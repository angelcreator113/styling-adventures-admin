// src/pages/admin/themes/ThemeLibrary.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import useThemeLibrary from "@/hooks/useThemeLibrary";

// local UI pieces in the same folder
import ThemeComposerPanel from "./ThemeComposerPanel.jsx";
import EditThemeModal from "./EditThemeModal.jsx";

/* ----------------------- small utilities ----------------------- */
const useDebounce = (v, d = 200) => {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setX(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return x;
};

const statusOf = (t, now) => {
  const rel = t?.releaseAt?.toMillis?.();
  const exp = t?.expiresAt?.toMillis?.();
  if (t.visibility === "private" && !rel && !exp) return "draft";
  if (rel && now < rel) return "scheduled";
  if (exp && now > exp) return "expired";
  return "live";
};

const STATUS_META = {
  draft:     { label: "Draft",     bg: "#f1f5f9", fg: "#0f172a" },
  scheduled: { label: "Scheduled", bg: "#fff7ed", fg: "#9a3412" },
  live:      { label: "Live",      bg: "#ecfeff", fg: "#155e75" },
  expired:   { label: "Expired",   bg: "#fef2f2", fg: "#991b1b" },
};

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META.live;
  return (
    <span
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        fontSize: 12,
        background: meta.bg,
        color: meta.fg,
        borderRadius: 999,
        padding: "2px 8px",
        border: "1px solid rgba(0,0,0,.06)",
      }}
    >
      {meta.label}
    </span>
  );
}

/* ----------------------- main component ----------------------- */
export default function ThemeLibrary() {
  const {
    loading,
    themes,
    iconMap, // { [themeId]: iconUrl }
    refresh,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateDraftsFromFiles,
    uploadThemeBg,
    applyBackgroundAsset,
  } = useThemeLibrary();

  // panels
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);

  // filters + sort
  const [q, setQ] = useState("");
  const qDeb = useDebounce(q, 200);
  const [status, setStatus] = useState("all"); // all|draft|scheduled|live|expired
  const [onlyFeatured, setOnlyFeatured] = useState(false); // ★ filter
  const [sortBy, setSortBy] = useState("createdDesc"); // nameAsc|status|releaseAsc|createdDesc

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // bulk-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  // inline rename
  const [nameDraft, setNameDraft] = useState({});

  // drag upload state (id -> boolean)
  const [uploading, setUploading] = useState({});

  const now = Date.now();
  const searchRef = useRef(null);

  // keyboard helpers
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowNew(true);
      }
      if (e.key === "Escape") setQ("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- filtering + computed status per theme ----
  const computed = useMemo(
    () => (themes || []).map((t) => ({ ...t, _status: statusOf(t, now) })),
    [themes, now]
  );

  const filtered = useMemo(() => {
    const needle = qDeb.trim().toLowerCase();
    return computed.filter((t) => {
      const okStatus = status === "all" ? true : t._status === status;
      const featuredOk = !onlyFeatured || !!t.featured; // ★ filter
      if (!okStatus || !featuredOk) return false;
      if (!needle) return true;
      return (
        (t.name || "").toLowerCase().includes(needle) ||
        (t.description || "").toLowerCase().includes(needle)
      );
    });
  }, [computed, qDeb, status, onlyFeatured]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
    const byCreatedDesc = (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    const byReleaseAsc = (a, b) =>
      (a.releaseAt?.toMillis?.() || Infinity) - (b.releaseAt?.toMillis?.() || Infinity);
    const byStatus = (a, b) => {
      const order = { draft: 0, scheduled: 1, live: 2, expired: 3 };
      return (order[a._status] ?? 99) - (order[b._status] ?? 99);
    };

    if (sortBy === "nameAsc") arr.sort(byName);
    else if (sortBy === "status") arr.sort(byStatus);
    else if (sortBy === "releaseAsc") arr.sort(byReleaseAsc);
    else arr.sort(byCreatedDesc);
    return arr;
  }, [filtered, sortBy]);

  const pageItems = useMemo(() => sorted.slice(0, page * pageSize), [sorted, page]);
  const canShowMore = page * pageSize < sorted.length;

  // selection helpers
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  const clearSelection = () => setSelected(new Set());

  // ------- quick actions -------
  async function onDuplicateTheme(t) {
    const base = {
      name: `${t.name || t.id} (copy)`,
      description: t.description || "",
      visibility: "private",
    };
    await createTheme(base);
    refresh();
  }

  async function onToggleFeatured(t, next = true) {
    try {
      await updateTheme(t.id, { featured: !!next });
    } catch (e) {
      console.error(e);
    }
  }

  async function onDeleteTheme(t) {
    if (!confirm(`Delete theme "${t.name || t.id}"? This cannot be undone.`)) return;
    try {
      await deleteTheme(t.id);
    } catch (e) {
      alert("Failed to delete theme. See console.");
      console.error(e);
    }
  }

  // inline rename save helper
  async function saveNameIfChanged(t) {
    const draft = (nameDraft[t.id] ?? "").trim();
    const current = (t.name ?? "").trim();
    if (draft && draft !== current) {
      try { await updateTheme(t.id, { name: draft }); }
      catch (e) { console.error(e); }
    }
  }

  // drag & drop handler
  async function handleDrop(e, themeId) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      setUploading((m) => ({ ...m, [themeId]: true }));
      await uploadThemeBg(themeId, file);
    } finally {
      setUploading((m) => ({ ...m, [themeId]: false }));
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      {/* Header */}
      <div
        className="dashboard-card"
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>🎨 Theme Library</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Rename, upload a background, feature on login, and schedule releases.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!selectMode ? (
            <>
              <button className="btn" onClick={refresh} disabled={loading}>Refresh</button>
              <button className="btn" onClick={() => { setSelectMode(true); clearSelection(); }}>Select</button>
              <button className="btn primary" onClick={() => setShowNew(true)}>New Theme</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => { setSelectMode(false); clearSelection(); }}>Done</button>
              {/* bulk actions omitted for brevity */}
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            ref={searchRef}
            className="input"
            placeholder="Search name / description  (press / to focus)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 420 }}
            aria-label="Search themes"
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="expired">Expired</option>
          </select>

          {/* ★ Featured-only filter */}
          <label
            className="input"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px" }}
          >
            <input
              type="checkbox"
              checked={onlyFeatured}
              onChange={(e) => setOnlyFeatured(e.target.checked)}
            />
            Featured only
          </label>

          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort themes">
            <option value="createdDesc">Newest</option>
            <option value="nameAsc">Name (A→Z)</option>
            <option value="status">Status</option>
            <option value="releaseAsc">Next Release</option>
          </select>

          <div className="muted" style={{ marginLeft: "auto" }}>
            {loading ? "Loading…" : `${sorted.length} theme${sorted.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="dashboard-card">
        {sorted.length === 0 && (
          <div className="muted" style={{ padding: 16 }}>
            {loading ? "Loading…" : (
              <>
                No themes yet.{" "}
                <button className="btn linklike" onClick={() => setShowNew(true)}>Create your first theme</button>
                {" "}or drag a folder of images into the composer to create drafts.
              </>
            )}
          </div>
        )}

        {sorted.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              }}
            >
              {pageItems.map((t) => {
                const iconUrl = iconMap?.[t.id];
                const s = t._status;
                const checked = selected.has(t.id);
                const uploadingThis = !!uploading[t.id];

                return (
                  <article
                    key={t.id}
                    className="card"
                    style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", position: "relative" }}
                  >
                    {/* preview (click to edit) + drag&drop upload */}
                    <div
                      role="button"
                      onClick={() => setEditing(t)}
                      title="Edit theme"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, t.id)}
                      style={{
                        width: "100%",
                        height: 120,
                        borderRadius: 10,
                        background: "#f6f1fa",
                        display: "grid",
                        placeItems: "center",
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        outline: "1px dashed transparent",
                      }}
                    >
                      {(t.bgUrl || iconUrl) ? (
                        <img
                          src={t.bgUrl || iconUrl}
                          alt={t.name || t.id}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span className="muted">Drop an image to set background</span>
                      )}

                      {/* status + featured badges */}
                      <StatusChip status={s} />
                      {t.featured && (
                        <span
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontSize: 12,
                            background: "#fef3c7",
                            color: "#92400e",
                            borderRadius: 999,
                            padding: "2px 8px",
                            border: "1px solid rgba(0,0,0,.06)",
                          }}
                          title="Featured"
                        >
                          ★ Featured
                        </span>
                      )}

                      {/* uploading veil */}
                      {uploadingThis && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(255,255,255,.55)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 600,
                          }}
                        >
                          Uploading…
                        </div>
                      )}
                    </div>

                    {/* body */}
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        {/* Inline rename */}
                        <input
                          className="input"
                          value={nameDraft[t.id] ?? t.name ?? ""}
                          onChange={(e) =>
                            setNameDraft((s) => ({ ...s, [t.id]: e.target.value }))
                          }
                          onBlur={() => saveNameIfChanged(t)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          aria-label={`Rename theme ${t.name || t.id}`}
                          style={{
                            fontWeight: 700,
                            border: "1px solid transparent",
                            background: "transparent",
                            padding: 0,
                            minWidth: 0,
                            width: "70%",
                          }}
                        />

                        {!selectMode ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn" style={{ padding: "4px 8px" }} onClick={() => setEditing(t)} aria-label="Edit theme">
                              Edit
                            </button>
                            <button className="btn" style={{ padding: "4px 8px" }} onClick={() => onDuplicateTheme(t)} aria-label="Duplicate theme">
                              Duplicate
                            </button>
                            <button
                              className="btn"
                              style={{ padding: "4px 8px" }}
                              onClick={() => onToggleFeatured(t, !t.featured)}
                              aria-label={t.featured ? "Unfeature theme" : "Feature theme"}
                              title={t.featured ? "Unfeature" : "Feature"}
                            >
                              {t.featured ? "Unfeature" : "Feature"}
                            </button>
                            <button className="btn danger" style={{ padding: "4px 8px" }} onClick={() => onDeleteTheme(t)} aria-label="Delete theme">
                              Delete
                            </button>
                          </div>
                        ) : (
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelect(t.id)}
                              aria-label={`Select ${t.name || t.id}`}
                            />
                            Select
                          </label>
                        )}
                      </div>

                      {!!t.description && (
                        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
                          {t.description}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {canShowMore && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <button className="btn" onClick={() => setPage((p) => p + 1)}>
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose panel (bulk import + single create) */}
      {showNew && (
        <ThemeComposerPanel
          onClose={() => setShowNew(false)}
          onCreateTheme={(payload) => createTheme(payload)}
          onCreateDraftsFromFiles={(files) => bulkCreateDraftsFromFiles(files)}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <EditThemeModal
          theme={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => updateTheme(editing.id, patch)}
          onUploadBg={(file) => uploadThemeBg(editing.id, file)}
          onDelete={() => deleteTheme(editing.id)}
          onApplyAsset={(themeId, asset) => applyBackgroundAsset(themeId, asset)}
        />
      )}
    </section>
  );
}

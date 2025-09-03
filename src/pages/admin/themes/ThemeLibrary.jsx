// src/pages/admin/themes/ThemeLibrary.jsx
import React, { useMemo, useState } from "react";
import useThemeLibrary from "@/hooks/useThemeLibrary";

// local UI pieces in the same folder
import ThemeComposerPanel from "./ThemeComposerPanel.jsx";
import EditThemeModal from "./EditThemeModal.jsx";

export default function ThemeLibrary() {
  const {
    loading,
    themes,
    iconMap,                     // { [themeId]: iconUrl }
    refresh,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateDraftsFromFiles,
    uploadThemeBg,
    applyBackgroundAsset,
  } = useThemeLibrary();

  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all|draft|scheduled|live|expired

  // ---- filtering + computed status per theme ----
  const now = Date.now();
  const filtered = useMemo(() => {
    const list = (themes || []).map((t) => {
      const rel = t?.releaseAt?.toMillis?.();
      const exp = t?.expiresAt?.toMillis?.();
      let st = "live";
      if (t.visibility === "private" && !rel && !exp) st = "draft";
      if (rel && now < rel) st = "scheduled";
      if (exp && now > exp) st = "expired";
      return { ...t, _status: st };
    });

    const needle = q.trim().toLowerCase();
    return list.filter((t) => {
      const okStatus = status === "all" ? true : t._status === status;
      if (!okStatus) return false;
      if (!needle) return true;
      return (
        (t.name || "").toLowerCase().includes(needle) ||
        (t.description || "").toLowerCase().includes(needle)
      );
    });
  }, [themes, q, status, now]);

  const openEdit = (t) => setEditing(t);

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
          <button className="btn" onClick={refresh} disabled={loading}>
            Refresh
          </button>
          <button className="btn primary" onClick={() => setShowNew(true)}>
            New Theme
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Search name / description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 420 }}
          />
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="expired">Expired</option>
          </select>
          <div className="muted">
            {loading ? "Loading…" : `${filtered.length} themes`}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="dashboard-card">
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {filtered.length === 0 && (
            <div className="muted" style={{ padding: 12 }}>
              {loading ? "Loading…" : "No themes yet."}
            </div>
          )}

          {filtered.map((t) => {
            const iconUrl = iconMap[t.id];
            const badge =
              t._status === "draft"
                ? "Draft"
                : t._status === "scheduled"
                ? "Scheduled"
                : t._status === "expired"
                ? "Expired"
                : "Live";

            return (
              <article
                key={t.id}
                className="card"
                style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }}
              >
                {/* preview (click to edit) */}
                <div
                  role="button"
                  onClick={() => openEdit(t)}
                  title="Edit theme"
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
                  }}
                >
                  {(t.bgUrl || iconUrl) ? (
                    <img
                      src={t.bgUrl || iconUrl}
                      alt={t.name || t.id}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="muted">No background/icon</span>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      fontSize: 12,
                      background: "#eee",
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {badge}
                  </span>
                </div>

                {/* body */}
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span>{t.name || t.id}</span>
                    <button
                      className="btn"
                      style={{ padding: "4px 8px" }}
                      onClick={() => openEdit(t)}
                    >
                      Edit
                    </button>
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

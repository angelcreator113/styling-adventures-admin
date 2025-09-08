// src/pages/admin/themes/ThemeLibrary/ThemeLibrary.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import useThemeLibrary from "@/hooks/useThemeLibrary";
import { useAuth } from "@/context/AuthContext";

// local panels you already have
import ThemeComposerPanel from "../ThemeComposerPanel.jsx";
import EditThemeModal from "../EditThemeModal.jsx";

// split components
import HeaderBar from "./components/HeaderBar.jsx";
import ThemeFilters from "./components/ThemeFilters.jsx";
import BulkActionsBar from "./components/BulkActionsBar.jsx";
import ThemeCard from "./components/ThemeCard.jsx";

// hooks
import useInfiniteScroll from "./hooks/useInfiniteScroll.js";

const statusOf = (t, now) => {
  const rel = t?.releaseAt?.toMillis?.();
  const exp = t?.expiresAt?.toMillis?.();
  if (t.visibility === "private" && !rel && !exp) return "draft";
  if (rel && now < rel) return "scheduled";
  if (exp && now > exp) return "expired";
  return "live";
};

export default function ThemeLibrary() {
  const {
    loading,
    themes,
    iconMap,
    refresh,
    createTheme,
    updateTheme,
    deleteTheme,
    bulkCreateDraftsFromFiles,
    uploadThemeBg,      // now supports (id, file, onProgress?)
    applyBackgroundAsset,
    revertThemeBg,      // NEW
  } = useThemeLibrary();

  const { role = "fan" } = useAuth?.() ?? { role: "fan" };
  const canFeature = role === "admin";

  // UI state
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [sortBy, setSortBy] = useState("createdDesc");

  // paging + infinite scroll
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const { sentinelRef } = useInfiniteScroll(() => setPage((p) => p + 1), {
    rootMargin: "600px",
  });

  // keyboard: “/” to focus search, “n” new theme
  const searchRef = useRef(null);
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // compute / filter / sort
  const now = Date.now();
  const computed = useMemo(
    () => (themes || []).map((t) => ({ ...t, _status: statusOf(t, now) })),
    [themes, now]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return computed.filter((t) => {
      const okStatus = status === "all" ? true : t._status === status;
      const featuredOk = !onlyFeatured || !!t.featured;
      if (!okStatus || !featuredOk) return false;
      if (!needle) return true;
      return (
        (t.name || "").toLowerCase().includes(needle) ||
        (t.description || "").toLowerCase().includes(needle)
      );
    });
  }, [computed, q, status, onlyFeatured]);

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

  const pageItems = sorted.slice(0, page * pageSize);
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

  // bulk actions
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    const val = prompt(`Type DELETE to remove ${selected.size} theme(s).`);
    if (val !== "DELETE") return;
    let ok = 0;
    for (const id of selected) {
      try {
        await deleteTheme(id);
        ok++;
      } catch {}
    }
    window?.toast?.info?.(`Deleted ${ok}/${selected.size} theme(s)`);
    clearSelection();
    refresh();
  };
  const bulkFeature = async (next = true) => {
    if (!canFeature || selected.size === 0) return;
    let ok = 0;
    for (const id of selected) {
      try {
        await updateTheme(id, { featured: !!next });
        ok++;
      } catch {}
    }
    window?.toast?.success?.(
      `${next ? "Featured" : "Unfeatured"} ${ok}/${selected.size} theme(s)`
    );
    clearSelection();
    refresh();
  };

  return (
    <section className="container" style={{ padding: 16 }}>
      <HeaderBar
        loading={loading}
        onRefresh={refresh}
        onSelect={() => {
          setSelectMode(true);
          clearSelection();
        }}
        onNew={() => setShowNew(true)}
        selectMode={selectMode}
        onDone={() => {
          setSelectMode(false);
          clearSelection();
        }}
        canFeature={canFeature}
        selectedCount={selected.size}
        onBulkFeature={() => bulkFeature(true)}
        onBulkUnfeature={() => bulkFeature(false)}
        onBulkDelete={bulkDelete}
      />

      <ThemeFilters
        refInput={searchRef}
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        onlyFeatured={onlyFeatured}
        onOnlyFeatured={setOnlyFeatured}
        sortBy={sortBy}
        onSortBy={setSortBy}
        count={sorted.length}
        loading={loading}
      />

      <div className="dashboard-card">
        {sorted.length === 0 ? (
          <div className="muted" style={{ padding: 16 }}>
            {loading ? (
              "Loading…"
            ) : q.trim() ? (
              <>No results for “{q.trim()}”.</>
            ) : (
              <>
                No themes yet.{" "}
                <button className="btn linklike" onClick={() => setShowNew(true)}>
                  Create your first theme
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {selectMode && (
              <BulkActionsBar
                canFeature={canFeature}
                selectedCount={selected.size}
                onFeature={() => bulkFeature(true)}
                onUnfeature={() => bulkFeature(false)}
                onDelete={bulkDelete}
              />
            )}

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              }}
            >
              {pageItems.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  iconUrl={iconMap?.[t.id]}
                  canFeature={canFeature}
                  selectMode={selectMode}
                  selected={selected.has(t.id)}
                  onToggleSelect={() => toggleSelect(t.id)}
                  onEdit={() => setEditing(t)}
                  onUpdate={updateTheme}
                  onDuplicate={async () => {
                    await createTheme({
                      name: `${t.name || t.id} (copy)`,
                      description: t.description || "",
                      visibility: "private",
                    });
                    window?.toast?.success?.("Theme duplicated");
                    refresh();
                  }}
                  onDelete={async () => {
                    const val = prompt(
                      `Type DELETE to permanently remove "${t.name || t.id}".`
                    );
                    if (val !== "DELETE") return;
                    await deleteTheme(t.id);
                    window?.toast?.success?.("Theme deleted");
                  }}
                  // progress-enabled upload + revert wiring
                  onUploadBg={(file, onProgress) =>
                    uploadThemeBg(t.id, file, onProgress)
                  }
                  onRevertBg={() => revertThemeBg(t.id)}
                />
              ))}
            </div>

            {canShowMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          </>
        )}
      </div>

      {showNew && (
        <ThemeComposerPanel
          onClose={() => setShowNew(false)}
          onCreateTheme={(payload) => createTheme(payload)}
          onCreateDraftsFromFiles={(files) => bulkCreateDraftsFromFiles(files)}
        />
      )}

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

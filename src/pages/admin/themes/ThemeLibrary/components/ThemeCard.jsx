// src/pages/admin/themes/ThemeLibrary/components/ThemeCard.jsx
import React, { useState } from "react";

const STATUS_META = {
  draft:     { label: "Draft",     bg: "#f1f5f9", fg: "#0f172a" },
  scheduled: { label: "Scheduled", bg: "#fff7ed", fg: "#9a3412" },
  live:      { label: "Live",      bg: "#ecfeff", fg: "#155e75" },
  expired:   { label: "Expired",   bg: "#fef2f2", fg: "#991b1b" },
};
const StatusChip = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.live;
  return (
    <span style={{
      position: "absolute", top: 8, left: 8, fontSize: 12,
      background: m.bg, color: m.fg, borderRadius: 999,
      padding: "2px 8px", border: "1px solid rgba(0,0,0,.06)"
    }}>
      {m.label}
    </span>
  );
};

export default function ThemeCard({
  theme,
  iconUrl,
  canFeature,
  selectMode,
  selected,
  onToggleSelect,
  onEdit,
  onUpdate,
  onDuplicate,
  onDelete,
  onUploadBg,          // (file, {onProgress}) -> url
  onRevert,            // () => revert
}) {
  const t = theme;
  const [name, setName] = useState(t.name ?? "");
  const [desc, setDesc] = useState(t.description ?? "");
  const [over, setOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const saveName = async () => {
    const draft = (name ?? "").trim();
    const current = (t.name ?? "").trim();
    if (draft && draft !== current) {
      await onUpdate(t.id, { name: draft });
      window?.toast?.success?.("Name saved");
    }
  };
  const saveDesc = async () => {
    const draft = (desc ?? "").trim();
    const current = (t.description ?? "").trim();
    if ((draft || current) && draft !== current) {
      await onUpdate(t.id, { description: draft });
      window?.toast?.success?.("Description saved");
    }
  };

  async function doUpload(file) {
    setUploading(true);
    setPct(0);
    try {
      await onUploadBg(file, { onProgress: (p) => setPct(p) });
      window?.toast?.success?.("Background uploaded");
    } catch (e) {
      console.error(e);
      window?.toast?.error?.(e?.message || "Upload failed");
    } finally {
      setUploading(false);
      setOver(false);
      setPct(0);
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith?.("image/")) {
      window?.toast?.error?.("Please drop an image file");
      setOver(false);
      return;
    }
    await doUpload(file);
  };

  return (
    <article className="card" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee", position: "relative" }}>
      {/* Preview + drag/drop */}
      <div
        role="button"
        title="Edit theme"
        onClick={onEdit}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
        onDragLeave={(e) => { e.stopPropagation(); setOver(false); }}
        onDrop={handleDrop}
        className={`drop-target ${over ? "is-dragover" : ""}`}
        style={{
          width: "100%", height: 120, borderRadius: 10,
          background: over ? "rgba(139,92,246,.06)" : "#f6f1fa",
          display: "grid", placeItems: "center", overflow: "hidden",
          cursor: "pointer", position: "relative",
          outline: `1px dashed ${over ? "rgba(139,92,246,.45)" : "transparent"}`,
        }}
      >
        {(t.bgUrl || iconUrl) ? (
          <img src={t.bgUrl || iconUrl} alt={t.name || t.id}
               style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="muted">Drop an image to set background</span>
        )}

        <StatusChip status={t._status} />

        {t.featured && (
          <span style={{
            position: "absolute", top: 8, right: 8, fontSize: 12,
            background: "#fef3c7", color: "#92400e",
            borderRadius: 999, padding: "2px 8px",
            border: "1px solid rgba(0,0,0,.06)"
          }}>
            ★ Featured
          </span>
        )}

        {/* progress overlay */}
        {uploading && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(255,255,255,.65)",
            display: "grid", placeItems: "center", padding: 12
          }}>
            <div style={{ width: "85%", maxWidth: 260 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, textAlign: "center" }}>
                Uploading… {pct}%
              </div>
              <div style={{ height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#8b5cf6" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            aria-label={`Rename theme ${t.name || t.id}`}
            style={{ fontWeight: 700, border: "1px solid transparent", background: "transparent", padding: 0, minWidth: 0, width: "70%" }}
          />

          {!selectMode ? (
            <div className="theme-card-actions" style={{ display: "flex", gap: 6 }}>
              <button className="btn sm" onClick={onEdit}>Edit</button>
              <button className="btn sm" onClick={onDuplicate}>Duplicate</button>
              <button
                className="btn sm"
                disabled={!canFeature}
                title={canFeature ? "" : "Admins only"}
                onClick={() => onUpdate(t.id, { featured: !t.featured })}
              >
                {t.featured ? "Unfeature" : "Feature"}
              </button>
              {/* Revert appears when we have a previous background */}
              {!!t.prevBgUrl && (
                <button className="btn sm" onClick={onRevert}>
                  Revert
                </button>
              )}
              <button className="btn sm danger" onClick={onDelete}>Delete</button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              <input type="checkbox" checked={selected} onChange={onToggleSelect} />
              Select
            </label>
          )}
        </div>

        <textarea
          className="input"
          rows={2}
          placeholder="Add description…"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={saveDesc}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) e.currentTarget.blur(); }}
          style={{ marginTop: 6, resize: "vertical" }}
          aria-label={`Edit description for ${t.name || t.id}`}
        />
      </div>
    </article>
  );
}

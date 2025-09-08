// src/pages/admin/themes/EditThemeModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import EpisodeBackgroundPicker from "./EpisodeBackgroundPicker.jsx";
import { prepareBackgroundImage } from "@/utils/prepareBackgroundImage";

/* ----------------------------------------------------------------------------
   Helpers
---------------------------------------------------------------------------- */
const toInput = (ts) => {
  if (!ts) return "";
  const ms =
    typeof ts?.toMillis === "function"
      ? ts.toMillis()
      : typeof ts === "number"
      ? ts
      : null;
  if (!ms) return "";
  // format for <input type="datetime-local"> => "YYYY-MM-DDTHH:mm"
  return new Date(ms).toISOString().slice(0, 16);
};

// lightweight validator — returns Date or null
const parseAnyDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.valueOf()) ? d : null;
};

/* ----------------------------------------------------------------------------
   Component
---------------------------------------------------------------------------- */
export default function EditThemeModal({
  theme,
  onClose,
  onSave,
  onUploadBg,   // expects File/Blob; we preprocess before calling it
  onDelete,
  onApplyAsset, // hook.applyBackgroundAsset(themeId, asset) -> url
}) {
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pickOpen, setPickOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const initialAud = useMemo(() => {
    if (Array.isArray(theme?.audiences) && theme.audiences.length) return theme.audiences;
    if (theme?.tier === "vip") return ["vip"];
    return ["all"];
  }, [theme]);

  const [form, setForm] = useState(() => ({
    name: theme?.name || "",
    description: theme?.description || "",
    visibility: theme?.visibility || "public",
    audiences: initialAud,
    releaseAt: toInput(theme?.releaseAt),
    vipReleaseAt: toInput(theme?.vipReleaseAt),
    expiresAt: toInput(theme?.expiresAt),
    deleteAt: toInput(theme?.deleteAt),
    rolloutVip:
      typeof theme?.rollout?.vip === "number"
        ? theme.rollout.vip
        : typeof theme?.abRollout === "number"
        ? theme.abRollout
        : 100,
    rolloutAll:
      typeof theme?.rollout?.all === "number"
        ? theme.rollout.all
        : typeof theme?.abRollout === "number"
        ? theme.abRollout
        : 100,
    featuredOnLogin: !!theme?.featuredOnLogin,
    bgUrl: theme?.bgUrl || "",
  }));

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: theme?.name || "",
      description: theme?.description || "",
      visibility: theme?.visibility || "public",
      audiences: initialAud,
      releaseAt: toInput(theme?.releaseAt),
      vipReleaseAt: toInput(theme?.vipReleaseAt),
      expiresAt: toInput(theme?.expiresAt),
      deleteAt: toInput(theme?.deleteAt),
      rolloutVip:
        typeof theme?.rollout?.vip === "number"
          ? theme.rollout.vip
          : typeof theme?.abRollout === "number"
          ? theme.abRollout
          : 100,
      rolloutAll:
        typeof theme?.rollout?.all === "number"
          ? theme.rollout.all
          : typeof theme?.abRollout === "number"
          ? theme.abRollout
          : 100,
      featuredOnLogin: !!theme?.featuredOnLogin,
      bgUrl: theme?.bgUrl || "",
    }));
  }, [theme, initialAud]);

  const statusBadge = useMemo(() => {
    const now = Date.now();
    const rel = theme?.releaseAt?.toMillis?.();
    const exp = theme?.expiresAt?.toMillis?.();
    if (theme?.visibility === "private" && !rel && !exp) return "Draft";
    if (rel && now < rel) return "Scheduled";
    if (exp && now > exp) return "Expired";
    return "Live";
  }, [theme]);

  /* ----------------------------------------------------------------------------
     Save (validate here; convert to Firestore Timestamp inside the hook)
  ---------------------------------------------------------------------------- */
  async function doSave() {
    setSaving(true);
    setError("");
    try {
      const audiences =
        (form.audiences && form.audiences.length) ? form.audiences : ["all"];

      // Validate date strings but DO NOT convert here
      const issues = [];
      if (form.releaseAt && !parseAnyDate(form.releaseAt)) issues.push("Release at");
      if (audiences.includes("vip") && form.vipReleaseAt && !parseAnyDate(form.vipReleaseAt)) issues.push("VIP early access");
      if (form.expiresAt && !parseAnyDate(form.expiresAt)) issues.push("Expires at");
      if (form.deleteAt && !parseAnyDate(form.deleteAt)) issues.push("Delete at");
      if (issues.length) throw new Error(`Invalid time value for: ${issues.join(", ")}`);

      const patch = {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
        audiences,
        featuredOnLogin: !!form.featuredOnLogin,

        // send raw strings or null; hook converts to Timestamps
        releaseAt: form.releaseAt || null,
        vipReleaseAt: audiences.includes("vip") ? (form.vipReleaseAt || null) : null,
        expiresAt: form.expiresAt || null,
        deleteAt: form.deleteAt || null,

        rollout: {
          vip: Number.isFinite(form.rolloutVip) ? Number(form.rolloutVip) : 100,
          all: Number.isFinite(form.rolloutAll) ? Number(form.rolloutAll) : 100,
        },
        abRollout: Number.isFinite(form.rolloutAll) ? Number(form.rolloutAll) : 100,
      };

      await onSave?.(patch);
      onClose?.();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function pickFile() {
    fileRef.current?.click();
  }

  /* ----------------------------------------------------------------------------
     Background: preprocess to 1280×720 (cover), then upload via parent hook
  ---------------------------------------------------------------------------- */
  async function processAndUpload(fileOrBlob) {
    if (!fileOrBlob?.type?.startsWith?.("image/")) {
      throw new Error("Please choose an image file");
    }
    const { blob } = await prepareBackgroundImage(fileOrBlob, {
      targetW: 1280,
      targetH: 720,
      mime: "image/jpeg",
      quality: 0.9,
      mode: "cover", // use "contain" to letterbox instead of crop
    });
    const url = await onUploadBg?.(blob);
    if (url) setForm((f) => ({ ...f, bgUrl: url }));
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await processAndUpload(file);
      window?.toast?.success?.("Background updated");
    } catch (err) {
      setError(err?.message || String(err));
      window?.toast?.error?.("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await processAndUpload(file);
      window?.toast?.success?.("Background updated");
    } catch (err) {
      setError(err?.message || String(err));
      window?.toast?.error?.("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function doDelete() {
    if (!theme?.id) return onClose?.();
    if (!confirm(`Delete theme “${theme.name || theme.id}”?`)) return;
    setSaving(true);
    setError("");
    try {
      await onDelete?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const toggleAudience = (key) => (e) => {
    const on = e.target.checked;
    const s = new Set(form.audiences || []);
    on ? s.add(key) : s.delete(key);
    setForm((f) => ({ ...f, audiences: Array.from(s) }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 50, display: "grid", placeItems: "center", padding: 16 }}
    >
      <div className="dashboard-card" style={{ width: "min(980px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 16, position: "relative" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0 }}>Edit Theme</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              ID: <code>{theme?.id}</code> · Status: <strong>{statusBadge}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={onClose} disabled={saving || uploading}>Close</button>
            <button className="btn danger" onClick={doDelete} disabled={saving || uploading}>Delete</button>
            <button className="btn primary" onClick={doSave} disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </header>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="grid" style={{ display: "grid", gap: 16, gridTemplateColumns: "1.15fr .85fr", alignItems: "start" }}>
          <section className="card" style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, alignItems: "start" }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  width: "100%", height: 220, borderRadius: 10,
                  background: dragOver ? "rgba(139,92,246,.06)" : "#f6f1fa",
                  outline: `1px dashed ${dragOver ? "rgba(139,92,246,.45)" : "transparent"}`,
                  display: "grid", placeItems: "center", overflow: "hidden", position: "relative"
                }}
              >
                {form.bgUrl ? (
                  <img src={form.bgUrl} alt={form.name || theme?.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span className="muted">Drop an image here (auto 1280×720)</span>
                )}
                {uploading && (
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      background: "rgba(255,255,255,.55)",
                      display: "grid", placeItems: "center", fontWeight: 600
                    }}
                  >
                    Uploading…
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn" onClick={pickFile} disabled={uploading || saving}>
                    {uploading ? "Uploading…" : "Replace background"}
                  </button>
                  <button className="btn" onClick={() => setPickOpen(true)} disabled={saving || uploading}>
                    Pick from library
                  </button>
                </div>

                <input ref={fileRef} type="file" hidden accept="image/*" onChange={onFile} />
                <div className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4 }}>
                  <strong>Requirement:</strong> 16:9, at least <code>1280×720</code>. We auto-crop/resize to exactly 1280×720.
                </div>
              </div>
            </div>

            {/* Name / Description */}
            <div style={{ marginTop: 12 }}>
              <label className="muted">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <label className="muted" style={{ marginTop: 8 }}>Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Visibility + Audience */}
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
              <label className="muted">
                Visibility
                <select
                  className="input"
                  value={form.visibility}
                  onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
                >
                  <option value="public">Public</option>
                  <option value="private">Private (draft)</option>
                </select>
              </label>

              <div>
                <div className="muted">Audience</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <label className="chip">
                    <input
                      type="checkbox"
                      checked={(form.audiences || []).includes("vip")}
                      onChange={toggleAudience("vip")}
                    />
                    VIP
                  </label>
                  <label className="chip">
                    <input
                      type="checkbox"
                      checked={(form.audiences || ["all"]).includes("all")}
                      onChange={toggleAudience("all")}
                    />
                    All fans
                  </label>
                </div>
              </div>
            </div>

            {/* Rollout */}
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
              <label className="muted">
                VIP Rollout %
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={form.rolloutVip}
                  onChange={(e) => setForm((f) => ({ ...f, rolloutVip: Number(e.target.value) }))}
                />
              </label>
              <label className="muted">
                All Fans Rollout %
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={form.rolloutAll}
                  onChange={(e) => setForm((f) => ({ ...f, rolloutAll: Number(e.target.value) }))}
                />
              </label>
            </div>

            {/* Scheduling */}
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
              <label className="muted">
                Release at (All)
                <input
                  className="input"
                  type="datetime-local"
                  value={form.releaseAt}
                  onChange={(e) => setForm((f) => ({ ...f, releaseAt: e.target.value }))}
                />
              </label>
              {(form.audiences || []).includes("vip") && (
                <label className="muted">
                  VIP early access at
                  <input
                    className="input"
                    type="datetime-local"
                    value={form.vipReleaseAt}
                    onChange={(e) => setForm((f) => ({ ...f, vipReleaseAt: e.target.value }))}
                  />
                </label>
              )}
            </div>

            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
              <label className="muted">
                Expires at
                <input
                  className="input"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </label>
              <label className="muted">
                Delete at (auto archive)
                <input
                  className="input"
                  type="datetime-local"
                  value={form.deleteAt}
                  onChange={(e) => setForm((f) => ({ ...f, deleteAt: e.target.value }))}
                />
              </label>
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
              <input
                type="checkbox"
                checked={!!form.featuredOnLogin}
                onChange={(e) => setForm((f) => ({ ...f, featuredOnLogin: e.target.checked }))}
              />
              Featured on login
            </label>
          </section>

          <aside className="card" style={{ padding: 12 }}>
            <h4 style={{ margin: 0 }}>Audit log</h4>
            <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              No changes yet.
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              When edits are saved, entries will appear here (who / what / when).
            </div>
          </aside>
        </div>
      </div>

      {/* Picker */}
      <EpisodeBackgroundPicker
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onSelect={(asset) => {
          onApplyAsset?.(theme.id, asset)
            .then((url) => setForm((f) => ({ ...f, bgUrl: url })))
            .finally(() => setPickOpen(false));
        }}
      />
    </div>
  );
}

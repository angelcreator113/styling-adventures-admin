// src/components/themes/ThemeEditorPanel.jsx
import React, { useEffect, useState } from "react";
import { saveTheme, deleteTheme, toTimestamp } from "@/hooks/useThemes";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import DropzoneUpload from "@/components/themes/DropzoneUpload.jsx";

export default function ThemeEditorPanel({ theme, onClose }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: theme?.name || "",
    description: theme?.description || "",
    bgUrl: theme?.bgUrl || "",
    visibility: theme?.visibility || "public",
    tier: theme?.tier || "all",
    rolloutPercent: theme?.rolloutPercent ?? 100,
    releaseAt: theme?.releaseAt ? theme.releaseAt.toDate().toISOString().slice(0, 16) : "",
    expiresAt: theme?.expiresAt ? theme.expiresAt.toDate().toISOString().slice(0, 16) : "",
    deleteAt: theme?.deleteAt ? theme.deleteAt.toDate().toISOString().slice(0, 16) : "",
    featuredOnLogin: !!theme?.featuredOnLogin,
  });

  useEffect(() => {
    setForm({
      name: theme?.name || "",
      description: theme?.description || "",
      bgUrl: theme?.bgUrl || "",
      visibility: theme?.visibility || "public",
      tier: theme?.tier || "all",
      rolloutPercent: theme?.rolloutPercent ?? 100,
      releaseAt: theme?.releaseAt ? theme.releaseAt.toDate().toISOString().slice(0, 16) : "",
      expiresAt: theme?.expiresAt ? theme.expiresAt.toDate().toISOString().slice(0, 16) : "",
      deleteAt: theme?.deleteAt ? theme.deleteAt.toDate().toISOString().slice(0, 16) : "",
      featuredOnLogin: !!theme?.featuredOnLogin,
    });
  }, [theme?.id]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadBgFile = async (file) => {
    const storage = getStorage();
    const id = theme?.id || `new-${Date.now()}`;
    const path = `public/themes/${id}/background_${Date.now()}_${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    upd("bgUrl", url);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: (form.name || "").trim(),
        description: form.description || "",
        bgUrl: form.bgUrl || "",
        visibility: form.visibility,
        tier: form.tier,
        rolloutPercent: Number(form.rolloutPercent) || 0,
        featuredOnLogin: !!form.featuredOnLogin,
        releaseAt: toTimestamp(form.releaseAt),
        expiresAt: toTimestamp(form.expiresAt),
        deleteAt: toTimestamp(form.deleteAt),
      };
      await saveTheme(theme?.id, payload);
      onClose?.("saved");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!theme?.id) return onClose?.();
    if (!confirm(`Delete theme “${theme.name || theme.id}”?`)) return;
    await deleteTheme(theme.id);
    onClose?.("deleted");
  };

  return (
    <aside className="dashboard-card" style={{ position: "sticky", top: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{theme?.id ? "Edit Theme" : "New Theme"}</h3>
        <button className="btn" onClick={() => onClose?.()}>✕</button>
      </div>

      <div className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
        <label>
          <div className="muted">Title</div>
          <input className="input" value={form.name} onChange={(e) => upd("name", e.target.value)} />
        </label>

        <label>
          <div className="muted">Description</div>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => upd("description", e.target.value)} />
        </label>

        <div>
          <div className="muted">Background image</div>
          <DropzoneUpload onFile={uploadBgFile} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="input"
              placeholder="Paste background image URL"
              value={form.bgUrl}
              onChange={(e) => upd("bgUrl", e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              width: "100%",
              height: 120,
              borderRadius: 10,
              background: "#f6f1fa",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
            }}
          >
            {form.bgUrl ? (
              <img src={form.bgUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>No background selected</span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            <div className="muted">Visibility</div>
            <select className="input" value={form.visibility} onChange={(e) => upd("visibility", e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label>
            <div className="muted">Tier</div>
            <select className="input" value={form.tier} onChange={(e) => upd("tier", e.target.value)}>
              <option value="all">All fans</option>
              <option value="vip">VIP only</option>
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label>
            <div className="muted">Release at</div>
            <input type="datetime-local" className="input" value={form.releaseAt} onChange={(e) => upd("releaseAt", e.target.value)} />
          </label>
          <label>
            <div className="muted">Expires at</div>
            <input type="datetime-local" className="input" value={form.expiresAt} onChange={(e) => upd("expiresAt", e.target.value)} />
          </label>
          <label>
            <div className="muted">Delete at</div>
            <input type="datetime-local" className="input" value={form.deleteAt} onChange={(e) => upd("deleteAt", e.target.value)} />
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={!!form.featuredOnLogin} onChange={(e) => upd("featuredOnLogin", e.target.checked)} />
          Feature on login screen
        </label>

        <label>
          <div className="muted">A/B rollout (% of fans who see it)</div>
          <input
            type="range" min="0" max="100"
            value={form.rolloutPercent}
            onChange={(e) => upd("rolloutPercent", e.target.value)}
            aria-label="Rollout percent"
          />
          <div className="muted" style={{ fontSize: 12 }}>{form.rolloutPercent}%</div>
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <button className="btn" onClick={() => onClose?.()}>Close</button>
          {!!theme?.id && <button className="btn danger" onClick={onDelete}>Delete</button>}
        </div>
      </div>
    </aside>
  );
}

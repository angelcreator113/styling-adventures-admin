// src/pages/admin/themes/ThemeComposerPanel.jsx
import React, { useState } from "react";
import BulkImportDropzone from "./components/BulkImportDropzone.jsx";

export default function ThemeComposerPanel({
  onClose,
  onCreateTheme,          // (payload) => id
  onCreateDraftsFromFiles // (FileList|Array<File>) => ids[]
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    bgUrl: "",
    visibility: "public",
    tier: "all",
    abRollout: 100,
    releaseAt: "",
    expiresAt: "",
    deleteAt: "",
    featuredOnLogin: false,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const payload = { ...form };
      await onCreateTheme?.(payload);
      setForm((f) => ({ ...f, name: "", description: "", bgUrl: "" }));
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="dashboard-card" style={{ position: "sticky", top: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>New Theme</h3>
        <button className="btn" onClick={onClose} aria-label="Close">✕</button>
      </div>

      {/* 1) Bulk import (creates private draft themes automatically) */}
      <BulkImportDropzone onFiles={onCreateDraftsFromFiles} />

      {/* 2) OR fill the form below for a single theme */}
      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <div className="muted" style={{ marginBottom: 8 }}>Or create one manually</div>

        <label className="muted">Name</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label className="muted" style={{ marginTop: 10 }}>Description</label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="muted" style={{ marginTop: 10 }}>Background URL</label>
        <input
          className="input"
          value={form.bgUrl}
          placeholder="https://…"
          onChange={(e) => setForm({ ...form, bgUrl: e.target.value })}
        />

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
          <label className="muted">
            Visibility
            <select
              className="input"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="muted">
            Tier
            <select
              className="input"
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
            >
              <option value="all">All fans</option>
              <option value="vip">VIP only</option>
            </select>
          </label>
        </div>

        <label className="muted" style={{ marginTop: 10 }}>A/B Rollout %</label>
        <input
          className="input"
          type="number"
          min={0} max={100}
          value={form.abRollout}
          onChange={(e) => setForm({ ...form, abRollout: Number(e.target.value) })}
        />

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 10 }}>
          <label className="muted">
            Release at
            <input
              className="input"
              type="datetime-local"
              value={form.releaseAt}
              onChange={(e) => setForm({ ...form, releaseAt: e.target.value })}
            />
          </label>
          <label className="muted">
            Expires at
            <input
              className="input"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
        </div>

        <label className="muted" style={{ marginTop: 10 }}>
          Delete at
          <input
            className="input"
            type="datetime-local"
            value={form.deleteAt}
            onChange={(e) => setForm({ ...form, deleteAt: e.target.value })}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
          <input
            type="checkbox"
            checked={form.featuredOnLogin}
            onChange={(e) => setForm({ ...form, featuredOnLogin: e.target.checked })}
          />
          Featured on login
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={save} disabled={busy}>Save</button>
          <button className="btn" onClick={onClose} disabled={busy}>Close</button>
        </div>
      </div>
    </aside>
  );
}

// src/pages/admin/themes/components/ThemeEditorPanel.jsx
import React, { useEffect, useState } from "react";
import { useThemeLibrary } from "@/hooks/useThemeLibrary";

export default function ThemeEditorPanel({ theme, onClose }) {
  const { createTheme, updateTheme, deleteTheme } = useThemeLibrary({
    live: false, // we only need actions here
  });

  const [form, setForm] = useState(() => ({
    name: theme?.name || "",
    description: theme?.description || "",
    bgUrl: theme?.bgUrl || "",
    visibility: theme?.visibility || "public",
    tier: theme?.tier || "all",
    rolloutPercent:
      typeof theme?.rolloutPercent === "number" ? theme.rolloutPercent : 100,
    featuredOnLogin: !!theme?.featuredOnLogin,
    releaseAt: theme?.releaseAt
      ? theme.releaseAt.toDate().toISOString().slice(0, 16)
      : "",
    expiresAt: theme?.expiresAt
      ? theme.expiresAt.toDate().toISOString().slice(0, 16)
      : "",
    deleteAt: theme?.deleteAt
      ? theme.deleteAt.toDate().toISOString().slice(0, 16)
      : "",
  }));

  useEffect(() => {
    setForm({
      name: theme?.name || "",
      description: theme?.description || "",
      bgUrl: theme?.bgUrl || "",
      visibility: theme?.visibility || "public",
      tier: theme?.tier || "all",
      rolloutPercent:
        typeof theme?.rolloutPercent === "number" ? theme.rolloutPercent : 100,
      featuredOnLogin: !!theme?.featuredOnLogin,
      releaseAt: theme?.releaseAt
        ? theme.releaseAt.toDate().toISOString().slice(0, 16)
        : "",
      expiresAt: theme?.expiresAt
        ? theme.expiresAt.toDate().toISOString().slice(0, 16)
        : "",
      deleteAt: theme?.deleteAt
        ? theme.deleteAt.toDate().toISOString().slice(0, 16)
        : "",
    });
  }, [theme]);

  const onSave = async () => {
    const payload = { ...form };
    if (theme?.id) {
      await updateTheme(theme.id, payload);
    } else {
      await createTheme(payload);
    }
    onClose?.();
  };

  const onRemove = async () => {
    if (!theme?.id) return onClose?.();
    if (!confirm(`Delete theme “${theme.name || theme.id}”?`)) return;
    await deleteTheme(theme.id);
    onClose?.();
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <div className="muted">Name</div>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>

        <label>
          <div className="muted">Description</div>
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </label>

        <label>
          <div className="muted">Background URL</div>
          <input
            className="input"
            value={form.bgUrl}
            onChange={(e) => setForm((f) => ({ ...f, bgUrl: e.target.value }))}
            placeholder="https://…"
          />
        </label>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            <div className="muted">Visibility</div>
            <select
              className="input"
              value={form.visibility}
              onChange={(e) =>
                setForm((f) => ({ ...f, visibility: e.target.value }))
              }
            >
              <option value="public">Public</option>
              <option value="private">Private (draft)</option>
            </select>
          </label>
          <label>
            <div className="muted">Tier</div>
            <select
              className="input"
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            >
              <option value="all">All fans</option>
              <option value="vip">VIP only</option>
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <label>
            <div className="muted">A/B Rollout %</div>
            <input
              type="number"
              className="input"
              min={0}
              max={100}
              value={form.rolloutPercent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rolloutPercent: Math.max(
                    0,
                    Math.min(100, Number(e.target.value || 0))
                  ),
                }))
              }
            />
          </label>
          <label style={{ display: "flex", alignItems: "end" }}>
            <input
              type="checkbox"
              checked={!!form.featuredOnLogin}
              onChange={(e) =>
                setForm((f) => ({ ...f, featuredOnLogin: e.target.checked }))
              }
              style={{ marginRight: 8 }}
            />
            <span className="muted">Featured on login</span>
          </label>
        </div>

        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label>
            <div className="muted">Release at</div>
            <input
              type="datetime-local"
              className="input"
              value={form.releaseAt}
              onChange={(e) => setForm((f) => ({ ...f, releaseAt: e.target.value }))}
            />
          </label>
          <label>
            <div className="muted">Expires at</div>
            <input
              type="datetime-local"
              className="input"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </label>
          <label>
            <div className="muted">Delete at</div>
            <input
              type="datetime-local"
              className="input"
              value={form.deleteAt}
              onChange={(e) => setForm((f) => ({ ...f, deleteAt: e.target.value }))}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button className="btn primary" onClick={onSave}>Save</button>
          <button className="btn" onClick={() => onClose?.()}>Close</button>
          {theme?.id && (
            <button className="btn danger" onClick={onRemove}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

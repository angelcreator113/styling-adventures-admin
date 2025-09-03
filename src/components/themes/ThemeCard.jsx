// src/components/themes/ThemeCard.jsx
import React from "react";

const COLORS = {
  draft:    "#64748b",
  scheduled:"#eab308",
  live:     "#22c55e",
  expired:  "#ef4444",
};

export default function ThemeCard({ theme, iconUrl, onEdit }) {
  const badge = theme._status || "draft";
  return (
    <article className="card" style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }}>
      <div
        style={{
          width: "100%",
          height: 110,
          borderRadius: 10,
          background: "#f6f1fa",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
        }}
        onClick={onEdit}
        role="button"
      >
        {theme.bgUrl ? (
          <img src={theme.bgUrl} alt={theme.name || theme.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : iconUrl ? (
          <img src={iconUrl} alt={theme.name || theme.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="muted">No background/icon</span>
        )}

        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 12,
            padding: "2px 8px",
            background: COLORS[badge],
            color: "#fff",
            borderRadius: 999,
          }}
          aria-label={`status: ${badge}`}
        >
          {badge}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span>{theme.name || theme.id}</span>
          <button className="btn" style={{ padding: "4px 8px" }} onClick={onEdit}>Edit</button>
        </div>
        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
          {theme.tier === "vip" ? "VIP only" : "All fans"}
          {" • "}
          Featured on login: {theme.featuredOnLogin ? "Yes" : "No"}
          {" • "}
          Rollout: {theme.rolloutPercent ?? 100}%
        </div>
      </div>
    </article>
  );
}

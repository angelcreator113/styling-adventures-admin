// src/pages/home/components/CreatorRibbon.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CreatorRibbon({ cfg, onClick, onDismiss }) {
  if (!cfg) return null;
  return (
    <aside className="creator-ribbon" role="complementary" aria-live="polite">
      <span>{cfg.message}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
        <Link to={cfg.ctaHref} className="btn sm" onClick={() => onClick?.(cfg.ctaHref)}>
          {cfg.ctaLabel}
        </Link>
        <button
          className="btn sm"
          aria-label="Dismiss"
          title="Hide for a while"
          onClick={onDismiss}
        >
          ✕
        </button>
      </div>
    </aside>
  );
}

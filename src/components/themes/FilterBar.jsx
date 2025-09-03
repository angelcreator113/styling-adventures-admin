// src/components/themes/FilterBar.jsx
import React from "react";

const ORDER = ["draft", "scheduled", "live", "expired"];

export default function FilterBar({ value, onChange, counts = {} }) {
  return (
    <div className="dashboard-card" style={{ display: "flex", gap: 8, padding: 8, alignItems: "center" }}>
      {ORDER.map((k) => {
        const active = value === k;
        return (
          <button
            key={k}
            className={`btn ${active ? "primary" : ""}`}
            onClick={() => onChange(k)}
            aria-pressed={active}
          >
            {k[0].toUpperCase() + k.slice(1)} {typeof counts[k] === "number" ? `(${counts[k]})` : ""}
          </button>
        );
      })}
    </div>
  );
}

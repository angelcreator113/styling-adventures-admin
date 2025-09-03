// src/components/ui/Tabs.jsx
import React from "react";

export default function Tabs({ value, onChange, items = [] }) {
  return (
    <div
      role="tablist"
      aria-label="Theme library tabs"
      className="dashboard-card"
      style={{ display: "flex", gap: 8, padding: 8, alignItems: "center" }}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            className={`btn ${active ? "primary" : ""}`}
            onClick={() => onChange(id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {Icon ? <Icon size={16} /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

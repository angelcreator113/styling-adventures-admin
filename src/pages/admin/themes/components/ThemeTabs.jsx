import React from "react";

export default function ThemeTabs({ active, onChange }) {
  const tabs = [
    { id: "library", label: "Library" },
    { id: "icons", label: "Icons" },
    { id: "voting", label: "Voting Preview" },
  ];
  return (
    <div className="dashboard-card">
      <div className="card__body tl-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn tl-tab ${active === t.id ? "is-active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

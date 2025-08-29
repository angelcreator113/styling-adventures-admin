import React from "react";

export default function DebugPanel({ role, variant, onReset }) {
  return (
    <div className="card" style={{ padding: 12, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <strong>Debug:</strong>
        <span>role={role}</span>
        <span>variant={variant}</span>
        <button className="btn" onClick={onReset}>Reset my ribbon caps</button>
        <span className="muted">clears server + local caps for this account</span>
      </div>
    </div>
  );
}

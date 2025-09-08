// src/pages/admin/themes/ThemeLibrary/components/BulkActionsBar.jsx
import React from "react";

export default function BulkActionsBar({ canFeature, selectedCount, onFeature, onUnfeature, onDelete }) {
  return (
    <div className="muted" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <strong>{selectedCount}</strong> selected
      <span aria-hidden>•</span>
      <button className="btn sm" onClick={onFeature}  disabled={!canFeature || selectedCount === 0} title={canFeature ? "" : "Admins only"}>Feature</button>
      <button className="btn sm" onClick={onUnfeature} disabled={!canFeature || selectedCount === 0} title={canFeature ? "" : "Admins only"}>Unfeature</button>
      <button className="btn sm danger" onClick={onDelete} disabled={selectedCount === 0}>Delete</button>
    </div>
  );
}

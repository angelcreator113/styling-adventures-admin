// src/pages/admin/themes/ThemeLibrary/components/HeaderBar.jsx
import React from "react";

export default function HeaderBar({
  loading,
  onRefresh,
  onSelect,
  onNew,
  selectMode,
  onDone,
  canFeature,
  selectedCount,
  onBulkFeature,
  onBulkUnfeature,
  onBulkDelete,
}) {
  return (
    <div className="dashboard-card" style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0 }}>🎨 Theme Library</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Rename, upload a background, feature on login, and schedule releases.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {!selectMode ? (
          <>
            <button className="btn" onClick={onRefresh} disabled={loading}>Refresh</button>
            <button className="btn" onClick={onSelect}>Select</button>
            <button className="btn primary" onClick={onNew}>New Theme</button>
          </>
        ) : (
          <>
            <button className="btn" onClick={onDone}>Done</button>
            <button className="btn" onClick={onBulkFeature}  disabled={!canFeature || selectedCount === 0} title={canFeature ? "" : "Admins only"}>Feature</button>
            <button className="btn" onClick={onBulkUnfeature} disabled={!canFeature || selectedCount === 0} title={canFeature ? "" : "Admins only"}>Unfeature</button>
            <button className="btn danger" onClick={onBulkDelete} disabled={selectedCount === 0}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

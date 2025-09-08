// src/pages/admin/themes/ThemeLibrary/components/ThemeFilters.jsx
import React from "react";

export default function ThemeFilters({
  refInput,
  q, onQ,
  status, onStatus,
  onlyFeatured, onOnlyFeatured,
  sortBy, onSortBy,
  count, loading,
}) {
  return (
    <div className="dashboard-card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          ref={refInput}
          className="input"
          placeholder="Search name / description  (press / to focus)"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          style={{ maxWidth: 420 }}
          aria-label="Search themes"
        />
        <select className="input" value={status} onChange={(e) => onStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="expired">Expired</option>
        </select>

        <label className="input" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px" }}>
          <input type="checkbox" checked={onlyFeatured} onChange={(e) => onOnlyFeatured(e.target.checked)} />
          Featured only
        </label>

        <select className="input" value={sortBy} onChange={(e) => onSortBy(e.target.value)} aria-label="Sort themes">
          <option value="createdDesc">Newest</option>
          <option value="nameAsc">Name (A→Z)</option>
          <option value="status">Status</option>
          <option value="releaseAsc">Next Release</option>
        </select>

        <div className="muted" style={{ marginLeft: "auto" }}>
          {loading ? "Loading…" : `${count} theme${count === 1 ? "" : "s"}`}
        </div>
      </div>
    </div>
  );
}

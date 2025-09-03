import React from "react";

export default function AdminMetaTools() {
  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h1 className="page-title" style={{ marginTop: 0 }}>Meta & Tools</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Admin utilities for site metadata, panels, and miscellaneous tools.
        </p>
      </div>

      {/* Replace this with your real meta/tools UI */}
      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          <div className="card" style={{ padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
            <h3 style={{ margin: 0 }}>Homepage Panels</h3>
            <p className="muted" style={{ margin: "8px 0 12px" }}>Configure hero, stats, and surface cards.</p>
            <button className="btn">Open</button>
          </div>
          <div className="card" style={{ padding: 16, borderRadius: 12, border: "1px solid #eee" }}>
            <h3 style={{ margin: 0 }}>SEO & Metadata</h3>
            <p className="muted" style={{ margin: "8px 0 12px" }}>Titles, descriptions, social preview images.</p>
            <button className="btn">Open</button>
          </div>
        </div>
      </div>
    </section>
  );
}

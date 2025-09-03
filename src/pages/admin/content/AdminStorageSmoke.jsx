import React from "react";

export default function AdminStorageSmoke() {
  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h1 className="page-title" style={{ marginTop: 0 }}>Storage Smoke</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Quick bucket health check & permissions sanity. Replace this with your real smoke tests.
        </p>
      </div>

      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Check can list bucket</li>
          <li>Check can upload test file</li>
          <li>Check can fetch public asset</li>
        </ul>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="btn">Run All</button>
          <button className="btn ghost">View Logs</button>
        </div>
      </div>
    </section>
  );
}

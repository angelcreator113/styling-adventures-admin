import React from "react";
import { useUploadPanel } from "../hooks/useUploadPanel";

export default function ClosetPanel() {
  useUploadPanel("closet", "closet-");

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        {/* Left: Upload card */}
        <section className="card" aria-labelledby="closet-upload-title">
          <div className="card__body">
            <h2 id="closet-upload-title" className="card__title">Closet Upload</h2>

            <div id="closet-drop-area" className="drop-zone" role="button" tabIndex={0}>
              <input id="closet-file-input" type="file" accept="image/*" hidden />
              Drag &amp; drop image here, or click to browse.
            </div>

            <form id="closet-upload-form">
              <div className="form-group">
                <label htmlFor="closet-category">Category</label>
                <select id="closet-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="closet-subcategory">Subcategory</label>
                <select id="closet-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="closet-subsubcategory">Sub-subcategory</label>
                <select id="closet-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="closet-title">Title (optional)</label>
                <input id="closet-title" type="text" />
              </div>
              <div className="form-group">
                <label htmlFor="closet-notes">Notes (optional)</label>
                <textarea id="closet-notes" rows={4} />
              </div>

              <label className="inline-flex items-center" style={{gap:'.5rem', marginTop:'.25rem'}}>
                <input id="closet-is-public" type="checkbox" defaultChecked /> Make Public
              </label>

              <div className="actions">
                <button id="closet-upload-btn" type="submit" className="primary">Upload to Closet</button>
              </div>
            </form>
          </div>
        </section>

        {/* Right: Dashboard placeholder */}
        <section className="card dashboard" aria-labelledby="closet-dash-title">
          <div className="card__body">
            <h3 id="closet-dash-title" className="card__title">Closet Dashboard</h3>
            <div className="toolbar">
              <select id="closet-dash-filter" defaultValue="all">
                <option value="all">All Categories</option>
              </select>
              <input id="closet-dash-search" placeholder="Search filenames..." />
            </div>
            <div id="closet-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

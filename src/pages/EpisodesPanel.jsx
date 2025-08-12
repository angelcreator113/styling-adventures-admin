import React from "react";
import { useUploadPanel } from "../hooks/useUploadPanel";

export default function EpisodesPanel() {
  useUploadPanel("episodes", "episodes-");

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        <section className="card" aria-labelledby="ep-upload-title">
          <div className="card__body">
            <h2 id="ep-upload-title" className="card__title">Upload Episode</h2>

            <div id="episodes-drop-area" className="drop-zone" role="button" tabIndex={0}>
              <input id="episodes-file-input" type="file" accept="video/*" hidden />
              Drag &amp; drop video here, or click to browse.
            </div>

            <form id="episodes-upload-form">
              <div className="form-group">
                <label htmlFor="episodes-category">Category</label>
                <select id="episodes-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="episodes-subcategory">Subcategory</label>
                <select id="episodes-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episodes-subsubcategory">Sub-subcategory</label>
                <select id="episodes-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episodes-title">Title (optional)</label>
                <input id="episodes-title" type="text" />
              </div>
              <div className="form-group">
                <label htmlFor="episodes-notes">Notes (optional)</label>
                <textarea id="episodes-notes" rows={4} />
              </div>

              <label className="inline-flex items-center" style={{gap:'.5rem', marginTop:'.25rem'}}>
                <input id="episodes-is-public" type="checkbox" /> Public
              </label>

              <div className="actions">
                <button id="episodes-upload-btn" type="submit" className="primary">Upload Episode</button>
              </div>
            </form>
          </div>
        </section>

        <section className="card dashboard" aria-labelledby="ep-dash-title">
          <div className="card__body">
            <h3 id="ep-dash-title" className="card__title">Episode Dashboard</h3>
            <div className="toolbar">
              <select id="episodes-dash-filter" defaultValue="all">
                <option value="all">All Categories</option>
              </select>
              <input id="episodes-dash-search" placeholder="Search filenames..." />
            </div>
            <div id="episodes-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

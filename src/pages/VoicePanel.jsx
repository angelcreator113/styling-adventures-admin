// src/pages/VoicePanel.jsx
import React, { useEffect } from "react";
import { useUploadPanel } from "../hooks/useUploadPanel";
import { loadCategoryData } from "../components/categoryStore";

export default function VoicePanel() {
  useUploadPanel("voice", "voice-");

  useEffect(() => {
    let unsub;
    (async () => { unsub = await loadCategoryData("voice", "voice-"); })();
    return () => { try { unsub && unsub(); } catch {} };
  }, []);

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        <section className="card" aria-labelledby="voice-upload-title">
          <div className="card__body">
            <h2 id="voice-upload-title" className="card__title">Upload Voice</h2>

            <div id="voice-drop-area" className="drop-zone" role="button" tabIndex={0}>
              <input id="voice-file-input" type="file" accept="audio/*" hidden />
              Drag &amp; drop audio here, or click to browse.
            </div>

            <form id="voice-upload-form">
              <div className="form-group">
                <label htmlFor="voice-category">Category</label>
                <select id="voice-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="voice-subcategory">Subcategory</label>
                <select id="voice-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="voice-subsubcategory">Sub-subcategory</label>
                <select id="voice-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="voice-title">Title (optional)</label>
                <input id="voice-title" type="text" />
              </div>
              <div className="form-group">
                <label htmlFor="voice-notes">Notes (optional)</label>
                <textarea id="voice-notes" rows={4} />
              </div>

              <label className="inline-flex items-center" style={{gap:'.5rem', marginTop:'.25rem'}}>
                <input id="voice-is-public" type="checkbox" /> Public
              </label>

              <div className="actions">
                <button id="voice-upload-btn" type="submit" className="primary">Upload Voice</button>
              </div>
            </form>
          </div>
        </section>

        <section className="card dashboard" aria-labelledby="voice-dash-title">
          <div className="card__body">
            <h3 id="voice-dash-title" className="card__title">Voice Dashboard</h3>
            <div className="toolbar">
              <select id="voice-dash-filter" defaultValue="all">
                <option value="all">All Categories</option>
              </select>
              <input id="voice-dash-search" placeholder="Search filenames..." />
            </div>
            <div id="voice-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
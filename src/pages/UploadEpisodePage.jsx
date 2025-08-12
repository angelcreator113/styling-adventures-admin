// src/pages/UploadEpisodePage.jsx
import React, { useEffect, useState } from "react";
import { useUploadPanel } from "@/hooks/useUploadPanel";
import "@/css/styles/upload-page.css";

const prettyBytes = (n = 0) => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};

export default function UploadEpisodePage() {
  // Prefix must stay "episode-" to match your hook
  useUploadPanel("episodes", "episode-");

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Listen for files from the hook
  useEffect(() => {
    const onFiles = (e) => {
      if (e.detail?.uiPrefix !== "episode-") return;
      setFile(e.detail.files?.[0] || null);
    };
    document.addEventListener("upload:files", onFiles);
    return () => document.removeEventListener("upload:files", onFiles);
  }, []);

  // Listen for progress/completion from your pipeline
  useEffect(() => {
    const onProg = (e) => {
      if (e.detail?.uiPrefix !== "episode-") return;
      setUploading(true);
      setProgress(Math.max(0, Math.min(100, e.detail.progress ?? 0)));
    };
    const onDone = (e) => {
      if (e.detail?.uiPrefix !== "episode-") return;
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFile(null);
      }, 600);
    };
    document.addEventListener("upload:progress", onProg);
    document.addEventListener("upload:complete", onDone);
    return () => {
      document.removeEventListener("upload:progress", onProg);
      document.removeEventListener("upload:complete", onDone);
    };
  }, []);

  const onClear = () => {
    setFile(null);
    const input = document.getElementById("episode-file-input");
    if (input) input.value = "";
  };

  // Demo-only progress if backend isn’t wired yet
  const startDemoUpload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + Math.random() * 18 + 6);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setUploading(false);
          setFile(null);
          setProgress(0);
        }, 500);
      }
    }, 180);
  };

  return (
    <div className="upload-page">
      <div className="upload-page-grid">
        <section className="card" aria-labelledby="ep-upload-title">
          <div className="card__body">
            <h2 id="ep-upload-title" className="card__title">Upload Episode</h2>
            <p className="muted">Upload video files, tag them, and manage visibility.</p>

            {/* Drag-only drop area (no label wrapper, no onClick) */}
            <div id="episode-drop-area" className="drop-zone" role="button" tabIndex={0}>
              Drag &amp; drop video here, or use the button.
            </div>

            {/* Hidden input + label-as-button (the ONLY picker opener) */}
            <input id="episode-file-input" type="file" accept="video/*" hidden />
            <div className="row" style={{ marginTop: 12 }}>
              <label htmlFor="episode-file-input" className="tb-btn secondary">Choose a file…</label>
              <button
                id="episode-upload-btn"
                className="tb-btn primary"
                type="button"
                onClick={startDemoUpload}
              >
                Upload Episode
              </button>
              <button
                id="episode-clear"
                className="tb-btn ghost"
                type="button"
                onClick={onClear}
              >
                Clear
              </button>
            </div>

            {/* Optional file list + progress UI that your hook can manipulate */}
            <div
              id="episode-file-list"
              className="file-list"
              data-empty={file ? "false" : "true"}
            >
              {/* Lightweight inline preview for convenience (safe to remove if you prefer hook-driven render) */}
              {file && (
                <div className="file-row">
                  <span className="file-row__icon" aria-hidden="true">🎬</span>
                  <span className="file-row__name">{file.name}</span>
                  <span className="file-row__size">{prettyBytes(file.size)}</span>
                </div>
              )}
            </div>

            <progress
              id="episode-progress"
              max="100"
              value={progress}
              hidden={!uploading && progress === 0}
            />
            <div id="episode-progress-label" className="muted">
              {uploading || progress > 0 ? `${Math.floor(progress)}%` : ""}
            </div>

            {/* …the rest of your form fields … */}
            <form id="episode-upload-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label htmlFor="episode-category">Category</label>
                <select id="episode-category" className="smart-dropdown" required />
              </div>
              <div className="form-group">
                <label htmlFor="episode-subcategory">Subcategory</label>
                <select id="episode-subcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episode-subsubcategory">Sub-subcategory</label>
                <select id="episode-subsubcategory" className="smart-dropdown" />
              </div>
              <div className="form-group">
                <label htmlFor="episode-title">Title (optional)</label>
                <input id="episode-title" type="text" />
              </div>
              <div className="form-group">
                <label htmlFor="episode-notes">Notes (optional)</label>
                <textarea id="episode-notes" rows={3} />
              </div>

              <label className="inline-flex items-center" style={{ gap: ".5rem", marginTop: ".25rem" }}>
                <input id="episode-is-public" type="checkbox" /> Public
              </label>
            </form>
          </div>
        </section>

        {/* Dashboard stays the same */}
        <section className="card dashboard" aria-labelledby="ep-dash-title">
          <div className="card__body">
            <h3 id="ep-dash-title" className="card__title">Episode Dashboard</h3>
            <div className="toolbar" style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <select id="episode-dash-filter" defaultValue="all">
                <option value="all">All Categories</option>
              </select>
              <input id="episode-dash-search" placeholder="Search filenames…" />
            </div>
            <div id="episode-dashboard-root" className="dashboard-grid">
              <div className="empty">Items will appear here.</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

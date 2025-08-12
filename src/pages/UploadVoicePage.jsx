import React, { useEffect, useState } from "react";
import { useUploadPanel } from "@/hooks/useUploadPanel";
import "@/css/styles/upload-page.css";

export default function UploadVoicePage() {
  useUploadPanel("voice", "voice-");

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const onFiles = (e) => {
      if (e.detail?.uiPrefix !== "voice-") return;
      setFile(e.detail.files?.[0] || null);
    };
    document.addEventListener("upload:files", onFiles);
    return () => document.removeEventListener("upload:files", onFiles);
  }, []);

  useEffect(() => {
    const onProg = (e) => {
      if (e.detail?.uiPrefix !== "voice-") return;
      setUploading(true);
      setProgress(Math.max(0, Math.min(100, e.detail.progress ?? 0)));
    };
    const onDone = (e) => {
      if (e.detail?.uiPrefix !== "voice-") return;
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
    const input = document.getElementById("voice-file-input");
    if (input) input.value = "";
  };

  // Demo-only progress so the bar moves if backend isn't wired yet
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
        <section className="card" aria-labelledby="voice-upload-title">
          <div className="card__body">
            <h2 id="voice-upload-title" className="card__title">Upload Voice</h2>
            <p className="muted">Upload audio files, tag them, and manage visibility.</p>

            {/* Drag-only drop area (no onClick here) */}
            <div id="voice-drop-area" className="drop-zone" role="button" tabIndex={0}>
              Drag &amp; drop audio here, or use the button.
            </div>

            {/* Hidden input + label-as-button (the only click trigger) */}
            <input id="voice-file-input" type="file" accept="audio/*" hidden />
            <div className="row" style={{ marginTop: 12 }}>
              <label htmlFor="voice-file-input" className="tb-btn secondary">Choose a file…</label>
              <button
                id="voice-upload-btn"
                className="tb-btn primary"
                type="button"
                onClick={startDemoUpload}
              >
                Upload Voice
              </button>
              <button
                id="voice-clear"
                className="tb-btn ghost"
                type="button"
                onClick={onClear}
              >
                Clear
              </button>
            </div>

            {/* Optional file list + progress UI your hook wires up */}
            <div id="voice-file-list" className="file-list" data-empty={!file}></div>
            <progress
              id="voice-progress"
              max="100"
              value={progress}
              hidden={!uploading && progress === 0}
            />
            <div id="voice-progress-label" className="muted">
              {uploading || progress > 0 ? `${Math.floor(progress)}%` : ""}
            </div>

            {/* …the rest of your form fields … */}
            <form id="voice-upload-form" style={{ marginTop: 16 }}>
              <label className="inline-flex items-center" style={{ gap: ".5rem", marginBottom: "0.5rem" }}>
                <input id="voice-is-public" type="checkbox" /> Public
              </label>

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
                <textarea id="voice-notes" rows={3} />
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

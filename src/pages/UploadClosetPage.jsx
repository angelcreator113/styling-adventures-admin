import React, { useEffect, useState } from "react";
import { useUploadPanel } from "@/hooks/useUploadPanel";
import "@/css/styles/upload-page.css";

const prettyBytes = (n = 0) => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};

export default function UploadClosetPage() {
  useUploadPanel("closet", "closet-");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const onFiles = (e) => {
      if (e.detail?.uiPrefix !== "closet-") return;
      const f = e.detail.files?.[0];
      setFile(f || null);
    };
    document.addEventListener("upload:files", onFiles);
    return () => document.removeEventListener("upload:files", onFiles);
  }, []);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview("");
  }, [file]);

  useEffect(() => {
    const onProg = (e) => {
      if (e.detail?.uiPrefix !== "closet-") return;
      setUploading(true);
      setProgress(Math.max(0, Math.min(100, e.detail.progress ?? 0)));
    };
    const onDone = (e) => {
      if (e.detail?.uiPrefix !== "closet-") return;
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
    setPreview("");
    const input = document.getElementById("closet-file-input");
    if (input) input.value = "";
  };

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
        {/* Left: Upload card */}
        <section className="card" aria-labelledby="closet-upload-title">
          <div className="card__body">
            <h2 id="closet-upload-title" className="card__title">
              Closet Upload
            </h2>
            <p className="muted">
              Drop closet image files, tag them, and manage visibility.
            </p>

            {/* Drag-only drop area */}
            <div id="closet-drop-area" className="drop-zone" role="button" tabIndex={0}>
              Drag &amp; drop image here, or use the button.
            </div>

            {/* Hidden input + label-as-button */}
            <input id="closet-file-input" type="file" accept="image/*" hidden />
            <div className="row" style={{ marginTop: 12 }}>
              <label htmlFor="closet-file-input" className="tb-btn secondary">
                Choose a file…
              </label>
              <button
                id="closet-upload-btn"
                className="tb-btn primary"
                type="button"
                onClick={startDemoUpload}
              >
                Upload to Closet
              </button>
              <button
                id="closet-clear"
                className="tb-btn ghost"
                type="button"
                onClick={onClear}
              >
                Clear
              </button>
            </div>

            {/* Optional file list + progress */}
            <div id="closet-file-list" className="file-list" data-empty={!file}></div>
            {uploading || progress > 0 ? (
              <>
                <progress id="closet-progress" max="100" value={progress} />
                <div id="closet-progress-label" className="muted">
                  {progress > 0 && `${progress.toFixed(0)}%`}
                </div>
              </>
            ) : null}

            {/* Rest of your form fields */}
            <form id="closet-upload-form" style={{ marginTop: 16 }}>
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
                <textarea id="closet-notes" rows={3} />
              </div>

              <label
                className="inline-flex items-center"
                style={{ gap: ".5rem", marginTop: ".25rem" }}
              >
                <input id="closet-is-public" type="checkbox" defaultChecked /> Make Public
              </label>
            </form>
          </div>
        </section>

        {/* Right: Dashboard scaffold */}
        <section className="card dashboard" aria-labelledby="closet-dash-title">
          <div className="card__body">
            <h3 id="closet-dash-title" className="card__title">
              Closet Dashboard
            </h3>
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

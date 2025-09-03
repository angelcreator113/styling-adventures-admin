// src/pages/admin/themes/BulkImportDropzone.jsx
import React, { useCallback, useRef, useState } from "react";

export default function BulkImportDropzone({ onFiles }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const handle = useCallback(
    (list) => {
      const files = Array.from(list || []).filter(Boolean);
      if (files.length && typeof onFiles === "function") onFiles(files);
    },
    [onFiles]
  );

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    if (e.dataTransfer?.files?.length) handle(e.dataTransfer.files);
  };

  const onSelect = (e) => handle(e.target.files);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      style={{
        border: "2px dashed #d9c7f7",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
        background: isOver ? "#faf5ff" : "#fff",
        cursor: "pointer",
      }}
      aria-label="Drop images here or click to choose"
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Drop images here (or click) to create draft themes
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        JPG / PNG / WEBP • multiple files supported
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onSelect}
      />
    </div>
  );
}

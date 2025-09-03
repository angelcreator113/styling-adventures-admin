// src/components/themes/DropzoneUpload.jsx
import React, { useCallback, useRef, useState } from "react";

export default function DropzoneUpload({ onFile, accept = "image/*", height = 140 }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = useCallback(
    (e) => {
      stop(e);
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFile?.(file);
    },
    [onFile]
  );

  return (
    <div
      onClick={pick}
      onDragEnter={(e) => { stop(e); setDragOver(true); }}
      onDragOver={(e) => { stop(e); setDragOver(true); }}
      onDragLeave={(e) => { stop(e); setDragOver(false); }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        border: dragOver ? "2px dashed #a855f7" : "2px dashed #ddd",
        background: dragOver ? "rgba(168,85,247,.06)" : "#faf7ff",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "all .15s ease",
      }}
      aria-label="Drop image here or click to choose"
    >
      <div className="muted" style={{ textAlign: "center" }}>
        <strong>Drop background here</strong>
        <div style={{ fontSize: 12 }}>or click to choose</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile?.(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

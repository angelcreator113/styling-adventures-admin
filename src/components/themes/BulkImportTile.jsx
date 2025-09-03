// src/components/themes/BulkImportTile.jsx
import React, { useRef, useState } from "react";
import { uploadBgAndCreateDraft } from "@/hooks/useThemes";

export default function BulkImportTile({ onDone }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const list = Array.from(files);
      await Promise.all(list.map((f) => uploadBgAndCreateDraft(f)));
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      className="card"
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px dashed #d6d3e0",
        background: "#fbf7ff",
        display: "grid",
        placeItems: "center",
        minHeight: 110,
        cursor: "pointer",
      }}
      aria-label="Bulk import backgrounds"
      title="Drop multiple images to create draft themes"
    >
      <div className="muted" style={{ textAlign: "center" }}>
        <strong>{busy ? "Importing…" : "Bulk import backgrounds"}</strong>
        <div style={{ fontSize: 12 }}>Drop multiple images or click to choose</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

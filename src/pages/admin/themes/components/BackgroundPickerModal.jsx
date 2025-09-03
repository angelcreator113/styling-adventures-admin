// src/pages/admin/themes/components/BackgroundPickerModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db, storage } from "@/utils/init-firebase";
import {
  collection, getDocs, query, where, orderBy, limit,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

function FileCard({ file, selected, onSelect }) {
  const thumb = file.thumbUrl || file.bgUrl || file.previewUrl;
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={`card ${selected ? "is-active" : ""}`}
      style={{
        textAlign: "left",
        padding: 8,
        border: selected ? "2px solid #8b5cf6" : "1px solid #eee",
        borderRadius: 12,
      }}
      title={file.name || file.title || file.id}
    >
      <div
        style={{
          width: "100%", height: 120, borderRadius: 10,
          background: "#f7f4fb", display: "grid", placeItems: "center",
          overflow: "hidden",
        }}
      >
        {thumb ? (
          <img src={thumb} alt={file.name || file.title || file.id}
               style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="muted">No preview</span>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {file.title || file.name || file.id}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>
          {file.season ? `S${file.season}` : ""}{file.episode ? ` · E${file.episode}` : ""}
          {file.panel ? ` · ${file.panel}` : ""}
        </div>
      </div>
    </button>
  );
}

/**
 * Looks under Firestore: /contentFiles/episode-backgrounds/items (and optional folders)
 * Each item doc ideally has:
 *  - title/name
 *  - filePath (Storage path) or bgUrl / thumbUrl
 *  - season, episode, panel (optional)
 */
export default function BackgroundPickerModal({
  open, onClose, onPick,
  categoryId = "episode-backgrounds",
}) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setBusy(true);
      try {
        // Base collection for episode backgrounds
        const base = collection(db, "contentFiles", categoryId, "items");
        const qs = query(base, orderBy("createdAt", "desc"), limit(200));
        const snap = await getDocs(qs);
        const rows = await Promise.all(
          snap.docs.map(async (d) => {
            const data = { id: d.id, path: d.ref.path, ...d.data(), categoryId };
            // If only filePath is present, resolve a URL for preview
            if (!data.thumbUrl && !data.bgUrl && data.filePath) {
              try {
                data.bgUrl = await getDownloadURL(ref(storage, data.filePath));
              } catch { /* ignore */ }
            }
            return data;
          })
        );
        setFiles(rows);
      } finally {
        setBusy(false);
      }
    })();
  }, [open, categoryId]);

  const list = useMemo(() => {
    const text = q.trim().toLowerCase();
    return files.filter((f) => {
      if (season && String(f.season || "") !== String(season)) return false;
      if (episode && String(f.episode || "") !== String(episode)) return false;
      if (!text) return true;
      const hay =
        `${f.title || ""} ${f.name || ""} ${f.panel || ""}`.toLowerCase();
      return hay.includes(text);
    });
  }, [files, q, season, episode]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true"
         style={{
           position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
           display: "grid", placeItems: "center", zIndex: 60,
         }}>
      <div className="dashboard-card" style={{ width: 920, maxWidth: "95vw" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 8,
        }}>
          <h3 style={{ margin: 0 }}>Pick from Episode Backgrounds</h3>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <div style={{
          display: "flex", gap: 8, alignItems: "center", marginBottom: 12,
        }}>
          <input className="input" placeholder="Search title / panel"
                 value={q} onChange={(e) => setQ(e.target.value)}
                 style={{ maxWidth: 320 }} />
          <input className="input" placeholder="Season"
                 value={season} onChange={(e) => setSeason(e.target.value)}
                 style={{ width: 100 }} />
          <input className="input" placeholder="Episode"
                 value={episode} onChange={(e) => setEpisode(e.target.value)}
                 style={{ width: 100 }} />
          <div className="muted">{list.length} assets</div>
        </div>

        <div style={{
          display: "grid", gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          marginBottom: 12,
        }}>
          {busy && <div className="muted">Loading…</div>}
          {!busy && list.length === 0 && (
            <div className="muted">No backgrounds found.</div>
          )}
          {list.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              selected={selected?.id === f.id}
              onSelect={setSelected}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!selected}
            onClick={() => {
              if (selected) onPick?.(selected);
              onClose?.();
            }}
          >
            Use selected
          </button>
        </div>
      </div>
    </div>
  );
}

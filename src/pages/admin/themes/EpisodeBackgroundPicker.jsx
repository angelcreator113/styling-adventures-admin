// src/pages/admin/themes/EpisodeBackgroundPicker.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/utils/init-firebase";

export default function EpisodeBackgroundPicker({ open, onClose, onSelect }) {
  const [rows, setRows] = useState([]);
  const [qText, setQText] = useState("");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [type, setType] = useState("all"); // "image" | "video" | "all"

  // Live list from Firestore (latest first)
  useEffect(() => {
    if (!open) return;
    const ref = collection(db, "episodeBackgrounds");
    const unsub = onSnapshot(query(ref, orderBy("createdAt", "desc")), (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [open]);

  // Apply UI filters
  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();

    return rows.filter((r) => {
      const itemKind = r.kind || r.type || "image";
      const okType = type === "all" ? true : itemKind === type;
      const okSeason = season ? String(r.season ?? "") === String(season) : true;
      const okEpisode = episode ? String(r.episode ?? "") === String(episode) : true;

      const hay = `${r.title || ""} ${(r.category || "")} ${(r.tags || []).join(" ")}`.toLowerCase();
      const okText = !t || hay.includes(t);

      return okType && okSeason && okEpisode && okText;
    });
  }, [rows, type, season, episode, qText]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pick episode background"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        className="dashboard-card"
        style={{ width: "min(1000px, 100%)", maxHeight: "90vh", overflow: "auto", padding: 16 }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>Pick Episode Background</h3>
          <button className="btn" onClick={onClose} aria-label="Close picker">
            Close
          </button>
        </header>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Search…"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            style={{ minWidth: 220 }}
            aria-label="Search text"
          />
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Type filter"
          >
            <option value="all">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <input
            className="input"
            placeholder="Season"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            style={{ width: 120 }}
            aria-label="Season"
          />
          <input
            className="input"
            placeholder="Episode"
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            style={{ width: 120 }}
            aria-label="Episode"
          />
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          }}
        >
          {filtered.map((r) => {
            const itemKind = r.kind || r.type || "image";
            const preview = r.posterUrl || r.thumbUrl || r.url; // prefer poster for videos

            return (
              <div key={r.id} className="card" style={{ padding: 8 }}>
                <div
                  style={{
                    height: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#f6f1fa",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {itemKind === "video" ? (
                    preview ? (
                      <img
                        src={preview}
                        alt={r.title || r.id}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="muted">No preview</div>
                    )
                  ) : preview ? (
                    <img
                      src={preview}
                      alt={r.title || r.id}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="muted">No preview</div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{r.title || r.category || "Untitled"}</div>
                    <div className="muted">
                      {(r.season ? `S${r.season} ` : "") + (r.episode ? `E${r.episode}` : "")}
                    </div>
                  </div>

                  <button
                    className="btn"
                    style={{ padding: "4px 8px" }}
                    onClick={() =>
                      onSelect?.({
                        id: r.id,
                        url: r.url,
                        kind: itemKind, // "image" | "video"
                        posterUrl: r.posterUrl || null,
                        title: r.title || null,
                        season: r.season ?? null,
                        episode: r.episode ?? null,
                      })
                    }
                  >
                    Use
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="muted" style={{ padding: 8 }}>
              No backgrounds match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


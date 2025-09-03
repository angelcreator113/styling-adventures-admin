import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, storage, auth } from "@/utils/init-firebase";
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const human = () => auth.currentUser?.email || auth.currentUser?.uid || "system";

async function readImageDims(file) {
  const url = URL.createObjectURL(file);
  try {
    const dims = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
    return dims;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readVideoDims(file) {
  const url = URL.createObjectURL(file);
  try {
    const dims = await new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => resolve({ w: v.videoWidth, h: v.videoHeight, dur: v.duration });
      v.onerror = reject;
      v.src = url;
    });
    return dims;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function validate16x9(file) {
  if (file.type.startsWith("image/")) {
    const { w, h } = await readImageDims(file);
    const okRatio = Math.abs(w / h - 16 / 9) < 0.02;
    const okMin = w >= 1280 && h >= 720;
    if (!okRatio || !okMin) throw new Error(`Image must be 16:9 and at least 1280×720. Got ${w}×${h}.`);
    return { w, h, type: "image" };
  }
  if (file.type.startsWith("video/")) {
    const { w, h, dur } = await readVideoDims(file);
    const okRatio = Math.abs(w / h - 16 / 9) < 0.02;
    const okMin = w >= 1280 && h >= 720;
    if (!okRatio || !okMin) throw new Error(`Video must be 16:9 and at least 1280×720. Got ${w}×${h}.`);
    return { w, h, dur, type: "video" };
  }
  throw new Error("Only images or videos are allowed.");
}

export default function AdminEpisodeBackgrounds() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({ season: "", episode: "", category: "", title: "", tags: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const refColl = collection(db, "episodeBackgrounds");
    const unsub = onSnapshot(query(refColl, orderBy("createdAt", "desc")), (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError("");
    try {
      const meta = await validate16x9(file);

      // Create doc first to get ID
      const docRef = await addDoc(collection(db, "episodeBackgrounds"), {
        title: form.title || file.name,
        category: form.category || null,
        season: form.season ? Number(form.season) : null,
        episode: form.episode ? Number(form.episode) : null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        type: meta.type,
        width: meta.w, height: meta.h, duration: meta.dur || null,
        createdAt: serverTimestamp(),
        createdBy: human(),
        usedBy: { count: 0, themes: {} },
      });

      const path = `episodeBackgrounds/${docRef.id}/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);

      await setDoc(doc(db, "episodeBackgrounds", docRef.id), { url, thumbUrl: url, storagePath: path }, { merge: true });
      setForm({ season: "", episode: "", category: "", title: "", tags: "" });
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>🎬 Episode Backgrounds</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Upload 16:9 backgrounds (image or video, min 1280×720). Then pick them inside the Theme editor.
        </p>
      </div>

      <div className="dashboard-card" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Upload</h3>
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <input className="input" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="input" placeholder="Season" value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))} />
              <input className="input" placeholder="Episode" value={form.episode} onChange={(e) => setForm((f) => ({ ...f, episode: e.target.value }))} />
            </div>
            <input className="input" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
                {busy ? "Uploading…" : "Choose file"}
              </button>
              <span className="muted">Only images or videos. Must be 16:9, at least 1280×720.</span>
            </div>
            <input type="file" hidden ref={fileRef} accept="image/*,video/*" onChange={onUpload} />
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Library</h3>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {rows.map((r) => (
              <div key={r.id} className="card" style={{ padding: 8 }}>
                <div style={{ height: 100, borderRadius: 10, overflow: "hidden", background: "#f6f1fa", display: "grid", placeItems: "center" }}>
                  {r.type === "video" ? (
                    <video src={r.thumbUrl || r.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                  ) : (
                    <img src={r.thumbUrl || r.url} alt={r.title || r.id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{r.title || "Untitled"}</div>
                  <div className="muted">
                    {(r.season ? `S${r.season} ` : "") + (r.episode ? `E${r.episode}` : "")} • {r.type || "image"}
                  </div>
                  <div className="muted">Used by: {r.usedBy?.count || 0} theme(s)</div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <div className="muted">No backgrounds yet.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

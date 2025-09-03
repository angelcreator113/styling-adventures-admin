import { useCallback, useEffect, useState } from "react";
import { auth, db, storage } from "@/utils/init-firebase";
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const ALLOWED_IMAGES = new Set(["image/jpeg","image/png","image/webp"]);
const ALLOWED_VIDEOS = new Set(["video/mp4","video/webm"]);
const human = () => auth.currentUser?.email || auth.currentUser?.uid || "system";

function assertAllowedType(file) {
  const t = file?.type || "";
  if (ALLOWED_IMAGES.has(t)) return "image";
  if (ALLOWED_VIDEOS.has(t)) return "video";
  throw new Error("Only images (jpg/png/webp) or videos (mp4/webm) are allowed.");
}

async function getImageSize(file) {
  const url = URL.createObjectURL(file);
  try {
    const dim = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
    return dim;
  } finally { URL.revokeObjectURL(url); }
}

async function getVideoSize(file) {
  const url = URL.createObjectURL(file);
  try {
    const dim = await new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () =>
        resolve({ w: v.videoWidth || 0, h: v.videoHeight || 0, url });
      v.onerror = reject;
      v.src = url;
      v.muted = true;
    });
    return dim;
  } finally { /* keep URL for frame capture in poster step, then revoke */ }
}

function ensure16by9({ w, h }) {
  const ratio = w / h;
  const okRatio = Math.abs(ratio - 16/9) < 0.02; // ~2% tolerance
  const okMin = w >= 1280 && h >= 720;
  if (!okRatio || !okMin) {
    throw new Error(`Must be 16:9 and ≥1280×720. Got ${w}×${h}.`);
  }
  return { w, h, ratio };
}

async function makeVideoPoster(objectURL, w, h) {
  // capture first frame as poster
  const video = document.createElement("video");
  video.src = objectURL; video.muted = true;
  await video.play().catch(()=>{}); // some browsers require play for ready
  await new Promise(res => { if (video.readyState >= 2) res(); else video.onloadeddata = res; });
  video.currentTime = 0;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, w, h);
  const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob;
}

export default function useEpisodeBackgrounds() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "episodeBackgrounds"), orderBy("createdAt","desc"));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const upload = useCallback(async ({ file, title, season, episode, tags = [] }) => {
    setBusy(true);
    try {
      const kind = assertAllowedType(file);

      let dims, posterBlob = null;
      if (kind === "image") {
        dims = ensure16by9(await getImageSize(file));
      } else {
        const vs = await getVideoSize(file);
        dims = ensure16by9(vs);
        posterBlob = await makeVideoPoster(vs.url, dims.w, dims.h);
        URL.revokeObjectURL(vs.url);
      }

      const meta = {
        kind,                     // "image" | "video"
        title: (title || file.name).replace(/\.[^/.]+$/,""),
        season: season || null,
        episode: episode || null,
        tags, width: dims.w, height: dims.h, ratio: dims.ratio,
        createdAt: serverTimestamp(), createdBy: human(),
      };
      const docRef = await addDoc(collection(db, "episodeBackgrounds"), meta);

      const mainPath = `episodeBackgrounds/${docRef.id}/${Date.now()}_${file.name}`;
      const mainRef  = ref(storage, mainPath);
      await uploadBytes(mainRef, file);
      const url = await getDownloadURL(mainRef);

      const patch = { url, storagePath: mainPath };

      if (posterBlob) {
        const posterPath = `episodeBackgrounds/${docRef.id}/poster_${Date.now()}.jpg`;
        const posterRef  = ref(storage, posterPath);
        await uploadBytes(posterRef, posterBlob);
        patch.posterUrl = await getDownloadURL(posterRef);
        patch.posterPath = posterPath;
      }

      await setDoc(doc(db, "episodeBackgrounds", docRef.id), patch, { merge: true });
      return docRef.id;
    } finally {
      setBusy(false);
    }
  }, []);

  const remove = useCallback(async (id) => {
    setBusy(true);
    try { await deleteDoc(doc(db,"episodeBackgrounds",id)); }
    finally { setBusy(false); }
  }, []);

  return { items, busy, upload, remove };
}

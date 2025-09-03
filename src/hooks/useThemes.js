// src/hooks/useThemes.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection, doc, getDocs, onSnapshot, setDoc, addDoc, deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/utils/init-firebase";
import { getAuth } from "firebase/auth";

// ---- time helpers ----
export const toMillis = (ts) =>
  ts?.toMillis?.() ?? (typeof ts?.seconds === "number" ? ts.seconds * 1000 : null) ?? (typeof ts === "number" ? ts : null);

export const toTimestamp = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  // Firestore Timestamp – lazy import to avoid cyclic deps
  const { Timestamp } = require("firebase/firestore");
  return Timestamp.fromDate(d);
};

// ---- status machine ----
export const themeStatus = (t, nowMs = Date.now()) => {
  const rel = toMillis(t.releaseAt);
  const exp = toMillis(t.expiresAt);
  const del = toMillis(t.deleteAt);

  if (del && nowMs >= del) return "expired";
  if (exp && nowMs >= exp) return "expired";
  if (rel && nowMs < rel) return "scheduled";
  if (!rel) return "draft";
  return "live";
};

// ---- audit ----
const addAudit = async (themeId, entry) => {
  try {
    const auth = getAuth();
    const u = auth.currentUser;
    await addDoc(collection(db, `themes/${themeId}/audit`), {
      ts: serverTimestamp(),
      userUid: u?.uid || null,
      userName: u?.displayName || null,
      ...entry,
    });
  } catch (e) {
    console.warn("[audit] failed", e);
  }
};

// ---- public API ----
export function useThemes() {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState([]);
  const [iconMap, setIconMap] = useState({}); // {themeId: iconUrl}

  // live themes
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "themes"), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setThemes(rows);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // icons (no need to live update unless you want)
  useEffect(() => {
    (async () => {
      try {
        const s = await getDocs(collection(db, "themeIcons"));
        const m = {};
        s.docs.forEach((d) => (m[d.id] = d.data()?.iconUrl || null));
        setIconMap(m);
      } catch {
        setIconMap({});
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const s = await getDocs(collection(db, "themes"));
    setThemes(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, []);

  const themesWithStatus = useMemo(
    () => themes.map((t) => ({ ...t, _status: themeStatus(t) })),
    [themes]
  );

  return { themes: themesWithStatus, iconMap, loading, refresh };
}

// ---- mutations ----
export async function saveTheme(id, payload) {
  if (id) {
    // read previous for audit "before"
    const before = null; // keep small; you can fetch doc if needed
    await setDoc(doc(db, "themes", id), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    await addAudit(id, { action: "update", after: payload, before });
    return id;
  } else {
    const ref = await addDoc(collection(db, "themes"), { ...payload, createdAt: serverTimestamp() });
    await addAudit(ref.id, { action: "create", after: payload });
    return ref.id;
  }
}

export async function deleteTheme(id) {
  await deleteDoc(doc(db, "themes", id));
  await addAudit(id, { action: "delete" });
}

// ---- storage helpers (used by bulk import) ----
export async function uploadBgAndCreateDraft(file) {
  const storage = getStorage();
  const name = (file.name || "theme").replace(/\.[^.]+$/, "");
  const newId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `public/themes/${newId}/bg_${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);

  const payload = {
    name,
    description: "",
    bgUrl: url,
    visibility: "public",
    tier: "all",
    releaseAt: null,          // => Draft
    expiresAt: null,
    deleteAt: null,
    featuredOnLogin: false,
    rolloutPercent: 100,
  };
  const id = await saveTheme(null, payload);
  return { id, url, name };
}

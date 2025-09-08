// src/hooks/useFanTheme.ts
import { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/utils/init-firebase";

type ThemeDoc = {
  name?: string;
  iconUrl?: string;
  bgUrl?: string;              // allow either field name
  backgroundUrl?: string;
  ambientEffect?: string | null;
  visibility?: "public" | "private";
  releaseAt?: any;
  expiresAt?: any;
};

type FanSettings = {
  themeId?: string | null;
  updatedAt?: any;
};

function toMillis(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "number") return ts;
  return null;
}

function isLive(t?: ThemeDoc | null) {
  if (!t) return false;
  if (t.visibility === "private") return false;
  const now = Date.now();
  const rel = toMillis((t as any).releaseAt);
  const exp = toMillis((t as any).expiresAt);
  if (rel && now < rel) return false;
  if (exp && now > exp) return false;
  return true;
}

export default function useFanTheme() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [themeDoc, setThemeDoc] = useState<ThemeDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // track auth uid
  useEffect(() => {
    const off = auth.onAuthStateChanged((u) => setUid(u?.uid || null));
    return off;
  }, []);

  // subscribe to fan settings -> themeId
  useEffect(() => {
    if (!uid) {
      setThemeId(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, "fanSettings", uid);
    const off = onSnapshot(
      ref,
      (snap) => {
        const data = (snap.data() as FanSettings) || {};
        setThemeId(data.themeId || null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return off;
  }, [uid]);

  // fetch theme doc when id changes
  useEffect(() => {
    if (!themeId) {
      setThemeDoc(null);
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.style.setProperty("--theme-bg", "none");
        root.removeAttribute("data-ambient");
      }
      return;
    }
    const ref = doc(db, "themes", themeId);
    const off = onSnapshot(ref, (snap) => {
      const t = (snap.data() as DocumentData | undefined) as ThemeDoc | undefined;
      setThemeDoc(t || null);
    });
    return off;
  }, [themeId]);

  // apply CSS side effects
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const url = themeDoc?.backgroundUrl || themeDoc?.bgUrl || "";
    const ambient = themeDoc?.ambientEffect || "";

    if (url && isLive(themeDoc)) {
      root.style.setProperty("--theme-bg", `url("${url}")`);
    } else {
      root.style.setProperty("--theme-bg", "none");
    }
    if (ambient) root.setAttribute("data-ambient", ambient);
    else root.removeAttribute("data-ambient");
  }, [themeDoc]);

  // setter writes to fanSettings/{uid}
  async function chooseTheme(nextId: string | null) {
    if (!uid) throw new Error("Not signed in.");
    const ref = doc(db, "fanSettings", uid);
    await setDoc(ref, { themeId: nextId, updatedAt: serverTimestamp() }, { merge: true });
  }

  return useMemo(
    () => ({
      uid,
      themeId,
      themeDoc,
      live: isLive(themeDoc || undefined),
      loading,
      chooseTheme,
    }),
    [uid, themeId, themeDoc, loading]
  );
}

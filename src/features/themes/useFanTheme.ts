// src/features/themes/useFanTheme.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/utils/init-firebase";
import { db } from "@/utils/init-firebase";

export function useFanTheme() {
  const [themeId, setThemeId] = useState<string | null>(null);
  const uid = auth.currentUser?.uid || null;

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "fanSettings", uid);
    const off = onSnapshot(ref, (snap) => {
      setThemeId((snap.data() as any)?.themeId ?? null);
    });
    return () => off();
  }, [uid]);

  async function chooseTheme(nextId: string) {
    if (!uid) throw new Error("Not signed in");
    const ref = doc(db, "fanSettings", uid);
    await setDoc(ref, { themeId: nextId, updatedAt: serverTimestamp() }, { merge: true });
  }

  return { themeId, chooseTheme };
}

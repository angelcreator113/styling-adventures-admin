// src/features/themes/applyTheme.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/init-firebase";

export async function applyThemeToDOM(themeId?: string | null) {
  const root = document.documentElement;
  if (!themeId) {
    root.style.removeProperty("--theme-bg");
    root.setAttribute("data-ambient", "");
    return;
  }
  const snap = await getDoc(doc(db, "themes", themeId));
  const t = snap.data() as any;
  root.style.setProperty("--theme-bg", `url("${t?.backgroundUrl || ""}")`);
  root.setAttribute("data-ambient", t?.ambientEffect || "");
}

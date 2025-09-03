// utils/log-theme-vote.js
import { db } from "@/utils/init-firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getUserRole } from "@/utils/auth-helpers";
import { getClientId } from "@/utils/client-id";

export async function logThemeVote({ themeName, themeId, themeIcon }) {
  try {
    const uid = localStorage.getItem("uid") || null;
    const clientId = getClientId();
    const role = uid ? await getUserRole(uid) : "guest";
    const now = Date.now();

    // Defensive validation
    if (!themeId && !themeName) {
      console.warn("[logThemeVote] Missing themeId and themeName — skipping vote log.");
      return;
    }

    await addDoc(collection(db, "analytics", "themeVotes", "events"), {
      type: "theme_vote",
      themeName: themeName || themeId || "unknown",
      themeId: themeId || "unknown",
      themeIcon: themeIcon || null,
      userRole: role || "guest",
      uid,
      clientId,
      ts: now,
      date: new Date(now).toISOString().split("T")[0],
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("[logThemeVote] Failed to log vote", err);
  }
}


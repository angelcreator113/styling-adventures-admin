// src/features/themes/castThemeVote.ts
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "@/utils/init-firebase";

function dayStamp(d = new Date()) {
  return d.toISOString().slice(0,10).replace(/-/g,""); // YYYYMMDD
}

export async function castThemeVote(themeId: string) {
  const u = auth.currentUser;
  if (!u) throw new Error("Sign in to vote");
  const voteId = `${u.uid}_${dayStamp()}`;
  const ref = doc(db, `themes/${themeId}/votes/${voteId}`);
  await setDoc(ref, { uid: u.uid, themeId, createdAt: serverTimestamp() }, { merge: false });
}

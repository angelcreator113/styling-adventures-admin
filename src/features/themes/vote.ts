// src/features/themes/vote.ts
import { auth } from "@/utils/init-firebase";
import { db } from "@/utils/init-firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

function today() {
  const d = new Date();
  const mm = `${d.getMonth()+1}`.padStart(2,"0");
  const dd = `${d.getDate()}`.padStart(2,"0");
  return `${d.getFullYear()}${mm}${dd}`; // YYYYMMDD
}

export async function voteForTheme(themeId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to vote");
  const voteId = `${uid}_${today()}`;
  const ref = doc(db, "themes", themeId, "votes", voteId);
  await setDoc(ref, {
    uid, themeId, day: today(), createdAt: serverTimestamp(),
  }, { merge: false });
}

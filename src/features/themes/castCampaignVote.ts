// src/features/themes/castCampaignVote.ts
import { auth, db } from "@/utils/init-firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * Writes to themeCampaigns/{cid}/votes/{uid_YYYYMMDD}
 * Required by rules: { uid, themeId, createdAt: request.time }
 */
export async function castCampaignVote(campaignId: string, themeId: string) {
  const u = auth.currentUser;
  if (!u) throw new Error("Sign in to vote.");

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const voteId = `${u.uid}_${y}${m}${d}`;

  const ref = doc(db, `themeCampaigns/${campaignId}/votes/${voteId}`);
  await setDoc(ref, {
    uid: u.uid,
    themeId,
    createdAt: serverTimestamp(), // matches request.time in rules
  }, { merge: false });
}

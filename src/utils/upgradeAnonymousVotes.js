// src/utils/upgradeAnonymousVotes.js
import { getFirestore, query, where, collection, getDocs, writeBatch } from "firebase/firestore";

export const upgradeAnonymousVotes = async (uid) => {
  const db = getFirestore();
  const clientId = localStorage.getItem("clientId");
  if (!uid || !clientId) return;

  const q = query(
    collection(db, "analytics/themeVotes/events"),
    where("uid", "==", ""),
    where("clientId", "==", clientId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.forEach((doc) => {
    batch.update(doc.ref, { uid });
  });

  await batch.commit();
  console.log("Votes upgraded to UID");
};

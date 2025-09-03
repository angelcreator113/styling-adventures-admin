import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Generate date string like "2025-08-30"
export const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Get UID or fallback anonymous clientId
export const getUserIdentifier = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user?.uid) return { uid: user.uid, clientId: null };
  // fallback for anonymous session
  let clientId = localStorage.getItem("clientId");
  if (!clientId) {
    clientId = crypto.randomUUID(); // or Date.now() based
    localStorage.setItem("clientId", clientId);
  }
  return { uid: null, clientId };
};

// Save the vote in the clean path
export const saveThemeVote = async (themeId, themeName, themeIcon) => {
  const db = getFirestore();
  const today = getTodayDateString();
  const { uid, clientId } = getUserIdentifier();

  const voteRef = doc(collection(db, 'analytics/themeVotes/events'));
  await setDoc(voteRef, {
    themeId,
    themeName,
    themeIcon,
    votedAt: serverTimestamp(),
    date: today,
    uid: uid || "",
    clientId: clientId || "",
  });
};

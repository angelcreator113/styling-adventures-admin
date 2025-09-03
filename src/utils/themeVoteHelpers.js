import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase"; // adjust path if needed

export const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getClientId = () => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
};

export const hasAlreadyVoted = async (themeId, uid = null, clientId, todayDateString) => {
  const votesRef = collection(db, 'analytics/themeVotes/events');
  const constraints = [
    where('themeId', '==', themeId),
    where('date', '==', todayDateString),
  ];

  if (uid) {
    constraints.push(where('uid', '==', uid));
  } else {
    constraints.push(where('clientId', '==', clientId));
  }

  const q = query(votesRef, ...constraints);
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const saveVote = async (themeId, themeName, themeIcon) => {
  const user = auth.currentUser;
  const uid = user?.uid ?? null;
  const clientId = getClientId();
  const todayDateString = getTodayDateString();

  const alreadyVoted = await hasAlreadyVoted(themeId, uid, clientId, todayDateString);

  if (alreadyVoted) {
    throw new Error("already-voted");
  }

  const voteData = {
    type: "theme_vote",
    themeId,
    themeName,
    themeIcon,
    uid: uid ?? "",
    userRole: user?.role ?? "anon",
    clientId,
    ts: Date.now(),
    date: todayDateString,
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(db, "analytics/themeVotes/events"), voteData);
};

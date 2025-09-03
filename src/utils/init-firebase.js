import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.appspot.com",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:YOUR_REAL_APP_ID", // ✅ FIXED
  measurementId: "G-N9YGR4MR0E", // ✅ FIXED
};

// Initialize app only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

export const onAuthReady = () =>
  new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(() => {
      unsub();
      resolve();
    });
  });

export { app, auth, db, storage };  // Ensure storage is exported

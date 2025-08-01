// ✅ Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Config Object
const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.appspot.com",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9",
};

// ✅ Initialize Firebase Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// ✅ Custom Auth Listener Wrapper
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ✅ Page Protection: Require Login
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.warn("🚫 Not authenticated. Redirecting to login...");
      window.location.href = "login.html";
    }
  });
}

// src/firebase/auth.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// ✅ Your Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.firebasestorage.app",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9"
};

// ✅ Initialize only if not already
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();

// ✅ onAuthReady wrapper (Promise resolves once Firebase knows auth state)
const onAuthReady = () =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });

export { auth, onAuthReady };

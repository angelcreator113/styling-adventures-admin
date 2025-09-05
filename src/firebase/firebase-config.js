// src/firebase/firebase-config.js
const get = (k) => (import.meta.env[k] ?? "").trim();

export const firebaseConfig = {
  apiKey: get("VITE_FIREBASE_API_KEY"),
  authDomain: get("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: get("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: get("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: get("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: get("VITE_FIREBASE_APP_ID"),
  measurementId: get("VITE_FIREBASE_MEASUREMENT_ID"), // optional
};

// Safety: helpful error if something is missing
for (const [k, v] of Object.entries(firebaseConfig)) {
  if ((k !== "measurementId") && !v) {
    // eslint-disable-next-line no-console
    console.error(`[Firebase] Missing env for ${k}. Check .env.local`);
  }
}

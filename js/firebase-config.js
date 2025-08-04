// /js/firebase-config.js
// @ts-check

// @ts-ignore
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
// @ts-ignore
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
// @ts-ignore
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
// @ts-ignore
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const w = /** @type {any} */ (window);

async function loadConfig() {
  if (w.__FIREBASE_CONFIG__) return w.__FIREBASE_CONFIG__;
  const res = await fetch('/config/firebase.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`[firebase-config] GET /config/firebase.json failed: ${res.status}`);
  return /** @type {any} */ (await res.json());
}

(async function initFirebase() {
  try {
    const config = await loadConfig();

    // ✅ Avoid re-initializing if Firebase is already set up
    const existingApps = getApps();
    const app = existingApps.length ? existingApps[0] : initializeApp(config);

    const db = getFirestore(app);
    const storage = getStorage(app);
    const auth = getAuth(app);

    w.firebaseRefs = { app, db, storage, auth, onAuthStateChanged };
    console.info('[firebase-config] Firebase initialized');
  } catch (e) {
    console.error('Failed to load Firebase config:', e);
    w.firebaseRefs = w.firebaseRefs || {};
  }
})();

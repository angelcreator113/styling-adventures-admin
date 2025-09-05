// src/utils/init-firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
} from "firebase/storage";

import { firebaseConfig } from "@/firebase/firebase-config";

// Reuse existing app in dev to avoid duplicate inits
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core SDKs
export const auth = getAuth(app);

// Flags
const forceLP =
  String(import.meta.env.VITE_FIRESTORE_LONG_POLLING || "")
    .toLowerCase() === "true";
const useEmu =
  String(import.meta.env.VITE_USE_EMULATORS || "")
    .toLowerCase() === "false";

// Firestore — try initialize once with desired options, else reuse existing
let _db;
try {
  _db = initializeFirestore(
    app,
    forceLP ? { experimentalForceLongPolling: true } : {}
  );
} catch {
  // If already initialized elsewhere, just grab it
  _db = getFirestore(app);
}
export const db = _db;

// Storage
export const storage = getStorage(app);

/* ---- Emulator wiring (dev only) ---------------------------------------- */
if (useEmu) {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {}

  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {}

  try {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  } catch {}

  // eslint-disable-next-line no-console
  console.log("[Firebase] Using local emulators (auth:9099, firestore:8080, storage:9199)");
}
/* ----------------------------------------------------------------------- */

/**
 * Wait for the initial auth user (or null).
 * Usage: const user = await authReady();
 */
export function authReady() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        stop();
        resolve(user || null);
      },
      () => {
        stop();
        resolve(null);
      }
    );
  });
}

// Convenience: a ready-made Promise some places may await directly
export const authReadyPromise = authReady();

// ✅ Back-compat alias for older imports
export { authReady as onAuthReady };

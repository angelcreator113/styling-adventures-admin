// src/utils/init-firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/firebase-config'; // <- your file

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Optional but fixes flaky “Listen 400” on some networks
const useLongPolling =
  String(import.meta.env?.VITE_FIRESTORE_LONG_POLLING ?? '') === 'true';

const db = useLongPolling
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

// Promise that resolves once Auth state is known
let _authReady;
function authReady() {
  if (!_authReady) {
    _authReady = new Promise((resolve) => {
      const off = onAuthStateChanged(auth, (user) => {
        off();
        resolve(user || null);
      });
    });
  }
  return _authReady;
}

export { app, auth, db, authReady };

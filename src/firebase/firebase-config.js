// src/firebase/firebase-config.js

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.appspot.com",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9"
};

// Prevent re-initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Export reusable Firebase instances
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;

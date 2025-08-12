// src/utils/init-firebase.js
import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

window.firebaseRefs = { app, db, storage, auth };
window.dispatchEvent(new Event('firebase-ready'));

console.log('[init-firebase] Firebase initialized ✅');

export { app, db, storage, auth };

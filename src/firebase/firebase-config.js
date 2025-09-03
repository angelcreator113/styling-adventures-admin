import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Correct import for Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.firebasestorage.app",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Export Firestore instance

export { db }; // Ensure db is exported

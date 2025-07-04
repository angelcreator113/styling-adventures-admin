// firebase-config.js
// Initializes Firebase App + Firestore + Storage services

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔐 Replace with environment variables in production
const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.firebasestorage.app",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756980e13f45b946070f9",
  measurementId: "G-NY9GR4MR0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore and Storage references
export const db = getFirestore(app);
export const storage = getStorage(app);

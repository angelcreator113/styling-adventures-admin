import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.firebasestorage.app",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app); // ✅ This enables use in meta-panel.js

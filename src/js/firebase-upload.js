// js/firebase-upload.js
import { db, storage } from '../../utils/firebase-client.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 📤 Upload to Firebase Storage
export async function uploadFile(file, path) {
  const storageRef = ref(storage, `${path}/${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// 🧾 Save metadata to Firestore
export async function saveFileMetadata(type, metadata) {
  const colRef = collection(db, type);
  await addDoc(colRef, metadata);
}

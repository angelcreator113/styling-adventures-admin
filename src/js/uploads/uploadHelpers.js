// src/js/uploads/uploadHelpers.js
// ✅ Unified init + modular SDK
import { db, storage } from '../../utils/init-firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

// 📤 Upload to Firebase Storage
export async function uploadFile(file, path) {
  const storageRef = ref(storage, `${path}/${encodeURIComponent(file.name)}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// 🧾 Save metadata to Firestore
export async function saveFileMetadata(type, metadata) {
  await addDoc(collection(db, type), metadata);
}

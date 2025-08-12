import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { storage, db } from "./firebase-client.js"; // ✅ FIXED PATH

/**
 * 🍞 Show toast message
 * @param {string} message
 * @param {"success"|"error"} type
 */
export function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/**
 * Upload a file to Firebase Storage and track progress.
 * @param {File} file - The file object to upload
 * @param {string} path - The full Firebase Storage path (no trailing slash)
 * @returns {Promise<string>} downloadURL
 */
export function uploadFile(file, path) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `${path}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const progressBar = document.getElementById("upload-progress");
    if (progressBar) {
      progressBar.hidden = false;
      progressBar.value = 0;
    }

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressBar) progressBar.value = percent;
      },
      (error) => {
        console.error("❌ Upload failed:", error);
        showToast("❌ Upload failed", "error");
        if (progressBar) {
          progressBar.hidden = true;
          progressBar.value = 0;
        }
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        showToast("✅ Upload complete", "success");
        if (progressBar) {
          progressBar.hidden = true;
          progressBar.value = 0;
        }
        resolve(url);
      }
    );
  });
}

/**
 * Save metadata to Firestore
 * @param {string} collectionName
 * @param {object} data
 */
export async function saveFileMetadata(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      uploadedAt: new Date()
    });
    console.log(`📦 Metadata saved to "${collectionName}" with ID:`, docRef.id);
  } catch (error) {
    console.error("❌ Error saving metadata:", error);
    showToast("❌ Failed to save metadata", "error");
  }
}

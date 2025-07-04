// uploader.js
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, storage } from "./firebase-config.js";

/**
 * Uploads a file to Firebase Storage with progress callback support
 * @param {File} file - The file to upload
 * @param {string} basePath - The base storage folder (e.g., "closet")
 * @param {function} [progressCallback] - Optional callback(progress: number)
 * @param  {...string} folders - Optional nested folders (e.g., category, subcategory, subsubcategory)
 * @returns {Promise<string>} - File download URL
 */
export async function uploadFile(file, basePath, progressCallback, ...folders) {
  return new Promise((resolve, reject) => {
    try {
      const safeFileName = encodeURIComponent(file.name);
      const fullPath = [basePath, ...folders].filter(Boolean).join("/");
      const fileRef = ref(storage, `${fullPath}/${safeFileName}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (progressCallback) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressCallback(progress);
          }
        },
        (error) => {
          console.error("[UPLOAD FAILED]", error);
          alert("Upload failed: " + error.message);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[UPLOAD SUCCESS] ${file.name} → ${fullPath}`);
          resolve(url);
        }
      );
    } catch (error) {
      console.error("[UPLOAD ERROR]", error);
      reject(error);
    }
  });
}

/**
 * Saves metadata to Firestore
 * @param {string} collectionName - Firestore collection name
 * @param {object} data - Metadata object
 */
export async function saveFileMetadata(collectionName, data) {
  try {
    await addDoc(collection(db, collectionName), {
      ...data,
      uploadedAt: serverTimestamp()
    });
    console.log(`[METADATA SAVED] → ${collectionName}`);
  } catch (error) {
    console.error("[METADATA SAVE FAILED]", error);
    alert("Metadata save failed: " + error.message);
  }
}

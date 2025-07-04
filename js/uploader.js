// uploader.js
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, storage } from "./firebase-config.js";

/**
 * Uploads a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} basePath - The base storage folder (e.g., "closet")
 * @param {string} [category] - Optional category folder
 * @param {string} [subcategory] - Optional subcategory folder
 * @returns {Promise<string>} - File download URL
 */
export async function uploadFile(file, basePath, category = '', subcategory = '') {
  try {
    const safeFileName = encodeURIComponent(file.name);
    const fullPath = [basePath, category, subcategory].filter(Boolean).join("/");
    const fileRef = ref(storage, `${fullPath}/${safeFileName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log(`[UPLOAD SUCCESS] ${file.name} → ${fullPath}`);
    return url;
  } catch (error) {
    console.error("[UPLOAD FAILED]", error);
    alert("Upload failed: " + error.message);
    throw error;
  }
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

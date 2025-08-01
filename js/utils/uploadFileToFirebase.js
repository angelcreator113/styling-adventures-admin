import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { app } from "./firebase-client.js";

const storage = getStorage(app);

/**
 * 📤 Upload a file to Firebase Storage and return the download URL
 * @param {string} type - folder name like 'closet', 'voice', etc.
 * @param {File} file - file object selected by user
 * @param {function} onProgress - callback with upload % (optional)
 * @param {function} onComplete - callback(downloadURL, filename)
 * @param {function} onError - callback(error)
 */
export async function uploadFileToFirebase(type, file, onProgress, onComplete, onError) {
  try {
    const filePath = `${type}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);

    // Optional: Wrap with progress simulation if needed
    const snapshot = await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);
    console.log(`✅ Uploaded to Firebase: ${downloadURL}`);

    if (onComplete) onComplete(downloadURL, file.name);
  } catch (error) {
    console.error("❌ Upload error:", error);
    if (onError) onError(error);
  }
}

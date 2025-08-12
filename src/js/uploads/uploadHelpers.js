import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db, storage } from './firebase-client.js';

/**
 * Uploads a File to Firebase Storage under {collection}/{uuid}/{filename}
 * Returns the public download URL.
 */
export async function uploadFileToFirestoreStorage(collectionName, file) {
  const id = crypto.randomUUID();
  const storageRef = ref(storage, `${collectionName}/${id}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * Saves metadata for the upload to Firestore
 */
export async function saveUploadMetadata(collectionName, data) {
  await addDoc(collection(db, collectionName), data);
}

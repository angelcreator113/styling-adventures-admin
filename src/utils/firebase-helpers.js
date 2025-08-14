// src/utils/firebase-helpers.js
// ✅ Real uploader + DOM events; no CDN imports
import { storage, db } from './init-firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * Core uploader with progress + events.
 * @param {{ file: File, path: string, uiPrefix?: string, metadata?: Record<string, any>, onProgress?: (pct:number, sent:number, total:number)=>void }} opts
 * @returns {Promise<{ url: string, fullPath: string, bytes: number, contentType?: string }>}
 */
export function uploadFile({ file, path, uiPrefix, metadata = {}, onProgress }) {
  return new Promise((resolve, reject) => {
    const safeName = file.name.replace(/\s+/g, '-');
    const fullPath = `${path}/${Date.now()}-${safeName}`;
    const sref = ref(storage, fullPath);
    const task = uploadBytesResumable(sref, file, metadata);

    task.on('state_changed',
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(pct, snap.bytesTransferred, snap.totalBytes);
        emit('upload:progress', {
          uiPrefix, progress: pct,
          bytesTransferred: snap.bytesTransferred,
          totalBytes: snap.totalBytes,
          fileName: file.name, path: fullPath,
        });
      },
      (error) => {
        emit('upload:error', { uiPrefix, error: String(error), fileName: file.name, path: fullPath });
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        emit('upload:complete', { uiPrefix, url, fileName: file.name, path: fullPath });
        resolve({ url, fullPath, bytes: task.snapshot.totalBytes, contentType: file.type });
      }
    );
  });
}

/**
 * Convenience for your upload panels
 * (file, { slug, public, onProgress, uiPrefix })
 */
export function uploadFileWithProgress(file, { slug, public: isPublic = true, onProgress, uiPrefix }) {
  const folder = slug === 'closet' ? 'closet' : slug === 'voice' ? 'voices' : 'episodes';
  const base = isPublic ? 'public' : 'private';
  const path = `${base}/${folder}`;
  return uploadFile({ file, path, uiPrefix, onProgress });
}

export async function saveFileMetadata(collectionName, data) {
  await addDoc(collection(db, collectionName), { ...data, uploadedAt: serverTimestamp() });
}

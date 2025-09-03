// src/utils/firestoreScenes.js
import { db } from '@/firebase/firebase-config';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

const CLOSET_SCENES_COLLECTION = 'closet_scenes';

/**
 * Fetch all Closet Scenes from Firestore.
 */
export async function getScenes() {
  const snapshot = await getDocs(collection(db, CLOSET_SCENES_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Save or update a Closet Scene in Firestore.
 * @param {object} scene - The full scene object including ID.
 */
export async function saveScene(scene) {
  const sceneId = scene.id || scene.name.toLowerCase().replace(/\s+/g, '-');
  const ref = doc(db, CLOSET_SCENES_COLLECTION, sceneId);
  return setDoc(ref, scene);
}

/**
 * Delete a Closet Scene by ID.
 * @param {string} id - The document ID to delete.
 */
export async function deleteScene(id) {
  const ref = doc(db, CLOSET_SCENES_COLLECTION, id);
  return deleteDoc(ref);
}

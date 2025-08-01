// js/components/categoryStore.js
import { db } from '../utils/firebase-client.js';
import {
  collection, doc, getDocs, setDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const COLLECTION_NAME = 'categories'; // 🏷️ Firestore root

/**
 * 🔄 Load category data for a given panel type
 */
export async function loadCategoryData(panelType) {
  const result = {};
  try {
    const colRef = collection(db, `${COLLECTION_NAME}/${panelType}/items`);
    const snapshot = await getDocs(colRef);
    snapshot.forEach(doc => result[doc.id] = doc.data());
    localStorage.setItem(`dropdowns-${panelType}`, JSON.stringify(result));
    return result;
  } catch (err) {
    console.warn(`[CategoryStore] Firestore load failed, falling back to localStorage`, err);
    const fallback = localStorage.getItem(`dropdowns-${panelType}`);
    return fallback ? JSON.parse(fallback) : {};
  }
}

/**
 * 💾 Save category structure for a panel
 */
export async function saveCategoryData(panelType, data) {
  try {
    const colRef = collection(db, `${COLLECTION_NAME}/${panelType}/items`);
    for (const [cat, subcats] of Object.entries(data)) {
      await setDoc(doc(colRef, cat), subcats);
    }
    localStorage.setItem(`dropdowns-${panelType}`, JSON.stringify(data));
  } catch (err) {
    console.error('[CategoryStore] Failed to save category data:', err);
  }
}

/**
 * ❌ Delete protection — Prevent deletion if sub-items exist
 */
export async function deleteCategory(panelType, category) {
  const data = await loadCategoryData(panelType);
  if (Object.keys(data[category] || {}).length > 0) {
    throw new Error('This category has sub-items and cannot be deleted.');
  }
  try {
    const docRef = doc(db, `${COLLECTION_NAME}/${panelType}/items`, category);
    await deleteDoc(docRef);
    delete data[category];
    localStorage.setItem(`dropdowns-${panelType}`, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[CategoryStore] Delete failed:', err);
    return false;
  }
}

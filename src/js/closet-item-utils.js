// closet-item-utils.js
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function getAllClosetItems() {
  const snapshot = await getDocs(collection(db, "closet"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateClosetItem(id, updates) {
  const ref = doc(db, "closet", id);
  await updateDoc(ref, updates);
}

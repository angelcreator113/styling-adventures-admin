import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDpOFCB3QzPbgzfroeoi8oxgj7rF5hmyHw",
  authDomain: "styling-admin.firebaseapp.com",
  projectId: "styling-admin",
  storageBucket: "styling-admin.appspot.com",
  messagingSenderId: "390526657916",
  appId: "1:390526657916:web:2756988e13f45b946070f9",
  measurementId: "G-N9YGR4MR0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Upload helper
async function uploadFile(file, path) {
  const fileRef = ref(storage, `${path}/${file.name}`);
  const snapshot = await uploadBytes(fileRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Display helper
async function displayUploads(collectionName, listId, type) {
  const snapshot = await getDocs(collection(db, collectionName));
  const container = document.getElementById(listId);
  container.innerHTML = '';

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.innerHTML = `
      <strong>${data.filename || data.title}</strong><br>
      ${type === 'link' ? `<a href="${data.url}" target="_blank">View</a><br>` : ''}
      <button onclick="deleteItem('${collectionName}', '${docSnap.id}', '${listId}', '${type}')">🗑️ Delete</button>
    `;
    container.appendChild(div);
  });
}

// Delete helper
window.deleteItem = async (collectionName, id, listId, type) => {
  await deleteDoc(doc(db, collectionName, id));
  alert("Item deleted.");
  displayUploads(collectionName, listId, type);
};

// Upload buttons
document.getElementById('episode-upload-btn').addEventListener('click', async () => {
  const file = document.getElementById('episode-upload').files[0];
  if (!file) return alert("No episode selected.");

  const url = await uploadFile(file, "episodes");
  await addDoc(collection(db, "episodes"), {
    filename: file.name,
    url: url,
    type: "video"
  });
  alert("Episode uploaded!");
  displayUploads('episodes', 'episode-list', 'link');
});

document.getElementById('voice-upload-btn').addEventListener('click', async () => {
  const file = document.getElementById('voice-upload').files[0];
  if (!file) return alert("No voice file selected.");

  const url = await uploadFile(file, "voice");
  await addDoc(collection(db, "voice"), {
    filename: file.name,
    url: url,
    type: "audio"
  });
  alert("Voice file uploaded!");
  displayUploads('voice', 'voice-list', 'link');
});

document.getElementById('closet-upload-btn').addEventListener('click', async () => {
  const file = document.getElementById('closet-upload').files[0];
  if (!file) return alert("No closet item selected.");

  const url = await uploadFile(file, "closet");
  await addDoc(collection(db, "closet"), {
    filename: file.name,
    url: url,
    type: "image"
  });
  alert("Closet item uploaded!");
  displayUploads('closet', 'closet-list', 'link');
});

document.getElementById('meta-publish-btn').addEventListener('click', async () => {
  const title = document.getElementById('meta-title').value;
  const description = document.getElementById('meta-description').value;
  const tags = document.getElementById('meta-tags').value;

  await addDoc(collection(db, "metadata"), {
    title,
    description,
    tags: tags.split(',').map(t => t.trim())
  });

  alert("Metadata saved!");
  displayUploads('metadata', 'meta-list', 'text');
});

// Initial load
displayUploads('episodes', 'episode-list', 'link');
displayUploads('voice', 'voice-list', 'link');
displayUploads('closet', 'closet-list', 'link');
displayUploads('metadata', 'meta-list', 'text');

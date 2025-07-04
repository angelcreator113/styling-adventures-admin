// renderer.js
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function displayUploads(collectionName, listId, previewType) {
  const listEl = document.getElementById(listId);
  if (!listEl) return;
  listEl.innerHTML = '';

  const querySnapshot = await getDocs(collection(db, collectionName));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement('li');
    li.className = 'upload-item';

    const fileLabel = document.createElement('div');
    fileLabel.textContent = data.filename || 'Unnamed';
    fileLabel.className = 'upload-label';

    // Preview Element
    let preview;
    if (previewType === 'preview' && data.type === 'image') {
      preview = document.createElement('img');
      preview.src = data.url;
      preview.alt = data.filename;
      preview.className = 'upload-thumb';
    } else if (data.type === 'video') {
      preview = document.createElement('video');
      preview.src = data.url;
      preview.controls = true;
      preview.className = 'upload-thumb';
    } else if (data.type === 'audio') {
      preview = document.createElement('audio');
      preview.src = data.url;
      preview.controls = true;
      preview.className = 'upload-thumb';
    } else {
      preview = document.createElement('a');
      preview.href = data.url;
      preview.textContent = 'Open File';
      preview.target = '_blank';
    }

    // Delete Button
    const delBtn = document.createElement('button');
    delBtn.textContent = '❌';
    delBtn.className = 'delete-btn';
    delBtn.onclick = async () => {
      if (confirm(`Delete ${data.filename}?`)) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
        displayUploads(collectionName, listId, previewType);
      }
    };

    li.appendChild(fileLabel);
    li.appendChild(preview);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  });
}

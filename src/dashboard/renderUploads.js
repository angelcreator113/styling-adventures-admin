// js/dashboard/renderUploads.js
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "../utils/firebase-client.js";

/**
 * 🧙‍♀️ Render all uploads for a given panel (closet, voice, episodes)
 * @param {string} type - Firestore collection name (closet, voice, episodes)
 * @param {string} gridSelector - CSS selector for grid element
 * @param {'image'|'audio'|'video'} mediaType - Determines preview element
 */
export async function renderUploadCollection(type, gridSelector, mediaType) {
  const listEl = document.querySelector(gridSelector);
  if (!listEl) return;

  // 💡 Show loading state only once
  if (!listEl.classList.contains("populated")) {
    listEl.innerHTML = `<div class="loading">⏳ Loading ${type}...</div>`;
  }

  try {
    const querySnapshot = await getDocs(collection(db, type));
    listEl.innerHTML = ''; // 🧹 Clear after loading

    if (querySnapshot.empty) {
      listEl.innerHTML = `<div class="no-results">No ${type} uploads found yet.</div>`;
      return;
    }

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement('div');
      li.className = 'upload-card';

      const label = document.createElement('div');
      label.className = 'upload-label';
      label.textContent = data.filename || 'Unnamed';

      // 🔍 Preview element
      let preview;
      if (mediaType === 'image') {
        preview = document.createElement('img');
        preview.src = data.url;
        preview.alt = data.filename;
        preview.className = 'upload-thumb';
      } else if (mediaType === 'video') {
        preview = document.createElement('video');
        preview.src = data.url;
        preview.controls = true;
        preview.className = 'upload-thumb';
      } else if (mediaType === 'audio') {
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

      // 🗑️ Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.className = 'delete-btn';
      delBtn.onclick = async () => {
        if (confirm(`Delete ${data.filename}?`)) {
          await deleteDoc(doc(db, type, docSnap.id));
          await renderUploadCollection(type, gridSelector, mediaType);
        }
      };

      li.appendChild(label);
      li.appendChild(preview);
      li.appendChild(delBtn);
      listEl.appendChild(li);
    });

    // ✅ Mark grid as ready
    listEl.classList.add("populated");
  } catch (err) {
    listEl.innerHTML = `<div class="error-message">Failed to load uploads: ${err.message}</div>`;
    console.error(`❌ Error rendering ${type} uploads:`, err);
  }
}

/**
 * 🧤 Protect against double rendering
 */
if (!window.renderedPanels) window.renderedPanels = {};
export async function safeRenderPanel(type, selector, mediaType) {
  if (window.renderedPanels[type]) return;
  window.renderedPanels[type] = true;
  await renderUploadCollection(type, selector, mediaType);
}

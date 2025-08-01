// js/uploads/upload-handlers.js

import {
  collection as fsCollection,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "../utils/firebase-client.js";
import { uploadFile } from "../utils/firebase-helpers.js";
import { setupCategoryDropdowns } from "../components/category-dropdowns.js";
import { initDragDropUploadDynamic } from "../components/dragdrop.js";

// 🔔 Toast UI
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : ""}`;
  toast.textContent = message;
  document.getElementById("toast-container")?.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// 🧼 Reset Inputs
function resetUploadForm({ fileInput, categoryEl, subcategoryEl, subsubcategoryEl, filterInput }) {
  if (fileInput) fileInput.value = "";
  if (categoryEl) categoryEl.selectedIndex = 0;
  if (subcategoryEl) subcategoryEl.selectedIndex = 0;
  if (subsubcategoryEl) subsubcategoryEl.selectedIndex = 0;
  if (filterInput) filterInput.value = "";
}

// 🖼️ Render Upload Cards
export function renderUploadCollection(collectionName, containerSelector, mediaType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const placeholders = {
    closet: "/img/placeholder-closet.png",
    voice: "/img/placeholder-voice.png",
    episodes: "/img/placeholder-episode.png"
  };

  container.innerHTML = `<div class="dashboard-loading">Loading ${collectionName}...</div>`;
  const colRef = fsCollection(db, collectionName);

  onSnapshot(colRef, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p class="empty-state">No uploads yet.</p>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const { filename, url, category } = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "upload-card";

      const media = document.createElement(mediaType === "image" ? "img" : mediaType);
      if (mediaType === "image") {
        media.src = url || placeholders[collectionName];
        media.alt = filename;
        media.onerror = () => { media.src = placeholders[collectionName]; };
      } else {
        const source = document.createElement("source");
        source.src = url;
        source.type = mediaType === "audio" ? "audio/mpeg" : "video/mp4";
        media.controls = true;
        media.width = 240;
        media.poster = placeholders[collectionName];
        media.appendChild(source);
      }

      const meta = document.createElement("div");
      meta.className = "upload-meta";
      meta.innerHTML = `
        <strong>${filename}</strong><br/>
        <small>Category: ${category || "Uncategorized"}</small>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "🗑️ Delete";
      deleteBtn.onclick = async () => {
        if (confirm(`Delete "${filename}"?`)) {
          await deleteDoc(doc(db, collectionName, id));
        }
      };

      const actions = document.createElement("div");
      actions.className = "upload-actions";
      actions.appendChild(deleteBtn);

      card.appendChild(media);
      card.appendChild(meta);
      card.appendChild(actions);
      container.appendChild(card);
    });
  });
}

// 🚀 Main Setup Function
export async function initUploadPanel({
  panelType,
  fileInputId,
  uploadBtnId,
  categoryId,
  subcategoryId,
  subsubcategoryId,
  dropAreaId,
  filterInputId,
  clearFilterBtnId,
  gridSelector,
  fileType
}) {
  const fileInput = document.getElementById(fileInputId);
  const uploadBtn = document.getElementById(uploadBtnId);
  const categoryEl = document.getElementById(categoryId);
  const subcategoryEl = document.getElementById(subcategoryId);
  const subsubcategoryEl = document.getElementById(subsubcategoryId);
  const dropArea = document.getElementById(dropAreaId);
  const filterInput = document.getElementById(filterInputId);
  const clearFilterBtn = document.getElementById(clearFilterBtnId);
  const progressEl = document.getElementById("upload-progress");

  setupCategoryDropdowns(panelType, `${panelType}-`);
  initDragDropUploadDynamic([{ inputId: fileInputId, dropAreaId }]);
  renderUploadCollection(panelType, gridSelector, fileType);

  // Clear filter
  clearFilterBtn?.addEventListener("click", () => {
    if (filterInput) filterInput.value = "";
    renderUploadCollection(panelType, gridSelector, fileType);
  });

  uploadBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (uploadBtn.disabled) return;

    const file = fileInput?.files?.[0];
    const category = categoryEl?.value;

    if (!file || !category) {
      showToast("❗ Please select a file and choose at least a category.", true);
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading…";
    progressEl.hidden = false;
    progressEl.value = 0;

    try {
      const subcategory = subcategoryEl?.value || "uncategorized";
      const subSubcategory = subsubcategoryEl?.value || "none";
      const path = `${panelType}/${category}/${subcategory}/${subSubcategory}`;

      const fileUrl = await uploadFile(file, path, progress => {
        progressEl.value = progress;
      });

      const metadata = {
        filename: file.name,
        url: fileUrl,
        category,
        subcategory,
        subsubcategory: subSubcategory,
        createdAt: new Date().toISOString()
      };

      await addDoc(fsCollection(db, panelType), metadata);
      showToast(`✅ ${panelType} upload successful!`);

      resetUploadForm({ fileInput, categoryEl, subcategoryEl, subsubcategoryEl, filterInput });
    } catch (err) {
      console.error(`❌ Upload error:`, err);
      showToast("❌ Upload failed. Check console for details.", true);
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Upload";
      progressEl.hidden = true;
      progressEl.value = 0;
    }
  });
}

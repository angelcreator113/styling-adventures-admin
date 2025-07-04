// renderer.js
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

/**
 * Render a list of uploads into a target container
 * @param {string} collectionName - Firestore collection
 * @param {string} containerId - HTML element ID to render into
 * @param {string} renderType - 'link', 'text', or 'image'
 */
export async function displayUploads(collectionName, containerId, renderType = "link") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container with id "${containerId}" not found.`);
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    container.innerHTML = ""; // Clear existing content

    if (querySnapshot.empty) {
      container.innerHTML = `<p class="upload-item">No uploads yet.</p>`;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      let content = "";

      if (renderType === "link") {
        content = `
          <div class="upload-item" data-doc-id="${docId}">
            <a href="${data.url}" target="_blank">${data.filename || "Download File"}</a><br/>
            ${data.category ? `<strong>${data.category}</strong> → ${data.subcategory || ""}<br/>` : ""}
            <button class="delete-btn" data-doc-id="${docId}">🗑️ Delete</button>
          </div>
        `;
      } else if (renderType === "image") {
        content = `
          <div class="upload-item" data-doc-id="${docId}">
            <img src="${data.url}" alt="${data.filename || "Image"}" style="max-width:100%; max-height:100px;" />
            <p>${data.filename}</p>
            ${data.category ? `<strong>${data.category}</strong> → ${data.subcategory || ""}<br/>` : ""}
            <button class="delete-btn" data-doc-id="${docId}">🗑️ Delete</button>
          </div>
        `;
      } else {
        content = `
          <div class="upload-item" data-doc-id="${docId}">
            <strong>${data.title || "Untitled"}</strong><br/>
            <em>${data.description || "No description"}</em><br/>
            <span>Tags: ${Array.isArray(data.tags) ? data.tags.join(", ") : "None"}</span><br/>
            <button class="delete-btn" data-doc-id="${docId}">🗑️ Delete</button>
          </div>
        `;
      }

      container.insertAdjacentHTML("beforeend", content);
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.getAttribute('data-doc-id');
        if (confirm("Are you sure you want to delete this item?")) {
          try {
            await deleteDoc(doc(db, collectionName, docId));
            alert("Deleted successfully!");
            displayUploads(collectionName, containerId, renderType);
          } catch (err) {
            console.error("Delete failed:", err);
            alert("Error deleting item.");
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading uploads:", error);
    container.innerHTML = `<div class="upload-item">Error loading uploads.</div>`;
  }
}

// renderer.js
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let content = "";

      if (renderType === "link") {
        content = `
          <div class="upload-item">
            <a href="${data.url}" target="_blank">${data.filename || "Download File"}</a>
          </div>
        `;
      } else if (renderType === "image") {
        content = `
          <div class="upload-item">
            <img src="${data.url}" alt="${data.filename || "Image"}" style="max-width:100%; max-height:100px;" />
            <p>${data.filename}</p>
          </div>
        `;
      } else {
        content = `
          <div class="upload-item">
            <strong>${data.title || "Untitled"}</strong><br/>
            <em>${data.description || "No description"}</em><br/>
            <span>Tags: ${Array.isArray(data.tags) ? data.tags.join(", ") : "None"}</span>
          </div>
        `;
      }

      container.insertAdjacentHTML("beforeend", content);
    });
  } catch (error) {
    console.error("Error loading uploads:", error);
    container.innerHTML = `<div class="upload-item">Error loading uploads.</div>`;
  }
}

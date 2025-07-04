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

    // Group by category/subcategory
    const grouped = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const cat = data.category || "Uncategorized";
      const sub = data.subcategory || "Other";
      if (!grouped[cat]) grouped[cat] = {};
      if (!grouped[cat][sub]) grouped[cat][sub] = [];
      grouped[cat][sub].push({ id: doc.id, ...data });
    });

    const sortSeasons = (a, b) => {
      const seasonA = parseInt(a.replace("s", ""));
      const seasonB = parseInt(b.replace("s", ""));
      return seasonA - seasonB;
    };

    for (const category in grouped) {
      const catSection = document.createElement("div");
      catSection.className = "closet-category";
      catSection.innerHTML = `<h3>${category}</h3>`;

      let subKeys = Object.keys(grouped[category]);
      if (["Seasons", "Filler"].includes(category)) {
        subKeys = subKeys.sort(sortSeasons);
      }

      for (const sub of subKeys) {
        const subSection = document.createElement("div");
        subSection.className = "closet-subcategory";
        subSection.innerHTML = `<h4>${sub}</h4>`;

        grouped[category][sub].forEach((item) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = "upload-item";
          itemDiv.dataset.docId = item.id;

          const ext = item.url.split('.').pop().toLowerCase();

          if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
            itemDiv.innerHTML = `
              <img src="${item.url}" alt="${item.filename}" style="max-width:100px; max-height:80px;" /><br>
              <a href="${item.url}" target="_blank">${item.filename}</a>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
            `;
          } else if (["mp4", "mov", "webm"].includes(ext)) {
            itemDiv.innerHTML = `
              <video src="${item.url}" controls style="max-width:150px; max-height:100px;"></video><br>
              <a href="${item.url}" target="_blank">${item.filename}</a>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
            `;
          } else {
            itemDiv.innerHTML = `
              <a href="${item.url}" target="_blank">${item.filename || "Download File"}</a>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
            `;
          }

          subSection.appendChild(itemDiv);
        });

        catSection.appendChild(subSection);
      }

      container.appendChild(catSection);
    }

    // Attach delete listeners
    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const docId = btn.dataset.docId;
        if (confirm("Delete this item?")) {
          await deleteDoc(doc(db, collectionName, docId));
          displayUploads(collectionName, containerId, renderType);
        }
      });
    });

  } catch (error) {
    console.error("Error loading uploads:", error);
    container.innerHTML = `<div class="upload-item">Error loading uploads.</div>`;
  }
}

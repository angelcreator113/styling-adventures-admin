// closet-categories.js
export const closetStructure = {
  outfit: ["pants", "dress", "swimsuit", "skirt", "shirt"],
  shoes: ["boots", "sandals", "heels"],
  jewelry: ["necklace", "earrings", "bracelet", "ring"],
  perfume: ["floral"],
  accessories: ["hat", "gloves"],
  purse: ["handbag", "mini-bag"]
};

export function initClosetDropdowns() {
  const categorySelect = document.getElementById("closet-category");
  const subcategorySelect = document.getElementById("closet-subcategory");

  function populateSubcategories(category) {
    const subs = closetStructure[category] || [];
    subcategorySelect.innerHTML = subs.map(
      sub => `<option value="${sub}">${sub}</option>`
    ).join("");
  }

  // Initial population
  populateSubcategories(categorySelect.value);

  // Event listener
  categorySelect.addEventListener("change", (e) => {
    populateSubcategories(e.target.value);
  });
}
// renderer.js
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

/**
 * Render a list of uploads into a target container
 * @param {string} collectionName - Firestore collection
 * @param {string} containerId - HTML element ID to render into
 * @param {string} renderType - 'link', 'text', 'image', or 'preview'
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

    // Force 'preview' mode for episodes and closet
    if (["episodes", "closet"].includes(collectionName)) {
      renderType = "preview";
    }

    for (const category in grouped) {
      const catSection = document.createElement("div");
      catSection.className = "closet-category";
      catSection.innerHTML = `<h3>${category}</h3>`;

      let subKeys = Object.keys(grouped[category]);
      if (["Seasons", "Filler", "episode"].includes(category.toLowerCase())) {
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

          if (renderType === "preview") {
            if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
              itemDiv.innerHTML = `
                <img src="${item.url}" alt="${item.filename}" /><br>
                <a href="${item.url}" target="_blank">${item.filename}</a>
                <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
              `;
            } else if (["mp4", "mov", "webm"].includes(ext)) {
              itemDiv.innerHTML = `
                <video src="${item.url}" controls muted></video><br>
                <a href="${item.url}" target="_blank">${item.filename}</a>
                <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
              `;
            }
          } else if (renderType === "image") {
            itemDiv.innerHTML = `
              <img src="${item.url}" alt="${item.filename}" /><br>
              <p>${item.filename}</p>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
            `;
          } else if (renderType === "link") {
            itemDiv.innerHTML = `
              <a href="${item.url}" target="_blank">${item.filename}</a>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url}">🗑️</button>
            `;
          } else {
            itemDiv.innerHTML = `
              <strong>${item.title || "Untitled"}</strong><br/>
              <em>${item.description || "No description"}</em><br/>
              <span>Tags: ${Array.isArray(item.tags) ? item.tags.join(", ") : "None"}</span>
              <button class="delete-btn" data-doc-id="${item.id}" data-path="${item.url || ''}">🗑️</button>
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

// js/editor.js

export function setupModalEvents() {
  const modal = document.getElementById("meta-editor-modal");
  const closeBtn = document.getElementById("close-modal");
  const saveBtn = document.getElementById("save-meta");

  if (modal && closeBtn && saveBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("show"));
    saveBtn.addEventListener("click", () => {
      alert("💾 Metadata saved!");
      modal.classList.remove("show");
    });
  }

  const types = ["closet", "voice", "episode"];

  types.forEach(type => {
    const grid = document.querySelector(`#${type}-grid`);
    if (!grid) {
      console.warn(`⚠️ No grid found for type "${type}"`);
      return;
    }

    const cards = grid.querySelectorAll(".card");
    cards.forEach(card => {
      // Avoid duplicating buttons
      if (card.querySelector(".edit-btn")) return;

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️ Edit";
      editBtn.className = "edit-btn";
      editBtn.dataset.type = type;
      editBtn.dataset.id = card.dataset.id || "";

      editBtn.addEventListener("click", () => {
        openEditModal(type, card.dataset.id);
      });

      card.appendChild(editBtn);
    });
  });
}

/**
 * 📦 Handle edit modal logic
 * @param {string} type - closet | voice | episode
 * @param {string} id - Firestore doc ID or internal ID
 */
function openEditModal(type, id) {
  const modal = document.getElementById("meta-editor-modal");
  if (!modal) return;

  // Populate modal content
  modal.classList.add("show");
  modal.querySelector("#modal-type").textContent = type;
  modal.querySelector("#modal-id").textContent = id || "N/A";

  console.log(`🔧 Editing [${type}] item with ID: ${id}`);
}

import { addCategory, deleteCategory } from "../components/category-manager.js";

/**
 * 🧠 Initializes the Meta Panel with add/delete category controls
 */
export function initMetaPanel() {
  console.log("[meta-panel] Initializing category controls");

  const addBtn = document.getElementById("meta-add-btn");
  const deleteBtn = document.getElementById("meta-delete-btn");

  const typeEl = document.getElementById("meta-type");
  const catEl = document.getElementById("meta-category");
  const subEl = document.getElementById("meta-subcategory");
  const subsubEl = document.getElementById("meta-subsubcategory");

  if (addBtn) {
    addBtn.onclick = async () => {
      const type = typeEl?.value || "closet";
      const cat = catEl?.value?.trim();
      const sub = subEl?.value?.trim();
      const subsub = subsubEl?.value?.trim();

      if (!cat) return alert("Please provide a category name.");

      try {
        await addCategory(type, cat, sub, subsub);
        alert("✅ Category added successfully.");
      } catch (err) {
        console.error("[meta-panel] Failed to add category:", err);
        alert("❌ Failed to add category.");
      }
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      const type = typeEl?.value || "closet";
      const cat = catEl?.value?.trim();
      const sub = subEl?.value?.trim();
      const subsub = subsubEl?.value?.trim();

      if (!cat) return alert("Please select at least a category.");

      const confirmed = confirm("⚠️ Are you sure you want to delete this category?");
      if (!confirmed) return;

      try {
        await deleteCategory(type, cat, sub, subsub);
        alert("✅ Category deleted successfully.");
      } catch (err) {
        console.error("[meta-panel] Failed to delete category:", err);
        alert("❌ Failed to delete category.");
      }
    };
  }
}


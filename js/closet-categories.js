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

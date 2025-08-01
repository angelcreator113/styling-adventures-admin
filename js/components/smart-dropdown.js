// js/components/smart-dropdown.js

/**
 * 💅 Populate a <select> element with <option> tags
 */
function populateOptions(selectElement, options) {
  if (!selectElement) return;
  selectElement.innerHTML = `<option value="">Select</option>`;
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    selectElement.appendChild(option);
  });
}

/**
 * 🧠 Safely set up cascading dropdowns if panel is visible
 */
export function setupSmartDropdown(categoryEl, subcategoryEl, subsubcategoryEl, panelType) {
  if (!panelType) {
    console.warn("[SmartDropdown] Missing panelType identifier. Setup skipped.");
    return;
  }

  const panel = document.getElementById(`${panelType}-panel`);
  if (!panel || !panel.classList.contains("active")) {
    console.warn("[SmartDropdown] Panel not found or inactive:", panelType);
    return;
  }

  if (!categoryEl || !subcategoryEl || !subsubcategoryEl) {
    console.warn("[SmartDropdown] One or more dropdown elements missing.", {
      categoryEl,
      subcategoryEl,
      subsubcategoryEl
    });
    return;
  }

  const dataMap = {
    closet: {
      Tops: { TShirts: ["Sleeveless", "Short Sleeve"], Blouses: ["Chiffon", "Silk"] },
      Bottoms: { Skirts: ["Mini", "Maxi"], Pants: ["Jeans", "Slacks"] }
    },
    voice: {
      Greetings: { Casual: ["Hey", "Hiya"], Formal: ["Hello", "Good evening"] },
      Reactions: { Happy: ["Yay!", "Wahoo!"], Sad: ["Oh no", "Aww"] }
    },
    episodes: {
      Season1: { Intro: ["Ep1", "Ep2"], Climax: ["Ep3", "Ep4"] },
      Season2: { Start: ["Ep1", "Ep2"], Finale: ["Ep3", "Ep4"] }
    }
  };

  const panelData = dataMap[panelType];
  if (!panelData) {
    console.warn(`[SmartDropdown] No data found for panel type: ${panelType}`);
    return;
  }

  // Populate top-level category
  populateOptions(categoryEl, Object.keys(panelData));

  categoryEl.addEventListener("change", () => {
    const selectedCategory = categoryEl.value;
    const subcats = panelData[selectedCategory] || {};
    populateOptions(subcategoryEl, Object.keys(subcats));
    populateOptions(subsubcategoryEl, []); // Clear third level
  });

  subcategoryEl.addEventListener("change", () => {
    const selectedCategory = categoryEl.value;
    const selectedSubcat = subcategoryEl.value;
    const items = panelData[selectedCategory]?.[selectedSubcat] || [];
    populateOptions(subsubcategoryEl, items);
  });

  // Trigger initial population chain
  categoryEl.dispatchEvent(new Event("change"));
}

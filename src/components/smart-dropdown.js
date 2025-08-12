// src/components/smart-dropdown.js
// @ts-check

import { loadCategories, getCategories, onCategories } from "./categoryStore.js";

/**
 * @typedef {Object} SmartOpts
 * @property {boolean} [skipActiveCheck]
 * @property {{ category?: string, subcategory?: string, subsubcategory?: string }} [initialValue]
 */

/**
 * Populate a <select> with option strings.
 * @param {HTMLSelectElement|null} selectEl
 * @param {string[]} options
 */
function populateOptions(selectEl, options) {
  if (!selectEl) return;
  const prev = selectEl.value;
  selectEl.innerHTML = `<option value="">Select</option>`;
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    selectEl.appendChild(o);
  }
  if (prev && options.includes(prev)) {
    selectEl.value = prev;
  }
}

/**
 * Given the category tree and current selections, derive lists for each level.
 * @param {Record<string, Record<string, string[]>>} tree
 * @param {string} category
 * @param {string} subcategory
 */
function deriveLists(tree, category, subcategory) {
  const categories = Object.keys(tree || {});
  const subcats = category && tree?.[category] ? Object.keys(tree[category]) : [];
  const items =
    category && subcategory && tree?.[category]?.[subcategory]
      ? tree[category][subcategory]
      : [];
  return { categories, subcats, items };
}

/**
 * Setup cascading dropdowns driven by categoryStore.
 * @param {HTMLSelectElement|null} categoryEl
 * @param {HTMLSelectElement|null} subcategoryEl
 * @param {HTMLSelectElement|null} subsubcategoryEl
 * @param {string} panelType
 * @param {SmartOpts} [opts]
 */
export function setupSmartDropdown(
  categoryEl,
  subcategoryEl,
  subsubcategoryEl,
  panelType,
  opts = {}
) {
  const { skipActiveCheck = false, initialValue } = opts;

  if (!panelType) {
    console.warn("[SmartDropdown] Missing panelType identifier. Setup skipped.");
    return stubController();
  }

  if (!skipActiveCheck) {
    // Accept #closet, #closet-panel, or [data-panel="closet"]
    const root = document.querySelector(
      `#${panelType}, #${panelType}-panel, [data-panel="${panelType}"]`
    );
    // If the panel isn't on this route, quietly no-op (helps in React StrictMode/dev)
    if (!root) return stubController();
  }

  let value = { category: "", subcategory: "", subsubcategory: "" };

  const readTree = () => {
    const snap = getCategories(panelType);
    return (snap && snap.categories) || {};
  };

  const onCatChange = () => {
    value.category = categoryEl?.value || "";
    const tree = readTree();
    const { subcats } = deriveLists(tree, value.category, "");
    populateOptions(subcategoryEl, subcats);
    value.subcategory = "";
    populateOptions(subsubcategoryEl, []);
    value.subsubcategory = "";
  };

  const onSubChange = () => {
    value.subcategory = subcategoryEl?.value || "";
    const tree = readTree();
    const { items } = deriveLists(tree, value.category, value.subcategory);
    populateOptions(subsubcategoryEl, items);
    value.subsubcategory = "";
  };

  const onSub2Change = () => {
    value.subsubcategory = subsubcategoryEl?.value || "";
  };

  categoryEl?.addEventListener("change", onCatChange);
  subcategoryEl?.addEventListener("change", onSubChange);
  subsubcategoryEl?.addEventListener("change", onSub2Change);

  let unsubscribe = () => {};
  const bindToStore = () => {
    unsubscribe = onCategories(panelType, () => {
      const tree = readTree();
      const { categories, subcats, items } = deriveLists(
        tree,
        value.category,
        value.subcategory
      );

      populateOptions(categoryEl, categories);
      if (value.category && !categories.includes(value.category)) value.category = "";
      if (categoryEl) categoryEl.value = value.category;

      populateOptions(subcategoryEl, subcats);
      if (value.subcategory && !subcats.includes(value.subcategory)) value.subcategory = "";
      if (subcategoryEl) subcategoryEl.value = value.subcategory;

      populateOptions(subsubcategoryEl, items);
      if (value.subsubcategory && !items.includes(value.subsubcategory))
        value.subsubcategory = "";
      if (subsubcategoryEl) subsubcategoryEl.value = value.subsubcategory;
    });
  };

  (async () => {
    try {
      await loadCategories(panelType);
    } catch (e) {
      console.warn("[SmartDropdown] loadCategories failed:", e);
    }

    const tree = readTree();
    const { categories } = deriveLists(tree, "", "");
    populateOptions(categoryEl, categories);

    if (initialValue?.category && categoryEl) {
      categoryEl.value = initialValue.category;
    }
    onCatChange();

    if (initialValue?.subcategory && subcategoryEl) {
      subcategoryEl.value = initialValue.subcategory;
    }
    onSubChange();

    if (initialValue?.subsubcategory && subsubcategoryEl) {
      subsubcategoryEl.value = initialValue.subsubcategory;
    }
    onSub2Change();

    bindToStore();
  })();

  return {
    getValue: () => ({ ...value }),
    setValue: (v) => {
      if (v.category && categoryEl) {
        categoryEl.value = v.category;
        onCatChange();
      }
      if (v.subcategory && subcategoryEl) {
        subcategoryEl.value = v.subcategory;
        onSubChange();
      }
      if (v.subsubcategory && subsubcategoryEl) {
        subsubcategoryEl.value = v.subsubcategory;
        onSub2Change();
      }
    },
    destroy: () => {
      categoryEl?.removeEventListener("change", onCatChange);
      subcategoryEl?.removeEventListener("change", onSubChange);
      subsubcategoryEl?.removeEventListener("change", onSub2Change);
      try {
        unsubscribe();
      } catch {}
    },
  };
}

/**
 * Fallback no-op controller
 */
function stubController() {
  return {
    getValue: () => ({ category: "", subcategory: "", subsubcategory: "" }),
    setValue: () => {},
    destroy: () => {},
  };
}

/**
 * Auto-initialize all smart dropdowns inside a given panel
 * @param {{ panelId: string, skipActiveCheck?: boolean }} opts
 */
export function initSmartDropdownAll({ panelId, skipActiveCheck = true }) {
  const slug = panelId.replace(/-panel$/, "");
  // Find the panel by id or data attribute
  const panel =
    document.getElementById(panelId) ||
    document.getElementById(slug) ||
    document.querySelector(`[data-panel="${slug}"]`);

  if (!panel) return; // Not on this route — skip quietly

  const $ = (suffix) =>
    /** @type {HTMLSelectElement|null} */ (
      panel.querySelector(`#${slug}-${suffix}`)
    );

  const categoryEl = $("category");
  const subcategoryEl = $("subcategory");
  const subsubcategoryEl = $("subsubcategory");

  if (!categoryEl || !subcategoryEl) return; // nothing to wire on this route

  setupSmartDropdown(categoryEl, subcategoryEl, subsubcategoryEl, slug, {
    skipActiveCheck,
  });
}

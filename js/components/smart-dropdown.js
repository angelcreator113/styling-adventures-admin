// js/components/smart-dropdown.js
// @ts-check

import { loadCategories, getCategories, onCategories } from './categoryStore.js';

/**
 * @typedef {{
 *   skipActiveCheck?: boolean,
 *   initialValue?: { category?: string, subcategory?: string, subsubcategory?: string }
 * }} SmartOpts
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
    const o = document.createElement('option');
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
  const items = category && subcategory && tree?.[category]?.[subcategory] ? tree[category][subcategory] : [];
  return { categories, subcats, items };
}

/**
 * Setup cascading dropdowns driven by categoryStore.
 * Works in panels AND modals. Returns a controller for value access & cleanup.
 *
 * @param {HTMLSelectElement|null} categoryEl
 * @param {HTMLSelectElement|null} subcategoryEl
 * @param {HTMLSelectElement|null} subsubcategoryEl
 * @param {'closet'|'voice'|'episodes'|string} panelType
 * @param {SmartOpts} [opts]
 * @returns {{
 *   getValue: () => {category:string, subcategory:string, subsubcategory:string},
 *   setValue: (v: Partial<{category:string, subcategory:string, subsubcategory:string}>) => void,
 *   destroy: () => void
 * }}
 */
export function setupSmartDropdown(categoryEl, subcategoryEl, subsubcategoryEl, panelType, opts = {}) {
  const { skipActiveCheck = false, initialValue } = opts;

  if (!panelType) {
    console.warn('[SmartDropdown] Missing panelType identifier. Setup skipped.');
    return stubController();
  }

  // Optional guard for panel UIs; modals can pass skipActiveCheck: true
  if (!skipActiveCheck) {
    const panel = document.getElementById(`${panelType}-panel`);
    if (!panel || !panel.classList.contains('active')) {
      console.warn('[SmartDropdown] Panel not found or inactive:', panelType);
      return stubController();
    }
  }

  // Internal selection state
  let value = { category: '', subcategory: '', subsubcategory: '' };
  const setValue = (next) => { value = { ...value, ...next }; };

  // Helpers to read the current tree from store
  const readTree = () => {
    // categoryStore.getCategories(panel) -> { categories, map }
    const snap = getCategories(panelType);
    return (snap && snap.categories) || {};
  };

  // Change handlers (cascade down)
  const onCatChange = () => {
    value.category = categoryEl?.value || '';
    const tree = readTree();
    const { subcats } = deriveLists(tree, value.category, '');
    populateOptions(subcategoryEl, subcats);
    // reset downstream
    value.subcategory = '';
    populateOptions(subsubcategoryEl, []);
    value.subsubcategory = '';
  };

  const onSubChange = () => {
    value.subcategory = subcategoryEl?.value || '';
    const tree = readTree();
    const { items } = deriveLists(tree, value.category, value.subcategory);
    populateOptions(subsubcategoryEl, items);
    value.subsubcategory = '';
  };

  const onSub2Change = () => {
    value.subsubcategory = subsubcategoryEl?.value || '';
  };

  // Attach listeners
  categoryEl?.addEventListener('change', onCatChange);
  subcategoryEl?.addEventListener('change', onSubChange);
  subsubcategoryEl?.addEventListener('change', onSub2Change);

  // Subscribe to store updates → repopulate while preserving selection where possible
  let unsubscribe = () => {};
  const bindToStore = () => {
    unsubscribe = onCategories(panelType, () => {
      const tree = readTree();
      const { categories, subcats, items } = deriveLists(tree, value.category, value.subcategory);

      populateOptions(categoryEl, categories);
      if (value.category && !categories.includes(value.category)) value.category = '';
      if (categoryEl) categoryEl.value = value.category;

      populateOptions(subcategoryEl, subcats);
      if (value.subcategory && !subcats.includes(value.subcategory)) value.subcategory = '';
      if (subcategoryEl) subcategoryEl.value = value.subcategory;

      populateOptions(subsubcategoryEl, items);
      if (value.subsubcategory && !items.includes(value.subsubcategory)) value.subsubcategory = '';
      if (subsubcategoryEl) subsubcategoryEl.value = value.subsubcategory;
    });
  };

  // Initial load + population
  (async () => {
    try {
      await loadCategories(panelType); // ensures cache is hydrated
    } catch (e) {
      console.warn('[SmartDropdown] loadCategories failed:', e);
    }

    const tree = readTree();
    const { categories } = deriveLists(tree, '', '');
    populateOptions(categoryEl, categories);

    // Seed initial selection (e.g., when opening editor)
    if (initialValue?.category && categoryEl) {
      categoryEl.value = initialValue.category;
    }
    onCatChange(); // triggers subcats

    if (initialValue?.subcategory && subcategoryEl) {
      subcategoryEl.value = initialValue.subcategory;
    }
    onSubChange(); // triggers subsub

    if (initialValue?.subsubcategory && subsubcategoryEl) {
      subsubcategoryEl.value = initialValue.subsubcategory;
    }
    onSub2Change();

    // Now listen for live store updates
    bindToStore();
  })();

  return {
    getValue: () => ({
      category: value.category,
      subcategory: value.subcategory,
      subsubcategory: value.subsubcategory
    }),
    setValue: (v) => {
      // Apply in order: category → subcategory → subsubcategory
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
      categoryEl?.removeEventListener('change', onCatChange);
      subcategoryEl?.removeEventListener('change', onSubChange);
      subsubcategoryEl?.removeEventListener('change', onSub2Change);
      try { unsubscribe(); } catch {}
    }
  };
}

/** Fallback no-op controller (when setup is skipped). */
function stubController() {
  return {
    getValue: () => ({ category: '', subcategory: '', subsubcategory: '' }),
    setValue: (_v) => {},
    destroy: () => {}
  };
}

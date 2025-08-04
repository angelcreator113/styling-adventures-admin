// /js/components/default-loader.js
// @ts-check

/** @param {string} id */ 
function $select(id) {
  const el = document.getElementById(id);
  return el instanceof HTMLSelectElement ? el : null;
}

/** Populate fixed defaults for Episodes and Voice selects. */
export function loadDefaults() {
  /** @type {Record<string, string[]>} */
  const presetOptions = {
    'episode-category': ['seasons', 'filler'],
    'episode-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'episode-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5'],
    'voice-category': ['episode'],
    'voice-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'voice-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5']
  };

  for (const [selectId, options] of Object.entries(presetOptions)) {
    const select = $select(selectId);
    if (!select) continue;

    // Clear and repopulate
    select.innerHTML = '';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    }
  }
}

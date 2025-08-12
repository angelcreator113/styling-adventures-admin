// filter-utils.js
export function hookFilters(section, rawData, renderFn) {
  const searchInput = document.getElementById(`${section}-search`);
  const filterSelect = document.getElementById(`${section}-filter-subcategory`);
  const clearBtn = document.getElementById(`${section}-clear-filters`);

  // Populate filter dropdown with unique subcategories
  const subs = new Set();
  Object.values(rawData).forEach(submap => {
    Object.keys(submap).forEach(s => subs.add(s));
  });
  filterSelect.innerHTML = '<option value="">All</option>';
  subs.forEach(s => filterSelect.add(new Option(s, s)));

  const applyFilters = () => {
    const query = searchInput.value.toLowerCase();
    const selectedSub = filterSelect.value;

    const filtered = {};
    for (const [cat, submap] of Object.entries(rawData)) {
      filtered[cat] = {};
      for (const [sub, items] of Object.entries(submap)) {
        if (selectedSub && sub !== selectedSub) continue;
        const matched = items.filter(i =>
          i.filename.toLowerCase().includes(query) ||
          (i.tags || []).some(t => t.toLowerCase().includes(query))
        );
        if (matched.length) filtered[cat][sub] = matched;
      }
      if (Object.keys(filtered[cat]).length === 0) delete filtered[cat];
    }

    renderFn(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterSelect.value = '';
    applyFilters();
  });
}

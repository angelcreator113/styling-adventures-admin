/**
 * Load default dropdown values for each section
 */
export function loadDefaults() {
  const presetOptions = {
    'episode-category': ['seasons', 'filler'],
    'episode-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'episode-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5'],
    'voice-category': ['episode'],
    'voice-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'voice-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5']
  };

  for (const [selectId, options] of Object.entries(presetOptions)) {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '';
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
    }
  }

  setupClosetDropdowns();
  renderClosetEditPanel();
}

/**
 * Closet category to subcategory map
 */
export const closetMap = {
  outfit: ['pants', 'dress', 'swimsuit', 'skirt', 'shirt'],
  shoes: ['boots', 'sandals', 'heels'],
  jewelry: ['necklace', 'earrings', 'bracelet', 'ring'],
  perfume: ['floral'],
  accessories: ['hat', 'gloves'],
  purse: ['handbag', 'mini-bag']
};

/**
 * Setup closet category and dynamic subcategory dropdowns
 */
export function setupClosetDropdowns() {
  const categorySelect = document.getElementById('closet-category');
  const subcategorySelect = document.getElementById('closet-subcategory');

  if (!categorySelect || !subcategorySelect) return;

  categorySelect.innerHTML = '';
  Object.keys(closetMap).forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  categorySelect.addEventListener('change', () => {
    const selected = categorySelect.value;
    updateSubcategories(selected);
  });

  updateSubcategories(categorySelect.value);

  function updateSubcategories(selectedCategory) {
    subcategorySelect.innerHTML = '';
    (closetMap[selectedCategory] || []).forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      subcategorySelect.appendChild(option);
    });
  }
}

/**
 * Toggle visibility of edit panel for a given section
 */
export function toggleEdit(section) {
  const panel = document.getElementById(`${section}-edit-panel`);
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

/**
 * Add a new dropdown option dynamically
 */
export function addOption(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (input.value.trim()) {
    const option = document.createElement('option');
    option.value = input.value.trim();
    option.textContent = input.value.trim();
    select.appendChild(option);
    input.value = '';
  }
}

/**
 * Add new category to closetMap and refresh dropdowns
 */
export function addClosetCategory(name) {
  if (!closetMap[name]) {
    closetMap[name] = [];
    setupClosetDropdowns();
    renderClosetEditPanel();
  }
}

/**
 * Add subcategory to a category in closetMap
 */
export function addClosetSubcategory(category, subcategory) {
  if (closetMap[category] && !closetMap[category].includes(subcategory)) {
    closetMap[category].push(subcategory);
    setupClosetDropdowns();
    renderClosetEditPanel();
  }
}

/**
 * Remove a subcategory from a category in closetMap
 */
export function removeClosetSubcategory(category, subcategory) {
  if (closetMap[category]) {
    closetMap[category] = closetMap[category].filter(sub => sub !== subcategory);
    setupClosetDropdowns();
    renderClosetEditPanel();
  }
}

/**
 * Render dynamic closet category/subcategory editor panel
 */
export function renderClosetEditPanel() {
  const panel = document.getElementById('closet-edit-panel');
  if (!panel) return;

  panel.innerHTML = '<h4>Edit Closet Categories</h4>';

  for (const [cat, subs] of Object.entries(closetMap)) {
    const catDiv = document.createElement('div');
    catDiv.className = 'edit-block';

    const title = document.createElement('strong');
    title.textContent = cat;
    catDiv.appendChild(title);

    const list = document.createElement('ul');
    subs.forEach(sub => {
      const li = document.createElement('li');
      li.textContent = sub;
      const del = document.createElement('button');
      del.textContent = '✖';
      del.className = 'delete-btn';
      del.onclick = () => removeClosetSubcategory(cat, sub);
      li.appendChild(del);
      list.appendChild(li);
    });
    catDiv.appendChild(list);

    const input = document.createElement('input');
    input.placeholder = `Add subcategory to ${cat}`;
    const btn = document.createElement('button');
    btn.textContent = '+';
    btn.onclick = () => {
      if (input.value.trim()) {
        addClosetSubcategory(cat, input.value.trim());
        input.value = '';
      }
    };

    catDiv.appendChild(input);
    catDiv.appendChild(btn);

    panel.appendChild(catDiv);
  }

  const newCatInput = document.createElement('input');
  newCatInput.placeholder = 'New category name';
  const newCatBtn = document.createElement('button');
  newCatBtn.textContent = 'Add Category';
  newCatBtn.onclick = () => {
    if (newCatInput.value.trim()) {
      addClosetCategory(newCatInput.value.trim());
      newCatInput.value = '';
    }
  };
  panel.appendChild(newCatInput);
  panel.appendChild(newCatBtn);
}

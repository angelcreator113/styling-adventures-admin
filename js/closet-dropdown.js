// closet-dropdown.js
import { closetMap } from './closet-map.js';

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
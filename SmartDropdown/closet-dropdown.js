import { initSmartDropdown } from '../components/SmartDropdown/index.js';

export function setupClosetDropdowns() {
  const root = document;
  return initSmartDropdown(root, {
    panel: 'closet',
    ids: {
      categoryId: 'closet-category',
      subcategoryId: 'closet-subcategory',
      subsubcategoryId: 'closet-subsubcategory',
    }
  });
}

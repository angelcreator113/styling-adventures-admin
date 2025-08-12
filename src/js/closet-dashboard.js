// closet-dashboard.js
import { getAllClosetItems, updateClosetItem } from './closet-item-utils.js';

let closetItems = [];
let currentCategory = '';
let currentSubcategory = '';
let currentSearch = '';
let currentSort = 'name';

export async function initClosetDashboard() {
  closetItems = await getAllClosetItems();
  renderCategoryOptions();
  renderGrid();

  document.getElementById('closet-view-category').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    renderSubcategoryOptions();
    renderGrid();
  });

  document.getElementById('closet-view-subcategory').addEventListener('change', (e) => {
    currentSubcategory = e.target.value;
    renderGrid();
  });

  document.getElementById('closet-search').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderGrid();
  });

  document.getElementById('closet-sort').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGrid();
  });
}

function renderCategoryOptions() {
  const select = document.getElementById('closet-view-category');
  const categories = [...new Set(closetItems.map(item => item.category))];
  select.innerHTML = '<option value="">All</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function renderSubcategoryOptions() {
  const select = document.getElementById('closet-view-subcategory');
  const filtered = closetItems.filter(item => !currentCategory || item.category === currentCategory);
  const subcategories = [...new Set(filtered.map(item => item.subcategory))];
  select.innerHTML = '<option value="">All</option>' + subcategories.map(sub => `<option value="${sub}">${sub}</option>`).join('');
}

function renderGrid() {
  const grid = document.getElementById('closet-dashboard-grid');
  let filtered = closetItems.filter(item => {
    return (!currentCategory || item.category === currentCategory)
      && (!currentSubcategory || item.subcategory === currentSubcategory)
      && item.filename.toLowerCase().includes(currentSearch);
  });

  if (currentSort === 'name') {
    filtered.sort((a, b) => a.filename.localeCompare(b.filename));
  } else if (currentSort === 'date') {
    filtered.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0));
  }

  grid.innerHTML = filtered.map(item => `
    <div class="upload-item">
      <img src="${item.url}" class="upload-thumb" alt="${item.filename}" />
      <p class="upload-label">${item.filename}</p>
      <button class="delete-btn" onclick="alert('TODO: delete')">🗑</button>
      <button onclick="promptRename('${item.id}', '${item.filename}')">✏️ Rename</button>
    </div>`).join('');
}

window.promptRename = async function(id, oldName) {
  const newName = prompt("Rename to:", oldName);
  if (newName && newName !== oldName) {
    await updateClosetItem(id, { filename: newName });
    closetItems = await getAllClosetItems();
    renderGrid();
  }
} 

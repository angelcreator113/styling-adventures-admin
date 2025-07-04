// closet-editor.js
import { closetMap, addClosetCategory, addClosetSubcategory, removeClosetSubcategory } from './closet-map.js';
import { setupClosetDropdowns } from './closet-dropdown.js';

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
      del.onclick = () => {
        removeClosetSubcategory(cat, sub);
        setupClosetDropdowns();
        renderClosetEditPanel();
      };
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
        setupClosetDropdowns();
        renderClosetEditPanel();
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
      setupClosetDropdowns();
      renderClosetEditPanel();
      newCatInput.value = '';
    }
  };
  panel.appendChild(newCatInput);
  panel.appendChild(newCatBtn);
}

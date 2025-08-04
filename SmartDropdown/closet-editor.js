// @ts-check

/**
 * @typedef {{ 
 *   onSave?: (data: any) => void, 
 *   onDelete?: () => void 
 * }} EditorHandlers
 */

/** @param {string} id */ const $input  = (id) => {
  const el = document.getElementById(id);
  return el instanceof HTMLInputElement  ? el : null;
};
/** @param {string} id */ const $select = (id) => {
  const el = document.getElementById(id);
  return el instanceof HTMLSelectElement ? el : null;
};
/** @param {string} id */ const $button = (id) => {
  const el = document.getElementById(id);
  return el instanceof HTMLButtonElement ? el : null;
};

export function openClosetEditor(item, handlers = {}) {
  const { onSave = () => {}, onDelete = () => {} } = handlers;

  const modal = document.getElementById('closet-edit-modal');
  modal?.classList.add('open');

  // Typed elements
  const nameEl = $input('closet-edit-filename');
  const catEl  = $select('closet-edit-category');
  const subEl  = $select('closet-edit-subcategory');
  const sub2El = $select('closet-edit-subsubcategory');

  // If your visibility control is a <select>:
  const visEl  = $select('closet-edit-visibility');
  // If it's a checkbox instead, use:
  // const visChk = $input('closet-edit-visibility');

  // Populate initial values
  if (nameEl) nameEl.value = item?.filename ?? '';
  if (catEl)  catEl.value  = item?.category ?? '';
  if (subEl)  subEl.value  = item?.subcategory ?? '';
  if (sub2El) sub2El.value = item?.subsubcategory ?? '';
  if (visEl)  visEl.value  = item?.visibility ?? 'private';
  // If checkbox:
  // if (visChk) visChk.checked = (item?.visibility ?? 'private') === 'public';

  // Buttons
  const saveBtn   = $button('closet-edit-save');
  const deleteBtn = $button('closet-edit-delete');
  const closeBtn  = $button('closet-edit-cancel');

  // Save
  saveBtn?.addEventListener('click', () => {
    const next = {
      ...item,
      filename: nameEl?.value ?? item?.filename,
      category: catEl?.value ?? item?.category,
      subcategory: subEl?.value ?? item?.subcategory,
      subsubcategory: sub2El?.value ?? item?.subsubcategory,
      visibility: visEl?.value ?? item?.visibility, // or: (visChk?.checked ? 'public' : 'private')
      updatedAt: Date.now(),
    };
    onSave(next);
    modal?.classList.remove('open');
  }, { once: true });

  // Delete
  deleteBtn?.addEventListener('click', () => {
    onDelete();
    modal?.classList.remove('open');
  }, { once: true });

  // Cancel/close
  closeBtn?.addEventListener('click', () => {
    modal?.classList.remove('open');
  }, { once: true });
}

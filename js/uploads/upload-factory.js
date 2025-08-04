import { initDragDropUploadDynamic } from '/js/components/dragdrop.js'; // ⬅️ Add this to your imports

export async function createUploadUI(def /** @type {PanelDef} */) {
  const $ = (id) => document.getElementById(id);

  const fileInput  = $(`${def.uiPrefix}file-input`);
  const dropArea   = $(`${def.uiPrefix}drop-area`);
  const form       = $(`${def.slug}-upload-form`) || $(`${def.uiPrefix.replace(/-$/, '')}-upload-form`);
  const isPublicEl = $(`${def.uiPrefix}is-public`);

  if (!fileInput || !dropArea || !form) {
    console.warn(`[upload-factory] Missing elements for '${def.slug}' (prefix='${def.uiPrefix}')`);
    return;
  }

  // ✅ Init drag-and-drop
  initDragDropUploadDynamic([
    {
      inputId: fileInput.id,
      dropAreaId: dropArea.id,
      options: {
        acceptedTypes: def.accept.split(',').map(t => t.trim())
      }
    }
  ]);

  // ✅ Populate categories
  await loadCategoryData(def.categoryPanelKey, def.uiPrefix);

  /** @type {File|null} */
  let selectedFile = null;

  // Click proxy
  dropArea.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files?.[0] || null;
    if (selectedFile) annotateDropArea(dropArea, selectedFile.name);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = selectedFile || fileInput.files?.[0];
    if (!f) { alert('Please choose a file.'); return; }

    const cat  = /** @type {HTMLSelectElement|null} */($(def.uiPrefix + 'category'));
    const sub  = /** @type {HTMLSelectElement|null} */($(def.uiPrefix + 'subcategory'));
    const sub2 = /** @type {HTMLSelectElement|null} */($(def.uiPrefix + 'subsubcategory'));

    const category = cat?.value || '';
    const subcategory = sub?.value || '';
    const subsubcategory = def.levels === 3 ? (sub2?.value || '') : '';

    const visibility = isPublicEl instanceof HTMLInputElement && isPublicEl.checked
      ? 'public' : def.defaultVisibility;

    try {
      const userId = auth.currentUser?.uid || 'anonymous';
      const safeName = f.name.replace(/\s+/g, '_');
      const path = `${def.slug}/${userId}/${Date.now()}_${safeName}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, f, {
        contentType: f.type || guessContentType(def.accept),
        customMetadata: { visibility }
      });

      const url = await getDownloadURL(fileRef);

      const col = collection(db, def.collection);
      const docRef = doc(col);
      const id = docRef.id;

      await setDoc(docRef, {
        id, url, path, filename: f.name,
        category, subcategory, subsubcategory,
        visibility, uid: userId, createdAt: serverTimestamp()
      });

      window.showToast?.(`✅ ${def.name} uploaded.`) ?? alert(`✅ ${def.name} uploaded.`);
      fileInput.value = '';
      selectedFile = null;
      annotateDropArea(dropArea, null);
    } catch (err) {
      console.error(`[upload-factory] ${def.slug} upload failed`, err);
      window.showToast?.('❌ Upload failed.') ?? alert('❌ Upload failed.');
    }
  });
}

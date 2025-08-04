// js/uploads/closet/closet-upload.js
import { loadCategoryData } from '../../components/categoryStore.js';
import { initDragDropUploadDynamic } from '../../components/dragdrop.js';
import { storage, db, auth } from '../../utils/firebase-client.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Optional helper: fetch panel def so we honor its config (accept, defaultVisibility, etc.)
async function getPanelDef(panelId = 'closet') {
  try {
    const { doc: fsDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const dref = fsDoc(db, 'panel_defs', panelId);
    const snap = await getDoc(dref);
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

function mimeAllowed(file, acceptList) {
  if (!file) return false;
  if (!acceptList || acceptList.length === 0) return true;
  // acceptList like ['image/*'] or explicit types
  return acceptList.some(a => {
    if (a.endsWith('/*')) {
      const prefix = a.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    return file.type === a;
  });
}

export async function setupClosetUploadUI() {
  // 1) Panel config (best effort; safe fallbacks)
  const panel = (await getPanelDef('closet')) || {
    accept: 'image/*',
    categoryPanelKey: 'closet',
    uiPrefix: 'closet-',
    defaultVisibility: 'public'
  };

  const prefix = panel.uiPrefix || 'closet-';
  const acceptAttr = panel.accept || 'image/*';
  const defaultVisibility = panel.defaultVisibility === 'private' ? 'private' : 'public';

  // 2) Load category dropdowns
  loadCategoryData(panel.categoryPanelKey || 'closet', prefix);

  // 3) Set up drag-and-drop (keep tight MIME list for images)
  initDragDropUploadDynamic([
    {
      inputId: `${prefix}file-input`,
      dropAreaId: `${prefix}drop-area`,
      options: {
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
        preventClickDuringDrop: true,
      }
    }
  ]);

  // 4) DOM refs (fail fast if missing)
  const form = document.getElementById(`${prefix}upload-form`);
  const fileInput = document.getElementById(`${prefix}file-input`);
  const dropArea = document.getElementById(`${prefix}drop-area`);
  const catEl = document.getElementById(`${prefix}category`);
  const subcatEl = document.getElementById(`${prefix}subcategory`);
  const subsubcatEl = document.getElementById(`${prefix}subsubcategory`);
  const isPublicEl = document.getElementById(`${prefix}is-public`);

  if (!form || !fileInput || !dropArea || !catEl) {
    console.error('[Closet Upload] Missing required DOM nodes for closet upload form.');
    return;
  }

  // Ensure <input accept=...> matches panel config (does not break if set in HTML)
  try { fileInput.setAttribute('accept', acceptAttr); } catch {}

  // 5) Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Auth guard (align with your Firestore rules flow)
    const userId = auth?.currentUser?.uid;
    if (!userId) {
      alert('Please sign in to upload.');
      return;
    }

    const file = fileInput?.files?.[0];
    if (!file) {
      alert('Please choose a file.');
      return;
    }

    // Parse accept list for runtime MIME validation
    const acceptList = (acceptAttr || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!mimeAllowed(file, acceptList)) {
      alert(`File type "${file.type || 'unknown'}" is not allowed. Allowed: ${acceptList.join(', ') || 'image/*'}`);
      return;
    }

    const category = catEl.value?.trim();
    const subcategory = subcatEl?.value?.trim() || '';
    const subsubcategory = subsubcatEl?.value?.trim() || '';

    if (!category) {
      alert('Please select a category.');
      return;
    }

    // Visibility (UI overrides panel default if present)
    const visibility = (isPublicEl?.checked ?? (defaultVisibility === 'public')) ? 'public' : 'private';

    // Build a nice path
    const safeName = (file.name || 'unnamed').replace(/\s+/g, '_');
    const filePath = `closet/${userId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, filePath);

    try {
      // Upload (non-resumable) w/ visibility metadata
      await uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: { visibility }
      });

      const url = await getDownloadURL(storageRef);

      // Firestore doc (auto ID)
      const closetCol = collection(db, 'closet');
      const closetDocRef = doc(closetCol);
      const id = closetDocRef.id;

      await setDoc(closetDocRef, {
        id,
        url,
        path: filePath,
        filename: file.name || safeName,
        category,
        subcategory,
        subsubcategory,       // keep key consistent with DOM/filters
        visibility,
        uid: userId,
        createdAt: serverTimestamp()
      });

      // Soft UX reset
      form.reset();
      // Some dragdrop UIs keep the file around; make sure it's cleared
      try { fileInput.value = ''; } catch {}

      // Notify any listening dashboards to refresh
      document.dispatchEvent(new CustomEvent('closet:uploaded', { detail: { id, path: filePath } }));

      alert(`✅ Closet item uploaded as ${visibility}.`);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('❌ Upload failed. Check console for details.');
    }
  });
}

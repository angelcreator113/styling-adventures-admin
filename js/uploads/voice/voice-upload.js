// js/uploads/voice/voice-upload.js
import { loadCategoryData } from '../../components/categoryStore.js';
import { initDragDropUploadDynamic } from '../../components/dragdrop.js';
import { storage, db, auth } from '../../utils/firebase-client.js';

import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Pull panel def so we honor accept/defaultVisibility without hardcoding
async function getPanelDef(panelId = 'voice') {
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
  return acceptList.some(a => {
    if (a.endsWith('/*')) {
      const prefix = a.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    return file.type === a;
  });
}

export async function setupVoiceUploadUI() {
  // Config from registry with safe fallbacks
  const panel = (await getPanelDef('voice')) || {
    accept: 'audio/*',
    categoryPanelKey: 'voice',
    uiPrefix: 'voice-',
    defaultVisibility: 'private'
  };

  const prefix = panel.uiPrefix || 'voice-';
  const acceptAttr = panel.accept || 'audio/*';
  const defaultVisibility = panel.defaultVisibility === 'public' ? 'public' : 'private';

  // 1) Load category dropdowns for the correct tree
  loadCategoryData(panel.categoryPanelKey || 'voice', prefix);

  // 2) Set up drag-and-drop (common audio types)
  initDragDropUploadDynamic([
    {
      inputId: `${prefix}file-input`,
      dropAreaId: `${prefix}drop-area`,
      options: {
        acceptedTypes: [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
          'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac'
        ],
        preventClickDuringDrop: true,
      }
    }
  ]);

  // 3) DOM refs
  const form = document.getElementById(`${prefix}upload-form`);
  const fileInput = document.getElementById(`${prefix}file-input`);
  const dropArea = document.getElementById(`${prefix}drop-area`);
  const catEl = document.getElementById(`${prefix}category`);
  const subcatEl = document.getElementById(`${prefix}subcategory`);
  const subsubcatEl = document.getElementById(`${prefix}subsubcategory`);
  const isPublicEl = document.getElementById(`${prefix}is-public`);

  if (!form || !fileInput || !dropArea) {
    console.error('[Voice Upload] Missing required DOM nodes.');
    return;
  }

  // Ensure input accept matches panel config
  try { fileInput.setAttribute('accept', acceptAttr); } catch {}

  // 4) Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Auth guard
    const userId = auth?.currentUser?.uid;
    if (!userId) {
      alert('Please sign in to upload.');
      return;
    }

    const file = fileInput?.files?.[0];
    if (!file) {
      alert('Please choose an audio file.');
      return;
    }

    // Runtime MIME validation using panel.accept
    const acceptList = (acceptAttr || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!mimeAllowed(file, acceptList)) {
      alert(`File type "${file.type || 'unknown'}" is not allowed. Allowed: ${acceptList.join(', ') || 'audio/*'}`);
      return;
    }

    // Categories optional; normalize strings
    const category = catEl?.value?.trim() || '';
    const subcategory = subcatEl?.value?.trim() || '';
    const subsubcategory = subsubcatEl?.value?.trim() || '';

    // Visibility: checkbox overrides; default to panel default if absent
    const visibility = (isPublicEl?.checked ?? (defaultVisibility === 'public')) ? 'public' : 'private';

    const safeName = (file.name || 'unnamed').replace(/\s+/g, '_');
    const path = `voice/${userId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);

    try {
      await uploadBytes(storageRef, file, {
        contentType: file.type || 'audio/mpeg',
        customMetadata: { visibility }
      });

      const url = await getDownloadURL(storageRef);

      // Firestore mirror
      const col = collection(db, 'voice');
      const voiceDocRef = doc(col); // auto-id
      const id = voiceDocRef.id;

      await setDoc(voiceDocRef, {
        id,
        url,
        path,
        filename: file.name || safeName,
        category,
        subcategory,
        subsubcategory,
        visibility,
        uid: userId,
        createdAt: serverTimestamp()
      });

      // Reset & notify
      form.reset();
      try { fileInput.value = ''; } catch {}
      document.dispatchEvent(new CustomEvent('voice:uploaded', { detail: { id, path } }));

      alert(`✅ Voice uploaded as ${visibility}.`);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('❌ Upload failed. Check console for details.');
    }
  });
}

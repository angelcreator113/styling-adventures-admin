// js/uploads/closet/closet-upload.js

import { loadCategoryData } from '../../components/categoryStore.js';
import { initDragDropUploadDynamic } from '../../components/dragdrop.js';
import { storage, db, auth } from '../../utils/firebase-client.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export function setupClosetUploadUI() {
  // 1. Load category dropdowns
  loadCategoryData('closet', 'closet-');

  // 2. Set up drag-and-drop
  initDragDropUploadDynamic([
    {
      inputId: 'closet-file-input',
      dropAreaId: 'closet-drop-area',
      options: {
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        preventClickDuringDrop: true,
      }
    }
  ]);

  // 3. Hook up form submit logic
  const form = document.getElementById('closet-upload-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById('closet-file-input');
      const file = fileInput?.files[0];
      const category = document.getElementById('closet-category')?.value;
      const subcategory = document.getElementById('closet-subcategory')?.value || '';
      const subsubcategory = document.getElementById('closet-subsubcategory')?.value || '';

      if (!file || !category) {
        alert('Please choose a file and select a category.');
        return;
      }

      try {
        const userId = auth.currentUser?.uid || 'anonymous';
        const filePath = `closet/${userId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', null, 
          (err) => console.error('❌ Upload error:', err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'closet'), {
              url,
              filename: file.name,
              category,
              subcategory,
              subsubcategory,
              createdAt: Date.now(),
              uid: userId
            });
            alert('✅ Closet item uploaded!');
            fileInput.value = ''; // reset file input
          }
        );
      } catch (err) {
        console.error('Upload failed:', err);
        alert('❌ Upload failed. Check console for details.');
      }
    });
  }
}


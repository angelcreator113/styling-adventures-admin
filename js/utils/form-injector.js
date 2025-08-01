import { uploadFileToFirebase } from './uploadFileToFirebase.js';
import { db } from './firebase-client.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/**
 * Injects upload forms for closet, voice, and episode panels.
 * Only injects HTML structure and prevents duplicate injection.
 */
export function injectUploadForms() {
  const formTemplate = (type, fileType) => `
    <form id="${type}-upload-form">
      <div id="${type}-drop-area" class="drop-area">
        <label for="${type}-file-input" class="visually-hidden">Upload ${type} file</label>
        <input type="file" id="${type}-file-input" accept="${fileType}/*" />
      </div>
      <label for="${type}-category">Category</label>
      <select id="${type}-category" required></select>
      <label for="${type}-subcategory">Subcategory</label>
      <select id="${type}-subcategory"></select>
      <label for="${type}-subsubcategory">Sub-subcategory</label>
      <select id="${type}-subsubcategory"></select>
      <button id="${type}-upload-btn" type="button">Upload</button>
    </form>
  `;

  const types = [
    { id: "closet", container: "#closet-form-container", fileType: "image" },
    { id: "voice", container: "#voice-form-container", fileType: "audio" },
    { id: "episode", container: "#episode-form-container", fileType: "video" }
  ];

  types.forEach(({ id, container, fileType }) => {
    // ✅ Prevent duplicate form injection
    if (document.getElementById(`${id}-upload-form`)) return;

    const target = document.querySelector(container);
    if (target) {
      target.innerHTML = formTemplate(id, fileType);
      console.log(`[injector] Injected ${id} form.`);
    }

    const gridId = `${id}-dashboard-grid`;
    if (!document.getElementById(gridId)) {
      const section = document.querySelector(`#${id}-panel .dashboard-section`);
      if (section) {
        const gridDiv = document.createElement("div");
        gridDiv.id = gridId;
        gridDiv.className = `${id}-grid`;
        section.appendChild(gridDiv);
      }
    }
  });
}

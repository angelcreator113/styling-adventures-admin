// /js/uploads/upload-factory.js

import { initDragDropUploadDynamic } from '/js/components/dragdrop.js';
import { loadCategories } from '/js/components/categoryStore.js';

/**
 * @typedef {{
 *   slug: string,
 *   uiPrefix: string,
 * }} PanelDef
 */

/**
 * Setup the upload panel UI (dragdrop + categories)
 * @param {PanelDef} def
 */
export async function createUploadUI(def) {
  const { slug, uiPrefix } = def;

  const inputId = `${uiPrefix}file-input`;
  const dropAreaId = `${uiPrefix}drop-area`;

  // 🎯 Match accepted file types per panel
  const acceptedBySlug = {
    closet: ['image/png', 'image/jpeg', 'image/webp'],
    voice: ['audio/mpeg', 'audio/wav', 'audio/webm'],
    episodes: ['video/mp4', 'video/webm', 'video/quicktime'],
  };

  const acceptedTypes = acceptedBySlug[slug] || ['*/*'];

  // 🧲 Init drag-and-drop for this panel
  initDragDropUploadDynamic([
    {
      inputId,
      dropAreaId,
      options: { acceptedTypes },
    },
  ]);

  // 📚 Load category dropdown data
  try {
    await loadCategories(slug);
    console.log(`[upload-factory] Categories loaded for ${slug}`);
  } catch (err) {
    console.warn(`[upload-factory] Failed to load categories for ${slug}`, err);
  }
}

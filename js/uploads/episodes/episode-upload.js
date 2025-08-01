// js/uploads/episodes/episode-upload.js

import { loadCategoryData } from '../../components/categoryStore.js';
import { initDragDropUploadDynamic } from '../../components/dragdrop.js';

export function setupEpisodeUploadUI() {
  loadCategoryData('episode', 'episode-');

  initDragDropUploadDynamic([
    {
      inputId: 'episode-file-input',
      dropAreaId: 'episode-drop-area',
      options: {
        acceptedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
        preventClickDuringDrop: true,
      }
    }
  ]);
}


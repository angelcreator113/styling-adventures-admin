// js/uploads/voice/voice-upload.js

import { loadCategoryData } from '../../components/categoryStore.js';
import { initDragDropUploadDynamic } from '../../components/dragdrop.js';

export function setupVoiceUploadUI() {
  loadCategoryData('voice', 'voice-');

  initDragDropUploadDynamic([
    {
      inputId: 'voice-file-input',
      dropAreaId: 'voice-drop-area',
      options: {
        acceptedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
        preventClickDuringDrop: true,
      }
    }
  ]);
}


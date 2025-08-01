// js/components/dragdrop.js

const dragObservers = new Map(); // 🧠 Track per-panel observers

/**
 * Initialize drag-and-drop upload with dynamic options
 * @param {Array} configs - Array of { inputId, dropAreaId, options }
 */
export function initDragDropUploadDynamic(configs) {
  configs.forEach(({ inputId, dropAreaId, options = {} }) => {
    const dropArea = document.getElementById(dropAreaId);
    const fileInput = document.getElementById(inputId);

    if (!dropArea || !fileInput) {
      console.warn(`[dragdrop] Missing elements for ${dropAreaId}`);
      return;
    }

    // 🛡 Prevent re-initializing the same drop area
    if (dragObservers.has(dropAreaId)) {
      console.warn(`[dragdrop] ${dropAreaId} already initialized. Skipping.`);
      return;
    }

    // 💥 Drag over styling
    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('drag-over');
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('drag-over');
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const acceptedTypes = options.acceptedTypes || [];

      const validFiles = acceptedTypes.length
        ? files.filter(f => acceptedTypes.includes(f.type))
        : files;

      if (validFiles.length) {
        fileInput.files = createFileList(validFiles);
        fileInput.dispatchEvent(new Event('change')); // 👀 Trigger manual update
      } else {
        console.warn(`[dragdrop] No valid files dropped in ${dropAreaId}`);
      }
    });

    // 🖱 Click to open input unless disabled
    if (!options.preventClickDuringDrop) {
      dropArea.addEventListener('click', () => fileInput.click());
    }

    // 🧠 Scoped MutationObserver to check DOM re-renders
    const observer = new MutationObserver(() => {
      const newDropArea = document.getElementById(dropAreaId);
      if (!newDropArea) return;

      // 🔁 Re-bind if DOM replaced this element
      observer.disconnect();
      dragObservers.delete(dropAreaId);
      initDragDropUploadDynamic([{ inputId, dropAreaId, options }]);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    dragObservers.set(dropAreaId, observer);

    console.log(`[dragdrop] Initialized: ${dropAreaId}`);
  });
}

// 🧪 Create a new FileList (browser doesn't let you do it directly)
function createFileList(files) {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer.files;
}

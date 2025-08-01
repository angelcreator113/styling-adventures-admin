import { initUploadPanel } from "../upload-handlers.js";

initUploadPanel({
  panelType: "episode",
  fileInputId: "episode-file-input",
  uploadBtnId: "episode-upload-btn",
  categoryId: "episode-category",
  subcategoryId: "episode-subcategory",
  subsubcategoryId: "episode-subsubcategory",
  dropAreaId: "episode-drop-area",
  filterInputId: "episode-filter",
  clearFilterBtnId: "episode-clear-btn",
  gridSelector: "#episode-dashboard-grid",
  fileType: "video"
});

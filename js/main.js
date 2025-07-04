// js/main.js
// Handles all upload and metadata form interactions

import { uploadFile, saveFileMetadata } from './uploader.js';
import { displayUploads } from './renderer.js';
import { setupModalEvents } from './editor.js';
import { initClosetDropdowns } from './closet-categories.js';

document.getElementById('episode-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('episode-upload').files[0];
  if (!file) return alert("No episode selected.");
  console.log("Uploading episode:", file.name);

  const url = await uploadFile(file, "episodes");
  await saveFileMetadata("episodes", { filename: file.name, url, type: "video" });
  alert("Episode uploaded!");
  displayUploads('episodes', 'episode-list', 'link');
});

document.getElementById('voice-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('voice-upload').files[0];
  if (!file) return alert("No voice file selected.");
  console.log("Uploading voice file:", file.name);

  const url = await uploadFile(file, "voice");
  await saveFileMetadata("voice", { filename: file.name, url, type: "audio" });
  alert("Voice file uploaded!");
  displayUploads('voice', 'voice-list', 'link');
});

document.getElementById('closet-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('closet-upload').files[0];
  if (!file) return alert("No closet item selected.");

  const category = document.getElementById('closet-category')?.value;
  const subcategory = document.getElementById('closet-subcategory')?.value;

  if (!category || !subcategory) return alert("Please select both a category and subcategory.");

  const url = await uploadFile(file, "closet", category, subcategory);
  await saveFileMetadata("closet", {
    filename: file.name,
    url,
    type: "image",
    category,
    subcategory
  });
  alert("Closet item uploaded!");
  displayUploads('closet', 'closet-list', 'link');
});

// Initial Loads and Modal Setup
displayUploads('episodes', 'episode-list', 'link');
displayUploads('voice', 'voice-list', 'link');
displayUploads('closet', 'closet-list', 'link');

setupModalEvents();
initClosetDropdowns();

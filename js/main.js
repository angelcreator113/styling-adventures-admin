// js/main.js
import { uploadFile, saveFileMetadata } from './uploader.js';
import { displayUploads } from './renderer.js';
import { setupModalEvents } from './editor.js';
import { initClosetDropdowns } from './closet-categories.js';

// Upload Episodes
document.getElementById('episode-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('episode-upload').files[0];
  if (!file) return alert("No episode selected.");

  const category = document.getElementById('episode-category')?.value;
  const subcategory = document.getElementById('episode-subcategory')?.value;

  if (!category || !subcategory) return alert("Please select both episode category and subcategory.");

  const path = `episodes/${category}/${subcategory}`;
  console.log("Uploading episode to:", path);

  const url = await uploadFile(file, path);
  await saveFileMetadata("episodes", {
    filename: file.name,
    url,
    type: "video",
    category,
    subcategory
  });

  alert("Episode uploaded!");
  displayUploads('episodes', 'episode-list', 'link');
});

// Upload Voice Files
document.getElementById('voice-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('voice-upload').files[0];
  if (!file) return alert("No voice file selected.");

  const url = await uploadFile(file, "voice");
  await saveFileMetadata("voice", { filename: file.name, url, type: "audio" });

  alert("Voice file uploaded!");
  displayUploads('voice', 'voice-list', 'link');
});

// Upload Closet Items
document.getElementById('closet-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('closet-upload').files[0];
  if (!file) return alert("No closet item selected.");

  const category = document.getElementById('closet-category')?.value;
  const subcategory = document.getElementById('closet-subcategory')?.value;

  if (!category || !subcategory) return alert("Please select both a category and subcategory.");

  const path = `closet/${category}/${subcategory}`;
  console.log("Uploading closet item to:", path);

  const url = await uploadFile(file, path);
  await saveFileMetadata("closet", {
    filename: file.name,
    url,
    type: "image",
    category,
    subcategory
  });

  alert("Closet item uploaded!");
  displayUploads('closet', 'closet-list', 'image');
});

// Initial Loads
displayUploads('episodes', 'episode-list', 'link');
displayUploads('voice', 'voice-list', 'link');
displayUploads('closet', 'closet-list', 'image');

setupModalEvents();
initClosetDropdowns();

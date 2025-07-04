// js/main.js
// Handles all upload and metadata form interactions

import { uploadFile, saveFileMetadata } from './uploader.js';
import { displayUploads } from './renderer.js';
import { setupModalEvents } from './editor.js';

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
  console.log("Uploading closet item:", file.name);

  const url = await uploadFile(file, "closet");
  await saveFileMetadata("closet", { filename: file.name, url, type: "image" });
  alert("Closet item uploaded!");
  displayUploads('closet', 'closet-list', 'link');
});

document.getElementById('meta-publish-btn')?.addEventListener('click', async () => {
  const title = document.getElementById('meta-title').value;
  const description = document.getElementById('meta-description').value;
  const tags = document.getElementById('meta-tags').value;

  await saveFileMetadata("metadata", {
    title,
    description,
    tags: tags.split(',').map(t => t.trim())
  });

  alert("Metadata saved!");
  displayUploads('metadata', 'meta-list', 'text');
});

// Initial Loads and Modal Setup
displayUploads('episodes', 'episode-list', 'link');
displayUploads('voice', 'voice-list', 'link');
displayUploads('closet', 'closet-list', 'link');
displayUploads('metadata', 'meta-list', 'text');

setupModalEvents();

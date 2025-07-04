import { uploadFile, saveFileMetadata } from './uploader.js';
import { setupModalEvents } from './editor.js';
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { loadDefaults } from './dropdown-utils.js';

import { renderEpisodeUploads } from './uploads/episodes/index.js';
import { renderVoiceUploads } from './uploads/voice/index.js';
import { renderClosetUploads } from './uploads/closet/index.js';

// Firebase Anonymous Auth
const auth = getAuth();
signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch((error) => console.error("Firebase Auth error:", error));

// Upload Episodes
document.getElementById('episode-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('episode-upload').files[0];
  const category = document.getElementById('episode-category')?.value;
  const subcategory = document.getElementById('episode-subcategory')?.value;
  const subsubcategory = document.getElementById('episode-sub-subcategory')?.value;

  if (!file || !category || !subcategory || !subsubcategory)
    return alert("Please select all episode fields and choose a file.");

  const path = `episodes/${category}/${subcategory}/${subsubcategory}`;
  const url = await uploadFile(file, path);
  await saveFileMetadata("episodes", { filename: file.name, url, type: "video", category, subcategory, subsubcategory });

  alert("Episode uploaded!");
  renderEpisodeUploads();
});

// Upload Voice Files
document.getElementById('voice-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('voice-upload').files[0];
  const category = document.getElementById('voice-category')?.value;
  const subcategory = document.getElementById('voice-subcategory')?.value;
  const subsubcategory = document.getElementById('voice-sub-subcategory')?.value;

  if (!file || !category || !subcategory || !subsubcategory)
    return alert("Please select all voice fields and choose a file.");

  const path = `voice/${category}/${subcategory}/${subsubcategory}`;
  const url = await uploadFile(file, path);
  await saveFileMetadata("voice", { filename: file.name, url, type: "audio", category, subcategory, subsubcategory });

  alert("Voice file uploaded!");
  renderVoiceUploads();
});

// Upload Closet Items
document.getElementById('closet-upload-btn')?.addEventListener('click', async () => {
  const file = document.getElementById('closet-upload').files[0];
  const category = document.getElementById('closet-category')?.value;
  const subcategory = document.getElementById('closet-subcategory')?.value;

  if (!file || !category || !subcategory)
    return alert("Please select closet category/subcategory and choose a file.");

  const path = `closet/${category}/${subcategory}`;
  const url = await uploadFile(file, path);
  await saveFileMetadata("closet", { filename: file.name, url, type: "image", category, subcategory });

  alert("Closet item uploaded!");
  renderClosetUploads();
});

// Initial Load
loadDefaults();
setupModalEvents();
renderEpisodeUploads();
renderVoiceUploads();
renderClosetUploads();

// 🔐 Auth & Firebase
import { requireAuth, auth } from './utils/firebase-client.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ⬆️ Upload UI Init
import { setupClosetUploadUI } from './uploads/closet/closet-upload.js';
import { setupVoiceUploadUI } from './uploads/voice/voice-upload.js';
import { setupEpisodeUploadUI } from './uploads/episodes/episode-upload.js';

// 🔁 Dashboard logic
import { refreshClosetDashboard } from './dashboard/closet-dashboard.js';
import { refreshEpisodeDashboard } from './dashboard/episode-dashboard.js';

// 🧃 Toast
import { showToast } from './components/toast.js';

// 🧩 Dynamic Panel Injection
const panelWrapper = document.getElementById('panel-wrapper');
const partials = [
  'closet-panel.html',
  'voice-panel.html',
  'episodes-panel.html',
  'meta-panel.html',
  'manage-panels-panel.html'
];

Promise.all(
  partials.map(filename =>
    fetch(`./partials/${filename}`).then(res => res.text())
  )
).then(contents => {
  contents.forEach(html => {
    const section = document.createElement('section');
    section.innerHTML = html;
    section.classList.add('panel');
    panelWrapper.appendChild(section.firstElementChild);
  });

  // Now safe to initialize logic
  initApp();
});

function initApp() {
  requireAuth();

  // Initialize Upload Panels
  setupClosetUploadUI();
  setupVoiceUploadUI();
  setupEpisodeUploadUI();

  // Panel Switching
  const navButtons = document.querySelectorAll('.nav-item[data-panel]');
  const panels = document.querySelectorAll('.panel');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      panels.forEach(panel => panel.classList.remove('active'));
      const panelId = button.getAttribute('data-panel');
      const target = document.getElementById(panelId);
      if (target) {
        target.classList.add('active');
      } else {
        console.warn(`⚠️ Panel not found: #${panelId}`);
      }
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    const newTheme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem("theme", newTheme);
  });

  // Logout
  document.getElementById('logout-button')?.addEventListener('click', async () => {
    try {
      await signOut(auth);
      console.log('🚪 Logged out successfully.');
      window.location.href = 'login.html';
    } catch (error) {
      alert('Error logging out: ' + error.message);
      console.error(error);
    }
  });

  console.log("✨ App fully initialized.");
}
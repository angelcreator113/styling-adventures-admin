// 🔐 Auth & Firebase
import { requireAuth, auth } from './js/utils/firebase-client.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ⬆️ Upload UI Init
import { setupClosetUploadUI } from './js/uploads/closet/closet-upload.js';
import { setupVoiceUploadUI } from './js/uploads/voice/voice-upload.js';
import { setupEpisodeUploadUI } from './js/uploads/episodes/episode-upload.js';

// 🔁 Dashboard logic
import { refreshClosetDashboard } from './js/dashboard/closet-dashboard.js';
import { refreshEpisodeDashboard } from './js/dashboard/episode-dashboard.js';

// 🧃 Toast
import { showToast } from './js/components/toast.js';

// 🚪 Logout Handler
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

// 🚀 App Boot
window.addEventListener('DOMContentLoaded', () => {
  requireAuth(); // 🔒 Protect access

  // 🧩 Initialize Upload Panels
  setupClosetUploadUI();
  setupVoiceUploadUI();
  setupEpisodeUploadUI();

  // 🌈 Panel Switching Logic
  const navButtons = document.querySelectorAll('.nav-item[data-panel]');
  const panels = document.querySelectorAll('.panel');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all buttons
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Hide all panels
      panels.forEach(panel => panel.classList.remove('active'));

      // Show the correct panel
      const panelId = button.getAttribute('data-panel');
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
      } else {
        console.warn(`⚠️ Panel not found: #${panelId}`);
      }
    });
  });

  // 🌗 Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    const newTheme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem("theme", newTheme);
  });

  // 🛠️ Manage Panels Logic (conditionally runs)
  const managePanel = document.getElementById("manage-panels-panel");
  if (managePanel) {
    const form = document.getElementById("add-panel-form");
    const panelNameInput = document.getElementById("panel-name");
    const fileTypeInput = document.getElementById("file-type");
    const panelList = document.getElementById("panel-list");

    function getPanels() {
      return JSON.parse(localStorage.getItem("uploadPanels") || "[]");
    }

    function savePanels(panels) {
      localStorage.setItem("uploadPanels", JSON.stringify(panels));
    }

    function renderPanels() {
      const panels = getPanels();
      panelList.innerHTML = "<h3>Existing Panels</h3>";
      panels.forEach((panel, index) => {
        const div = document.createElement("div");
        div.className = "panel-item";
        div.innerHTML = `
          <span><strong>${panel.label}</strong> — <code>${panel.accept}</code></span>
          <button data-index="${index}">Delete</button>
        `;
        panelList.appendChild(div);
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = panelNameInput.value.trim();
      const accept = fileTypeInput.value;
      if (!name) return;
      const id = name.toLowerCase().replace(/\\s+/g, "-");
      const newPanel = { id, label: name, accept };
      const panels = getPanels();
      panels.push(newPanel);
      savePanels(panels);
      renderPanels();
      form.reset();
    });

    panelList.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const index = e.target.getAttribute("data-index");
        const panels = getPanels();
        panels.splice(index, 1);
        savePanels(panels);
        renderPanels();
      }
    });

    renderPanels();
    console.log("🛠️ Manage Panels initialized.");
  }

  console.log("✨ App ready. Panels, Upload UIs, and Theme Toggle initialized.");
});

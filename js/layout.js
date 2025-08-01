// js/layout.js
const html = document.documentElement;
const navItems = document.querySelectorAll(".nav-item");
const panels = document.querySelectorAll(".panel");
const modeToggle = document.getElementById("toggle-theme");

const initializedPanels = new Set(); // 🧠 Track initialized panels

// 🌓 Theme toggle
modeToggle?.addEventListener("click", () => {
  html.classList.toggle("dark");
  html.classList.toggle("light");
});

// 🧭 Panel switching logic
export async function showPanel(panelId) {
  // Reset nav + panel active state
  navItems.forEach(item => item.classList.remove("active"));
  panels.forEach(panel => panel.classList.remove("active"));

  const button = document.querySelector(`[data-panel="${panelId}"]`);
  const panel = document.getElementById(`${panelId}-panel`);

  if (button) button.classList.add("active");
  if (panel) {
    panel.classList.add("active");
  } else {
    console.warn(`⚠️ Panel not found: ${panelId}-panel`);
  }

  // Lazy-load associated logic
  if (!initializedPanels.has(panelId)) {
    try {
      switch (panelId) {
        case "closet":
          await import("../js/uploads/closet/closet-upload.js").then(mod => mod.initUploadCloset?.());
          break;
        case "voice":
          await import("../js/uploads/voice/voice-upload.js").then(mod => mod.initUploadVoice?.());
          break;
        case "episodes":
          await import("../js/uploads/episodes/episode-upload.js").then(mod => mod.initUploadEpisode?.());
          break;
        case "meta":
          await import("../js/meta/meta-panel.js").then(mod => mod.initMetaPanel?.());
          break;
      }
      initializedPanels.add(panelId);
    } catch (err) {
      console.error(`[layout.js] Failed to initialize ${panelId}`, err);
      if (panel) {
        panel.innerHTML = `<p class="error">⚠️ Failed to load panel logic.</p>`;
      }
    }
  }
}

// ✅ Expose globally
window.showPanel = showPanel;

// 🧭 Initial click bindings
navItems.forEach(button => {
  button.addEventListener("click", () => {
    const panel = button.dataset.panel;
    if (panel) showPanel(panel);
  });
});

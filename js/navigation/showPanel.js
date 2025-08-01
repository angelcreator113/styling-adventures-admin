// js/navigation/showPanel.js

/**
 * Show the selected panel by ID and hide others
 * @param {string} panelType - The ID suffix of the panel to show (e.g. 'closet', 'voice', 'episodes', 'meta')
 */
export function showPanel(panelType) {
  const allPanels = document.querySelectorAll(".panel");
  const allButtons = document.querySelectorAll(".nav-item");

  allPanels.forEach(panel => panel.classList.remove("active"));
  allButtons.forEach(button => button.classList.remove("active"));

  const targetPanel = document.getElementById(`${panelType}-panel`);
  const targetButton = document.querySelector(`[data-panel='${panelType}-panel']`);

  if (targetPanel) targetPanel.classList.add("active");
  if (targetButton) targetButton.classList.add("active");
}

// ✅ Wait for DOM to be ready before any panel setup
if (typeof window !== 'undefined') {
  document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-item");

    navButtons.forEach(button => {
      button.addEventListener("click", () => {
        const panelId = button.getAttribute("data-panel");
        if (panelId) {
          const type = panelId.replace("-panel", "");
          showPanel(type);
        }
      });
    });
  });
}

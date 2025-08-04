// js/panels/panel-router.js
const panelMap = {
  'closet-upload': './partials/closet-panel.html',
  'voice-upload': './partials/voice-panel.html',
  'episode-upload': './partials/episodes-panel.html',
  'meta-upload': './partials/meta-panel.html',
  'panel-manager': './partials/manage-panels-panel.html',
  'home': null, // clear panel
};

const panelContainer = document.getElementById('panel-container');

async function loadPanel(panelKey) {
  const panelPath = panelMap[panelKey];

  if (!panelPath) {
    panelContainer.innerHTML = `
      <h1 class="placeholder-heading">Welcome to the Admin Panel</h1>
      <p class="placeholder-subtext">Select an action using the top navigation.</p>
    `;
    return;
  }

  try {
    const response = await fetch(panelPath);
    if (!response.ok) throw new Error(`Failed to load ${panelPath}`);
    const html = await response.text();
    panelContainer.innerHTML = html;
  } catch (error) {
    panelContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

// Attach click handlers
document.querySelectorAll('[data-panel]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const panelKey = e.target.getAttribute('data-panel');
    loadPanel(panelKey);
  });
});

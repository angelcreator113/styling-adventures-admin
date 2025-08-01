// panel-manager.js for upload.html

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("panel-wrapper");

  async function loadPanel(panelId, partialPath) {
    const res = await fetch(partialPath);
    const html = await res.text();
    const container = document.createElement("div");
    container.innerHTML = html;
    const panel = container.firstElementChild;
    panel.id = panelId;
    panel.classList.add("panel");
    if (panelId === "closet-panel") panel.classList.add("active");
    wrapper.appendChild(panel);
  }

  const panelsToLoad = [
    { id: "closet-panel", path: "../partials/closet-panel.html" },
    { id: "voice-panel", path: "../partials/voice-panel.html" },
    { id: "episodes-panel", path: "../partials/episodes-panel.html" },
    { id: "meta-panel", path: "../partials/meta-panel.html" },
    { id: "manage-panels-panel", path: "../partials/manage-panels-panel.html" }
  ];

  Promise.all(panelsToLoad.map(p => loadPanel(p.id, p.path))).then(() => {
    document.querySelectorAll(".tab-button").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const targetId = btn.dataset.panel;
        document.querySelectorAll(".panel").forEach(p => {
          p.classList.toggle("active", p.id === targetId);
        });
      });
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
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
    panelList.innerHTML = "<h2>Existing Panels</h2>";
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
    const id = name.toLowerCase().replace(/\s+/g, "-");
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
});

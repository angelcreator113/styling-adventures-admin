import { initUIListeners } from './loadListeners.js';

const loadComponent = async (path) => {
  const res = await fetch(path);
  return res.text();
};

const injectComponents = async () => {
  const container = document.getElementById("dashboard-container");

  const components = [
    "../components/view/dashboard-header.html",
    "../components/view/card-collections.html",
    "../components/view/card-stats.html",
    "../components/view/card-just-in.html",
    "../components/view/card-tip.html",
    "../components/view/card-planner.html"
  ];

  // Load and inject header first
  const headerHTML = await loadComponent(components[0]);
  container.innerHTML = headerHTML + `<div class="dashboard-grid" id="grid-area"></div>`;

  const grid = document.getElementById("grid-area");

  // Inject all dashboard cards
  for (let i = 1; i < components.length; i++) {
    const html = await loadComponent(components[i]);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    grid.appendChild(wrapper.firstChild);
  }

  // ⬇️ Once all components are mounted, attach listeners
  initUIListeners();
};

injectComponents();

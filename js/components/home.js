// js/home.js
import { injectHomeSections } from './components/injectHomeSections.js';
import { loadSidebar } from './utils/loadSidebar.js';
import { setupThemeToggle } from './utils/theme.js';

document.addEventListener("DOMContentLoaded", async () => {
  await loadSidebar();
  await injectHomeSections();
  setupThemeToggle();
});

import { injectUploadForms } from './utils/form-injector.js';
import { initDashboards } from './utils/dashboard-utils.js';

const INIT_DELAY = 300;
let hasInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("[main] DOM ready. Injecting forms...");
  injectUploadForms();

  // ⏱ Immediately show Closet panel
  if (typeof window.showPanel === "function") {
    window.showPanel("closet");
  } else {
    console.warn("⚠️ window.showPanel not available yet.");
  }

  // 👁‍🗨 One-time init when grids appear
  const observer = new MutationObserver(() => {
    if (hasInitialized) return;

    clearTimeout(window.initTimeout);
    window.initTimeout = setTimeout(() => {
      const allGridsExist =
        document.getElementById("closet-dashboard-grid") &&
        document.getElementById("voice-dashboard-grid") &&
        document.getElementById("episode-dashboard-grid");

      if (allGridsExist) {
        console.log("✅ All dashboard grids detected. Initializing...");
        initDashboards();
        hasInitialized = true;
        observer.disconnect();
      }
    }, INIT_DELAY);
  });

  const mainArea = document.querySelector(".main-content");
  if (mainArea) {
    observer.observe(mainArea, { childList: true, subtree: true });
  }
});


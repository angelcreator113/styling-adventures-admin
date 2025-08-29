// Safe a11y scaffold for SPA boot + HMR.
// - Does nothing if #root exists (React app will manage its own layout)
// - If it must create a <main>, it keeps it off-screen and removes it post-mount
let installed = false;

export function ensureA11yScaffold() {
  if (installed) return;
  installed = true;

  try {
    // If our React mount point exists already, we don't need any placeholder.
    if (document.getElementById("root")) {
      ensureSkipLink(); // still ensure the skip link targets #main-content if present later
      return;
    }

    ensureSkipLink();

    // Create an inert, off-screen main only if none exists yet.
    let main =
      document.getElementById("main-content") ||
      document.querySelector("main#main-content") ||
      document.querySelector('[role="main"]#main-content');

    if (!main) {
      main = document.createElement("main");
      main.id = "main-content";
      main.setAttribute("role", "main");
      main.setAttribute("tabindex", "-1");
      // Keep it out of layout so it never blanks the page.
      Object.assign(main.style, {
        position: "absolute",
        left: "-9999px",
        top: "0",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      });
      document.body.prepend(main);
    } else if (!main.hasAttribute("tabindex")) {
      main.setAttribute("tabindex", "-1");
    }

    bindFocusHandlers(main);
  } catch (_) {
    /* no-op */
  }
}

export function removeA11yScaffoldIfEmpty() {
  try {
    const main = document.getElementById("main-content");
    // If we created a placeholder and it's still empty, remove it now that React mounted.
    if (main && main.childElementCount === 0 && main.textContent.trim() === "") {
      // Only remove if it still looks like our off-screen placeholder
      const isOffscreen = main.style && main.style.position === "absolute" && main.style.left === "-9999px";
      if (isOffscreen) main.remove();
    }
  } catch (_) {
    /* no-op */
  }
}

function ensureSkipLink() {
  let skip = document.querySelector(".skip-link");
  if (!skip) {
    skip = document.createElement("a");
    skip.className = "skip-link vh--focusable";
    skip.href = "#main-content";
    skip.textContent = "Skip to content";
    document.body.prepend(skip);
  }
}

function bindFocusHandlers(main) {
  if (window.__a11yOnSkipClick) {
    window.removeEventListener("click", window.__a11yOnSkipClick, true);
  }
  const onSkipClick = (e) => {
    if (!e.target.closest(".skip-link")) return;
    e.preventDefault();
    requestAnimationFrame(() => main && main.focus());
  };
  window.addEventListener("click", onSkipClick, true);
  window.__a11yOnSkipClick = onSkipClick;

  if (window.__a11yOnHashChange) {
    window.removeEventListener("hashchange", window.__a11yOnHashChange);
  }
  const onHash = () => {
    if (location.hash === "#main-content") {
      requestAnimationFrame(() => main && main.focus());
    }
  };
  window.addEventListener("hashchange", onHash);
  window.__a11yOnHashChange = onHash;

  onHash();
}


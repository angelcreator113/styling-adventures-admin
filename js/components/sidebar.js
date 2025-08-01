// js/components/sidebar.js

export async function injectSidebar() {
  const container = document.getElementById("sidebar");
  if (!container) {
    console.warn("⚠️ Sidebar container not found");
    return;
  }

  try {
    const res = await fetch('./components/sidebar.html');
    if (!res.ok) throw new Error("Sidebar HTML not found");
    const html = await res.text();
    container.innerHTML = html;

    // 🔄 Highlight Active Button
    const currentPanel = document.body.dataset.panel;
    const buttons = container.querySelectorAll(".nav-item");
    buttons.forEach((btn) => {
      const panel = btn.getAttribute("data-panel");
      if (panel === currentPanel) {
        btn.classList.add("active");
      }
    });

    // 🧭 Optional Click Logic
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = btn.getAttribute("data-panel");
        if (panel) window.location.href = `${panel}.html`;
      });
    });

  } catch (err) {
    console.error("❌ Failed to inject sidebar:", err);
  }
}

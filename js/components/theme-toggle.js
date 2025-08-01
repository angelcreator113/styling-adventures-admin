export function setupThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");

  if (!toggleBtn) {
    console.warn("⚠️ Theme toggle not loaded");
    return;
  }

  // Apply saved theme (if any)
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "");
  });
}

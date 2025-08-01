const panelsToLoad = [
  "closet",
  "voice",
  "episodes",
  "meta",
  "manage-panels"
];

window.addEventListener("DOMContentLoaded", async () => {
  const wrapper = document.getElementById("panel-wrapper");
  if (!wrapper) return;

  for (const id of panelsToLoad) {
    const res = await fetch(`./partials/${id}-panel.html`);
    const html = await res.text();
    const section = document.createElement("div");
    section.innerHTML = html;
    wrapper.appendChild(section.firstElementChild);
  }
});

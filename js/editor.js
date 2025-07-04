export function setupModalEvents() {
  const buttons = [
    { id: 'episode-edit-btn', label: 'Episode' },
    { id: 'voice-edit-btn', label: 'Voice' },
    { id: 'closet-edit-btn', label: 'Closet' }
  ];

  buttons.forEach(({ id, label }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        console.log(`[EDIT] ${label} clicked`);
        // 👉 Insert modal initialization or form population here
        // Example: showModal(label.toLowerCase());
      });
    } else {
      console.warn(`[WARN] Button with ID '${id}' not found in DOM`);
    }
  });
}

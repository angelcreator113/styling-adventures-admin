// shared-ui.js
export function toggleEdit(section) {
  const panel = document.getElementById(`${section}-edit-panel`);
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

export function addOption(selectId, inputId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (input.value.trim()) {
    const option = document.createElement('option');
    option.value = input.value.trim();
    option.textContent = input.value.trim();
    select.appendChild(option);
    input.value = '';
  }
}
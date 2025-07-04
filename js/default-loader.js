// default-loader.js
export function loadDefaults() {
  const presetOptions = {
    'episode-category': ['seasons', 'filler'],
    'episode-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'episode-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5'],
    'voice-category': ['episode'],
    'voice-subcategory': ['s1', 's2', 's3', 's4', 's5'],
    'voice-sub-subcategory': ['ep1', 'ep2', 'ep3', 'ep4', 'ep5']
  };

  for (const [selectId, options] of Object.entries(presetOptions)) {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '';
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
    }
  }
}
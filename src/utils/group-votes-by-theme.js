// utils/group-votes-by-theme.js
export function groupVotesByTheme(events) {
  const out = {};
  for (const e of events) {
    const k = e.themeName || "Unknown";
    if (!out[k]) out[k] = { count: 0, icons: new Set() };
    out[k].count++;
    if (e.themeIcon) out[k].icons.add(e.themeIcon);
  }
  return out;
}

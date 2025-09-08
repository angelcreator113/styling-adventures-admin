// src/utils/nav-store.js
const RECENTS_KEY = "nav.recents.v1";
const PINNED_KEY  = "nav.pinned.v1";
const LIMIT = 12;

const safeJSON = (s, fallback) => {
  try { return JSON.parse(s) ?? fallback; } catch { return fallback; }
};

export function getRecents() {
  return safeJSON(localStorage.getItem(RECENTS_KEY), []);
}
export function addRecent(item) {
  if (!item?.path) return;
  const now = Date.now();
  const cur = getRecents().filter(r => r.path !== item.path);
  cur.unshift({ path: item.path, label: item.label || item.path, ts: now });
  localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, LIMIT)));
}

export function getPinned() {
  return safeJSON(localStorage.getItem(PINNED_KEY), []);
}
export function isPinned(path) {
  return getPinned().some(p => p.path === path);
}
export function togglePinned(item) {
  if (!item?.path) return getPinned();
  const cur = getPinned();
  const idx = cur.findIndex(p => p.path === item.path);
  if (idx >= 0) cur.splice(idx, 1);
  else cur.unshift({ path: item.path, label: item.label || item.path });
  localStorage.setItem(PINNED_KEY, JSON.stringify(cur.slice(0, LIMIT)));
  return getPinned();
}

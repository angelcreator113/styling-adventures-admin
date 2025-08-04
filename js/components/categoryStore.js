// js/components/categoryStore.js
// @ts-check

// ------- DB access (no module import needed) -------
/** Return Firestore DB that your env-driven init placed on window.firebaseRefs. */
function getDB() {
  const refs = /** @type {any} */ (window).firebaseRefs;
  if (!refs || !refs.db) throw new Error('[CategoryStore] Firestore not initialized yet');
  return refs.db;
}

// TS can’t resolve types for CDN ESM imports; ignore type resolution on this line.
// @ts-ignore
import { collection, doc, getDocs, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const ROOT = 'categories';
const LS_KEY = (p) => `dropdowns-${p}`;

/** @typedef {{ tree: Record<string, any>, map: Record<string, any> }} PanelState */

/** @type {Map<string, PanelState>} */
const cache = new Map();
/** @type {Map<string, Set<(snap: {categories: any, map: any}) => void>>} */
const subs  = new Map();

// -----------------------------
// Public API (Data Layer)
// -----------------------------

/**
 * Load panel-specific categories (Firestore → LS fallback), cache, notify.
 * @param {'closet'|'voice'|'episodes'|string} panel
 * @returns {Promise<{categories:any, map:any}>}
 */
export async function loadCategories(panel) {
  const tree = await fetchTree(panel);
  const filtered = filterDeleted(tree);
  const flatMap = buildMap(filtered);
  cache.set(panel, { tree: filtered, map: flatMap });
  notify(panel);
  return getCategories(panel);
}

/**
 * Latest snapshot from memory (shape used by smart-dropdown).
 * @param {'closet'|'voice'|'episodes'|string} panel
 */
export function getCategories(panel) {
  const snap = cache.get(panel) || { tree: {}, map: {} };
  return { categories: snap.tree, map: snap.map };
}

/**
 * Subscribe to updates; fires immediately with current state.
 * @param {'closet'|'voice'|'episodes'|string} panel
 * @param {(snap:{categories:any, map:any})=>void} cb
 * @returns {() => void} unsubscribe
 */
export function onCategories(panel, cb) {
  let set = subs.get(panel);
  if (!set) { set = new Set(); subs.set(panel, set); }
  set.add(cb);
  try { cb(getCategories(panel)); } catch (e) { console.error(e); }
  return () => subs.get(panel)?.delete(cb);
}

/** Add a category node at `path` with `label`. */
export async function addCategory(panel, path, label) {
  if (!Array.isArray(path)) throw new Error('path must be an array');
  if (!label) throw new Error('label is required');

  const { tree } = await requireState(panel);
  mutateTree(tree, path, (parent) => {
    if (parent[label]) throw new Error(`'${label}' already exists at ${join(path) || 'root'}`);
    parent[label] = {};
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

/** Soft-delete node at `path` (only if it has no active children). */
export async function deleteCategory(panel, path) {
  if (!Array.isArray(path) || path.length === 0) throw new Error('path must target a node');

  const { tree } = await requireState(panel);
  mutateTree(tree, path.slice(0, -1), (parent) => {
    const key = path[path.length - 1];
    const node = parent[key];
    if (!node) throw new Error(`Path not found: ${join(path)}`);

    const activeChildren = Object.entries(node)
      .filter(([k, v]) => isCategoryKey(k) && v && !v.isDeleted);
    if (activeChildren.length > 0) throw new Error('This category has sub-items and cannot be deleted.');

    parent[key] = { ...(node || {}), isDeleted: true };
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

/** Rename node at `path` to `newLabel` (copy → soft-delete old). */
export async function renameCategory(panel, path, newLabel) {
  if (!Array.isArray(path) || path.length === 0) throw new Error('path must target a node');
  if (!newLabel) throw new Error('newLabel is required');

  const { tree } = await requireState(panel);
  mutateTree(tree, path.slice(0, -1), (parent) => {
    const oldKey = path[path.length - 1];
    const node = parent[oldKey];
    if (!node) throw new Error(`Path not found: ${join(path)}`);
    if (parent[newLabel]) throw new Error(`'${newLabel}' already exists at ${join(path.slice(0,-1)) || 'root'}`);

    parent[newLabel] = node;                              // move subtree
    parent[oldKey] = { ...(parent[oldKey] || {}), isDeleted: true }; // soft-delete
  });

  await persistPanel(panel, tree, path);
  finalize(panel, tree);
}

// -----------------------------
// Internals (Data Layer)
// -----------------------------

/**
 * Ensure a non-null state exists for a panel (loads if missing).
 * @param {'closet'|'voice'|'episodes'|string} panel
 * @returns {Promise<PanelState>}
 */
async function requireState(panel) {
  let s = cache.get(panel);
  if (!s) {
    await loadCategories(panel);
    s = cache.get(panel);
  }
  if (!s) throw new Error(`[CategoryStore] State not initialized for panel: ${panel}`);
  return /** @type {PanelState} */ (s);
}

/** Fetch full tree from Firestore; LS fallback on error. */
async function fetchTree(panel) {
  try {
    const db = getDB();
    const colRef = collection(db, `${ROOT}/${panel}/items`);
    const snap = await getDocs(colRef);
    const topLevel = {};
    snap.forEach((d) => { topLevel[d.id] = d.data() || {}; });
    try { localStorage.setItem(LS_KEY(panel), JSON.stringify(topLevel)); } catch {}
    return topLevel;
  } catch (err) {
    console.warn(`[CategoryStore] Firestore load failed for '${panel}', using localStorage.`, err);
    try {
      const raw = localStorage.getItem(LS_KEY(panel));
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}

/** Persist the affected top-level documents for a panel. */
async function persistPanel(panel, tree, path) {
  const topKeys = changedTopKeys(path, tree);
  const db = getDB();
  const colRef = collection(db, `${ROOT}/${panel}/items`);

  await Promise.all(
    topKeys.map(async (topKey) => {
      const data = tree[topKey] || {};
      await setDoc(doc(colRef, topKey), data);
    })
  );

  try { localStorage.setItem(LS_KEY(panel), JSON.stringify(tree)); } catch {}
}

/** Determine which top-level docs to write. */
function changedTopKeys(path, tree) {
  if (!Array.isArray(path) || path.length === 0) return Object.keys(tree);
  return [path[0]];
}

/** Apply a mutation function to the object at `path`. */
function mutateTree(tree, path, mutator) {
  if (path.length === 0) { mutator(tree); return; }
  const top = path[0];
  if (!tree[top]) tree[top] = {};
  let cursor = tree[top];
  for (let i = 1; i < path.length; i++) {
    const key = path[i];
    if (!cursor[key]) cursor[key] = {};
    cursor = cursor[key];
  }
  mutator(cursor);
}

/** Remove nodes flagged as isDeleted (recursively). */
function filterDeleted(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!isCategoryKey(k)) continue;
    if (!v || v.isDeleted) continue;
    out[k] = filterDeleted(v);
  }
  return out;
}

/** Build a flat map of "A/B/C" -> nodeRef for quick lookups. */
function buildMap(tree) {
  const map = {};
  const walk = (node, trail = []) => {
    for (const [k, v] of Object.entries(node)) {
      if (!isCategoryKey(k)) continue;
      const p = [...trail, k];
      map[join(p)] = v;
      walk(v, p);
    }
  };
  walk(tree);
  return map;
}

function isCategoryKey(k) { return k !== 'isDeleted'; }
function join(path) { return path.join('/'); }

/** Notify subscribers with latest payload. */
function notify(panel) {
  const payload = getCategories(panel);
  (subs.get(panel) || new Set()).forEach(cb => {
    try { cb(payload); } catch (e) { console.error('[CategoryStore] subscriber error', e); }
  });
}

/** Recompute cache from tree and notify. */
function finalize(panel, newTree) {
  const filtered = filterDeleted(newTree);
  const flatMap = buildMap(filtered);
  cache.set(panel, { tree: filtered, map: flatMap });
  notify(panel);
}

// ---------------------------------------------------------------------------
// UI Helper for Upload Panels
// ---------------------------------------------------------------------------

/** Get a <select> by id with runtime/type-safe narrowing.
 * @param {string} id
 * @returns {HTMLSelectElement}
 */
function getSelect(id) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSelectElement)) {
    throw new Error(`[CategoryStore] Expected <select id="${id}">, got ${el ? el.tagName : 'null'}`);
  }
  return el;
}

/**
 * Wire three-level dropdowns using the store’s API.
 * Usage: loadCategoryData('closet','closet-') | ('voice','voice-') | ('episode','episode-')
 * @param {'closet'|'voice'|'episode'|'episodes'} panel
 * @param {string} prefix e.g., 'closet-', 'voice-', 'episode-'
 * @returns {Promise<() => void | undefined>} unsubscribe handle (optional)
 */
export async function loadCategoryData(panel, prefix) {
  // Normalize to your store’s canonical key
  const panelKey = panel === 'episode' ? 'episodes' : panel;

  const catEl  = getSelect(`${prefix}category`);
  const subEl  = getSelect(`${prefix}subcategory`);
  const sub2El = getSelect(`${prefix}subsubcategory`);

  // Ensure data is loaded once, then subscribe to live updates
  await loadCategories(panelKey);
  const unsub = onCategories(panelKey, ({ categories }) => {
    renderTopLevel(categories, catEl);
    syncChildren(categories, catEl, subEl, sub2El);
  });

  // Cascade changes
  catEl.addEventListener('change', () => {
    const { categories } = getCategories(panelKey);
    syncChildren(categories, catEl, subEl, sub2El);
  });

  subEl.addEventListener('change', () => {
    const { categories } = getCategories(panelKey);
    renderSubs2(categories, catEl.value, subEl.value, sub2El);
  });

  return unsub;
}

/** @param {Record<string, any>} tree @param {HTMLSelectElement} catEl */
function renderTopLevel(tree, catEl) {
  const prev = catEl.value;
  setOptions(catEl, Object.keys(tree));
  if (prev && tree[prev]) catEl.value = prev;
}

/**
 * @param {Record<string, any>} tree
 * @param {HTMLSelectElement} catEl
 * @param {HTMLSelectElement} subEl
 * @param {HTMLSelectElement} sub2El
 */
function syncChildren(tree, catEl, subEl, sub2El) {
  const top = tree[catEl.value] || {};
  const prev = subEl.value;
  setOptions(subEl, Object.keys(top));
  if (prev && top[prev]) subEl.value = prev;
  renderSubs2(tree, catEl.value, subEl.value, sub2El);
}

/**
 * @param {Record<string, any>} tree
 * @param {string} cat
 * @param {string} sub
 * @param {HTMLSelectElement} sub2El
 */
function renderSubs2(tree, cat, sub, sub2El) {
  const lvl2 = (tree[cat] || {})[sub] || {};
  const prev = sub2El.value;
  setOptions(sub2El, Object.keys(lvl2));
  if (prev && lvl2[prev]) sub2El.value = prev;
}

/** @param {HTMLSelectElement} selectEl @param {string[]} items */
function setOptions(selectEl, items) {
  // Clear then repopulate to keep it simple and typed
  selectEl.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '';
  selectEl.appendChild(empty);

  for (const k of items) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    selectEl.appendChild(opt);
  }
}

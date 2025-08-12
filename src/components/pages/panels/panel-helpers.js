// C:\Users\12483\Desktop\styling-adventures-admin\js\panels\panel-helpers.js

// Shared helpers for Closet / Voice / Episodes upload panels.
// Centralizes: panel defs loading, MIME validation, visibility resolution,
// input accept syncing, storage path building, and a standard "uploaded" event.

import { db } from '../utils/firebase-client.js';
import { getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const PANEL_COLLECTION = 'panel_defs';

// Lightweight dynamic import for doc() to keep CDN ESM happy and minimize surface
async function _doc() {
  const { doc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  return doc;
}

/**
 * Fetch a panel definition from Firestore: panel_defs/{panelId}
 * @param {string} panelId - e.g., 'closet' | 'voice' | 'episodes'
 * @returns {Promise<object|null>}
 */
export async function getPanelDef(panelId) {
  try {
    const docFn = await _doc();
    const dref = docFn(db, PANEL_COLLECTION, panelId);
    const snap = await getDoc(dref);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('[panel-helpers] getPanelDef error:', err);
    return null;
  }
}

/**
 * Merge a panel def with safe defaults.
 * Known keys: accept, categoryPanelKey, uiPrefix, defaultVisibility
 * @param {object|null} panel
 * @param {object} fallback
 */
export function withPanelDefaults(panel, fallback) {
  return {
    accept: panel?.accept ?? fallback.accept,
    categoryPanelKey: panel?.categoryPanelKey ?? fallback.categoryPanelKey,
    uiPrefix: panel?.uiPrefix ?? fallback.uiPrefix,
    defaultVisibility: panel?.defaultVisibility ?? fallback.defaultVisibility,
  };
}

/**
 * Runtime MIME validation against an <input accept="..."> style string.
 * Example: "image/*,image/png"
 * @param {File} file
 * @param {string} acceptStr
 */
export function mimeAllowed(file, acceptStr) {
  if (!file) return false;
  if (!acceptStr) return true;

  const list = acceptStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (list.length === 0) return true;

  return list.some(a => {
    if (a.endsWith('/*')) {
      // keep trailing slash so "image/*" -> "image/"
      const prefix = a.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    return file.type === a;
  });
}

/**
 * Resolve 'public' | 'private' from a checkbox and a panel default.
 * If checkbox exists, it wins; else fall back to default.
 * @param {HTMLInputElement|null} checkboxEl
 * @param {'public'|'private'} panelDefault
 */
export function resolveVisibility(checkboxEl, panelDefault = 'private') {
  const panelIsPublic = panelDefault === 'public';
  return (checkboxEl?.checked ?? panelIsPublic) ? 'public' : 'private';
}

/**
 * Ensure a file input's accept attribute matches the panel config.
 * @param {HTMLInputElement|null} inputEl
 * @param {string} acceptStr
 */
export function syncInputAccept(inputEl, acceptStr) {
  try {
    if (inputEl && acceptStr) inputEl.setAttribute('accept', acceptStr);
  } catch {}
}

/**
 * Build a consistent storage path for uploads.
 * @param {'closet'|'voice'|'episodes'} panelId
 * @param {string} userId
 * @param {string} filename
 */
export function buildPath(panelId, userId, filename) {
  const safeName = (filename || 'unnamed').replace(/\s+/g, '_');
  return `${panelId}/${userId}/${Date.now()}_${safeName}`;
}

/**
 * Dispatch a standard "<panelId>:uploaded" event so dashboards can refresh.
 * @param {'closet'|'voice'|'episodes'} panelId
 * @param {{ id:string, path:string }} detail
 */
export function dispatchUploaded(panelId, detail) {
  try {
    document.dispatchEvent(new CustomEvent(`${panelId}:uploaded`, { detail }));
  } catch {}
}

/**
 * Small util to safely trim DOM values to empty string.
 * @param {HTMLElement|null} el
 */
export function safeValue(el) {
  return (el?.value ?? '').toString().trim();
}

// /js/panels/manage-panels.js
// Manages "Manage Upload Panels" UI — saves to Firestore with LS fallback.
// Aligns with panel_defs schema (id == slug).

import { db } from '/js/utils/firebase-client.js';
// @ts-ignore - CDN ESM types
import {
  collection,
  getDocs,
  deleteDoc,
  setDoc,
  getDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const COL = 'panel_defs';
const LS_KEY = 'customPanels_v2'; // bump key to avoid mixing with old schema

/** ---- LocalStorage helpers (fallback) ---- */
function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsWrite(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

/** ---- Utilities ---- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/** Slug from name (lowercase, hyphenated, alnum-only + dashes) */
function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `panel-${Date.now()}`;
}

/**
 * Infer sensible defaults based on accept/name.
 * - closet-like panels (image/*) default to public visibility (matches your seed)
 * - others default to private
 */
function inferDefaults({ name, accept }) {
  const slug = slugify(name);
  const isImage = (accept || '').includes('image');
  const defaultVisibility = isImage ? 'public' : 'private';
  const uiPrefix = `${slug}-`;
  const collectionName = slug; // keep simple: collection mirrors slug
  const partial = `/partials/${slug}-panel.html`;

  return {
    id: slug,                 // == Firestore doc id
    name: name,
    slug: slug,
    accept: accept || '*/*',
    collection: collectionName,
    uiPrefix,
    categoryPanelKey: slug,
    levels: 3,
    defaultVisibility,
    partial,
    enabled: true,
    schemaVersion: 1,
    order: Date.now(),        // simple ordering; you can later sort or edit
  };
}

/** ---- Data access ---- */
async function fetchPanels() {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return lsRead();
  }
}

/**
 * Create or upsert a panel by slug (id).
 * Prevents duplicates by slug.
 */
async function createPanel(payload) {
  const docRef = doc(db, COL, payload.id);
  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error('Panel with this slug already exists.');
    }
    await setDoc(docRef, payload);
    return payload;
  } catch (err) {
    // Fallback to LS with same schema
    const items = lsRead();
    if (items.some(p => p.id === payload.id)) {
      // collision in LS as well — suffix it
      payload.id = `${payload.id}-${Date.now()}`;
      payload.slug = payload.id;
      payload.uiPrefix = `${payload.slug}-`;
      payload.collection = payload.slug;
      payload.categoryPanelKey = payload.slug;
    }
    items.push(payload);
    lsWrite(items);
    return payload;
  }
}

async function removePanel(id) {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch {
    // If FS fails or offline, remove from LS
    const items = lsRead().filter(p => p.id !== id);
    lsWrite(items);
  }
}

/** ---- Render ---- */
function renderList(container, items, onDelete) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<p class="muted">No custom panels yet.</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'panel-items';
  items
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach(p => {
      const li = document.createElement('li');
      li.className = 'panel-item';
      li.innerHTML = `
        <div class="stack">
          <strong>${escapeHtml(p.name)}</strong>
          <div class="chips">
            <span class="chip">slug: ${escapeHtml(p.slug)}</span>
            <span class="chip">${escapeHtml(p.accept || '')}</span>
            <span class="chip">visibility: ${escapeHtml(p.defaultVisibility || '')}</span>
          </div>
        </div>
        <button type="button" data-id="${escapeHtml(p.id)}" class="danger small">Delete</button>
      `;
      ul.appendChild(li);
    });
  container.appendChild(ul);

  ul.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    onDelete(btn.getAttribute('data-id'));
  });
}

/** ---- Controller ---- */
export async function setupManagePanelsUI() {
  const form = document.getElementById('add-panel-form');
  const nameEl = document.getElementById('panel-name');
  const typeEl = document.getElementById('file-type');  // expects options like image/*, audio/*, video/*
  const listEl = document.getElementById('panel-list');

  if (!(form instanceof HTMLFormElement) ||
      !(nameEl instanceof HTMLInputElement) ||
      !(typeEl instanceof HTMLSelectElement) ||
      !(listEl instanceof HTMLElement)) {
    console.warn('[manage-panels] Missing required elements');
    return;
  }

  let items = await fetchPanels();

  const rerender = () => renderList(listEl, items, async (id) => {
    await removePanel(id);
    items = items.filter(p => p.id !== id);
    rerender();
  });

  rerender();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameEl.value.trim();
    const accept = typeEl.value;

    if (!name) { alert('Please enter a panel name.'); return; }

    // Prevent duplicate slugs (more robust than name-only)
    const slug = slugify(name);
    if (items.some(p => (p.slug || p.id) === slug)) {
      alert('A panel with that name (slug) already exists.');
      return;
    }

    const payload = inferDefaults({ name, accept });

    const created = await createPanel(payload);
    items.push(created);

    // Reset form and rerender
    nameEl.value = '';
    rerender();
  });
}

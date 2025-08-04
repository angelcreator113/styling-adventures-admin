// /js/panels/seed-panel-registry.js
import { db } from '/js/utils/firebase-client.js';
// @ts-ignore CDN ESM
import { collection, doc, setDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const COL = 'panel_defs';

const seed = [
  {
    id: 'closet',
    name: 'Closet',
    slug: 'closet',
    accept: 'image/*',
    collection: 'closet',
    uiPrefix: 'closet-',
    categoryPanelKey: 'closet',
    levels: 3,
    defaultVisibility: 'public',
    partial: '/partials/closet-panel.html',
    enabled: true,
    schemaVersion: 1,
    order: 1,
  },
  {
    id: 'voice',
    name: 'Voice',
    slug: 'voice',
    accept: 'audio/*',
    collection: 'voice',
    uiPrefix: 'voice-',
    categoryPanelKey: 'voice',
    levels: 3,
    defaultVisibility: 'private',
    partial: '/partials/voice-panel.html',
    enabled: true,
    schemaVersion: 1,
    order: 2,
  },
  {
    id: 'episodes',
    name: 'Episodes',
    slug: 'episodes',
    accept: 'video/*',
    collection: 'episodes',
    uiPrefix: 'episode-',
    categoryPanelKey: 'episodes',
    levels: 3,
    defaultVisibility: 'private',
    partial: '/partials/episodes-panel.html',
    enabled: true,
    schemaVersion: 1,
    order: 3,
  },
];

export async function seedPanelRegistry() {
  // Idempotent: only writes missing docs
  const existing = await getDocs(query(collection(db, COL), where('schemaVersion', '>=', 1)));
  const have = new Set(existing.docs.map(d => d.id));
  await Promise.all(seed.map(async d => {
    if (!have.has(d.id)) await setDoc(doc(db, COL, d.id), d);
  }));
  return { ok: true, created: seed.filter(d => !have.has(d.id)).map(d => d.id) };
}

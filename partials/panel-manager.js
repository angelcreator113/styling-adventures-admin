import { ready, auth } from '/js/utils/firebase-client.js';
import { createUploadUI } from '/js/uploads/upload-factory.js';
// @ts-ignore CDN ESM
import {
  collection, getDocs, query, where, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from '/js/utils/firebase-client.js';
import { initDragDropUploadDynamic } from '/js/components/dragdrop.js';
import { initSmartDropdownAll } from '/js/components/smart-dropdown.js';

const wrapper = document.getElementById('panel-wrapper');
if (!wrapper) throw new Error('[panel-manager] ❌ #panel-wrapper not found in DOM.');

const tabBar = document.querySelector('.tab-buttons');
if (!tabBar) throw new Error('[panel-manager] ❌ .tab-buttons container not found.');

async function fetchPanelDefs() {
  try {
    const q = query(
      collection(db, 'panel_defs'),
      where('enabled', '==', true),
      orderBy('order')
    );
    const snap = await getDocs(q);
    const defs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (defs.length) {
      console.info(`[panel-manager] ✅ Loaded ${defs.length} panel definitions from Firestore.`);
      return defs;
    }
    console.warn('[panel-manager] ⚠️ No panel_defs found in Firestore. Falling back...');
  } catch (e) {
    console.warn('[panel-manager] ⚠️ Failed to fetch from Firestore, using fallback.', e);
  }

  return [
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
      order: 1
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
      order: 2
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
      order: 3
    }
  ];
}

function makeTabButton(def, isActive) {
  const btn = document.createElement('button');
  btn.className = 'tab-button' + (isActive ? ' active' : '');
  btn.dataset.panel = `${def.slug}-panel`;
  btn.textContent = def.name;
  return btn;
}

async function injectPanel(def, isActive) {
  try {
    const res = await fetch(def.partial);
    const html = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();

    const el = tmp.firstElementChild;
    if (!el) throw new Error(`[panel-manager] Failed to parse panel: ${def.slug}`);

    el.id = `${def.slug}-panel`;
    el.classList.add('panel');
    if (isActive) el.classList.add('active');

    el.setAttribute('role', 'tabpanel');
    el.setAttribute('aria-labelledby', `${def.slug}-tab`);

    wrapper.appendChild(el);
    await createUploadUI(def);
    await new Promise(r => requestAnimationFrame(r));

    console.log(`[panel-manager] 📦 Initializing drag/drop and dropdowns for ${def.slug}`);
    console.log('⛓️ DropArea:', document.getElementById(`${def.uiPrefix}drop-area`));
    console.log('📁 FileInput:', document.getElementById(`${def.uiPrefix}file-input`));
    console.log('📂 Category:', document.getElementById(`${def.uiPrefix}category`));

    initDragDropUploadDynamic([
      {
        inputId: `${def.uiPrefix}file-input`,
        dropAreaId: `${def.uiPrefix}drop-area`,
        options: {
          acceptedTypes: [def.accept]
        }
      }
    ]);

    initSmartDropdownAll({ panelId: el.id });

    console.info(`[panel-manager] ✅ Injected + initialized panel: ${def.slug}`);
    return el;
  } catch (err) {
    console.error(`[panel-manager] ❌ Failed to load panel: ${def.slug}`, err);
  }
}

async function main() {
  await ready();

  const defs = await fetchPanelDefs();
  tabBar.innerHTML = '';
  defs.forEach((def, idx) => tabBar.appendChild(makeTabButton(def, idx === 0)));

  await defs.reduce(async (p, def, idx) => {
    await p;
    return injectPanel(def, idx === 0);
  }, Promise.resolve());

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.dataset.panel;
      document.querySelectorAll('.panel').forEach(p => {
        p.classList.toggle('active', p.id === targetId);
      });
    });
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', main, { once: true })
  : main();

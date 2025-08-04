// server.js
require('dotenv').config();
console.log("🔥 server.js started");

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors'); // NEW

const log  = (...a) => console.log('[server]', ...a);
const warn = (...a) => console.warn('[server][WARN]', ...a);
const errl = (...a) => console.error('[server][ERROR]', ...a);

// ----------------------- ENV -----------------------
const PORT   = Number(process.env.PORT) || 3000;
// Bind to 127.0.0.1 by default (more predictable on Windows).
const HOST   = process.env.HOST || '127.0.0.1';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'styling-admin.appspot.com';
const ADC    = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const SA_B64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '';
const BYPASS = String(process.env.FIREBASE_ADMIN_BYPASS || '').toLowerCase() === 'true';

log('Node version  =', process.version);
log('NODE_ENV      =', process.env.NODE_ENV || 'development');
log('HOST          =', HOST);
log('PORT          =', PORT);
log('Bucket        =', BUCKET);
log('Admin BYPASS  =', BYPASS);
log('ADC path      =', ADC || '(unset)');

// -------------------- EXPRESS ---------------------
const app = express();
app.disable('x-powered-by');

// CORS for local Vite dev (with credentials)  // NEW
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']; // NEW
app.use(cors({ origin: allowedOrigins, credentials: true })); // NEW
app.options('*', cors({ origin: allowedOrigins, credentials: true })); // NEW (preflight)

app.use(express.json());

// Health is always available
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));

// ---- Protected routes (requires ./server/auth) ---- // NEW
const { authenticate, requireAdmin } = require('./server/auth'); // NEW
app.get('/admin/ping', authenticate, requireAdmin, (req, res) => { // NEW
  return res.json({ ok: true, uid: req.user.uid }); // NEW
}); // NEW

// Placeholders that depend on Firebase Admin
let admin = null;
let db = null;
let storage = null;

app.get('/smoke/firestore', async (_req, res) => {
  if (!db) return res.status(503).json({ ok: false, error: 'Admin not initialized yet' });
  try {
    const ref = db.collection('smoke').doc('ping');
    await ref.set({ now: Date.now() }, { merge: true });
    const snap = await ref.get();
    res.json({ ok: true, data: snap.data() });
  } catch (e) {
    errl('[smoke/firestore]', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/smoke/storage', async (_req, res) => {
  if (!storage) return res.status(503).json({ ok: false, error: 'Admin not initialized yet' });
  try {
    const [meta] = await storage.getMetadata();
    res.json({
      ok: true,
      bucket: storage.name,
      location: meta.location,
      storageClass: meta.storageClass,
    });
  } catch (e) {
    errl('[smoke/storage]', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Global noise
process.on('uncaughtException', (e) => errl('[UNCAUGHT]', e));
process.on('unhandledRejection', (r) => errl('[UNHANDLED]', r));

// ----------------- START LISTENING ----------------
log('Binding server…');
const server = app
  .listen(PORT, HOST, () => {
    const addr = server.address();
    log('Bound:', addr);
    const base = `http://${HOST}:${PORT}`;
    log('Health:', `${base}/health`);
    log('Firestore smoke:', `${base}/smoke/firestore`);
    log('Storage  smoke:', `${base}/smoke/storage`);
    log('Admin ping:', `${base}/admin/ping`); // NEW
  })
  .on('error', (e) => errl('[LISTEN ERROR]', e));

// ------------- ADMIN INIT (NON-BLOCKING) ----------
async function initAdmin() {
  const t0 = Date.now();

  try {
    if (BYPASS) {
      warn('FIREBASE_ADMIN_BYPASS=true → skipping Admin init');
      return;
    }

    admin = require('firebase-admin');

    if (ADC) {
      // Initialize using GOOGLE_APPLICATION_CREDENTIALS file
      const abs = path.isAbsolute(ADC) ? ADC : path.join(process.cwd(), ADC);
      const exists = fs.existsSync(abs);
      log('ADC exists?', exists, '→', abs);
      if (!exists) throw new Error(`Service account file not found at: ${abs}`);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: BUCKET,
        });
        log('Admin initialized with applicationDefault()');
      }
    } else if (SA_B64) {
      // Initialize from base64 JSON in env
      const json = JSON.parse(Buffer.from(SA_B64, 'base64').toString('utf8'));
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(json),
          storageBucket: BUCKET,
        });
        log('Admin initialized with FIREBASE_SERVICE_ACCOUNT_B64');
      }
    } else {
      throw new Error('Missing creds: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_B64');
    }

    db = admin.firestore();
    storage = admin.storage().bucket();

    log(`Firebase Admin READY in ${Date.now() - t0}ms`);
  } catch (e) {
    errl('[ADMIN INIT]', e);
  }
}

// Kick off without blocking the listener
initAdmin();

// Watchdog: keep you informed for ~10s
let ticks = 0;
const watch = setInterval(() => {
  ticks++;
  if (db && storage) {
    log('Admin status: READY');
    clearInterval(watch);
  } else {
    log(`Admin status: NOT READY (t=${ticks * 2}s)`);
    if (ticks >= 5) {
      warn('Admin still not ready after ~10s — check credentials/network.');
      clearInterval(watch);
    }
  }
}, 2000);

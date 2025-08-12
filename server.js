require('dotenv').config();
console.log("🔥 server.js started");

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// --- Logging ---
const log  = (...a) => console.log('[server]', ...a);
const warn = (...a) => console.warn('[server][WARN]', ...a);
const errl = (...a) => console.error('[server][ERROR]', ...a);

// --- ENV ---
const PORT   = Number(process.env.PORT) || 3000;
const HOST   = process.env.HOST || '127.0.0.1';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'styling-admin.appspot.com';
const ADC    = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
const SA_B64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '';
const BYPASS = String(process.env.FIREBASE_ADMIN_BYPASS || '').toLowerCase() === 'true';

// --- Express Setup ---
const app = express();
app.disable('x-powered-by');
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// --- Health Route ---
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));

// --- Firebase Admin Globals ---
let admin = null;
let db = null;
let storage = null;

// --- Auth Middleware ---
const { authenticate, requireAdmin } = require('./src/server/auth');

// --- Init Firebase Admin ---
async function initAdmin() {
  const t0 = Date.now();
  try {
    if (BYPASS) {
      warn('FIREBASE_ADMIN_BYPASS=true → skipping Admin init');
      return;
    }

    admin = require('firebase-admin');

    if (ADC) {
      const abs = path.isAbsolute(ADC) ? ADC : path.join(process.cwd(), ADC);
      if (!fs.existsSync(abs)) throw new Error(`Service account file not found: ${abs}`);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: BUCKET,
        });
        log('Admin initialized with applicationDefault()');
      }
    } else if (SA_B64) {
      const json = JSON.parse(Buffer.from(SA_B64, 'base64').toString('utf8'));
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(json),
          storageBucket: BUCKET,
        });
        log('Admin initialized with FIREBASE_SERVICE_ACCOUNT_B64');
      }
    } else {
      throw new Error('Missing credentials: set ADC or SA_B64');
    }

    db = admin.firestore();
    storage = admin.storage().bucket();

    // Make available globally
    global.admin = admin;
    log(`Firebase Admin READY in ${Date.now() - t0}ms`);
  } catch (e) {
    errl('[ADMIN INIT]', e);
  }
}
initAdmin();

// --- Routes ---
app.get('/admin/ping', authenticate, requireAdmin, (req, res) => {
  return res.json({ ok: true, uid: req.user.uid });
});

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

// --- Session Handlers ---
try {
  const sessionLogin = require('./src/server/handlers/sessionLogin');
  const sessionLogout = require('./src/server/handlers/sessionLogout');
  app.post('/sessionLogin', sessionLogin);
  app.post('/sessionLogout', sessionLogout);
} catch (e) {
  errl('Error registering session handlers:', e);
}

// --- Error Watch ---
process.on('uncaughtException', (e) => errl('[UNCAUGHT]', e));
process.on('unhandledRejection', (r) => errl('[UNHANDLED]', r));

// --- Launch Server ---
log('Binding server...');
const server = app
  .listen(PORT, HOST, () => {
    const base = `http://${HOST}:${PORT}`;
    log('Health:', `${base}/health`);
    log('Firestore smoke:', `${base}/smoke/firestore`);
    log('Storage  smoke:', `${base}/smoke/storage`);
    log('Admin ping:', `${base}/admin/ping`);
    log('Session login:', `${base}/sessionLogin`);
    log('Session logout:', `${base}/sessionLogout`);
  })
  .on('error', (e) => errl('[LISTEN ERROR]', e));

// --- Watchdog ---
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

// firebase-config.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Prevent double init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'styling-admin.firebasestorage.app'
  });
}

const db = admin.firestore();
const storage = admin.storage().bucket();

module.exports = { admin, db, storage };

// ⚠️ Server-side use only. Do NOT import this in client scripts.

/* eslint-disable max-len, valid-jsdoc, require-jsdoc, comma-dangle, indent, arrow-parens */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

function digestPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function assertAdmin(context) {
  const t = (context.auth && context.auth.token) || {};
  if (!context.auth || !(t.role === 'admin' || t.admin === true)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
}

// Set/rotate an admin PIN (super-admins with scope can set others)
exports.adminSetPin = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const actor = context.auth.uid;
  const { targetUid, pin, ttlHours = 24 } = data || {};
  if (!pin || !/^\d{6,8}$/.test(String(pin))) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be 6–8 digits.');
  }

  const actorToken = context.auth.token || {};
  const canManageOthers = actorToken.adminScopes && actorToken.adminScopes['admins.manage'] === true;
  const uid = targetUid && canManageOthers ? targetUid : actor;

  const pinDigest = digestPin(pin);
  const uniqId = crypto.createHash('sha256').update(pinDigest).digest('hex').slice(0, 24);

  const userRef = db.collection('adminPins').doc(uid);
  const uniqRef = db.collection('adminPinUniq').doc(uniqId);

  await db.runTransaction(async (tx) => {
    const uniqSnap = await tx.get(uniqRef);
    if (uniqSnap.exists && uniqSnap.data() && uniqSnap.data().uid !== uid) {
      throw new functions.https.HttpsError('already-exists', 'PIN already in use.');
    }

    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + ttlHours * 3600 * 1000));

    tx.set(
      userRef,
      {
        pinDigest,
        pinUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        updatedBy: actor
      },
      { merge: true }
    );

    tx.set(
      uniqRef,
      {
        uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  await db.collection('adminPinAudit').add({
    action: 'setPin',
    actor,
    target: uid,
    at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

// Verify a PIN and return a short-lived sessionUntil (ms since epoch)
exports.adminVerifyPin = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const uid = context.auth.uid;
  const { pin } = data || {};
  if (!pin || !/^\d{6,8}$/.test(String(pin))) {
    throw new functions.https.HttpsError('invalid-argument', 'Bad PIN.');
  }

  // rate limit
  const failRef = db.collection('adminPinFails').doc(uid);
  const failSnap = await failRef.get();
  const now = Date.now();
  const fails = (failSnap.exists ? failSnap.data().fails : []) || [];
  const recent = fails.filter((ts) => now - ts < 10 * 60 * 1000);
  if (recent.length >= 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many attempts. Try later.');
  }

  const pinRef = db.collection('adminPins').doc(uid);
  const pinSnap = await pinRef.get();
  if (!pinSnap.exists) throw new functions.https.HttpsError('not-found', 'No PIN set.');

  const dataDoc = pinSnap.data() || {};
  const pinDigest = dataDoc.pinDigest;
  const expiresAt = dataDoc.expiresAt;

  if (expiresAt && expiresAt.toMillis() < now) {
    throw new functions.https.HttpsError('failed-precondition', 'PIN expired.');
  }

  const ok =
    pinDigest &&
    crypto.timingSafeEqual(Buffer.from(pinDigest, 'hex'), Buffer.from(digestPin(pin), 'hex'));

  if (!ok) {
    await failRef.set({ fails: [...recent, now] }, { merge: true });
    await db.collection('adminPinAudit').add({
      action: 'verifyPinFail',
      actor: uid,
      at: admin.firestore.FieldValue.serverTimestamp()
    });
    throw new functions.https.HttpsError('unauthenticated', 'Incorrect PIN.');
  }

  await failRef.delete().catch(() => {});
  const sessionUntil = Date.now() + 2 * 60 * 60 * 1000; // 2h

  await db.collection('adminPinAudit').add({
    action: 'verifyPinOk',
    actor: uid,
    until: sessionUntil,
    at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true, sessionUntil };
});

exports.adminExpireSession = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const uid = context.auth.uid;
  await db.collection('adminPinAudit').add({
    action: 'expireSession',
    actor: uid,
    at: admin.firestore.FieldValue.serverTimestamp()
  });
  return { ok: true };
});

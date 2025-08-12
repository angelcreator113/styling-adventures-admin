// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.processNewUser = functions.auth.user().onCreate(async (user) => {
  const { uid, email } = user;

  // 1️⃣ Assign admin claim (or default roles)
  await admin.auth().setCustomUserClaims(uid, { admin: true });

  // 2️⃣ Create a user document in Firestore
  const firestore = admin.firestore();
  await firestore.collection('users').doc(uid).set({
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isAdmin: true,
  });

  console.log(`User ${uid} initialized with admin claim and profile doc.`);
});

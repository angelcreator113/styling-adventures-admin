// grantAdmin.js
// Node.js script to set Firebase Admin custom claim for a user

const admin = require('firebase-admin');
const path = require('path');

// 1️⃣ Load service account key
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// 2️⃣ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 3️⃣ Grant admin rights to a user
async function grantAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin claim set for user: ${uid}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  }
}

// 🔹 Replace with your Firebase Auth user's UID
const USER_UID = '6DLGwbk5TMMSFwoo87lSTGniRAt1';
grantAdmin(USER_UID);

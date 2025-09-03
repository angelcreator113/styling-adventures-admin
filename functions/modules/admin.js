// modules/admin.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { requireAdmin } = require("../utils/common");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const ENABLE_DEV_ADMIN = process.env.ENABLE_DEV_ADMIN === "true";

const out = {};

// Dev: auto-admin new users
if (ENABLE_DEV_ADMIN) {
  out.processNewUser = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email || "";
    await admin.auth().setCustomUserClaims(uid, { admin: true, role: "admin" });
    await db
      .collection("users")
      .doc(uid)
      .set(
        { email, createdAt: FieldValue.serverTimestamp(), isAdmin: true, role: "admin" },
        { merge: true },
      );
  });
}

// Set role
out.setUserRole = functions.region("us-central1").https.onCall(async (data, context) => {
  requireAdmin(context);

  const VALID = new Set(["fan", "creator", "admin"]);
  const email = String(data?.email || "")
    .trim()
    .toLowerCase();
  const role = String(data?.role || "");
  const spacesCap = data?.spacesCap === undefined ? undefined : Number(data.spacesCap);
  if (!email || !VALID.has(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid email or role");
  }
  if (
    role === "creator" &&
    spacesCap !== undefined &&
    (!Number.isFinite(spacesCap) || spacesCap < 0)
  ) {
    throw new functions.https.HttpsError("invalid-argument", "spacesCap must be >= 0");
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (_) {
    throw new functions.https.HttpsError("not-found", "User not found");
  }

  const nextClaims = { ...(userRecord.customClaims || {}), role };
  if (role === "admin") nextClaims.admin = true;
  else if ("admin" in nextClaims) delete nextClaims.admin;

  await admin.auth().setCustomUserClaims(userRecord.uid, nextClaims);
  await db
    .doc(`users/${userRecord.uid}`)
    .set(
      { role, isAdmin: role === "admin", updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  if (role === "creator" && spacesCap !== undefined) {
    await db.doc(`users/${userRecord.uid}/settings/profile`).set({ spacesCap }, { merge: true });
  }
  return { ok: true, uid: userRecord.uid, role, spacesCap: spacesCap ?? null };
});

module.exports = out;

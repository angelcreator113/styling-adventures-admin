// scripts/seed-grant-catalog.js
// Node 18+
// Usage:
//   node scripts/seed-grant-catalog.js
// or with a base64 service account:
//   FIREBASE_SERVICE_ACCOUNT_B64=... node scripts/seed-grant-catalog.js

require("dotenv").config();
const admin = require("firebase-admin");

(function init() {
  if (admin.apps.length) return;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    admin.initializeApp({ credential: admin.credential.cert(json) });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
})();

const db = admin.firestore();

/** Minimal catalog. Expand freely as you add features. */
const CATALOG = [
  // Users
  key("users.view",        "Users",     "View users"),
  key("users.delete",      "Users",     "Delete users"),
  key("users.ban",         "Users",     "Ban users"),
  key("users.mute",        "Users",     "Mute users"),
  key("roles.manage",      "Users",     "Manage user roles/claims"),
  key("roles.define",      "Users",     "Edit Admin Role Definitions"),

  // Content
  key("content.write",     "Content",   "Create & update content"),
  key("content.delete",    "Content",   "Delete content"),
  key("content.publish",   "Content",   "Publish/archive content"),
  key("content.readall",   "Content",   "Read all content"),

  // Community
  key("comments.moderate", "Community", "Moderate comments"),

  // Boards / Themes
  key("boards.analytics",  "Boards",    "Boards analytics"),
  key("themes.curate",     "Themes",    "Curate public themes"),
  key("themes.manage",     "Themes",    "Manage theme library"),

  // Partners / Finance
  key("partners.manage",   "Partners",  "Manage partners & collabs"),
  key("finance.manage",    "Finance",   "Refunds/payouts/invoices"),

  // Analytics / Admin
  key("analytics.full",    "Analytics", "Advanced analytics"),
  key("admin.metrics",     "System",    "Read/write admin metrics"),
];

function key(k, category, label, description = "") {
  return { key: k, category, label, description };
}

async function main() {
  const col = db.collection("adminGrantCatalog");
  for (const item of CATALOG) {
    const { key, ...rest } = item;
    await col.doc(key).set({ key, ...rest, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    console.log("✅ seeded", key);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

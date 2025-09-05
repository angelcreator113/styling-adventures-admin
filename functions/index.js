/* functions/index.js
 * Runtime: Node 20, Firebase Functions v2
 */
"use strict";

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // ✅ robust import
const crypto = require("crypto");

// ---------------------------------------------------------------------------
// Admin init
// ---------------------------------------------------------------------------
try {
  admin.app();
} catch (_e) {
  admin.initializeApp();
  logger.info("Admin initialized");
}

const auth = admin.auth();
const db = admin.firestore();

// Server timestamp helper — always use Firestore server sentinel
const sv = () => FieldValue.serverTimestamp();

// ---------------------------------------------------------------------------
// ENV (email/SMS providers optional; no-op if missing)
// ---------------------------------------------------------------------------
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:5173";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";

/** Lazy clients (avoid cold start cost). */
let _sgMail = null;
let _twilio = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/* Normalize an email (trim + lowercase). */
function cleanEmail(s = "") {
  return String(s).trim().toLowerCase();
}

/* Check for non-negative number. */
function isNonNegNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) && n >= 0;
}

/* Ensure user exists on callable context. */
function requireUser(ctx) {
  const u = ctx && ctx.auth;
  if (!u || !u.uid) throw new HttpsError("unauthenticated", "Sign in required.");
  return u;
}

/* Ensure admin. */
function requireAdmin(ctx) {
  const u = requireUser(ctx);
  const ok = u.token && (u.token.admin === true || u.token.role === "admin");
  if (!ok) throw new HttpsError("permission-denied", "Admins only.");
  return u;
}

/* Ensure super admin (must include 'superAdmin' in adminRoles). */
function requireSuperAdmin(ctx) {
  const u = requireUser(ctx);
  const arr = u.token && u.token.adminRoles;
  const ok = Array.isArray(arr) && arr.includes("superAdmin");
  if (!ok) throw new HttpsError("permission-denied", "Super Admin only.");
  return u;
}

/* Create small hex id. */
function shortId(n = 8) {
  return crypto.randomBytes(Math.ceil(n / 2)).toString("hex").slice(0, n);
}

/** Whether to precompute scopes from role defs. */
const MATERIALIZE_SCOPES = false;

/* Build admin scopes from saved Role Definitions. */
async function buildScopesFromRoles(adminRoles) {
  const roles = Array.isArray(adminRoles) ? adminRoles : [];
  const scopes = {};
  for (const id of roles) {
    const snap = await db.doc(`adminRoleDefs/${id}`).get();
    if (!snap.exists) continue;
    const grants = (snap.data() || {}).grants || {};
    Object.entries(grants).forEach(([k, v]) => {
      if (v === true) scopes[k] = true;
    });
  }
  return scopes;
}

/* Send email invite via SendGrid (dry-run if not configured). */
async function sendEmailInvite(p) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    logger.info("[email] (dry-run)", p);
    return;
  }
  if (!_sgMail) {
    _sgMail = require("@sendgrid/mail"); // eslint-disable-line global-require
    _sgMail.setApiKey(SENDGRID_API_KEY);
  }
  const subject = "You're invited to SAOLL";
  const adminRoles =
    Array.isArray(p.adminRoles) && p.adminRoles.length > 0? `<p>Admin sub-roles: <code>${p.adminRoles.join(", ")}</code></p>`: "";
  const role = p.role ? ` as <b>${p.role}</b>` : "";
  const html = `<p>Hi! You've been invited to SAOLL${role}.</p>${adminRoles}<p>Accept your invite: <a href="${p.url}">${p.url}</a></p>`;
  await _sgMail.send({ to: p.to, from: SENDGRID_FROM_EMAIL, subject, html });
}

/* Send SMS invite via Twilio (dry-run if not configured). */
async function sendSmsInvite(p) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    logger.info("[sms] (dry-run)", p);
    return;
  }
  if (!_twilio) {
    _twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); // eslint-disable-line global-require
  }
  await _twilio.messages.create({
    body: `You're invited to SAOLL. Accept: ${p.url}`,
    from: TWILIO_FROM_NUMBER,
    to: p.to,
  });
}

/* Build public invite URL. */
function inviteUrl(code) {
  const u = new URL("/accept-invite", APP_ORIGIN);
  u.searchParams.set("code", code);
  return u.toString();
}

/* Minimal CORS for acceptInvite. Returns true if OPTIONS handled. */
function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Health / Debug
// ---------------------------------------------------------------------------

/** Liveness. */
exports.ping = onRequest((_req, res) => {
  res.json({ ok: true, now: Date.now() });
});

/** Who am I (callable). */
exports.whoAmI = onCall((ctx) => {
  const u = requireUser(ctx);
  return {
    uid: u.uid,
    email: (u.token && u.token.email) || null,
    role: (u.token && (u.token.role || (u.token.admin ? "admin" : "fan"))) || "fan",
    admin: !!(u.token && u.token.admin),
    adminRoles: (u.token && u.token.adminRoles) || [],
  };
});

// ---------------------------------------------------------------------------
// Admin: roles + lookups
// ---------------------------------------------------------------------------

/** Lookup user by email (admin). */
exports.lookupUserByEmail = onCall(async (ctx) => {
  requireAdmin(ctx);
  const email = cleanEmail(ctx.data && ctx.data.email);
  if (!email) throw new HttpsError("invalid-argument", "email required");
  try {
    const u = await auth.getUserByEmail(email);
    return { found: true, uid: u.uid, email: u.email, claims: u.customClaims || {} };
  } catch (_e) {
    logger.debug("lookupUserByEmail not found", { email });
    return { found: false };
  }
});

/** Set a user's base role. */
exports.setUserRole = onCall({ region: "us-central1" }, async (ctx) => {
  requireAdmin(ctx);
  const email = cleanEmail(ctx.data && ctx.data.email);
  const role = String((ctx.data && ctx.data.role) || "").trim().toLowerCase();
  const spacesCap = ctx.data && ctx.data.spacesCap;
  const requestedAdminRoles = ctx.data && ctx.data.adminRoles;

  if (!email || !["fan", "creator", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "email + role (fan|creator|admin) required");
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (_e) {
    logger.debug("setUserRole user not found", { email });
    throw new HttpsError("not-found", "User not found.");
  }

  const current = userRecord.customClaims || {};
  const next = { ...current, role };

  if (role === "admin") {
    next.admin = true;
    if (requestedAdminRoles != null) {
      requireSuperAdmin(ctx);
      const arr = Array.isArray(requestedAdminRoles)? requestedAdminRoles.map((s) => String(s).trim()).filter(Boolean): [];
      next.adminRoles = Array.from(new Set(arr));
    } else if (!Array.isArray(next.adminRoles)) {
      next.adminRoles = [];
    }
    if (MATERIALIZE_SCOPES) next.adminScopes = await buildScopesFromRoles(next.adminRoles);
  } else {
    delete next.admin;
    delete next.adminRoles;
    if (MATERIALIZE_SCOPES) delete next.adminScopes;
  }

  await auth.setCustomUserClaims(userRecord.uid, next);

  if (role === "creator" && isNonNegNumber(spacesCap)) {
    await db.doc(`users/${userRecord.uid}/settings/profile`).set(
      { spacesCap: Number(spacesCap) },
      { merge: true }
    );
  }

  return {
    ok: true,
    uid: userRecord.uid,
    claims: { role: next.role, admin: !!next.admin, adminRoles: next.adminRoles || [] },
  };
});

/** Super-admin only: set admin sub-roles. */
exports.setAdminRoles = onCall({ region: "us-central1" }, async (ctx) => {
  requireSuperAdmin(ctx);
  const email = cleanEmail(ctx.data && ctx.data.email);
  const incoming = Array.isArray(ctx.data && ctx.data.adminRoles)? ctx.data.adminRoles.map((x) => String(x).trim()).filter(Boolean): [];
  if (!email) throw new HttpsError("invalid-argument", "email required");

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (_e) {
    logger.debug("setAdminRoles user not found", { email });
    throw new HttpsError("not-found", "User not found.");
  }

  const next = {
    ...(userRecord.customClaims || {}),
    role: "admin",
    admin: true,
    adminRoles: Array.from(new Set(incoming)),
  };
  if (MATERIALIZE_SCOPES) next.adminScopes = await buildScopesFromRoles(next.adminRoles);

  await auth.setCustomUserClaims(userRecord.uid, next);
  return { ok: true, uid: userRecord.uid, adminRoles: next.adminRoles };
});

// ---------------------------------------------------------------------------
// Invites: create/assign + resend + revoke + bulk
// ---------------------------------------------------------------------------

/** Invite or assign a user. */
exports.inviteOrAssignUser = onCall(async (ctx) => {
  requireAdmin(ctx);
  const email = cleanEmail(ctx.data && ctx.data.email);
  const role = String((ctx.data && ctx.data.role) || "").trim().toLowerCase();
  const adminRoles = Array.isArray(ctx.data && ctx.data.adminRoles)? ctx.data.adminRoles.map((s) => String(s).trim()).filter(Boolean): [];
  const spacesCap = ctx.data && ctx.data.spacesCap;
  const createIfMissing = !!(ctx.data && ctx.data.createIfMissing);
  const sendInvite = !!(ctx.data && ctx.data.sendInvite);

  if (!email || !["fan", "creator", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "email + role required");
  }

  let userRecord = null;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (_e) {
    logger.debug("inviteOrAssignUser no existing user", { email });
  }

  if (userRecord) {
    if (role === "admin" && adminRoles.length > 0) requireSuperAdmin(ctx);
    const next = { ...(userRecord.customClaims || {}), role, admin: role === "admin" };
    if (role === "admin") next.adminRoles = adminRoles;
    else delete next.adminRoles;
    if (!next.admin) delete next.admin;
    if (MATERIALIZE_SCOPES && next.admin) next.adminScopes = await buildScopesFromRoles(next.adminRoles || []);
    if (MATERIALIZE_SCOPES && !next.admin) delete next.adminScopes;

    await auth.setCustomUserClaims(userRecord.uid, next);
    if (role === "creator" && isNonNegNumber(spacesCap)) {
      await db.doc(`users/${userRecord.uid}/settings/profile`).set(
        { spacesCap: Number(spacesCap) },
        { merge: true }
      );
    }
    return { ok: true, uid: userRecord.uid, created: false, claims: next };
  }

  if (!createIfMissing) {
    throw new HttpsError("failed-precondition", "User not found; set createIfMissing to invite.");
  }
  if (role === "admin" && adminRoles.length > 0) requireSuperAdmin(ctx);

  const code = shortId(8);
  const ref = db.collection("admin").doc("invites").collection("items").doc();
  const invite = {
    email,
    role,
    adminRoles,
    spacesCap: isNonNegNumber(spacesCap) ? Number(spacesCap) : null,
    status: "pending",
    code,
    shortId: code,
    createdAt: sv(),
    lastSentAt: null,
    createdBy: ctx.auth.uid,
  };
  await ref.set(invite);

  if (sendInvite) {
    const url = inviteUrl(code);
    try {
      await sendEmailInvite({ to: email, url, role, adminRoles });
    } catch (e) {
      logger.error("sendEmail failed", e);
    }
    await ref.update({ lastSentAt: sv() });
  }

  return { ok: true, uid: null, created: true, inviteId: ref.id, code };
});

/** Resend a single invite by id. */
exports.resendInvite = onCall(async (ctx) => {
  requireAdmin(ctx);
  const inviteId = String((ctx.data && ctx.data.inviteId) || "");
  if (!inviteId) throw new HttpsError("invalid-argument", "inviteId required");

  const ref = db.collection("admin").doc("invites").collection("items").doc(inviteId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Invite not found");
  const inv = snap.data();
  if (inv.status !== "pending") throw new HttpsError("failed-precondition", "Invite not pending");

  const url = inviteUrl(inv.code);
  try {
    if (inv.email) await sendEmailInvite({ to: inv.email, url, role: inv.role, adminRoles: inv.adminRoles });
    if (inv.phone) await sendSmsInvite({ to: inv.phone, url });
  } catch (e) {
    logger.error("resendInvite failed", e);
  }

  await ref.update({ lastSentAt: sv() });
  return { ok: true };
});

/** Revoke a pending invite. */
exports.revokeInvite = onCall(async (ctx) => {
  requireAdmin(ctx);
  const inviteId = String((ctx.data && ctx.data.inviteId) || "");
  if (!inviteId) throw new HttpsError("invalid-argument", "inviteId required");

  const ref = db.collection("admin").doc("invites").collection("items").doc(inviteId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Invite not found");
  const inv = snap.data();
  if (inv.status !== "pending") return { ok: true };

  await ref.update({ status: "revoked", revokedAt: sv() });
  return { ok: true };
});

/** Bulk resend stale invites older than N minutes. */
exports.bulkResendStaleInvites = onCall(async (ctx) => {
  requireAdmin(ctx);
  const minAgeMinutes = Number((ctx.data && ctx.data.minAgeMinutes) || 60 * 24);
  const cutoff = Date.now() - minAgeMinutes * 60 * 1000;

  const col = db.collection("admin").doc("invites").collection("items");
  const snap = await col.where("status", "==", "pending").get();

  let count = 0;
  for (const d of snap.docs) {
    const inv = d.data();
    const last = (inv.lastSentAt && inv.lastSentAt.toMillis && inv.lastSentAt.toMillis()) || 0;
    if (last && last > cutoff) continue;

    const url = inviteUrl(inv.code);
    try {
      if (inv.email) await sendEmailInvite({ to: inv.email, url, role: inv.role, adminRoles: inv.adminRoles });
      if (inv.phone) await sendSmsInvite({ to: inv.phone, url });
      await d.ref.update({ lastSentAt: sv() });
      count += 1;
    } catch (e) {
      logger.error("bulkResend failed", e);
    }
  }
  return { ok: true, count };
});

// ---------------------------------------------------------------------------
// Public Accept endpoint (HTTP)
// ---------------------------------------------------------------------------

/** Accept an invite: POST { code } -> { customToken } */
exports.acceptInvite = onRequest(async (req, res) => {
  try {
    if (applyCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "POST only" });
      return;
    }

    const body = req.body || {};
    const code = String((body && body.code) || (req.query && req.query.code) || "").trim();
    if (!code) {
      res.status(400).json({ error: "code required" });
      return;
    }

    const q = await db
      .collection("admin")
      .doc("invites")
      .collection("items")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (q.empty) {
      res.status(404).json({ error: "Invalid or expired invite" });
      return;
    }

    const docSnap = q.docs[0];
    const inv = docSnap.data();
    if (inv.status !== "pending") {
      res.status(409).json({ error: "Invite not pending" });
      return;
    }

    // Ensure/create user
    let userRecord = null;
    if (inv.email) {
      try {
        userRecord = await auth.getUserByEmail(inv.email);
      } catch (_e) {
        logger.debug("acceptInvite: email not found, creating", { email: inv.email });
      }
      if (!userRecord) userRecord = await auth.createUser({ email: inv.email, emailVerified: false });
    } else if (inv.phone) {
      try {
        userRecord = await auth.getUserByPhoneNumber(inv.phone);
      } catch (_e) {
        logger.debug("acceptInvite: phone not found, creating", { phone: inv.phone });
      }
      if (!userRecord) userRecord = await auth.createUser({ phoneNumber: inv.phone });
    } else {
      res.status(400).json({ error: "Invite missing recipient" });
      return;
    }

    // Claims
    const nextClaims = { role: inv.role || "fan" };
    if (inv.role === "admin") {
      nextClaims.admin = true;
      nextClaims.adminRoles = Array.isArray(inv.adminRoles) ? inv.adminRoles : [];
      if (MATERIALIZE_SCOPES) nextClaims.adminScopes = await buildScopesFromRoles(nextClaims.adminRoles);
    }
    await auth.setCustomUserClaims(userRecord.uid, nextClaims);

    // Creator metadata
    if (inv.role === "creator" && isNonNegNumber(inv.spacesCap)) {
      await db.doc(`users/${userRecord.uid}/settings/profile`).set(
        { spacesCap: Number(inv.spacesCap) },
        { merge: true }
      );
    }

    // Mark accepted
    await docSnap.ref.update({
      status: "accepted",
      acceptedAt: sv(),
      acceptedUid: userRecord.uid,
    });

    const customToken = await auth.createCustomToken(userRecord.uid);
    res.json({ ok: true, uid: userRecord.uid, customToken });
  } catch (e) {
    logger.error("acceptInvite error", e);
    res.status(500).json({ error: "internal" });
  }
});

// ---------------------------------------------------------------------------
// DEV ONLY (emulator): grant admin/superAdmin quickly
// NEVER deploy to prod (guarded by FUNCTIONS_EMULATOR).
// ---------------------------------------------------------------------------
if (process.env.FUNCTIONS_EMULATOR === "true") {
  exports.devGrantAdmin = onRequest(async (req, res) => {
    try {
      if (req.method !== "POST" && req.method !== "GET") {
        res.status(405).json({ error: "Use GET or POST" });
        return;
      }
      const email = String(
        (req.query && req.query.email) || (req.body && req.body.email) || ""
      )
        .trim()
        .toLowerCase();
      if (!email) {
        res.status(400).json({ error: "email required" });
        return;
      }
      let u;
      try {
        u = await auth.getUserByEmail(email);
      } catch (_e) {
        u = await auth.createUser({ email, emailVerified: false });
      }
      const claims = {
        ...(u.customClaims || {}),
        role: "admin",
        admin: true,
        adminRoles: ["superAdmin"],
      };
      await auth.setCustomUserClaims(u.uid, claims);
      res.json({ ok: true, uid: u.uid, claims });
    } catch (e) {
      logger.error("devGrantAdmin error", e);
      res.status(500).json({ error: "internal" });
    }
  });
}


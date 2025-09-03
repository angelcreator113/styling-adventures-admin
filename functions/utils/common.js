// utils/common.js
const functions = require("firebase-functions/v1");

const MIN_BG_W = 1280;
const MIN_BG_H = 720;
const RATIO_16_9 = 16 / 9;

function todayKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseStorageUrl(url) {
  if (!url || typeof url !== "string") return null;

  if (url.startsWith("gs://")) {
    const rest = url.slice(5);
    const i = rest.indexOf("/");
    if (i === -1) return null;
    return { bucket: rest.slice(0, i), path: rest.slice(i + 1) };
  }
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("storage.googleapis.com")) {
      const parts = u.pathname.replace(/^\/+/, "").split("/");
      const bucket = parts.shift();
      const p = parts.join("/");
      return bucket && p ? { bucket, path: p } : null;
    }
    if (u.hostname.endsWith("firebasestorage.googleapis.com")) {
      const segs = u.pathname.split("/").filter(Boolean);
      const bIdx = segs.indexOf("b");
      const oIdx = segs.indexOf("o");
      const bucket = bIdx >= 0 ? segs[bIdx + 1] : null;
      const rawPath = oIdx >= 0 ? segs[oIdx + 1] : null;
      const p = rawPath ? decodeURIComponent(rawPath) : null;
      return bucket && p ? { bucket, path: p } : null;
    }
  } catch (_) {}
  return null;
}

function is16by9(w, h, tolerance = 0.02) {
  if (!w || !h) return false;
  const ratio = w / h;
  return Math.abs(ratio - RATIO_16_9) <= RATIO_16_9 * tolerance;
}

/* Guards */
const ENFORCE_APPCHECK = process.env.APPCHECK_ENFORCE === "true";

function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Sign in required");
  }
  if (ENFORCE_APPCHECK && !context.app) {
    throw new functions.https.HttpsError("failed-precondition", "App Check required");
  }
}
function requireAdmin(context) {
  requireAuth(context);
  const claims = context.auth.token || {};
  const ok = claims.admin === true || claims.role === "admin";
  if (!ok) throw new functions.https.HttpsError("permission-denied", "Admins only");
}

module.exports = {
  MIN_BG_W,
  MIN_BG_H,
  RATIO_16_9,
  todayKeyUTC,
  slugify,
  parseStorageUrl,
  is16by9,
  requireAuth,
  requireAdmin,
};

// modules/boards.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { todayKeyUTC, slugify } = require("../utils/common");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

exports.onBoardItemCreate = functions
  .region("us-central1")
  .firestore.document("users/{uid}/boards/{boardId}/items/{itemId}")
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const boardId = context.params.boardId;
    const data = snap.data() || {};
    const ts = FieldValue.serverTimestamp();
    const dateKey = todayKeyUTC();

    const boardRef = db.collection("users").doc(uid).collection("boards").doc(boardId);
    const dailyRef = db.collection("admin").doc("metrics").collection("boards_daily").doc(dateKey);
    const boardDailyRef = dailyRef.collection("boards").doc(`${uid}:${boardId}`);
    const catSlug = slugify(data.category || "uncategorized");
    const catDailyRef = dailyRef.collection("categories").doc(catSlug);

    try {
      const br = await boardRef.get();
      const updates = { itemsCount: FieldValue.increment(1), updatedAt: ts };
      const brData = br.exists ? br.data() : null;
      const hasCover = !!(brData && brData.coverUrl);
      if (!hasCover && data.previewUrl) updates.coverUrl = data.previewUrl;
      await boardRef.set(updates, { merge: true });
    } catch (e) {
      console.error("onBoardItemCreate boardRef.set failed", e);
    }

    const batch = db.batch();
    batch.set(dailyRef, { added: FieldValue.increment(1), updatedAt: ts }, { merge: true });
    batch.set(
      boardDailyRef,
      { uid, boardId, label: data.boardLabel || null, added: FieldValue.increment(1) },
      { merge: true },
    );
    batch.set(
      catDailyRef,
      { label: data.category || "Uncategorized", count: FieldValue.increment(1) },
      { merge: true },
    );
    await batch.commit();
  });

exports.onBoardItemDelete = functions
  .region("us-central1")
  .firestore.document("users/{uid}/boards/{boardId}/items/{itemId}")
  .onDelete(async (_snap, context) => {
    const uid = context.params.uid;
    const boardId = context.params.boardId;
    const ts = FieldValue.serverTimestamp();
    const dateKey = todayKeyUTC();

    const boardRef = db.collection("users").doc(uid).collection("boards").doc(boardId);
    const dailyRef = db.collection("admin").doc("metrics").collection("boards_daily").doc(dateKey);
    const boardDailyRef = dailyRef.collection("boards").doc(`${uid}:${boardId}`);

    try {
      await db.runTransaction(async (t) => {
        const s = await t.get(boardRef);
        const cur = (s.exists && s.data().itemsCount) || 0;
        const next = Math.max(0, cur - 1);
        t.set(boardRef, { itemsCount: next, updatedAt: ts }, { merge: true });
      });
    } catch (e) {
      console.error("onBoardItemDelete tx failed", e);
    }

    const batch = db.batch();
    batch.set(dailyRef, { removed: FieldValue.increment(1), updatedAt: ts }, { merge: true });
    batch.set(boardDailyRef, { uid, boardId, removed: FieldValue.increment(1) }, { merge: true });
    await batch.commit();
  });

exports.boardsTrackEvent = functions.region("us-central1").https.onCall(async (data, _context) => {
  const p = data || {};
  const type = p.type;
  const creatorUid = p.creatorUid;
  const boardId = p.boardId;
  const category = p.category;
  const boardLabel = p.boardLabel;
  const outUrl = p.outUrl;
  const tz = String(p.tz || "UTC");
  const tzOffsetMinutes = Number.isFinite(p.tzOffsetMinutes) ? Number(p.tzOffsetMinutes) : 0;

  const allowed = new Set(["view", "save", "click", "share"]);
  if (!allowed.has(type) || !creatorUid || !boardId) {
    throw new functions.https.HttpsError("invalid-argument", "Bad payload");
  }

  const now = new Date();
  const dateKey = todayKeyUTC(now);
  const utcHour = now.getUTCHours();
  const localHour = (((utcHour - tzOffsetMinutes / 60) % 24) + 24) % 24;
  const hourDocKey = String(utcHour).padStart(2, "0");
  const localHourDocKey = String(localHour).padStart(2, "0");

  const ts = FieldValue.serverTimestamp();

  const dailyRef = db.doc(`users/${creatorUid}/metrics/boards/daily/${dateKey}`);
  const boardsRef = dailyRef.collection("boards").doc(boardId);
  const catSlug = slugify(category || "uncategorized");
  const catsRef = dailyRef.collection("categories").doc(catSlug);
  const utcHourRef = dailyRef.collection("hours").doc(hourDocKey);
  const localHourRef = dailyRef.collection("local_hours").doc(localHourDocKey);

  const batch = db.batch();

  const totals = { updatedAt: ts, tz, tzOffsetMinutes };
  if (type === "view") totals.views = FieldValue.increment(1);
  if (type === "save") totals.saves = FieldValue.increment(1);
  if (type === "click") totals.clicks = FieldValue.increment(1);
  if (type === "share") totals.shares = FieldValue.increment(1);
  batch.set(dailyRef, totals, { merge: true });

  const boardUpdate = { updatedAt: ts, boardId, label: boardLabel || null };
  if (type === "view") boardUpdate.views = FieldValue.increment(1);
  if (type === "save") boardUpdate.saves = FieldValue.increment(1);
  if (type === "click") boardUpdate.clicks = FieldValue.increment(1);
  if (type === "share") boardUpdate.shares = FieldValue.increment(1);
  batch.set(boardsRef, boardUpdate, { merge: true });

  if (category) {
    batch.set(catsRef, { label: category, count: FieldValue.increment(1) }, { merge: true });
  }

  const utcUpdate = { updatedAt: ts };
  if (type === "view") utcUpdate.views = FieldValue.increment(1);
  if (type === "save") utcUpdate.saves = FieldValue.increment(1);
  if (type === "click") utcUpdate.clicks = FieldValue.increment(1);
  if (type === "share") utcUpdate.shares = FieldValue.increment(1);
  batch.set(utcHourRef, utcUpdate, { merge: true });

  const localUpdate = { updatedAt: ts, tz, tzOffsetMinutes };
  if (type === "view") localUpdate.views = FieldValue.increment(1);
  if (type === "save") localUpdate.saves = FieldValue.increment(1);
  if (type === "click") localUpdate.clicks = FieldValue.increment(1);
  if (type === "share") localUpdate.shares = FieldValue.increment(1);
  batch.set(localHourRef, localUpdate, { merge: true });

  if (type === "click" && outUrl) {
    try {
      const u = new URL(String(outUrl));
      const host = u.hostname.replace(/^www\./i, "");
      const pathOnly = u.pathname || "/";
      const hostId = Buffer.from(host).toString("base64").slice(0, 100);
      batch.set(
        dailyRef.collection("links").doc(hostId),
        { host, clicks: FieldValue.increment(1) },
        { merge: true },
      );
      const fullKey = host + "|" + pathOnly;
      const fullId = Buffer.from(fullKey).toString("base64").slice(0, 140);
      batch.set(
        dailyRef.collection("links_full").doc(fullId),
        { host, path: pathOnly, clicks: FieldValue.increment(1) },
        { merge: true },
      );
    } catch (_) {}
  }

  await batch.commit();
  return { ok: true };
});

/* eslint-disable camelcase */
const functions = require("firebase-functions/v1"); // keep v1 for HTTPS/PubSub/Firestore
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");

const { validateBackgroundAsset } = require("../utils/mediaProbe");
const { requireAdmin, parseStorageUrl } = require("../utils/common");

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const logger = functions.logger;

// Strict mode: require validators. If false, degrade gracefully when sharp/ffprobe are missing.
const STRICT_BG_VALIDATION =
  String(process.env.STRICT_BG_VALIDATION || "").toLowerCase() === "true";

function softSkipValidation(err) {
  if (!err) return false;
  const code =
    err.code ||
    err?.httpErrorCode?.canonicalName ||
    err?.httpErrorCode?.status ||
    "";
  const msg = String(err.message || err).toLowerCase();
  // We skip only when libs are missing and strict mode is OFF.
  return (
    !STRICT_BG_VALIDATION &&
    (code === "failed-precondition" ||
      msg.includes("sharp not installed") ||
      msg.includes("ffprobe-static") ||
      msg.includes("validator unavailable"))
  );
}

/**
 * onThemeAssetUpload (Gen 2)
 * Fires when any object is finalized in your default bucket.
 * - Accepts images or video
 * - Validates 16:9 and >= 1280x720 (via utils/mediaProbe) if libs available
 * - Auto-creates a PRIVATE draft theme for "theme-backgrounds/" bulk uploads
 * - Ignores unrelated paths
 */
exports.onThemeAssetUpload = onObjectFinalized(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 240,
    retry: false,
  },
  async (event) => {
    const obj = event.data || {};
    const bucket = obj.bucket; // e.g. styling-admin.firebasestorage.app
    const name = obj.name || "";
    const contentType = obj.contentType || "";
    const metadata = obj.metadata || {};

    // Only handle our bulk-import/pipeline prefixes or flagged uploads.
    const isBulk =
      name.startsWith("theme-backgrounds/") ||
      name.startsWith("episode-backgrounds/") ||
      metadata["theme-bulk"] === "1";

    if (!isBulk) return;

    // Try validation (image/video dimensions). If validators missing and STRICT=false, continue.
    try {
      await validateBackgroundAsset(bucket, name, contentType);
    } catch (err) {
      if (softSkipValidation(err)) {
        logger.warn("Background validation skipped (validators unavailable).", {
          name,
          contentType,
          reason: String(err.message || err),
        });
      } else {
        logger.error("Background validation failed.", { name, error: err });
        throw err; // enforce failure in strict mode or real validation errors
      }
    }

    // Only auto-create a theme for theme bulk drops.
    if (name.startsWith("theme-backgrounds/")) {
      const base = (name.split("/").pop() || "").replace(/\.[^.]+$/, "");
      const themeName = (metadata["theme-name"] || base || "untitled").trim() || "untitled";
      const gsUrl = `gs://${bucket}/${name}`;

      const ref = await db.collection("themes").add({
        name: themeName,
        description: "",
        bgUrl: gsUrl,
        visibility: "private",
        // legacy fields kept for back-compat
        tier: "all",
        abRollout: 100,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        importedBy: metadata["u"] || "system:bulk",
      });

      await ref.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        type: "import",
        file: name,
        actorUid: metadata["u"] || null,
      });

      logger.info("Bulk draft theme created", { id: ref.id, name });
    }
  }
);

// Admin upsert
exports.adminUpsertTheme = functions.region("us-central1").https.onCall(async (data, context) => {
  requireAdmin(context);
  const id = data?.id;
  const patch = data?.patch;
  if (!patch || typeof patch !== "object") {
    throw new functions.https.HttpsError("invalid-argument", "patch required");
  }
  const now = FieldValue.serverTimestamp();
  const ref = id ? db.collection("themes").doc(id) : db.collection("themes").doc();
  const beforeSnap = await ref.get();
  const beforeData = beforeSnap.exists ? beforeSnap.data() : null;

  const apply = { ...patch, updatedAt: now, _lastEditedBy: context.auth.uid };
  if (!beforeSnap.exists) apply.createdAt = now;

  await ref.set(apply, { merge: true });
  await ref.collection("audit").add({
    at: now,
    actorUid: context.auth.uid,
    type: beforeSnap.exists ? "update" : "create",
    patch,
    before: beforeData
      ? Object.keys(patch).reduce((o, k) => ((o[k] = beforeData[k]), o), {})
      : null,
  });
  return { ok: true, id: ref.id };
});

// Admin delete (soft + archive)
exports.adminDeleteTheme = functions.region("us-central1").https.onCall(async (data, context) => {
  requireAdmin(context);
  const id = String(data?.id || "");
  if (!id) throw new functions.https.HttpsError("invalid-argument", "id required");

  const ref = db.collection("themes").doc(id);
  const snap = await ref.get();
  const before = snap.exists ? snap.data() : null;

  await ref.set(
    {
      archived: true,
      visibility: "private",
      archivedAt: FieldValue.serverTimestamp(),
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: context.auth.uid,
    },
    { merge: true }
  );
  await ref.collection("audit").add({
    at: FieldValue.serverTimestamp(),
    actorUid: context.auth.uid,
    type: "delete",
    before,
  });
  return { ok: true };
});

// Apply an existing Storage asset to a theme
exports.applyBackgroundAsset = functions
  .region("us-central1")
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    requireAdmin(context);

    const themeId = String(data?.themeId || "");
    const url = String(data?.url || "");
    if (!themeId || !url) {
      throw new functions.https.HttpsError("invalid-argument", "themeId and url are required");
    }

    const parsed = parseStorageUrl(url);
    if (!parsed) {
      throw new functions.https.HttpsError("invalid-argument", "Unsupported storage URL");
    }

    const [meta] = await admin.storage().bucket(parsed.bucket).file(parsed.path).getMetadata();
    const contentType = meta?.contentType || "";

    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      throw new functions.https.HttpsError("invalid-argument", "Only image or video files are allowed.");
    }

    let dims = null;
    try {
      dims = await validateBackgroundAsset(parsed.bucket, parsed.path, contentType);
    } catch (err) {
      if (softSkipValidation(err)) {
        logger.warn("Validation skipped while applying asset.", {
          path: parsed.path,
          reason: String(err.message || err),
        });
        // Continue with unknown dimensions
        dims = { kind: contentType.startsWith("video/") ? "video" : "image", width: null, height: null };
      } else {
        throw err;
      }
    }

    const gsUrl = `gs://${parsed.bucket}/${parsed.path}`;
    const ref = db.collection("themes").doc(themeId);
    await ref.set(
      {
        bgUrl: gsUrl,
        bgType: dims.kind,
        bgMeta: { width: dims.width, height: dims.height, contentType },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await ref.collection("audit").add({
      at: FieldValue.serverTimestamp(),
      actorUid: context.auth.uid,
      type: "apply-asset",
      storagePath: parsed.path,
      bucket: parsed.bucket,
      width: dims.width,
      height: dims.height,
      kind: dims.kind,
    });
    return { ok: true, storageUrl: gsUrl, kind: dims.kind, width: dims.width, height: dims.height };
  });

// Publish cache
exports.publishLoginThemes = functions
  .region("us-central1")
  .pubsub.schedule("every 15 minutes")
  .onRun(async () => {
    const now = Date.now();
    const snap = await db.collection("themes").get();
    const itemsAll = [];
    const itemsVip = [];

    snap.forEach((d) => {
      const x = d.data() || {};
      if (x.archived === true) return;

      const relAll = x.releaseAt?.toMillis?.() ?? null;
      const relVip = x.vipReleaseAt?.toMillis?.() ?? null;
      const exp = x.expiresAt?.toMillis?.() ?? null;
      const del = x.deleteAt?.toMillis?.() ?? null;

      const releaseOK = !relAll || relAll <= now;
      const notExpired = !exp || exp > now;
      const notDeleted = !del || del > now;
      const isPublic = (x.visibility || "public") === "public";

      if (!(isPublic && releaseOK && notExpired && notDeleted)) return;

      const aud =
        Array.isArray(x.audiences) && x.audiences.length
          ? x.audiences
          : x.tier === "vip"
            ? ["vip"]
            : ["all"];

      const rollout = {
        all: Number(x.rollout?.all ?? x.abRollout ?? 100),
        vip: Number(x.rollout?.vip ?? x.abRollout ?? 100),
      };

      const base = {
        id: d.id,
        name: x.name || d.id,
        bgUrl: x.bgUrl || null,
        bgType: x.bgType || "image",
        bgMeta: x.bgMeta || null,
        thumbPath: x.thumbPath || null,
        featuredOnLogin: !!x.featuredOnLogin,
        rollout,
        rolloutSalt: x.rolloutSalt || d.id,
      };

      if (aud.includes("all")) itemsAll.push(base);
      const vipOK = aud.includes("vip") && (!relVip || relVip <= now);
      if (vipOK) itemsVip.push(base);
    });

    await db.doc("public/login_themes").set(
      {
        items_all: itemsAll,
        items_vip: itemsVip,
        items: itemsAll,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return null;
  });

// Nightly archiver
exports.nightlyThemeArchiver = functions
  .region("us-central1")
  .pubsub.schedule("every day 02:10")
  .timeZone("Etc/UTC")
  .onRun(async () => {
    const now = Date.now();
    const qs = await db
      .collection("themes")
      .where("archived", "!=", true)
      .orderBy("archived")
      .get();

    const toArchive = [];
    qs.forEach((d) => {
      const x = d.data() || {};
      const del = x.deleteAt?.toMillis?.() ?? null;
      if (del && del <= now) toArchive.push({ id: d.id, data: x });
    });

    for (const t of toArchive) {
      const parsed = parseStorageUrl(t.data.bgUrl || "");
      try {
        if (parsed) {
          const b = admin.storage().bucket(parsed.bucket);
          const src = b.file(parsed.path);
          const dstPath = parsed.path.startsWith("archive/")
            ? parsed.path
            : `archive/${parsed.path}`;
          await src.copy(b.file(dstPath));
          await src.delete({ ignoreNotFound: true });
          try {
            await b.file(dstPath).setStorageClass("ARCHIVE");
          } catch (e) {
            // best-effort
          }
        }
        const ref = db.collection("themes").doc(t.id);
        await ref.set(
          { archived: true, archivedAt: FieldValue.serverTimestamp(), visibility: "private" },
          { merge: true }
        );
        await ref.collection("audit").add({
          at: FieldValue.serverTimestamp(),
          type: "auto-archive",
        });
      } catch (e) {
        logger.error("Archive failed", { id: t.id, error: e });
      }
    }
    return null;
  });

// On doc delete: archive asset
exports.onThemeDocDelete = functions
  .region("us-central1")
  .firestore.document("themes/{themeId}")
  .onDelete(async (snap, context) => {
    const themeId = context.params.themeId;
    const d = snap.data() || {};
    try {
      await db.collection("themeIcons").doc(themeId).delete();
    } catch (_) {}
    const parsed = parseStorageUrl(d.bgUrl || "");
    if (!parsed) return;
    const b = admin.storage().bucket(parsed.bucket);
    const src = b.file(parsed.path);
    const dstPath = parsed.path.startsWith("archive/") ? parsed.path : `archive/${parsed.path}`;
    const dst = b.file(dstPath);
    try {
      await src.copy(dst);
      await src.delete({ ignoreNotFound: true });
      try {
        await dst.setStorageClass("ARCHIVE");
      } catch (_) {}
    } catch (e) {
      logger.warn("onThemeDocDelete archive failed", { parsed, error: e });
    }
  });



const admin = require("firebase-admin");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs/promises");
const functions = require("firebase-functions/v1");
const { MIN_BG_W, MIN_BG_H, is16by9 } = require("./common");

let sharp = null;
try {
  // optional dependency; we throw a clean error later if missing
  // eslint-disable-next-line global-require
  sharp = require("sharp");
} catch (_) {
  // no-op
}

let ffprobePath = null;
try {
  // optional dependency; we throw a clean error later if missing
  // eslint-disable-next-line global-require
  ffprobePath = require("ffprobe-static").path;
} catch (_) {
  // no-op
}

async function downloadToTmp(bucket, gcsPath) {
  const tmp = path.join(os.tmpdir(), `bg-${Date.now()}-${path.basename(gcsPath)}`);
  await admin.storage().bucket(bucket).file(gcsPath).download({ destination: tmp });
  return tmp;
}

async function probeVideo(bucket, gcsPath) {
  if (!ffprobePath) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Video validator unavailable (ffprobe-static not installed).",
    );
  }
  const local = await downloadToTmp(bucket, gcsPath);
  try {
    const args = [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      "-select_streams",
      "v:0",
      local,
    ];

    const out = await new Promise((resolve, reject) => {
      const p = spawn(ffprobePath, args);
      let data = "";
      let err = "";
      p.stdout.on("data", (c) => {
        data += c.toString();
      });
      p.stderr.on("data", (c) => {
        err += c.toString();
      });
      p.on("close", (code) => {
        if (code === 0) resolve(data);
        else reject(new Error(err || `ffprobe ${code}`));
      });
    });

    const json = JSON.parse(out || "{}");
    const stream = (json.streams || [])[0] || {};

    let w = stream.width || 0;
    let h = stream.height || 0;

    const rot = Number(stream?.tags?.rotate || stream?.side_data_list?.[0]?.rotation || 0);
    if (rot === 90 || rot === 270 || rot === -90) {
      const t = w;
      w = h;
      h = t;
    }

    const sar = String(stream.sample_aspect_ratio || "1:1");
    if (sar !== "1:1" && sar.includes(":")) {
      const [sn, sd] = sar.split(":").map((n) => Number(n) || 1);
      if (sn > 0 && sd > 0) w = Math.round((w * sn) / sd);
    }

    return { width: w, height: h, rotation: rot || 0 };
  } finally {
    try {
      await fs.unlink(local);
    } catch (_) {
      // best-effort cleanup
    }
  }
}

async function probeImage(bucket, gcsPath) {
  if (!sharp) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Image validator unavailable (sharp not installed).",
    );
  }
  const [buf] = await admin.storage().bucket(bucket).file(gcsPath).download();
  const meta = await sharp(buf).metadata();

  let w = meta?.width || 0;
  let h = meta?.height || 0;
  const orientation = Number(meta?.orientation || 1);

  // EXIF orientation 6/8 = rotated 90°/270°
  if (orientation === 6 || orientation === 8) {
    const t = w;
    w = h;
    h = t;
  }
  return { width: w, height: h, orientation };
}

async function validateBackgroundAsset(bucket, gcsPath, contentType) {
  const kind = contentType.startsWith("video/")
    ? "video"
    : contentType.startsWith("image/")
      ? "image"
      : "other";

  if (kind === "other") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Only image or video files are allowed.",
    );
  }

  const dims =
    kind === "image" ? await probeImage(bucket, gcsPath) : await probeVideo(bucket, gcsPath);
  const { width: w, height: h } = dims;

  if (!(w >= MIN_BG_W && h >= MIN_BG_H)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Background too small. Need at least ${MIN_BG_W}×${MIN_BG_H}. Got ${w}×${h}.`,
    );
  }

  if (!is16by9(w, h)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Background must be 16:9. Got ${w}×${h}.`,
    );
  }

  return { kind, width: w, height: h };
}

module.exports = { probeImage, probeVideo, validateBackgroundAsset };

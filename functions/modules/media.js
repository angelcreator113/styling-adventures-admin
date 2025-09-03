const functions = require("firebase-functions/v1");
const axios = require("axios");
const { requireAuth } = require("../utils/common");

function isLikelyBase64(str) {
  return typeof str === "string" && /^[A-Za-z0-9+/=\s]+$/.test(str) && str.length > 0;
}
function approxBytesFromBase64(b64) {
  const len = b64.length - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
  return Math.floor((len * 3) / 4);
}

exports.removeBgPro = functions
  .region("us-central1")
  .runWith({ memory: "2GB", timeoutSeconds: 60, secrets: ["REMOVER_KEY"] })
  .https.onCall(async (data, context) => {
    requireAuth(context);

    const imageBase64 = data && data.imageBase64;
    if (!imageBase64) {
      throw new functions.https.HttpsError("invalid-argument", "imageBase64 missing");
    }
    if (!isLikelyBase64(imageBase64)) {
      throw new functions.https.HttpsError("invalid-argument", "imageBase64 not valid");
    }
    const maxBytes = 8 * 1024 * 1024;
    if (approxBytesFromBase64(imageBase64) > maxBytes) {
      throw new functions.https.HttpsError("invalid-argument", "image too large");
    }

    const provider = String(process.env.REMOVER_PROVIDER || "stub").toLowerCase();
    const key = String(process.env.REMOVER_KEY || "");

    try {
      if (provider === "clipdrop" && key) {
        const url = "https://clipdrop-api.co/remove-background/v1";
        // lazy import form-data
        const FormData = require("form-data");
        const buffer = Buffer.from(imageBase64, "base64");
        const form = new FormData();
        form.append("image_file", buffer, { filename: "in.png" });

        const resp = await axios.post(url, form, {
          headers: { "x-api-key": key, ...form.getHeaders() },
          responseType: "arraybuffer",
        });
        return { ok: true, imageBase64: Buffer.from(resp.data).toString("base64") };
      }

      if (provider === "removebg" && key) {
        const url = "https://api.remove.bg/v1.0/removebg";
        const FormData = require("form-data");
        const buffer = Buffer.from(imageBase64, "base64");
        const form = new FormData();
        form.append("image_file", buffer, { filename: "in.png" });
        form.append("size", "auto");

        const resp = await axios.post(url, form, {
          headers: { "X-Api-Key": key, ...form.getHeaders() },
          responseType: "arraybuffer",
        });
        return { ok: true, imageBase64: Buffer.from(resp.data).toString("base64") };
      }

      // Fallback stub: echo input
      return { ok: true, imageBase64 };
    } catch (err) {
      const errData = err?.response?.data || err;
      console.error("removeBgPro failure:", errData);
      throw new functions.https.HttpsError("internal", "Background removal failed");
    }
  });

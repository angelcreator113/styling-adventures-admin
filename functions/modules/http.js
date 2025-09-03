// modules/http.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { todayKeyUTC } = require("../utils/common");
const db = admin.firestore();

exports.boardsDaily = functions.region("us-central1").https.onRequest(async (req, res) => {
  try {
    const token = process.env.ADMIN_METRICS_TOKEN;
    if (token) {
      const provided = req.get("x-admin-token");
      if (provided !== token) {
        res.status(403).json({ ok: false, error: "forbidden" });
        return;
      }
    }
    const dateKey = req.query && req.query.date ? String(req.query.date) : todayKeyUTC();
    const docRef = db.collection("admin").doc("metrics").collection("boards_daily").doc(dateKey);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      res.status(404).json({ ok: false, message: "No metrics for date", dateKey });
      return;
    }
    const out = docSnap.data() || {};
    const catsSnap = await docRef.collection("categories").get();
    const boardsSnap = await docRef.collection("boards").get();
    out.categories = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    out.boards = boardsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ ok: true, dateKey, data: out });
  } catch (e) {
    console.error("boardsDaily error", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

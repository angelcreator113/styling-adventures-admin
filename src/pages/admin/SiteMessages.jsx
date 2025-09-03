import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/init-firebase";
import {
  doc, getDoc, setDoc,
  collection, addDoc, getDocs, query, orderBy, limit,
} from "firebase/firestore";

function splitCSV(s) {
  return String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
}
function strOrNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : x;
}
function normalizePayload(p) {
  const safeNumber = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    enabled: !!p.enabled,
    message: p.message || "Psst… creators get 2 free Spaces 🏱",
    ctaLabel: p.ctaLabel || "Upgrade to Creator",
    ctaHref: p.ctaHref || "/settings/upgrade",
    showEveryHours: safeNumber(p.showEveryHours),
    minClosetItems: safeNumber(p.minClosetItems),
    rolesAllowed: Array.isArray(p.rolesAllowed) ? p.rolesAllowed : splitCSV(p.rolesAllowed),
    variant: p.variant || "auto",
    startAt: safeNumber(p.startAt),
    endAt: safeNumber(p.endAt),
  };
}
function groupCounts(events, key) {
  const out = {};
  for (const e of events) {
    const k = e[key] || "unknown";
    if (!out[k]) out[k] = { views: 0, clicks: 0, ctr: "0.0%" };
    if (e.type === "creator_ribbon_view") out[k].views += 1;
    if (e.type === "creator_ribbon_click") out[k].clicks += 1;
  }
  for (const k of Object.keys(out)) {
    const { views, clicks } = out[k];
    out[k].ctr = views ? ((clicks / views) * 100).toFixed(1) + "%" : "0.0%";
  }
  return out;
}

export default function SiteMessages() {
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState({
    enabled: true,
    message: "Psst… creators get 2 free Spaces 🏱",
    ctaLabel: "Upgrade to Creator",
    ctaHref: "/settings/upgrade",
    showEveryHours: 0,
    minClosetItems: 0,
    rolesAllowed: ["fan"],
    variant: "auto",
    startAt: "",
    endAt: "",
  });

  const [presets, setPresets] = useState([]);
  const [creating, setCreating] = useState({
    enabled: true,
    message: "",
    ctaLabel: "",
    ctaHref: "",
    showEveryHours: 0,
    minClosetItems: 0,
    rolesAllowed: "fan",
    variant: "auto",
    startAt: "",
    endAt: "",
  });

  const [events, setEvents] = useState([]);
  const [resetUids, setResetUids] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const live = await getDoc(doc(db, "site_settings/creatorRibbon"));
        if (live.exists()) setCurrent((prev) => ({ ...prev, ...live.data() }));

        const ps = await getDocs(collection(db, "site_messages"));
        const list = ps.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => d.type === "creator_ribbon");
        setPresets(list);

        const qy = query(collection(db, "analytics", "events"), orderBy("ts", "desc"), limit(100));
        const es = await getDocs(qy);
        setEvents(es.docs.map((d) => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveCurrent = async () => {
    const payload = normalizePayload(current);
    await setDoc(doc(db, "site_settings/creatorRibbon"), payload, { merge: true });
    alert("Saved");
  };

  const createPreset = async () => {
    const payload = normalizePayload({
      ...creating,
      startAt: strOrNum(creating.startAt),
      endAt: strOrNum(creating.endAt),
      rolesAllowed: splitCSV(creating.rolesAllowed),
    });
    const ref = await addDoc(collection(db, "site_messages"), {
      ...payload,
      type: "creator_ribbon",
      createdAt: Date.now(),
    });
    setPresets((prev) => [{ id: ref.id, ...payload, type: "creator_ribbon" }, ...prev]);
    setCreating({
      enabled: true,
      message: "",
      ctaLabel: "",
      ctaHref: "",
      showEveryHours: 0,
      minClosetItems: 0,
      rolesAllowed: "fan",
      variant: "auto",
      startAt: "",
      endAt: "",
    });
  };

  const applyPreset = async (p) => {
    const payload = normalizePayload(p);
    await setDoc(doc(db, "site_settings/creatorRibbon"), payload, { merge: true });
    setCurrent((prev) => ({ ...prev, ...payload }));
    alert("Applied");
  };

  async function resetFrequencyCapsForUids(uidsString) {
    const uids = String(uidsString || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!uids.length) return alert("Enter at least one UID to reset.");

    setResetBusy(true);
    const payload = {
      lastRibbonShown: { A: 0, B: 0 },
      resetToken: Date.now(),
    };
    try {
      await Promise.all(
        uids.map((uid) => setDoc(doc(db, `users/${uid}/settings/engagement`), payload, { merge: true }))
      );
      alert(`Reset caps for ${uids.length} account(s).`);
    } catch (e) {
      console.error(e);
      alert("Error resetting caps. Check console for details.");
    } finally {
      setResetBusy(false);
    }
  }

  const byRole = useMemo(() => groupCounts(events, "role"), [events]);
  const byVariant = useMemo(() => groupCounts(events, "variant"), [events]);

  if (loading) return null;

  return (
    <div className="container" style={{ padding: 16 }}>
      {/* Entire component JSX unchanged — logic above has the updates */}
      {/* Render code omitted here for brevity unless you want every line pasted too */}
    </div>
  );
}

function SimpleBreakdown({ table }) {
  const rows = Object.entries(table || {});
  if (!rows.length) return <p className="muted">No events yet.</p>;
  return (
    <table style={{ width: "100%", fontSize: ".92rem" }}>
      <thead>
        <tr>
          <th align="left">key</th>
          <th align="right">views</th>
          <th align="right">clicks</th>
          <th align="right">CTR</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td align="right">{v.views}</td>
            <td align="right">{v.clicks}</td>
            <td align="right">{v.ctr}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

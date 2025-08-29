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
  return {
    enabled: !!p.enabled,
    message: p.message || "Psst… creators get 2 free Spaces 🎁",
    ctaLabel: p.ctaLabel || "Upgrade to Creator",
    ctaHref: p.ctaHref || "/settings/upgrade",
    showEveryHours: Number(p.showEveryHours || 0),
    minClosetItems: Number(p.minClosetItems || 0),
    rolesAllowed: Array.isArray(p.rolesAllowed) ? p.rolesAllowed : splitCSV(p.rolesAllowed),
    variant: p.variant || "auto",
    startAt: typeof p.startAt === "number" ? p.startAt : Number(p.startAt || 0),
    endAt: typeof p.endAt === "number" ? p.endAt : Number(p.endAt || 0),
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
    message: "Psst… creators get 2 free Spaces 🎁",
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

  // load live config, presets, analytics
  useEffect(() => {
    (async () => {
      try {
        const live = await getDoc(doc(db, "site_settings/creatorRibbon"));
        if (live.exists()) setCurrent((prev) => ({ ...prev, ...live.data() }));

        const ps = await getDocs(collection(db, "site_messages"));
        const list = ps.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "creator_ribbon");
        setPresets(list);

        const qy = query(collection(db, "analytics/events"), orderBy("ts", "desc"), limit(100));
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
    if (!uids.length) {
      alert("Enter at least one UID to reset.");
      return;
    }
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
      <h1>Site Messages</h1>
      <p className="muted">
        Control the homepage ribbon — scheduling, targeting, frequency — and inspect analytics by role and variant.
      </p>

      {/* current */}
      <section className="section">
        <h2 className="section__title">Current Creator Ribbon</h2>
        <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={!!current.enabled}
              onChange={(e) => setCurrent({ ...current, enabled: e.target.checked })}
            />{" "}
            Enabled
          </label>

          <label>
            Message
            <input
              value={current.message || ""}
              onChange={(e) => setCurrent({ ...current, message: e.target.value })}
              style={{ width: "100%" }}
            />
          </label>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              CTA Label
              <input value={current.ctaLabel || ""} onChange={(e) => setCurrent({ ...current, ctaLabel: e.target.value })} />
            </label>
            <label>
              CTA Href
              <input value={current.ctaHref || ""} onChange={(e) => setCurrent({ ...current, ctaHref: e.target.value })} />
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3,1fr)" }}>
            <label>
              Start At (ms)
              <input value={current.startAt || ""} onChange={(e) => setCurrent({ ...current, startAt: strOrNum(e.target.value) })} />
            </label>
            <label>
              End At (ms)
              <input value={current.endAt || ""} onChange={(e) => setCurrent({ ...current, endAt: strOrNum(e.target.value) })} />
            </label>
            <label>
              Show Every (hrs)
              <input
                type="number"
                value={current.showEveryHours || 0}
                onChange={(e) => setCurrent({ ...current, showEveryHours: Number(e.target.value) })}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3,1fr)" }}>
            <label>
              Min Closet Items
              <input
                type="number"
                value={current.minClosetItems || 0}
                onChange={(e) => setCurrent({ ...current, minClosetItems: Number(e.target.value) })}
              />
            </label>
            <label>
              Roles Allowed (csv)
              <input
                value={(current.rolesAllowed || []).join(",")}
                onChange={(e) => setCurrent({ ...current, rolesAllowed: splitCSV(e.target.value) })}
              />
            </label>
            <label>
              Variant
              <input value={current.variant || "auto"} onChange={(e) => setCurrent({ ...current, variant: e.target.value })} />
            </label>
          </div>

          <button className="btn primary" onClick={saveCurrent}>Save</button>
        </div>
      </section>

      {/* create preset */}
      <section className="section">
        <h2 className="section__title">Create Preset</h2>
        <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={!!creating.enabled}
              onChange={(e) => setCreating({ ...creating, enabled: e.target.checked })}
            />{" "}
            Enabled
          </label>
          <label>
            Message
            <input value={creating.message} onChange={(e) => setCreating({ ...creating, message: e.target.value })} style={{ width: "100%" }} />
          </label>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              CTA Label
              <input value={creating.ctaLabel} onChange={(e) => setCreating({ ...creating, ctaLabel: e.target.value })} />
            </label>
            <label>
              CTA Href
              <input value={creating.ctaHref} onChange={(e) => setCreating({ ...creating, ctaHref: e.target.value })} />
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3,1fr)" }}>
            <label>Start At (ms)<input value={creating.startAt} onChange={(e) => setCreating({ ...creating, startAt: e.target.value })} /></label>
            <label>End At (ms)<input value={creating.endAt} onChange={(e) => setCreating({ ...creating, endAt: e.target.value })} /></label>
            <label>Show Every (hrs)<input type="number" value={creating.showEveryHours} onChange={(e) => setCreating({ ...creating, showEveryHours: Number(e.target.value) })} /></label>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3,1fr)" }}>
            <label>Min Closet Items<input type="number" value={creating.minClosetItems} onChange={(e) => setCreating({ ...creating, minClosetItems: Number(e.target.value) })} /></label>
            <label>Roles Allowed (csv)<input value={creating.rolesAllowed} onChange={(e) => setCreating({ ...creating, rolesAllowed: e.target.value })} /></label>
            <label>Variant<input value={creating.variant} onChange={(e) => setCreating({ ...creating, variant: e.target.value })} /></label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={createPreset}>Add Preset</button>
          </div>
        </div>
      </section>

      {/* apply preset */}
      {presets.length > 0 && (
        <section className="section">
          <h2 className="section__title">Presets</h2>
          <div className="card" style={{ padding: 16 }}>
            <ul>
              {presets.map((p) => (
                <li key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <code style={{ background: "#f6f6f9", padding: "2px 6px", borderRadius: 6 }}>{p.message.slice(0, 64)}{p.message.length > 64 ? "…" : ""}</code>
                  <button className="btn sm" onClick={() => applyPreset(p)}>Apply</button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* RESET CAPS */}
      <section className="section">
        <h2 className="section__title">Reset Ribbon Frequency (Test Accounts)</h2>
        <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
          <label>
            Account UIDs (comma separated)
            <input
              placeholder="uid1, uid2, uid3"
              value={resetUids}
              onChange={(e) => setResetUids(e.target.value)}
              style={{ width: "100%" }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" disabled={resetBusy} onClick={() => resetFrequencyCapsForUids(resetUids)}>
              {resetBusy ? "Resetting…" : "Reset Frequency Caps"}
            </button>
            <span className="muted">
              Clears server caps for A/B and bumps a token so clients clear <strong>localStorage</strong> caps next load.
            </span>
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="section">
        <h2 className="section__title">Ribbon Analytics (last 100)</h2>

        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <h3>By Role</h3>
          <SimpleBreakdown table={groupCounts(events, "role")} />
        </div>

        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <h3>By Variant</h3>
          <SimpleBreakdown table={groupCounts(events, "variant")} />
        </div>

        <div className="card" style={{ padding: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: ".92rem" }}>
            <thead>
              <tr>
                <th align="left">ts</th>
                <th align="left">type</th>
                <th align="left">userId</th>
                <th align="left">role</th>
                <th align="left">variant</th>
                <th align="left">extra</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.ts).toLocaleString()}</td>
                  <td>{e.type}</td>
                  <td>{e.userId || "-"}</td>
                  <td>{e.role || "-"}</td>
                  <td>{e.variant || "-"}</td>
                  <td>{JSON.stringify(e.extra || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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

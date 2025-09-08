// src/pages/admin/themes/VotingSettings.jsx
import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/utils/init-firebase";

const toTs = (v) => (v ? Timestamp.fromDate(new Date(v)) : null);

export default function VotingSettings() {
  const [themes, setThemes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    name: "",
    themeIds: [],
    vipOnly: false,
    anonymousAllowed: true,
    perUserMaxTotal: 1,
    perUserMaxPerDay: 1,
    startAt: "",
    endAt: "",
    status: "draft", // draft | active | paused | ended
  });

  // load themes for multi-select
  useEffect(() => {
    const qy = query(collection(db, "themes"), orderBy("name", "asc"));
    return onSnapshot(qy, (snap) => {
      setThemes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // live campaigns
  useEffect(() => {
    const qy = query(collection(db, "themeCampaigns"), orderBy("createdAt", "desc"));
    return onSnapshot(qy, (snap) => {
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  async function createCampaign(e) {
    e.preventDefault();
    const payload = {
      ...form,
      createdAt: serverTimestamp(),
      startAt: toTs(form.startAt),
      endAt: toTs(form.endAt),
    };
    await addDoc(collection(db, "themeCampaigns"), payload);
    setForm({
      name: "",
      themeIds: [],
      vipOnly: false,
      anonymousAllowed: true,
      perUserMaxTotal: 1,
      perUserMaxPerDay: 1,
      startAt: "",
      endAt: "",
      status: "draft",
    });
  }

  async function setStatus(c, status) {
    await setDoc(doc(db, "themeCampaigns", c.id), { status }, { merge: true });
  }

  async function remove(c) {
    if (!confirm(`Delete campaign “${c.name}”?`)) return;
    await deleteDoc(doc(db, "themeCampaigns", c.id));
  }

  // quick “test vote” (writes to campaign’s votes subcollection).
  // Your Cloud Function can listen and increment themes/{id}.voteCount.
  async function addTestVote(c, themeId) {
    if (!themeId) return alert("Pick a theme in the campaign first.");
    await addDoc(collection(db, `themeCampaigns/${c.id}/votes`), {
      themeId,
      themeName: themes.find((t) => t.id === themeId)?.name || themeId,
      timestamp: serverTimestamp(),
      by: "admin-test",
    });
    alert("Test vote added.");
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h1 style={{ margin: 0 }}>🗳️ Voting Settings</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Configure windows, limits, and VIP rules. Create campaigns and preview/test votes.
        </p>

        <form onSubmit={createCampaign} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              <div className="muted">Campaign name</div>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Fall Launch Week"
                required
              />
            </label>

            <label>
              <div className="muted">Allowed themes (hold Ctrl/⌘ for multi)</div>
              <select
                multiple
                className="input"
                value={form.themeIds}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    themeIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                  }))
                }
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <label>
              <div className="muted">Per-user max (total)</div>
              <input
                className="input"
                type="number"
                min={0}
                value={form.perUserMaxTotal}
                onChange={(e) => setForm((f) => ({ ...f, perUserMaxTotal: +e.target.value }))}
              />
            </label>
            <label>
              <div className="muted">Per-user per day</div>
              <input
                className="input"
                type="number"
                min={0}
                value={form.perUserMaxPerDay}
                onChange={(e) => setForm((f) => ({ ...f, perUserMaxPerDay: +e.target.value }))}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.vipOnly}
                onChange={(e) => setForm((f) => ({ ...f, vipOnly: e.target.checked }))}
              />
              VIP only?
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.anonymousAllowed}
                onChange={(e) =>
                  setForm((f) => ({ ...f, anonymousAllowed: e.target.checked }))
                }
              />
              Allow anonymous?
            </label>
          </div>

          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label>
              <div className="muted">Start</div>
              <input
                className="input"
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
              />
            </label>
            <label>
              <div className="muted">End</div>
              <input
                className="input"
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
              />
            </label>
            <label>
              <div className="muted">Status</div>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option>draft</option>
                <option>active</option>
                <option>paused</option>
                <option>ended</option>
              </select>
            </label>
          </div>

          <div>
            <button className="btn primary" type="submit">
              Create campaign
            </button>
          </div>
        </form>
      </div>

      <div className="dashboard-card" style={{ marginTop: 12 }}>
        <h2 style={{ margin: 0 }}>Active & Draft Campaigns</h2>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {campaigns.map((c) => (
            <div key={c.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{c.name}</strong>
                  <div className="muted">
                    {c.themeIds?.length || 0} themes · {c.vipOnly ? "VIP only" : "All fans"} ·{" "}
                    per-user {c.perUserMaxTotal}/{c.perUserMaxPerDay} (total/day)
                  </div>
                  <div className="muted">
                    {c.startAt ? new Date(c.startAt.toDate()).toLocaleString() : "—"} →{" "}
                    {c.endAt ? new Date(c.endAt.toDate()).toLocaleString() : "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="input"
                    onChange={(e) => addTestVote(c, e.target.value)}
                    defaultValue=""
                    title="Add a test vote to…"
                  >
                    <option value="" disabled>
                      + Test vote
                    </option>
                    {(c.themeIds || []).map((id) => (
                      <option key={id} value={id}>
                        {themes.find((t) => t.id === id)?.name || id}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input"
                    value={c.status || "draft"}
                    onChange={(e) => setStatus(c, e.target.value)}
                  >
                    <option>draft</option>
                    <option>active</option>
                    <option>paused</option>
                    <option>ended</option>
                  </select>
                  <button className="btn danger" onClick={() => remove(c)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!campaigns.length && <div className="muted">No campaigns yet.</div>}
        </div>
      </div>
    </section>
  );
}


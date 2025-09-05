// src/pages/admin/manage/AdminRoleDefs.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import toast, { Toaster } from "react-hot-toast";

/** Small starter set; UI also merges any keys it discovers in roles or in adminGrantCatalog */
const SUGGESTED_GRANTS = [
  "roles.manage",
  "roles.define",
  "content.publish",
  "content.readall",
  "community.moderate",
  "themes.manage",
  "boards.analytics",
  "partners.manage",
  "finance.manage",
  "analytics.full",
];

function emptyRole() {
  return {
    id: "",
    name: "",
    grants: {},
    inherits: [],   // NEW
  };
}

/** Merge inherited grants -> flat {key:true} */
function computeEffectiveGrants(role, rolesMap) {
  const out = {};
  const seen = new Set();

  function dfs(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const r = rolesMap[id];
    if (!r) return;
    // parents first (so this role can override if you ever want to support false)
    (r.inherits || []).forEach(dfs);
    Object.entries(r.grants || {}).forEach(([k, v]) => {
      if (v === true) out[k] = true;
      else if (v === false) delete out[k];
    });
  }

  (role.inherits || []).forEach(dfs);
  return out;
}

export default function AdminRoleDefs() {
  const [rows, setRows] = useState([]);            // role list
  const [editing, setEditing] = useState(null);    // current role (draft)
  const [filter, setFilter] = useState("");
  const [newGrantKey, setNewGrantKey] = useState("");
  const [diffOnly, setDiffOnly] = useState(false); // NEW
  const [catalog, setCatalog] = useState([]);      // optional grant catalog

  // live roles
  useEffect(() => {
    const off = onSnapshot(collection(db, "adminRoleDefs"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() || {}), inherits: d.data()?.inherits || [] }))
        .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
      setRows(list);

      if (editing) {
        const updated = list.find((r) => r.id === editing.id);
        if (updated) setEditing({ ...editing, ...updated });
      }
    });
    return () => off();
  }, [editing]);

  // optional grant catalog (adminGrantCatalog/*)
  useEffect(() => {
    const off = onSnapshot(collection(db, "adminGrantCatalog"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}), key: d.id }));
      setCatalog(list);
    }, () => setCatalog([])); // if collection doesn't exist, fall back silently
    return () => off();
  }, []);

  // Quick index for inheritance calculations
  const rolesMap = useMemo(() => {
    const m = {};
    rows.forEach((r) => (m[r.id] = r));
    return m;
  }, [rows]);

  // search filter
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = (r.name || r.id || "").toLowerCase();
      const grantHit = Object.keys(r.grants || {}).some((k) => k.toLowerCase().includes(q));
      return name.includes(q) || grantHit;
    });
  }, [rows, filter]);

  function startNew() {
    setEditing(emptyRole());
  }

  function startEdit(r) {
    setEditing({
      id: r.id,
      name: r.name || r.id,
      grants: { ...(r.grants || {}) },
      inherits: Array.isArray(r.inherits) ? [...r.inherits] : [],
    });
  }

  async function save() {
    if (!editing) return;
    const id =
      editing.id ||
      (editing.name || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^A-Za-z0-9_-]/g, "");
    if (!id) {
      toast.error("Please enter a role name.");
      return;
    }
    const payload = {
      name: (editing.name || "").trim() || id,
      grants: editing.grants || {},
      inherits: Array.isArray(editing.inherits) ? editing.inherits : [],
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, "adminRoleDefs", id), payload, { merge: true });
    toast.success(`Saved role “${payload.name}”`);
    setEditing({ ...payload, id });
  }

  async function remove(r) {
    if (!r?.id) return;
    if (!confirm(`Delete role "${r.name || r.id}"?`)) return;
    await deleteDoc(doc(db, "adminRoleDefs", r.id));
    toast.success("Deleted");
    setEditing(null);
  }

  function toggleGrant(key) {
    if (!editing) return;
    const next = { ...(editing.grants || {}) };
    next[key] = !next[key];
    setEditing({ ...editing, grants: next });
  }

  function addGrantKey() {
    const key = newGrantKey.trim();
    if (!key) return;
    if (!/^[a-z0-9.\-_]+$/i.test(key)) {
      toast.error("Use letters, numbers, dot, dash, underscore.");
      return;
    }
    if (!editing) return;
    const next = { ...(editing.grants || {}) };
    next[key] = true;
    setEditing({ ...editing, grants: next });
    setNewGrantKey("");
  }

  // All available grant keys (catalog → discovered → suggestions)
  const allGrantKeys = useMemo(() => {
    const keys = new Set(
      (catalog.length ? catalog.map((c) => c.key) : []).concat(SUGGESTED_GRANTS)
    );
    rows.forEach((r) => Object.keys(r.grants || {}).forEach((k) => keys.add(k)));
    if (editing) Object.keys(editing.grants || {}).forEach((k) => keys.add(k));
    return Array.from(keys).sort();
  }, [rows, editing, catalog]);

  // Group grants by catalog category if available
  const grantsByCategory = useMemo(() => {
    if (!catalog.length) return { All: allGrantKeys };
    const catMap = new Map();
    allGrantKeys.forEach((k) => {
      const meta = catalog.find((c) => c.key === k);
      const cat = meta?.category || "Other";
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(k);
    });
    // stable sorting inside categories
    for (const v of catMap.values()) v.sort();
    return Object.fromEntries([...catMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [allGrantKeys, catalog]);

  // Effective (inherited) grants & diff view
  const inherited = useMemo(() => {
    if (!editing) return {};
    return computeEffectiveGrants(editing, rolesMap);
  }, [editing, rolesMap]);

  const shouldShow = (k) => !diffOnly || !inherited[k] || !editing?.inherits?.length;

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />

      <div className="dashboard-card" style={{ padding: 16, display: "grid", gap: 16 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0 }}>Admin Role Definitions</h1>
            <div className="muted" style={{ marginTop: 4 }}>
              Define admin sub-roles and granular grants. Docs live in <code>adminRoleDefs/*</code>.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Search roles or grants…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input__field"
              style={{ minWidth: 240 }}
            />
            <button className="btn primary" onClick={startNew}>New role</button>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
          {/* List */}
          <aside className="dashboard-card" style={{ padding: 12 }}>
            {visible.length === 0 && <div className="muted">No roles yet.</div>}
            <ul role="list" style={{ display: "grid", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
              {visible.map((r) => (
                <li key={r.id}>
                  <button
                    className="chip"
                    onClick={() => startEdit(r)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "8px 10px",
                      background: editing?.id === r.id ? "#f8faff" : "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.name || r.id}</div>
                    <div className="muted sm">
                      {Object.keys(r.grants || {}).length} grants
                      {r.inherits?.length ? ` • inherits ${r.inherits.length}` : ""}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Editor */}
          <main className="dashboard-card" style={{ padding: 12, display: "grid", gap: 12 }}>
            {!editing && <div className="muted">Select a role or click “New role”.</div>}

            {editing && (
              <>
                {/* Name */}
                <div style={{ display: "grid", gap: 8 }}>
                  <label className="input__label" htmlFor="role-name">Display name</label>
                  <input
                    id="role-name"
                    className="input__field"
                    placeholder="e.g., Super Admin"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                  {!editing.id && (
                    <div className="muted sm">
                      Document ID will be derived from the name (letters/numbers/dash/underscore).
                    </div>
                  )}
                </div>

                {/* Inherits */}
                <div style={{ display: "grid", gap: 8 }}>
                  <label className="input__label">Inherits from</label>
                  <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                    {rows
                      .filter((r) => r.id !== editing.id)
                      .map((r) => {
                        const checked = editing.inherits?.includes(r.id);
                        return (
                          <label key={r.id} className="chip" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const set = new Set(editing.inherits || []);
                                checked ? set.delete(r.id) : set.add(r.id);
                                setEditing({ ...editing, inherits: Array.from(set) });
                              }}
                            />
                            <span>{r.name || r.id}</span>
                          </label>
                        );
                      })}
                  </div>
                  <label className="input__label" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
                    Show only grants added by this role (diff view)
                  </label>
                </div>

                {/* Grants */}
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong>Grants</strong>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        placeholder="new.grant.key"
                        value={newGrantKey}
                        onChange={(e) => setNewGrantKey(e.target.value)}
                        className="input__field"
                      />
                      <button className="btn" type="button" onClick={addGrantKey}>Add</button>
                    </div>
                  </div>

                  {/* By category if catalog exists */}
                  {Object.entries(grantsByCategory).map(([cat, keys]) => (
                    <div key={cat} style={{ display: shouldShowSection(keys, inherited, diffOnly) ? "block" : "none" }}>
                      {catalog.length > 0 && <div className="muted sm" style={{ margin: "6px 0" }}>{cat}</div>}
                      <div
                        style={{
                          display: "grid",
                          gap: 6,
                          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        }}
                      >
                        {keys.filter(shouldShow).map((k) => {
                          const checked = Boolean(editing.grants?.[k]);
                          const inheritedOn = Boolean(inherited[k]);
                          // If diffOnly, we already filtered inherited ones out; still hint with border
                          return (
                            <label
                              key={k}
                              className="chip"
                              title={inheritedOn ? "Inherited from parent role(s)" : ""}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                border: inheritedOn ? "1px dashed #cbd5e1" : "1px solid #e5e7eb",
                                borderRadius: 10,
                                padding: "8px 10px",
                                background: checked ? "#f0fdf4" : "#fff",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleGrant(k)}
                              />
                              <span>{k}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" onClick={save}>Save</button>
                  {editing?.id && (
                    <button className="btn danger" onClick={() => remove(editing)}>
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .btn { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; cursor: pointer; }
        .btn:hover { background: #f9fafb; }
        .btn.primary { background: #7c3aed; color: #fff; border-color: #7c3aed; }
        .btn.primary:hover { background: #6d28d9; }
        .btn.danger { color: #b91c1c; border-color: #fca5a5; background: #fff5f5; }
        .input__field { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; width: 100%; }
        .input__label { font-size: 14px; color: #6b7280; }
        .muted { color: #6b7280; }
        .muted.sm { font-size: 12px; }
        .chip { font: inherit; background: #fff; }
      `}</style>
    </section>
  );
}

/** Hide empty categories in diff mode */
function shouldShowSection(keys, inherited, diffOnly) {
  if (!diffOnly) return true;
  return keys.some((k) => !inherited[k]);
}

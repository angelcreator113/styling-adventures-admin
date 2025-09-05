// src/pages/admin/manage/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { fx } from "@/utils/functions"; // region-bound getFunctions()
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import { auth } from "@/utils/init-firebase"; // current user token
import toast, { Toaster } from "react-hot-toast";

/* ---------- emulator base url helper ---------- */
function emulatorBase() {
  const useEmu =
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true" ||
    import.meta.env.VITE_USE_EMULATORS === "true";

  if (!useEmu) return null;

  const raw =
    import.meta.env.VITE_FUNCTIONS_EMULATOR ||
    import.meta.env.VITE_EMU_FUNCTIONS ||
    "127.0.0.1:5001";

  const cleaned = String(raw).replace(/^https?:\/\//, "");
  const [host, portStr] = cleaned.split(":");
  const port = Number(portStr || 5001);

  const project =
    import.meta.env.VITE_FUNCTIONS_PROJECT ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.VITE_GCLOUD_PROJECT ||
    "styling-admin";

  const region = import.meta.env.VITE_FUNCTIONS_REGION || "us-central1";
  return `http://${host || "127.0.0.1"}:${port}/${project}/${region}`;
}

/* ---------- auth token helper ---------- */
async function getIdTokenMaybe(force = false) {
  const u = auth.currentUser;
  try {
    return u ? await u.getIdToken(force) : null;
  } catch {
    return null;
  }
}

/* ---------- improved callable wrapper: SDK -> emulator HTTP (two paths) with rich errors ---------- */
async function callFn(name, payload) {
  // 1) SDK first (prod + emulator when connectFunctionsEmulator ran)
  try {
    const callable = httpsCallable(fx(), name);
    const res = await callable(payload || {});
    return { data: res?.data ?? null };
  } catch (err) {
    // Decide whether to fallback to raw HTTP on the emulator
    const base =
      (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true" ||
        import.meta.env.VITE_USE_EMULATORS === "true") &&
      (() => {
        const raw =
          import.meta.env.VITE_FUNCTIONS_EMULATOR ||
          import.meta.env.VITE_EMU_FUNCTIONS ||
          "127.0.0.1:5001";
        const cleaned = String(raw).replace(/^https?:\/\//, "");
        const [host, portStr] = cleaned.split(":");
        const port = Number(portStr || 5001);
        const project =
          import.meta.env.VITE_FUNCTIONS_PROJECT ||
          import.meta.env.VITE_FIREBASE_PROJECT_ID ||
          import.meta.env.VITE_GCLOUD_PROJECT ||
          "styling-admin";
        const region = import.meta.env.VITE_FUNCTIONS_REGION || "us-central1";
        return `http://${host || "127.0.0.1"}:${port}/${project}/${region}`;
      })();

    const msg = String(
      err?.message?.replace(/^.*?:\s*/, "") ||
        err?.details?.message ||
        err?.details ||
        err
    );
    const code = err?.code || "";

    const canFallback =
      base &&
      (code === "functions/internal" ||
        code === "internal" ||
        msg.includes("Failed to fetch") ||
        msg.includes("CORS") ||
        msg.includes("fetch"));

    if (!canFallback) throw new Error(code ? `${code}: ${msg}` : msg);

    // 2) Emulator HTTP fallback — include Firebase ID token
    const getIdToken = async (force) => {
      try {
        return auth.currentUser ? await auth.currentUser.getIdToken(force) : null;
      } catch {
        return null;
      }
    };

    const post = async (url, token) => {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: payload || {} }), // callable expects {data: ...}
        mode: "cors",
      });
      let json = null;
      try {
        json = await res.json();
      } catch {
        // ignore
      }
      return { ok: res.ok, status: res.status, json };
    };

    const token0 = await getIdToken(false);

    // Try v2-style path first: /<project>/<region>/<name>
    let r = await post(`${base}/${name}`, token0);

    // If 404, try the 'callable:' route used in some emulator combos
    if (r.status === 404) {
      r = await post(`${base}/callable:${name}`, token0);
    }

    // If unauthorized, refresh token and retry once (both routes)
    if (!r.ok && (r.status === 401 || r.status === 403)) {
      const token1 = await getIdToken(true);
      r = await post(`${base}/${name}`, token1);
      if (r.status === 404) {
        r = await post(`${base}/callable:${name}`, token1);
      }
    }

    if (!r.ok) {
      // Show the most helpful thing we can find
      const e =
        r.json?.error?.message ||
        r.json?.error ||
        r.json?.details ||
        r.json?.result?.error ||
        `HTTP ${r.status}`;
      throw new Error(e);
    }

    // Emulator wraps onCall returns as { result: ... }
    return { data: r.json?.result ?? r.json ?? null };
  }
}

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("fan");
  const [cap, setCap] = useState("");
  const [inviteIfMissing, setInviteIfMissing] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);

  // admin role defs
  const [defs, setDefs] = useState([]); // [{id, name, grants}]
  const [adminRoles, setAdminRoles] = useState([]); // selected ids
  const [current, setCurrent] = useState(null); // current claims for looked-up user

  // Live role definitions
  useEffect(() => {
    const off = onSnapshot(collection(db, "adminRoleDefs"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() || {}) }))
        .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
      setDefs(list);
    });
    return () => off();
  }, []);

  async function lookup() {
    const clean = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(clean)) {
      toast.error("Enter a valid email first.");
      return;
    }
    try {
      const res = await callFn("lookupUserByEmail", { email: clean });
      if (res?.data?.found) {
        setCurrent(res.data);
        const claims = res.data.claims || {};
        setRole(claims.role || (claims.admin ? "admin" : "fan"));
        setAdminRoles(Array.isArray(claims.adminRoles) ? claims.adminRoles : []);
        toast.success("User found.");
      } else {
        setCurrent(null);
        toast("No existing account. You can invite them.");
      }
    } catch (e) {
      toast.error(`Lookup failed: ${e.message || e}`);
    }
  }

  async function save(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(clean)) {
      toast.error("Enter a valid email.");
      return;
    }

    const payload = {
      email: clean,
      role,
      createIfMissing: inviteIfMissing,
      sendInvite,
    };

    if (role === "creator" && cap !== "") {
      const n = Number(cap);
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Spaces cap must be ≥ 0.");
        return;
      }
      payload.spacesCap = n;
    }
    if (role === "admin") {
      payload.adminRoles = adminRoles;
    }

    try {
      toast.loading("Saving…", { id: "saving" });
      const res = await callFn("inviteOrAssignUser", payload);
      toast.dismiss("saving");
      if (res?.data?.ok) {
        const created = res.data.created ? " (invited/new)" : "";
        toast.success(`Updated ${clean} → ${role}${created}`);
        setCurrent({ uid: res.data.uid, claims: res.data.claims, found: true });
      } else {
        toast.error("Failed to save.");
      }
    } catch (e) {
      toast.dismiss("saving");
      const msg = String(e?.message || e);
      if (msg.includes("permission-denied")) toast.error("Admins only.");
      else if (msg.includes("invalid-argument")) toast.error("Invalid inputs.");
      else toast.error(`Save failed: ${msg}`);
    }
  }

  const defsById = useMemo(() => {
    const m = new Map();
    defs.forEach((d) => m.set(d.id, d));
    return m;
  }, [defs]);

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />
      <div
        className="dashboard-card"
        style={{ padding: 16, display: "grid", gap: 16, maxWidth: 760 }}
      >
        <header>
          <h1 className="page-title" style={{ marginTop: 0 }}>
            Manage Users (Roles)
          </h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Assign base roles and (optionally) admin sub-roles. Invite new users
            by email.
          </p>
        </header>

        <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label className="input__label" htmlFor="user-email">
              User email
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="user-email"
                type="email"
                className="input__field"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn" onClick={lookup}>
                Lookup
              </button>
            </div>
            {current && (
              <div className="muted">
                Current: role=
                <code>
                  {current.claims?.role || (current.claims?.admin ? "admin" : "fan")}
                </code>{" "}
                {Array.isArray(current.claims?.adminRoles) &&
                current.claims.adminRoles.length ? (
                  <>
                    adminRoles=
                    <code>{current.claims.adminRoles.join(", ")}</code>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label className="input__label" htmlFor="user-role">
              Base role
            </label>
            <select
              id="user-role"
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="fan">Fan</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === "creator" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label className="input__label" htmlFor="spaces-cap">
                Spaces Cap (optional)
              </label>
              <input
                id="spaces-cap"
                type="number"
                min={0}
                className="input__field"
                placeholder="e.g. 2"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
              />
              <div className="muted">
                Stored at <code>users/&lt;uid&gt;/settings/profile.spacesCap</code>.
              </div>
            </div>
          )}

          {role === "admin" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label className="input__label">Admin sub-roles</label>
              {defs.length === 0 ? (
                <div className="muted">
                  No role definitions yet. Create them in Role Definitions.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  }}
                >
                  {defs.map((d) => {
                    const checked = adminRoles.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="chip"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: "8px 10px",
                          background: checked ? "#eef2ff" : "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAdminRoles((prev) =>
                              checked
                                ? prev.filter((x) => x !== d.id)
                                : [...prev, d.id]
                            )
                          }
                        />
                        <span>{d.name || d.id}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="muted sm">
                Only <b>Super Admins</b> can change admin sub-roles.
              </div>
            </div>
          )}

          <div
            style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={inviteIfMissing}
                onChange={(e) => setInviteIfMissing(e.target.checked)}
              />
              Invite if not found
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
              />
              Email invite link
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit">
              Save
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEmail("");
                setRole("fan");
                setAdminRoles([]);
                setCap("");
                setCurrent(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

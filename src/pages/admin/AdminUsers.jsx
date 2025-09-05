import React, { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { fx } from "@/utils/functions";            // region-aware getFunctions()
import { auth, db } from "@/utils/init-firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import toast, { Toaster } from "react-hot-toast";

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("fan");
  const [cap, setCap] = useState("");
  const [adminDefs, setAdminDefs] = useState([]);       // [{id,name,grants}]
  const [selectedAdminRoles, setSelectedAdminRoles] = useState([]); // ['superAdmin', 'contentManager']

  // Load available admin sub-roles live from Firestore: /adminRoleDefs/*
  useEffect(() => {
    const qy = query(collection(db, "adminRoleDefs"), orderBy("name"));
    const off = onSnapshot(qy, (snap) => {
      setAdminDefs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return off;
  }, []);

  function notify(type, msg) {
    return type === "error" ? toast.error(msg) : toast.success(msg);
  }

  async function refreshMyRole() {
    try {
      const user = auth.currentUser;
      if (!user) return notify("error", "Not signed in.");
      toast.loading("Refreshing role…", { id: "refresh-role" });
      await user.getIdToken(true);           // force-refresh custom claims
      toast.dismiss("refresh-role");
      notify("success", "Role refreshed! Reloading…");
      setTimeout(() => window.location.reload(), 300);
    } catch {
      toast.dismiss("refresh-role");
      notify("error", "Couldn’t refresh role.");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      return notify("error", "Enter a valid email address.");
    }

    const payload = { email: cleanEmail, role };

    if (role === "creator" && cap !== "") {
      const n = Number(cap);
      if (!Number.isFinite(n) || n < 0) return notify("error", "Spaces cap must be ≥ 0.");
      payload.spacesCap = n;
    }

    if (role === "admin") {
      payload.adminRoles = selectedAdminRoles; // array of sub-role IDs
    }

    try {
      const call = httpsCallable(fx(), "setUserRole");
      toast.loading("Updating role…", { id: "role" });
      const res = await call(payload);
      toast.dismiss("role");

      if (res?.data?.ok) {
        notify(
          "success",
          `Updated: ${cleanEmail} → ${role}${
            payload.spacesCap != null ? ` (spaces: ${payload.spacesCap})` : ""
          }${payload.adminRoles?.length ? ` [${payload.adminRoles.join(", ")}]` : ""}`
        );
        setEmail(""); setCap(""); setRole("fan"); setSelectedAdminRoles([]);
      } else {
        notify("error", "Something went wrong.");
      }
    } catch (err) {
      toast.dismiss("role");
      const msg = String(err?.message || err);
      if (msg.includes("permission-denied")) return notify("error", "Admins only.");
      if (msg.includes("not-found"))         return notify("error", "User not found.");
      if (msg.includes("invalid-argument"))  return notify("error", "Invalid inputs.");
      notify("error", "Failed to update role.");
    }
  }

  const toggleAdminRole = (id) => {
    setSelectedAdminRoles((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />

      <div className="dashboard-card" style={{ padding: 16, display: "grid", gap: 16 }}>
        <header>
          <h1 className="page-title" style={{ marginTop: 0 }}>Manage Users (Roles)</h1>
          <p className="muted">Admins only. Assign Fan/Creator/Admin and optional sub-roles.</p>
        </header>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 600 }}>
          <div>
            <label className="input__label" htmlFor="user-email">User email</label>
            <input
              id="user-email"
              type="email"
              className="input__field"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label className="input__label" htmlFor="user-role">Role</label>
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
            <div>
              <label className="input__label" htmlFor="spaces-cap">Spaces Cap (optional)</label>
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
            <div>
              <div className="input__label">Admin sub-roles</div>
              <div style={{ display: "grid", gap: 8 }}>
                {adminDefs.length === 0 && (
                  <div className="muted">No sub-roles defined yet. Create docs in <code>adminRoleDefs</code>.</div>
                )}
                {adminDefs.map((r) => (
                  <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedAdminRoles.includes(r.id)}
                      onChange={() => toggleAdminRole(r.id)}
                    />
                    <span style={{ fontWeight: 600 }}>{r.name || r.id}</span>
                    {r.description && <span className="muted">— {r.description}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" type="submit">Save</button>
            <button className="btn" type="button" onClick={() => { setEmail(""); setCap(""); setRole("fan"); setSelectedAdminRoles([]); }}>
              Reset
            </button>
          </div>
        </form>

        <div className="hr" />
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost" type="button" onClick={refreshMyRole}>
            Refresh my role
          </button>
          <span className="muted">After changing claims, click this to pull new custom claims.</span>
        </div>
      </div>
    </section>
  );
}

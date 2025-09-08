import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/utils/init-firebase";
import { useAuth } from "@/context/AuthContext";
import { setAdminPin, clearAdminPin, expireAdminSession } from "@/utils/pins-api";

function randomPin(len = 6) {
  const min = 10 ** (len - 1);
  const max = 10 ** len - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export default function AdminPins() {
  const { role, claims } = useAuth() ?? {};
  const canManage = role === "admin" && claims?.adminScopes?.["admins.manage"] === true;
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Assume you mark admins in /users with role == 'admin'
      const qAdmin = query(collection(db, "users"), where("role", "==", "admin"));
      const snap = await getDocs(qAdmin);
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })));
      setLoading(false);
    })();
  }, []);

  async function doSet(uid, pin) {
    setMessage("");
    try {
      await setAdminPin(uid, pin);
      setMessage("PIN set successfully.");
    } catch (e) {
      setMessage(e?.message || "Failed to set PIN.");
    }
  }
  async function doGen(uid, len = 6) {
    const pin = randomPin(len);
    await doSet(uid, pin);
    // Show once — tell admin to copy it now.
    window?.toast?.info?.(`New PIN for ${uid}: ${pin} (copy now; shown once)`);
  }
  async function doClear(uid) {
    setMessage("");
    try {
      await clearAdminPin(uid);
      setMessage("PIN cleared.");
    } catch (e) {
      setMessage(e?.message || "Failed to clear PIN.");
    }
  }
  async function doExpire(uid) {
    setMessage("");
    try {
      await expireAdminSession(uid);
      setMessage("Active admin session expired.");
    } catch (e) {
      setMessage(e?.message || "Failed to expire session.");
    }
  }

  if (!canManage) {
    return (
      <section className="container" style={{ padding: 16 }}>
        <div className="dashboard-card">You don’t have permission to manage admin PINs.</div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h2 style={{ marginTop: 0 }}>Admin PINs</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Generate, assign, clear, or expire admin PINs. PINs are unique, hashed server-side, and not retrievable after set.
        </p>
        {message && (
          <div style={{ marginTop: 8 }} className="muted">
            {message}
          </div>
        )}
        {loading ? (
          <div style={{ marginTop: 12 }}>Loading…</div>
        ) : admins.length === 0 ? (
          <div style={{ marginTop: 12 }}>No admins found.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {admins.map((u) => (
              <div key={u.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 8,
                padding: 10, border: "1px solid #eee", borderRadius: 8
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.displayName || u.email || u.id}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                </div>
                <button className="btn sm" onClick={() => doGen(u.id, 6)}>Generate 6-digit</button>
                <button className="btn sm" onClick={() => {
                  const pin = prompt("Enter new PIN (6–8 digits):", "");
                  if (!pin) return;
                  if (!/^\d{6,8}$/.test(pin)) return window?.toast?.error?.("PIN must be 6–8 digits.");
                  doSet(u.id, pin);
                }}>Set custom</button>
                <button className="btn sm" onClick={() => doExpire(u.id)}>Expire session</button>
                <button className="btn sm danger" onClick={() => doClear(u.id)}>Clear PIN</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

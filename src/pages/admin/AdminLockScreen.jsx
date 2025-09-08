import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/utils/init-firebase";

export default function AdminLockScreen() {
  const [pin, setPin] = useState("");
  const [rememberToday, setRememberToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e?.preventDefault?.();
    if (!pin) return;
    setLoading(true);
    setErr("");
    try {
      const fn = httpsCallable(getFunctions(app), "adminVerifyPin");
      const { data } = await fn({ pin, rememberToday }); // rememberToday is optional
      if (data?.ok) {
        sessionStorage.setItem("admin_pin_ok", "1");
        if (data.validUntil) {
          sessionStorage.setItem("admin_pin_until", String(data.validUntil));
        } else {
          // 2h fallback TTL if server didn’t return one
          const twoHours = Date.now() + 2 * 60 * 60 * 1000;
          sessionStorage.setItem("admin_pin_until", String(twoHours));
        }
        nav("/admin");
      } else {
        setErr("Invalid PIN");
      }
    } catch (e2) {
      setErr(e2?.message || "PIN verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Admin PIN</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Enter your personal admin PIN to unlock the console.
        </p>

        {err && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fecaca",
            color: "#991b1b", borderRadius: 8, padding: "8px 10px", marginTop: 8
          }}>
            {err}
          </div>
        )}

        <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input
            className="input"
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="6–8 digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D+/g, "").slice(0, 8))}
          />
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={rememberToday}
              onChange={(e) => setRememberToday(e.target.checked)}
            />
            Remember for today
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" disabled={loading || pin.length < 6}>
              {loading ? "Verifying…" : "Unlock"}
            </button>
            <button type="button" className="btn" onClick={() => history.back()} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

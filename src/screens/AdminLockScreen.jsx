// src/pages/admin/AdminLockScreen.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/utils/init-firebase";

function remTodayMs() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime() - now.getTime();
}

export default function AdminLockScreen() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberToday, setRememberToday] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e?.preventDefault?.();
    if (!/^\d{6,8}$/.test(pin)) {
      setErr("Enter a 6–8 digit PIN.");
      return;
    }
    setBusy(true); setErr("");
    try {
      const fns = getFunctions(app, "us-central1");
      const verify = httpsCallable(fns, "adminVerifyPin");
      const res = await verify({ pin });
      const until = Number(res?.data?.sessionUntil) || 0;

      // store the session
      sessionStorage.setItem("admin_pin_ok", "1");
      sessionStorage.setItem(
        "admin_pin_until",
        String(rememberToday ? (Date.now() + remTodayMs()) : until)
      );

      // go in
      nav("/admin", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Admin Console Locked</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Enter your personal Admin PIN to continue.
        </p>

        {err && (
          <div style={{ background:"#fee2e2", border:"1px solid #fecaca",
                        color:"#991b1b", borderRadius:8, padding:"8px 10px", margin:"10px 0" }}>
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="6–8 digits"
            value={pin}
            onChange={(e)=>setPin(e.target.value.replace(/\D+/g,""))}
            maxLength={8}
          />
          <label style={{ display:"flex", gap:8, alignItems:"center", marginTop:10 }}>
            <input
              type="checkbox"
              checked={rememberToday}
              onChange={(e)=>setRememberToday(e.target.checked)}
            />
            Remember for today
          </label>

          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button className="btn primary" disabled={busy} onClick={submit}>
              {busy ? "Checking…" : "Unlock"}
            </button>
            <a className="btn" href="/home">Cancel</a>
          </div>
        </form>

        <details style={{ marginTop: 14 }}>
          <summary>Need a PIN?</summary>
          <p className="muted" style={{ marginTop: 6 }}>
            Ask a super-admin to assign you a PIN in Admin → PINs.
          </p>
        </details>
      </div>
    </section>
  );
}


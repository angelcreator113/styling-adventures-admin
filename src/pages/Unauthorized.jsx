// src/pages/Unauthorized.jsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const PIN_MIN = 6;
const PIN_MAX = 8;

export default function Unauthorized() {
  const nav = useNavigate();
  const location = useLocation();
  const { role, user, signOut } = useAuth() ?? {};
  const isAdmin = role === "admin";

  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqDone, setReqDone] = useState(false);
  const pinRef = useRef(null);

  const nextAfterUnlock = useMemo(() => {
    const from = location.state?.from;
    if (typeof from === "string" && from.startsWith("/admin/")) return from;
    return "/admin/home";
  }, [location.state]);

  async function unlock(e) {
    e?.preventDefault?.();
    setErr("");
    const cleaned = (pin || "").trim();
    if (!/^\d{6,8}$/.test(cleaned)) {
      setErr(`Please enter a ${PIN_MIN}–${PIN_MAX} digit PIN.`);
      pinRef.current?.focus();
      return;
    }
    try {
      setBusy(true);
      const fn = httpsCallable(getFunctions(), "adminVerifyPin");
      const res = await fn({ pin: cleaned });
      const until = Number(res?.data?.sessionUntil || 0);
      if (!until) throw new Error("Invalid server response.");
      sessionStorage.setItem("admin_pin_ok", "1");
      sessionStorage.setItem("admin_pin_until", String(until));
      setPin("");
      nav(nextAfterUnlock, { replace: true });
    } catch (e2) {
      setErr(e2?.message || "PIN check failed.");
      pinRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function requestAccess() {
    if (!user) return;
    setReqBusy(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, "adminAccessRequests"), {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        role: role || "fan",
        reason: "Requesting access to Styling Adventures Studio (admin console).",
        createdAt: serverTimestamp(),
        status: "pending",
      });
      setReqDone(true);
      window?.toast?.success?.("Request sent! We’ll review it shortly.");
    } catch (e) {
      // Fallback mailto if Firestore write is blocked for any reason
      const sub = encodeURIComponent("Admin access request");
      const body = encodeURIComponent(
        `Hi Team,\n\nI'd like access to the Styling Adventures Studio.\n\nUID: ${user.uid}\nEmail: ${user.email || ""}\nReason: (add any context here)\n\nThanks!`
      );
      window.location.href = `mailto:support@stylingadventures.example?subject=${sub}&body=${body}`;
    } finally {
      setReqBusy(false);
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <div
        className="dashboard-card"
        style={{
          maxWidth: 820,
          margin: "40px auto",
          padding: 24,
          borderRadius: 16,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>
            Bestie, come enter{" "}
            <span style={{ color: "#7c3aed" }}>Styling Adventures Studio</span> ✨
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            This area is for studio staff. If you have a pass, step right in!
          </p>
        </div>

        {isAdmin ? (
          <form
            onSubmit={unlock}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 16,
              display: "grid",
              gap: 10,
              background: "#faf8ff",
            }}
          >
            <label className="muted" htmlFor="studio-pin">Studio PIN</label>
            <input
              id="studio-pin"
              ref={pinRef}
              className="input"
              inputMode="numeric"
              pattern="^[0-9]{6,8}$"
              placeholder="Enter your 6–8 digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/[^\d]/g, "").slice(0, PIN_MAX))
              }
              aria-describedby="pin-help"
              disabled={busy}
              autoFocus
              style={{ maxWidth: 280 }}
            />
            <div id="pin-help" className="muted" style={{ fontSize: 12 }}>
              Your studio pass unlocks the console for a short time on this device.
            </div>
            {err && (
              <div
                role="alert"
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                {err}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? "Checking…" : "Unlock Studio"}
              </button>
              <button className="btn" type="button" onClick={() => nav("/")} disabled={busy}>
                Back to Home
              </button>
            </div>
          </form>
        ) : (
          <div
            style={{
              border: "1px dashed #e9d5ff",
              borderRadius: 12,
              padding: 16,
              background: "#fcfaff",
              display: "grid",
              gap: 10,
            }}
          >
            <p style={{ margin: 0 }}>
              You’re signed in as a <strong>fan</strong>. The studio console is for staff only.
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => nav("/")}>Go to Home</button>
              <button className="btn" onClick={() => nav("/boards")}>Explore Boards</button>

              <button
                className="btn"
                disabled={reqBusy || reqDone}
                onClick={requestAccess}
                title="Ask the team to grant you studio access"
              >
                {reqDone ? "Request sent ✓" : (reqBusy ? "Sending…" : "Request access")}
              </button>

              <button
                className="btn"
                onClick={async () => { await signOut?.(); nav("/"); }}
              >
                Sign out
              </button>
            </div>

            <div className="muted" style={{ fontSize: 12 }}>
              If you’re staff, sign in with your admin account and come back.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// src/pages/AcceptInvitePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/utils/init-firebase";

/** Build the acceptInvite endpoint URL for dev (emulator) or prod. */
function acceptInviteUrl() {
  // Prefer explicit emulator override if provided
  const explicit = import.meta.env.VITE_FUNCTIONS_EMULATOR?.trim();
  const useEmu =
    import.meta.env.VITE_USE_EMULATORS === "false" ||
    (explicit && explicit.startsWith("http"));

  const projectId =
    import.meta.env.VITE_FUNCTIONS_PROJECT ||
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.VITE_GCLOUD_PROJECT ||
    "styling-admin";

  const region = import.meta.env.VITE_FUNCTIONS_REGION || "us-central1";

  if (useEmu) {
    const base = explicit || `http://127.0.0.1:5001`;
    // http://127.0.0.1:5001/<project>/<region>/<function>
    return `${base}/${projectId}/${region}/acceptInvite`;
  }

  // Deployed Functions HTTPS URL
  return `https://${region}-${projectId}.cloudfunctions.net/acceptInvite`;
}

export default function AcceptInvitePage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const run = useCallback(async () => {
    try {
      setLoading(true);
      setMsg("Checking invite…");

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code")?.trim();

      if (!code) {
        setMsg("Missing invite code.");
        setLoading(false);
        return;
      }

      const res = await fetch(acceptInviteUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        mode: "cors",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.customToken) {
        setMsg(data?.error || "Invite is invalid or expired.");
        setLoading(false);
        return;
      }

      await signInWithCustomToken(auth, data.customToken);
      window.location.replace("/home");
    } catch {
      setMsg("Something went wrong while accepting the invite.");
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card" style={{ padding: 16, maxWidth: 640 }}>
        <h1 style={{ marginTop: 0 }}>Accept invite</h1>
        <p className="muted" style={{ marginTop: 4 }}>{msg || "…"}</p>

        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <button className="btn" onClick={run} disabled={loading}>
            {loading ? "Working…" : "Try again"}
          </button>
          <a className="btn" href="/login" aria-disabled={loading} onClick={e => loading && e.preventDefault()}>
            Go to login
          </a>
          {loading && (
            <span
              aria-hidden
              style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid #ddd", borderTopColor: "#7c3aed",
                animation: "spin .9s linear infinite"
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        .btn { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; cursor: pointer; }
        .btn[disabled], a.btn[aria-disabled="true"] { opacity: .6; pointer-events: none; }
        .btn:hover { background:#f9fafb; }
        .muted { color:#6b7280; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}


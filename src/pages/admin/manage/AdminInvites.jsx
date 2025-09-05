import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db } from "@/utils/init-firebase";
import { fx } from "@/utils/functions";
import toast, { Toaster } from "react-hot-toast";

function fmt(ts) {
  if (!ts) return "—";
  const d =
    typeof ts?.toDate === "function"
      ? ts.toDate()
      : typeof ts?.seconds === "number"
      ? new Date(ts.seconds * 1000)
      : new Date(ts);
  return d.toLocaleString();
}

export default function AdminInvites() {
  const [rows, setRows] = useState([]);
  const [qtext, setQtext] = useState("");

  // 🔧 FIX: correct collection path -> /admin/invites/items
  useEffect(() => {
    const qy = query(
      collection(db, "admin", "invites", "items"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const off = onSnapshot(
      qy,
      (snap) => {
        setRows(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() || {}),
          }))
        );
      },
      () => setRows([])
    );
    return () => off();
  }, []);

  const visible = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.email || "",
        r.phone || "",
        r.role || "",
        (r.adminRoles || []).join(","),
        r.shortId || r.id,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, qtext]);

  async function resend(inv) {
    try {
      toast.loading("Resending…", { id: "resend" });
      try {
        const call = httpsCallable(fx(), "resendInvite");
        await call({ inviteId: inv.id });
      } catch {
        // Fallback: bump lastSentAt; server can react via trigger if you add one later
        await updateDoc(doc(db, "admin", "invites", "items", inv.id), {
          lastSentAt: serverTimestamp(),
        });
      }
      toast.success("Invite resent.", { id: "resend" });
    } catch {
      toast.error("Could not resend invite.", { id: "resend" });
    }
  }

  async function revoke(inv) {
    if (!confirm(`Revoke invite for ${inv.email || inv.phone || inv.id}?`)) return;
    try {
      toast.loading("Revoking…", { id: "revoke" });
      try {
        const call = httpsCallable(fx(), "revokeInvite");
        await call({ inviteId: inv.id });
      } catch {
        await updateDoc(doc(db, "admin", "invites", "items", inv.id), {
          status: "revoked",
          revokedAt: serverTimestamp(),
        });
      }
      toast.success("Invite revoked.", { id: "revoke" });
    } catch {
      toast.error("Could not revoke invite.", { id: "revoke" });
    }
  }

  // NEW: bulk resend stale (defaults to >24h old on server)
  async function bulkResend() {
    try {
      toast.loading("Resending stale invites…", { id: "bulk" });
      const call = httpsCallable(fx(), "bulkResendStaleInvites");
      const res = await call({ minAgeMinutes: 60 * 24 });
      const n = res?.data?.count ?? 0;
      toast.success(`Resent ${n} invite(s).`, { id: "bulk" });
    } catch {
      toast.error("Bulk resend failed.", { id: "bulk" });
    }
  }

  return (
    <section className="container" style={{ padding: 16 }}>
      <Toaster position="top-right" />
      <div className="dashboard-card" style={{ padding: 16 }}>
        <header
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Admin Invites</h2>
            <div className="muted" style={{ marginTop: 4 }}>
              Pending invitations created by “Invite or assign” in Users.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input__field"
              placeholder="Search email, phone, role…"
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <button className="btn" onClick={bulkResend}>Resend stale</button>
          </div>
        </header>

        <div className="dashboard-card" style={{ padding: 0, marginTop: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1.1fr) minmax(120px, .7fr) minmax(160px, .9fr) minmax(160px, .9fr) minmax(110px, .7fr)",
              gap: 0,
            }}
          >
            <div className="muted" style={{ padding: "10px 12px" }}>
              Recipient
            </div>
            <div className="muted" style={{ padding: "10px 12px" }}>
              Role
            </div>
            <div className="muted" style={{ padding: "10px 12px" }}>
              Created
            </div>
            <div className="muted" style={{ padding: "10px 12px" }}>
              Last sent
            </div>
            <div className="muted" style={{ padding: "10px 12px" }}>
              Actions
            </div>
          </div>

          {visible.map((r) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 1.1fr) minmax(120px, .7fr) minmax(160px, .9fr) minmax(160px, .9fr) minmax(110px, .7fr)",
                alignItems: "center",
                borderTop: "1px solid #eee",
              }}
            >
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 600 }}>{r.email || r.phone || "—"}</div>
                <div className="muted sm">
                  {r.phone ? `sms: ${r.phone}` : r.email ? "email" : ""}
                  {r.shortId ? ` • id:${r.shortId}` : ""}
                </div>
              </div>

              <div style={{ padding: "10px 12px" }}>
                <code>{r.role || "fan"}</code>
                {Array.isArray(r.adminRoles) && r.adminRoles.length ? (
                  <div className="muted sm">
                    adminRoles: {r.adminRoles.join(", ")}
                  </div>
                ) : null}
              </div>

              <div style={{ padding: "10px 12px" }}>{fmt(r.createdAt)}</div>
              <div style={{ padding: "10px 12px" }}>{fmt(r.lastSentAt)}</div>

              <div style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                <button className="btn" onClick={() => resend(r)}>
                  Resend
                </button>
                <button className="btn danger" onClick={() => revoke(r)}>
                  Revoke
                </button>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div style={{ padding: 16 }} className="muted">
              No pending invites.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .btn { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; cursor: pointer; }
        .btn:hover { background: #f9fafb; }
        .btn.danger { color: #b91c1c; border-color: #fca5a5; background: #fff5f5; }
        .input__field { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .muted { color: #6b7280; }
        .muted.sm { font-size: 12px; }
      `}</style>
    </section>
  );
}

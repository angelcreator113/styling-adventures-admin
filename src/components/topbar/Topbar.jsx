import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TopbarAccountMenu from "@/components/TopbarAccountMenu.jsx";
import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx";

export default function Topbar() {
  const nav = useNavigate();
  const { displayName, role: primaryRole } = useAuth() ?? {};
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!btnRef.current) return;
      if (!btnRef.current.parentElement.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <div
      className="topbar"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => nav("/home")}
          className="brand"
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: "#6d28d9",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: 0,
          }}
          aria-label="Go to Home"
        >
          Styling Adventures
        </button>
        <span
          style={{
            fontSize: 12,
            color: "#9aa1a9",
            borderLeft: "1px solid #eee",
            paddingLeft: 10,
          }}
        >
          {(primaryRole || "fan").toUpperCase()}
        </span>
      </div>

      {primaryRole === "admin" && (
        <div style={{ marginRight: 6 }}>
          <RoleSwitcherTopbar />
        </div>
      )}

      <div style={{ position: "relative" }}>
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 10,
            padding: "6px 10px",
          }}
        >
          {displayName || "Account"} ▾
        </button>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              marginTop: 6,
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,.06), 0 1px 0 rgba(0,0,0,.04)",
              minWidth: 180,
              zIndex: 50,
              padding: 6,
            }}
          >
            <TopbarAccountMenu onClose={() => setMenuOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}


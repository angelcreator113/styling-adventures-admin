import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/utils/auth-client";

export default function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Always call hooks unconditionally
  const auth = useAuth() || {};
  const role = auth.role || "fan";

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        // restore focus to trigger
        anchorRef.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close whenever the route changes
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="avatar-wrap menu-anchor" ref={anchorRef}>
      <button
        id="avatar-trigger"
        className="icon-btn avatar-btn"
        aria-haspopup="menu"
        aria-controls="avatar-menu"
        aria-expanded={open ? "true" : "false"}
        title="Account menu"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="user" />
      </button>

      {open && (
        <div
          id="avatar-menu"
          ref={menuRef}
          className="menu topbar-panel"
          data-topbar-panel
          role="menu"
          aria-labelledby="avatar-trigger"
          style={{ minWidth: 240 }}
        >
          <Link to="/profile"  role="menuitem" className="menu-item" onClick={() => setOpen(false)}>Profile</Link>
          <Link to="/settings" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>Settings</Link>
          <Link to="/billing"  role="menuitem" className="menu-item" onClick={() => setOpen(false)}>Payments</Link>

          {/* Optional role shortcuts */}
          {role === "admin"   && (
            <Link to="/admin" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
              Admin Console
            </Link>
          )}
          {role === "creator" && (
            <Link to="/creator" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
              Creator Console
            </Link>
          )}

          <a
            href="https://help.example.com"
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            className="menu-item"
            onClick={() => setOpen(false)}
          >
            Help
          </a>

          <div className="menu-sep" role="separator" />

          <button type="button" className="menu-item danger" role="menuitem" onClick={doLogout}>
            <span style={{ marginRight: 8 }}>🚪</span> Logout
          </button>
        </div>
      )}
    </div>
  );
}

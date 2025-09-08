// src/components/TopbarAccountMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function pinValid() {
  const ok = sessionStorage.getItem("admin_pin_ok") === "1";
  const until = Number(sessionStorage.getItem("admin_pin_until") || 0);
  if (!ok) return false;
  if (until && Date.now() > until) {
    sessionStorage.removeItem("admin_pin_ok");
    sessionStorage.removeItem("admin_pin_until");
    return false;
  }
  return true;
}

export default function TopbarAccountMenu({ onClose }) {
  const { role, signOut, user } = useAuth() ?? {};
  // be strict about admin detection:
  const isAdmin =
    role === "admin" ||
    user?.claims?.admin === true ||
    user?.claims?.role === "admin";

  const nav = useNavigate();

  const goAdmin = () => {
    onClose?.();
    // leave “view as” if it exists (harmless for fans)
    sessionStorage.removeItem("viewAsRole");
    nav(pinValid() ? "/admin" : "/unauthorized");
  };

  const doSignOut = async () => {
    sessionStorage.removeItem("admin_pin_ok");
    sessionStorage.removeItem("admin_pin_until");
    sessionStorage.removeItem("viewAsRole");
    await signOut?.();
    nav("/");
  };

  return (
    <div className="menu">
      <button className="menu-item" onClick={() => { onClose?.(); nav("/"); }}>Home</button>
      <button className="menu-item" onClick={() => { onClose?.(); nav("/boards"); }}>Boards</button>

      {isAdmin && (
        <button className="menu-item" onClick={goAdmin}>Admin Console</button>
      )}

      <button className="menu-item" onClick={doSignOut}>Sign out</button>
    </div>
  );
}

import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";

/** Session helpers (8h TTL by default) */
export function isAdminPinValid() {
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

export default function RequireAdminPin() {
  const loc = useLocation();
  if (!isAdminPinValid()) {
    // bounce to lock screen; remember where we tried to go
    return <Navigate to="/admin/locked" replace state={{ from: loc.pathname + loc.search }} />;
  }
  return <Outlet />;
}

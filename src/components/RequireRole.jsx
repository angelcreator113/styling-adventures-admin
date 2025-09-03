import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/RoleGates";

/**
 * Single source of truth for role-gating.
 * props:
 *  - role: "admin" | "creator" | "fan"
 *  - allowAdmin: if true, admins can enter non-admin areas
 */
export default function RequireRole({ role: need, allowAdmin = true, children }) {
  const location = useLocation();
  const { user } = useAuth();

  // Call hooks unconditionally
  const { effectiveRole, primaryRole, loading, viewAs } = useUserRole();

  // Helpful debug - prints which module Vite actually loaded + guard config
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("[RequireRole] file:", import.meta.url, {
      need,
      allowAdmin,
      path: location.pathname,
    });
  }, [need, allowAdmin, location.pathname]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <span aria-busy="true" aria-live="polite">Checking permissions…</span>
      </div>
    );
  }

  // Normalize roles
  const primary = primaryRole ?? effectiveRole ?? "guest";
  const effective = effectiveRole ?? primary ?? "guest";

  const isAuthed = !!user;
  const isAdmin  = effective === "admin";

  let allowed = false;
  if (isAuthed) {
    switch (need) {
      case "admin":
        allowed = isAdmin;
        break;
      case "creator":
        allowed = effective === "creator" || (isAdmin && allowAdmin);
        break;
      case "fan":
        // Fan area blocks admins unless allowAdmin is true
        allowed = effective === "fan" || (isAdmin && allowAdmin);
        break;
      default:
        allowed = false;
    }
  }

  if (allowed) {
    return children ?? <Outlet />;
  }

  // Build a helpful redirect for diagnostics
  const qs = new URLSearchParams({
    from: location.pathname + location.search,
    need: String(need),
    effective: String(effective),
    primary: String(primary),
    viewAs: String(viewAs ?? ""),
    allowAdmin: String(allowAdmin),
  });

  return <Navigate to={`/unauthorized?${qs.toString()}`} replace />;
}

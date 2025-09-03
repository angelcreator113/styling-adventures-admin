// src/routes/guards.jsx
// 🚨 Legacy shim: funnel to canonical guards and warn once when used.
import React, { useRef } from "react";
import RequireAuthCanon from "@/components/RequireAuth.jsx";
import RequireRoleCanon from "@/components/RequireRole.jsx";
import { useUserRole } from "@/hooks/RoleGates";

function onceWarn(msg) {
  if (!window.__guards_warned) window.__guards_warned = new Set();
  if (!window.__guards_warned.has(msg)) {
    window.__guards_warned.add(msg);
    // eslint-disable-next-line no-console
    console.warn(msg);
  }
}

export function RequireAuth(props) {
  onceWarn("[guards.jsx] Use '@/components/RequireAuth' instead of '@/routes/guards'.");
  return <RequireAuthCanon {...props} />;
}

export function PublicOnly({ children }) {
  onceWarn("[guards.jsx] PublicOnly is legacy. Prefer explicit routing + RequireAuth.");
  // Very small public-only gate using the canonical hook
  const { loading, effectiveRole } = useUserRole();
  if (loading) return null;
  // if authed (any role), bounce to /home
  if (effectiveRole === "admin" || effectiveRole === "creator" || effectiveRole === "fan") {
    return (window.location.href = "/home"), null;
  }
  return children ?? null;
}

// Minimal compatibility layer for older "any role" checks.
// Prefer using <RequireRole role="admin|creator|fan"> directly.
export function RequireAnyRole({ allow = [], children }) {
  onceWarn("[guards.jsx] RequireAnyRole is legacy. Prefer '@/components/RequireRole'.");
  const { loading, effectiveRole } = useUserRole();
  if (loading) return null;
  if (effectiveRole === "admin") return children ?? null; // admin always allowed
  if (!allow.includes(effectiveRole)) {
    window.location.replace("/unauthorized");
    return null;
  }
  return children ?? null;
}

export default { RequireAuth, PublicOnly, RequireAnyRole };

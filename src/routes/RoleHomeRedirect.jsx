import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/RoleGates";

const VALID = new Set(["admin", "creator", "fan"]);
const norm = (r, hasUser) => (VALID.has(r) ? r : hasUser ? "fan" : "guest");

export default function RoleHomeRedirect() {
  const { user } = useAuth();
  const { effectiveRole, loading } = useUserRole();

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <span aria-busy="true" aria-live="polite">
          Loading…
        </span>
      </div>
    );
  }

  const eff = norm(effectiveRole, !!user);

  if (eff === "admin") return <Navigate to="/admin/home" replace />;
  if (eff === "creator") return <Navigate to="/creator/home" replace />;
  return <Navigate to="/home" replace />;
}

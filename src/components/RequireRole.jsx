// src/components/RequireRole.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

/**
 * Role-based route protection (RRv6 Outlet style):
 * - Matches against effectiveRole (admin may "view as" creator/fan)
 * - Admin (without view-as) can bypass for non-admin areas when allowAdmin=true
 */
export default function RequireRole({ role, allowAdmin = true }) {
  const { loading, role: primaryRole } = useAuth();
  const { effectiveRole } = useEffectiveRole();
  const location = useLocation();

  if (loading) return null;

  const allowedRoles = Array.isArray(role) ? role : [role];

  // Admin bypass (when not “view as”) for non-admin areas if allowAdmin === true
  const isAdminBypass =
    primaryRole === "admin" && !sessionStorage.getItem("viewAsRole") && allowAdmin && role !== "admin";

  const isAllowed = isAdminBypass || allowedRoles.includes(effectiveRole);

  if (!isAllowed) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

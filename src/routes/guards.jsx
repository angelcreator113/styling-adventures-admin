// src/routes/guards.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Small, shared loader so we never render "nothing"
function GateFallback({ text = "Loading…" }) {
  return (
    <section className="container" style={{ padding: 16 }}>
      <div
        className="dashboard-card"
        role="status"
        aria-live="polite"
        style={{ display: "flex", gap: 12, alignItems: "center" }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid #ccc",
            borderTopColor: "#7c3aed",
            animation: "spin .9s linear infinite",
          }}
        />
        <span>{text}</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}

/**
 * RequireAuth
 * - Shows a small loader while auth is resolving
 * - If not logged in, send to /login and remember where we came from
 */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <GateFallback />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;

  return children ?? <Outlet />;
}

/**
 * PublicOnly
 * - For pages like /login. If logged in, send to /home (or back to "from")
 */
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <GateFallback />;
  if (user) {
    const to = loc.state?.from?.pathname || "/home";
    return <Navigate to={to} replace />;
  }
  return children ?? <Outlet />;
}

/**
 * RequireAnyRole
 * - Allow if the user's primary role is in `allow`
 * - Admin is always allowed (so admin can access creator/fan dashboards)
 */
export function RequireAnyRole({ allow = [], children }) {
  const { role, loading } = useAuth(); // primary role from context
  const loc = useLocation();

  if (loading) return <GateFallback />;
  if (role === "admin") return children ?? <Outlet />; // superpower

  if (!allow.includes(role)) {
    return <Navigate to="/unauthorized" replace state={{ from: loc }} />;
  }
  return children ?? <Outlet />;
}

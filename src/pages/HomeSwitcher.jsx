// src/pages/HomeSwitcher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/RoleGates.jsx";
import FanHome from "@/pages/home/FanHome.jsx";

export default function HomeSwitcher() {
  const { loading, effectiveRole } = useUserRole();
  const loc = useLocation();

  // ✅ All hooks at top level
  const targets = useMemo(
    () => ({
      admin: "/admin/home",
      creator: "/creator/home",
      fan: "/home",
    }),
    []
  );

  const lastNavRef = useRef({ path: "", ts: 0 });

  const areaOf = (path) => {
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/creator")) return "creator";
    return "fan";
  };

  // ---- Tiny loading UI (safe now; no hooks below this line are introduced later) ----
  if (loading) {
    return (
      <section className="container" style={{ padding: 16 }}>
        <div
          className="dashboard-card"
          role="status"
          aria-live="polite"
          style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}
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
          <span>Loading…</span>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </section>
    );
  }

  // ---- Role routing ----
  if (effectiveRole === "admin") {
    const target = targets.admin;
    if (areaOf(loc.pathname) !== "admin") {
      const now = Date.now();
      if (lastNavRef.current.path !== target || now - lastNavRef.current.ts > 300) {
        lastNavRef.current = { path: target, ts: now };
        return <Navigate to={target} replace />;
      }
    }
    // Already in admin area; render nested routes instead of re-navigating
    return <FanHome />; // or return null; or an <Outlet/> depending on your router layout
  }

  if (effectiveRole === "creator") {
    const target = targets.creator;
    if (areaOf(loc.pathname) !== "creator") {
      const now = Date.now();
      if (lastNavRef.current.path !== target || now - lastNavRef.current.ts > 300) {
        lastNavRef.current = { path: target, ts: now };
        return <Navigate to={target} replace />;
      }
    }
    // Already in creator area; avoid looping navigate
    return <FanHome />; // adjust to your layout (Outlet/null)
  }

  // Fans: render the actual Fan home
  return <FanHome />;
}

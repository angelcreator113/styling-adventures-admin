// src/pages/HomeSwitcher.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/RoleGates.jsx";
import FanHome from "@/pages/home/FanHome.jsx";

export default function HomeSwitcher() {
  const loc = useLocation();
  const { effectiveRole, loading } = useUserRole();

  // --- safety valve: if loading > 3s, fall back to FanHome so the UI never gets stuck
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [loading]);

  const areaOf = (pathname) => {
    if (!pathname) return "root";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/creator")) return "creator";
    return "fan";
  };

  if (loading && !timedOut) {
    return (
      <section className="container" style={{ padding: 16 }}>
        <div className="dashboard-card" role="status" aria-live="polite" style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #ccc",borderTopColor:"#7c3aed",animation:"spin .9s linear infinite"}} />
          <span>Loading…</span>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </section>
    );
  }

  // If auth is still loading after 3s, show the fan home so the page is usable
  if (loading && timedOut) {
    console.warn("[home] auth/roles still loading after 3s — showing FanHome as a fallback.");
    return <FanHome />;
  }

  // normal role redirects
  if (effectiveRole === "admin" && areaOf(loc.pathname) !== "admin") {
    return <Navigate to="/admin/home" replace />;
  }
  if (effectiveRole === "creator" && areaOf(loc.pathname) !== "creator") {
    return <Navigate to="/creator/home" replace />;
  }

  // fan view
  return <FanHome />;
}

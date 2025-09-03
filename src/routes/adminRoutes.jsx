// src/routes/adminRoutes.jsx
import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/constants";

// ✅ real pages that exist in your repo
const AdminHome   = lazy(() => import("@/pages/home/AdminHome.jsx"));
const ThemeStudio = lazy(() => import("@/pages/admin/manage/ThemeStudio.jsx"));

// Small, styled placeholder so routes render until the real page exists
function Placeholder({ title, note = "Coming soon…" }) {
  return (
    <section className="container" style={{ padding: 16 }}>
      <div className="dashboard-card">
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{note}</p>
      </div>
    </section>
  );
}

/**
 * Admin routes live under /admin/* (nested inside AdminShell).
 * Keep paths RELATIVE here ("home", "themes/studio", etc).
 */
export function AdminRoutes() {
  return (
    <>
      {/* default -> /admin/home */}
      <Route index element={<Navigate to={ROUTES.adminHome} replace />} />

      {/* Home */}
      <Route path="home" element={<AdminHome />} />

      {/* Content */}
      <Route
        path="spaces"
        element={<Placeholder title="Spaces (All creators)" />}
      />

      {/* Tools */}
      <Route
        path="meta"
        element={<Placeholder title="Meta & Tools" />}
      />
      <Route
        path="storage"
        element={<Placeholder title="Storage Smoke" />}
      />

      {/* Episodes */}
      <Route
        path="episodes"
        element={<Placeholder title="Upload Episodes" />}
      />
      <Route
        path="episodes/clips"
        element={<Placeholder title="Clips" />}
      />
      <Route
        path="episodes/backgrounds"
        element={<Placeholder title="Episode Backgrounds" />}
      />

      {/* Themes */}
      <Route
        path="themes"
        element={<Placeholder title="Theme Library" />}
      />
      <Route
        path="themes/studio"
        element={<ThemeStudio />}
      />
      <Route
        path="themes/analytics"
        element={<Placeholder title="Theme Analytics" />}
      />
      <Route
        path="themes/voting"
        element={<Placeholder title="Voting Settings" />}
      />
    </>
  );
}

export default AdminRoutes;

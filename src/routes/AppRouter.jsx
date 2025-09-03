// src/routes/AppRouter.jsx
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { PublicRoutes } from "@/routes/publicRoutes";
import { AdminRoutes } from "@/routes/adminRoutes";
import { CreatorRoutes } from "@/routes/creatorRoutes";
import { FanRoutes } from "@/routes/fanRoutes";

import RequireAuth from "@/components/RequireAuth";
import RequireRole from "@/components/RequireRole";

import AdminShell from "@/admin/AdminShell.jsx";
import CreatorShell from "@/components/CreatorShell.jsx";
import FanShell from "@/components/FanShell.jsx";

const AuthDebug = React.lazy(() => import("@/pages/AuthDebug.jsx"));
const RoleHomeRedirect = React.lazy(() => import("@/routes/RoleHomeRedirect.jsx"));

const Fallback = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card" role="status" aria-live="polite" style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #ccc", borderTopColor: "#7c3aed", animation: "spin .9s linear infinite" }} />
      <span>Loading…</span>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </section>
);

const NotFound = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>404 — Page not found</h1>
      <p style={{ marginTop: 8 }}><a href="/home">Go to Home</a></p>
    </div>
  </section>
);

const Unauthorized = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>Unauthorized</h1>
      <p style={{ marginTop: 8 }}>You don’t have access to that page.</p>
    </div>
  </section>
);

export default function AppRouter() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public */}
          {PublicRoutes && PublicRoutes()}
          <Route path="/__auth" element={<AuthDebug />} />

          {/* Authenticated area */}
          <Route element={<RequireAuth />}>

            {/* Single root redirect decides the area once, then shells own their paths */}
            <Route index element={<RoleHomeRedirect />} />

            {/* Admin namespace */}
            <Route element={<RequireRole role="admin" />}>
              <Route path="/admin/*" element={<AdminShell />}>
                {AdminRoutes && AdminRoutes()}
              </Route>
            </Route>

            {/* Creator namespace */}
            <Route element={<RequireRole role="creator" />}>
              <Route path="/creator/*" element={<CreatorShell />}>
                {CreatorRoutes && CreatorRoutes()}
              </Route>
            </Route>

            {/* Fan catch-all LAST. Admins are blocked here by default. */}
            <Route element={<RequireRole role="fan" allowAdmin={false} />}>
              {/* Note: parent has no path; the children below are absolute like "home" */}
              <Route path="/*" element={<FanShell />}>
                {FanRoutes && FanRoutes()}
              </Route>
            </Route>
          </Route>

          {/* Fallbacks */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

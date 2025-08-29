import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// ✅ Use the guards we just defined in routes/guards.jsx
import { RequireAuth, RequireAnyRole } from "@/routes/guards.jsx";

// Route groups re-exported from src/routes/index.jsx
import { PublicRoutes, FanRoutes, CreatorRoutes, AdminRoutes } from "@/routes";

import AppToaster from "@/components/ui/AppToaster.jsx";

const Fallback = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card" role="status" aria-live="polite" style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
  if (import.meta.env.DEV) console.debug("[AppRouter] mounted");
  return (
    <>
      <AppToaster />
      <Suspense fallback={<Fallback />}>
        <Routes>
          {PublicRoutes()}

          {/* Authenticated umbrella */}
          <Route element={<RequireAuth />}>
            {/* Fan routes available to all roles (including admin) */}
            <Route element={<RequireAnyRole allow={["fan", "creator", "admin"]} />}>
              {FanRoutes()}
            </Route>

            {/* Creator (and admin) */}
            <Route element={<RequireAnyRole allow={["creator", "admin"]} />}>
              {CreatorRoutes()}
            </Route>

            {/* Admin only */}
            <Route element={<RequireAnyRole allow={["admin"]} />}>
              {AdminRoutes()}
            </Route>
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

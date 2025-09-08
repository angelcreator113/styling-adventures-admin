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

// shells
import AdminShell from "@/admin/AdminShell.jsx";
import CreatorShell from "@/components/CreatorShell.jsx";
import FanShell from "@/components/FanShell.jsx";

// admin PIN gate
import RequireAdminPin from "@/routes/RequireAdminPin";
const AdminLockScreen = React.lazy(() => import("@/pages/admin/AdminLockScreen.jsx"));

// lounge
import BestieLounge from "@/pages/lounge/BestieLounge";

// debug & landing
const AuthDebug = React.lazy(() => import("@/pages/AuthDebug.jsx"));
const RoleHomeRedirect = React.lazy(() => import("@/routes/RoleHomeRedirect.jsx"));

// 👇 Use your pretty Unauthorized page
import UnauthorizedPage from "@/pages/Unauthorized.jsx";

const Fallback = () => (
  <section className="container" style={{ padding: 16 }}>
    <div
      className="dashboard-card"
      role="status"
      aria-live="polite"
      style={{ display: "flex", gap: 12 }}
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

const NotFound = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>404 — Page not found</h1>
      <p style={{ marginTop: 8 }}>
        <a href="/home">Go to Home</a>
      </p>
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
            <Route index element={<RoleHomeRedirect />} />

            {/* ---------- ADMIN ---------- */}
            <Route element={<RequireRole role="admin" />}>
              {/* PIN lock screen (shown when sessionStorage pin not valid) */}
              <Route path="/admin/locked" element={<AdminLockScreen />} />

              {/* All admin pages behind the PIN gate */}
              <Route element={<RequireAdminPin />}>
                <Route path="/admin/*" element={<AdminShell />}>
                  {AdminRoutes && AdminRoutes()}
                </Route>
              </Route>
            </Route>

            {/* ---------- CREATOR ---------- */}
            <Route element={<RequireRole role="creator" />}>
              <Route path="/creator/*" element={<CreatorShell />}>
                {CreatorRoutes && CreatorRoutes()}
              </Route>
            </Route>

            {/* ---------- FAN (block admins here) ---------- */}
            <Route element={<RequireRole role="fan" allowAdmin={false} />}>
              {/* Lounge kept under FanShell to use fan chrome */}
              <Route path="/the-bestie-lounge" element={<FanShell />}>
                <Route index element={<BestieLounge campaignId="current" />} />
              </Route>

              {/* all other fan routes */}
              <Route path="/*" element={<FanShell />}>
                {FanRoutes && FanRoutes()}
              </Route>
            </Route>
          </Route>

          {/* Fallbacks */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}


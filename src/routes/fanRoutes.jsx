// src/routes/fanRoutes.jsx
import React from "react";
import { Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/routes/guards.jsx";
import FanShell from "@/components/FanShell.jsx";

// Lazy pages
const Home              = React.lazy(() => import("@/pages/HomeSwitcher.jsx"));
const UploadClosetPage  = React.lazy(() => import("@/pages/UploadClosetPage.jsx"));
const BoardsPage        = React.lazy(() => import("@/pages/BoardsPage.jsx"));
const OutfitBuilderPage = React.lazy(() => import("@/pages/Sidebar/OutfitBuilderPage.jsx"));
const PlannerPage       = React.lazy(() => import("@/pages/Sidebar/PlannerPage.jsx"));
const SpotlightsPage    = React.lazy(() => import("@/pages/Sidebar/SpotlightsPage.jsx"));
const ForumPage         = React.lazy(() => import("@/pages/Sidebar/ForumPage.jsx"));
const ConfessionsPage   = React.lazy(() => import("@/pages/Sidebar/ConfessionsPage.jsx"));
const ChallengesPage    = React.lazy(() => import("@/pages/Sidebar/ChallengesPage.jsx"));
const VipPage           = React.lazy(() => import("@/pages/Sidebar/VipPage.jsx"));
const CalendarPage      = React.lazy(() => import("@/pages/Sidebar/CalendarPage.jsx"));
const ForumThreadPage   = React.lazy(() => import("@/pages/ForumThreadPage.jsx"));

// Small loader wrapper
function Loader({ children }) {
  return (
    <React.Suspense
      fallback={
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
            <span>Loading…</span>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </section>
      }
    >
      {children}
    </React.Suspense>
  );
}

export function FanRoutes() {
  return (
    <Route
      element={
        <RequireAuth>
          <FanShell />
        </RequireAuth>
      }
    >
      {/* Pages */}
      <Route path="/home"                    element={<Loader><Home /></Loader>} />
      <Route path="/closet"                  element={<Loader><UploadClosetPage /></Loader>} />
      <Route path="/boards"                  element={<Loader><BoardsPage /></Loader>} />
      <Route path="/outfits/builder"         element={<Loader><OutfitBuilderPage /></Loader>} />
      <Route path="/planner"                 element={<Loader><PlannerPage /></Loader>} />
      <Route path="/community/spotlights"    element={<Loader><SpotlightsPage /></Loader>} />
      <Route path="/community/forum"         element={<Loader><ForumPage /></Loader>} />
      <Route path="/community/confessions"   element={<Loader><ConfessionsPage /></Loader>} />
      <Route path="/community/challenges"    element={<Loader><ChallengesPage /></Loader>} />
      <Route path="/vip"                     element={<Loader><VipPage /></Loader>} />
      <Route path="/calendar"                element={<Loader><CalendarPage /></Loader>} />
      <Route path="/community/forum/:id"     element={<Loader><ForumThreadPage /></Loader>} />

      {/* Redirect helpers */}
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Route>
  );
}


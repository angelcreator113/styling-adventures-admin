import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

/* -------- FAN PAGES -------- */
const BestieLounge       = lazy(() => import("@/pages/lounge/BestieLounge")); // .tsx default export
const ForumThreadPage    = lazy(() => import("@/pages/ForumThreadPage.jsx"));
const ConfessionsPage    = lazy(() => import("@/pages/Sidebar/ConfessionsPage.jsx"));
const CalendarPage       = lazy(() => import("@/pages/Sidebar/CalendarPage.jsx"));
const ChallengesPage     = lazy(() => import("@/pages/Sidebar/ChallengesPage.jsx"));
const OutfitBuilderPage  = lazy(() => import("@/pages/Sidebar/OutfitBuilderPage.jsx"));
const PlannerPage        = lazy(() => import("@/pages/Sidebar/PlannerPage.jsx"));
const SpotlightsPage     = lazy(() => import("@/pages/Sidebar/SpotlightsPage.jsx"));

/**
 * FanRoutes
 * Nest these under the FanShell in AppRouter (path="/*").
 * This component returns only <Route> elements — no wrapper.
 */
export function FanRoutes() {
  return (
    <>
      {/* Optional: default redirect for bare fan root */}
      <Route index element={<Navigate to="/home" replace />} />

      {/* Discover */}
      <Route path="the-bestie-lounge" element={<BestieLounge campaignId="current" />} />
      <Route path="blog"               element={<ForumThreadPage />} />
      <Route path="confessions"        element={<ConfessionsPage />} />

      {/* Sidebar/* features */}
      <Route path="calendar"           element={<CalendarPage />} />
      <Route path="challenges"         element={<ChallengesPage />} />
      <Route path="outfit-builder"     element={<OutfitBuilderPage />} />
      <Route path="planner"            element={<PlannerPage />} />
      <Route path="spotlights"         element={<SpotlightsPage />} />
    </>
  );
}

export default FanRoutes;

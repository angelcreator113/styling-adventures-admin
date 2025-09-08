import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

/* -------- CREATOR PAGES -------- */
const CalendarPage       = lazy(() => import("@/pages/Sidebar/CalendarPage.jsx"));
const ChallengesPage     = lazy(() => import("@/pages/Sidebar/ChallengesPage.jsx"));
const OutfitBuilderPage  = lazy(() => import("@/pages/Sidebar/OutfitBuilderPage.jsx"));
const PlannerPage        = lazy(() => import("@/pages/Sidebar/PlannerPage.jsx"));
const SpotlightsPage     = lazy(() => import("@/pages/Sidebar/SpotlightsPage.jsx"));

/**
 * CreatorRoutes
 * Mounted by AppRouter under <Route path="/creator/*" element={<CreatorShell/>}>.
 * Paths here are relative to /creator.
 */
export function CreatorRoutes() {
  return (
    <>
      {/* default -> /creator/planner (or whatever you prefer) */}
      <Route index element={<Navigate to="/creator/planner" replace />} />

      {/* Workflow mirrors */}
      <Route path="calendar"           element={<CalendarPage />} />
      <Route path="challenges"         element={<ChallengesPage />} />
      <Route path="outfit-builder"     element={<OutfitBuilderPage />} />
      <Route path="planner"            element={<PlannerPage />} />
      <Route path="spotlights"         element={<SpotlightsPage />} />
    </>
  );
}

export default CreatorRoutes;

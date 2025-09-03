// src/routes/creatorRoutes.jsx
import React from "react";
import { Route, Navigate } from "react-router-dom";

// NOTE: home page is under /pages/home, not /pages/creator
const CreatorHome            = React.lazy(() => import("@/pages/home/CreatorHome.jsx"));
const CreatorFilesPage       = React.lazy(() => import("@/pages/creator/CreatorFilesPage.jsx"));
const CreatorCalendarPage    = React.lazy(() => import("@/pages/creator/CreatorCalendarPage.jsx"));
const CreatorBoardsAnalytics = React.lazy(() => import("@/pages/creator/CreatorBoardsAnalytics.jsx"));
const CreatorPinterestPage   = React.lazy(() => import("@/pages/creator/CreatorPinterestPage.jsx"));
const CreatorInstagramPage   = React.lazy(() => import("@/pages/creator/CreatorInstagramPage.jsx"));
const CreatorYoutubePage     = React.lazy(() => import("@/pages/creator/CreatorYoutubePage.jsx"));

export function CreatorRoutes() {
  return (
    <>
      {/* /creator -> /creator/home */}
      <Route index element={<Navigate to="home" replace />} />

      <Route path="home" element={<CreatorHome />} />
      <Route path="files" element={<CreatorFilesPage />} />
      <Route path="calendar" element={<CreatorCalendarPage />} />
      <Route path="insights" element={<CreatorBoardsAnalytics />} />
      <Route path="pinterest" element={<CreatorPinterestPage />} />
      <Route path="instagram" element={<CreatorInstagramPage />} />
      <Route path="youtube" element={<CreatorYoutubePage />} />
    </>
  );
}

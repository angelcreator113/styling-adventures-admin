// ================================
// Router integration (example)
// File: src/router/index.jsx  (Create or update)
// NOTE: Adapt to your existing router. This shows React Router v6 style.
// ================================
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import ClosetUploadPage from "../js/uploads/closet/closet-upload-page.jsx";
import VoiceUploadPage from "../js/uploads/voice/voice-upload-page.jsx";
import EpisodesUploadPage from "../js/uploads/episode/episodes-upload-page.jsx";
import MetaPage from "../pages/meta/MetaPage.jsx";
import ManagePanelsPage from "../pages/manage/ManagePanelsPage.jsx";

export const router = createBrowserRouter([
  { path: "/closet", element: <ClosetUploadPage /> },
  { path: "/voice", element: <VoiceUploadPage /> },
  { path: "/episodes", element: <EpisodesUploadPage /> },
  { path: "/meta", element: <MetaPage /> },
  { path: "/manage-panels", element: <ManagePanelsPage /> },
]);

// ================================
// Sidebar active-map (ensure these routes exist)
// File: src/components/sidebar.js (snippet)
// ================================
export const ROUTE_MAP = {
  home: "/home",
  closet: "/closet",
  voice: "/voice",
  episodes: "/episodes",
  meta: "/meta",
  "manage-panels": "/manage-panels",
};

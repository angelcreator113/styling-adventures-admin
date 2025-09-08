// src/routes/adminRoutes.jsx
import React, { lazy } from "react";
import { Route, Navigate } from "react-router-dom";

/* -------- HOME -------- */
const AdminHome = lazy(() => import("@/pages/home/AdminHome.jsx"));

/* -------- THEMES -------- */
const ThemeLibrary    = lazy(() => import("@/pages/admin/themes/ThemeLibrary.jsx"));
const ThemeStudio     = lazy(() => import("@/pages/admin/manage/ThemeStudio.jsx"));
const ThemesAdmin     = lazy(() => import("@/pages/admin/manage/ThemesAdmin.jsx"));
const ThemeAnalytics  = lazy(() => import("@/pages/admin/themes/analytics/ThemeAnalytics.jsx"));
// Optional (present in repo)
const VotingSettings  = lazy(() => import("@/pages/admin/themes/VotingSettings.jsx"));

/* -------- CONTENT -------- */
const AdminSpacesDashboard = lazy(() => import("@/pages/admin/content/AdminSpacesDashboard.jsx"));
const AdminContentEpisodes = lazy(() => import("@/pages/admin/content/AdminContentEpisodes.jsx"));
const AdminContentClips    = lazy(() => import("@/pages/admin/content/AdminContentClips.jsx"));
const AdminContentCloset   = lazy(() => import("@/pages/admin/content/AdminContentCloset.jsx"));
const ContentEditor        = lazy(() => import("@/pages/admin/manage/ContentEditor.jsx"));

/* -------- META / TOOLS -------- */
const AdminMetaTools    = lazy(() => import("@/pages/admin/content/AdminMetaTools.jsx"));
const AdminStorageSmoke = lazy(() => import("@/pages/admin/content/AdminStorageSmoke.jsx"));

/* -------- MANAGE -------- */
const AdminBoardsAnalytics   = lazy(() => import("@/pages/admin/manage/AdminBoardsAnalytics.jsx"));
const AdminInvites           = lazy(() => import("@/pages/admin/manage/AdminInvites.jsx"));
const AdminManageChallenges  = lazy(() => import("@/pages/admin/manage/AdminManageChallenges.jsx"));
const AdminManageConfessions = lazy(() => import("@/pages/admin/manage/AdminManageConfessions.jsx"));
const AdminManageEvents      = lazy(() => import("@/pages/admin/manage/AdminManageEvents.jsx"));
const AdminManageOutfits     = lazy(() => import("@/pages/admin/manage/AdminManageOutfits.jsx"));
const AdminManageSpotlights  = lazy(() => import("@/pages/admin/manage/AdminManageSpotlights.jsx"));
const AdminManageVip         = lazy(() => import("@/pages/admin/manage/AdminManageVip.jsx"));
const AdminSystemUpdates     = lazy(() => import("@/pages/admin/manage/AdminSystemUpdates.jsx"));
const AdminPins              = lazy(() => import("@/pages/admin/manage/AdminPins.jsx"));

/* -------- USERS / ROLES / CHAT -------- */
const AdminUsers    = lazy(() => import("@/pages/admin/AdminUsers.jsx"));
const AdminRoleDefs = lazy(() => import("@/pages/admin/manage/AdminRoleDefs.jsx"));
const ChatManager   = lazy(() => import("@/pages/admin/manage/ChatManager.jsx"));

/* -------- OPTIONAL CREATOR TOOL EXPOSED IN ADMIN -------- */
const CreatorPostLaterPage = lazy(() => import("@/pages/admin/manage/CreatorPostLaterPage.jsx"));

/**
 * AdminRoutes
 * Nest these under <Route path="/admin/*" ...> in App.jsx.
 * This component returns only <Route> elements — no wrapper.
 */
export function AdminRoutes() {
  return (
    <>
      {/* default -> /admin/home */}
      <Route index element={<Navigate to="/admin/home" replace />} />

      {/* Home */}
      <Route path="home" element={<AdminHome />} />

      {/* ---------- THEMES (group) ---------- */}
      {/* /admin/themes -> Library by default */}
      <Route path="themes" element={<Navigate to="/admin/themes/library" replace />} />
      <Route path="themes/library"   element={<ThemeLibrary />} />
      <Route path="themes/studio"    element={<ThemeStudio />} />
      <Route path="themes/manage"    element={<ThemesAdmin />} />
      <Route path="themes/analytics" element={<ThemeAnalytics />} />
      <Route path="themes/voting"    element={<VotingSettings />} />

      {/* ---------- CONTENT (group) ---------- */}
      <Route path="spaces"              element={<AdminSpacesDashboard />} />
      <Route path="content/episodes"    element={<AdminContentEpisodes />} />
      <Route path="content/clips"       element={<AdminContentClips />} />
      <Route path="content/closet"      element={<AdminContentCloset />} />
      <Route path="content/editor"      element={<ContentEditor />} />
      <Route path="meta"                element={<AdminMetaTools />} />
      <Route path="storage"             element={<AdminStorageSmoke />} />

      {/* ---------- MANAGE (group) ---------- */}
      <Route path="boards"              element={<AdminBoardsAnalytics />} />
      <Route path="invites"             element={<AdminInvites />} />
      <Route path="manage/challenges"   element={<AdminManageChallenges />} />
      <Route path="manage/confessions"  element={<AdminManageConfessions />} />
      <Route path="manage/events"       element={<AdminManageEvents />} />
      <Route path="manage/outfits"      element={<AdminManageOutfits />} />
      <Route path="manage/spotlights"   element={<AdminManageSpotlights />} />
      <Route path="manage/vip"          element={<AdminManageVip />} />
      <Route path="system/updates"      element={<AdminSystemUpdates />} />
      <Route path="security/pins"       element={<AdminPins />} />

      {/* ---------- USERS / ROLES / CHAT ---------- */}
      <Route path="users"               element={<AdminUsers />} />
      <Route path="role-defs"           element={<AdminRoleDefs />} />
      <Route path="chat"                element={<ChatManager />} />

      {/* ---------- OPTIONAL TOOLS ---------- */}
      <Route path="post-me-later"       element={<CreatorPostLaterPage />} />
    </>
  );
}

export default AdminRoutes;

// src/routes/AdminRoutes.jsx
import React from "react";
import { Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes/constants";
import { RequireAuth } from "@/routes/guards.jsx";
import { RequireAnyRole } from "@/hooks/guards.jsx";

// ✅ make sure this matches where you placed the updated shell
import AdminShell from "@/admin/AdminShell.jsx"; // or "@/components/AdminShell.jsx"

const AdminHome             = React.lazy(() => import("@/pages/home/AdminHome.jsx"));
const AdminUsers            = React.lazy(() => import("@/pages/admin/manage/AdminUsers.jsx"));
const AdminSpacesDashboard  = React.lazy(() => import("@/pages/admin/content/AdminSpacesDashboard.jsx"));
const AdminContentCloset    = React.lazy(() => import("@/pages/admin/content/AdminContentCloset.jsx"));
const ChatManager           = React.lazy(() => import("@/pages/admin/manage/ChatManager.jsx"));
const AdminBoardsAnalytics  = React.lazy(() => import("@/pages/admin/manage/AdminBoardsAnalytics.jsx"));
const ThemesAdmin           = React.lazy(() => import("@/pages/admin/manage/ThemesAdmin.jsx"));
const AdminContentEpisodes  = React.lazy(() => import("@/pages/admin/content/AdminContentEpisodes.jsx"));
const AdminContentClips     = React.lazy(() => import("@/pages/admin/content/AdminContentClips.jsx"));
const MetaPage              = React.lazy(() => import("@/pages/MetaPage.jsx"));
const StorageSmoke          = React.lazy(() => import("@/pages/StorageSmoke.jsx"));

export function AdminRoutes() {
  return (
    <Route
      path="/admin"
      element={
        <RequireAuth>
          <RequireAnyRole allow={["admin"]}>
            <AdminShell />
          </RequireAnyRole>
        </RequireAuth>
      }
    >
      {/* Redirect /admin -> /admin/home */}
      <Route index element={<Navigate to="home" replace />} />

      <Route path="home" element={<AdminHome />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="spaces" element={<AdminSpacesDashboard />} />

      {/* keep your constant redirect */}
      <Route path="content/closet" element={<Navigate to={ROUTES.adminSpaces} replace />} />
      <Route path={ROUTES.adminSpaces} element={<AdminContentCloset />} />

      <Route path="chat" element={<ChatManager />} />
      <Route path="boards" element={<AdminBoardsAnalytics />} />
      <Route path="themes" element={<ThemesAdmin />} />
      <Route path="content/episodes" element={<AdminContentEpisodes />} />
      <Route path="content/clips" element={<AdminContentClips />} />
      <Route path="meta" element={<MetaPage />} />
      <Route path="storage-smoke" element={<StorageSmoke />} />

      {/* optional: catch-all for /admin/* typos */}
      <Route path="*" element={<Navigate to="home" replace />} />
    </Route>
  );
}

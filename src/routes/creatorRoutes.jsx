import React from "react";
import { Route } from "react-router-dom";
import { RequireAnyRole } from "@/hooks/guards.jsx";
import CreatorShell from "@/components/CreatorShell.jsx";

const CreatorHome            = React.lazy(() => import("@/pages/home/CreatorHome.jsx"));
const CreatorCalendarPage    = React.lazy(() => import("@/pages/creator/CreatorCalendarPage.jsx"));
const CreatorPinterestPage   = React.lazy(() => import("@/pages/creator/CreatorPinterestPage.jsx"));
const CreatorInstagramPage   = React.lazy(() => import("@/pages/creator/CreatorInstagramPage.jsx"));
const CreatorYoutubePage     = React.lazy(() => import("@/pages/creator/CreatorYoutubePage.jsx"));
const ForumPage              = React.lazy(() => import("@/pages/Sidebar/ForumPage.jsx"));
const CreatorPostLaterPage   = React.lazy(() => import("@/pages/admin/manage/CreatorPostLaterPage.jsx"));
const CreatorSpacesIndex     = React.lazy(() => import("@/pages/creator/spaces/CreatorSpacesIndex.jsx"));
const CreatorSpaceDetail     = React.lazy(() => import("@/pages/creator/spaces/CreatorSpaceDetail.jsx"));
const SpaceUpload            = React.lazy(() => import("@/pages/creator/spaces/SpaceUpload.jsx"));
const UploadVoicePage        = React.lazy(() => import("@/pages/UploadVoicePage.jsx"));
const UploadEpisodePage      = React.lazy(() => import("@/pages/UploadEpisodePage.jsx"));
const CreatorBoardsAnalytics = React.lazy(() => import("@/pages/creator/CreatorBoardsAnalytics.jsx"));

export function CreatorRoutes() {
  return (
    <Route element={<RequireAnyRole allow={["creator", "admin"]}><CreatorShell /></RequireAnyRole>}>
      <Route path="/creator/home" element={<CreatorHome />} />
      <Route path="/creator/calendar" element={<CreatorCalendarPage />} />
      <Route path="/creator/pinterest" element={<CreatorPinterestPage />} />
      <Route path="/creator/instagram" element={<CreatorInstagramPage />} />
      <Route path="/creator/youtube" element={<CreatorYoutubePage />} />
      <Route path="/creator/money-chat" element={<ForumPage />} />
      <Route path="/creator/post-later" element={<CreatorPostLaterPage />} />
      <Route path="/creator/spaces" element={<CreatorSpacesIndex />} />
      <Route path="/creator/spaces/:spaceId" element={<CreatorSpaceDetail />} />
      <Route path="/creator/spaces/:spaceId/upload" element={<SpaceUpload />} />
      <Route path="/voice" element={<UploadVoicePage />} />
      <Route path="/episodes" element={<UploadEpisodePage />} />
      <Route path="/creator/insights" element={<CreatorBoardsAnalytics />} />
    </Route>
  );
}

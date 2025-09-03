// src/routes/publicRoutes.jsx
import React from "react";
import { Route, Navigate } from "react-router-dom";
import { PublicOnly } from "@/routes/guards.jsx";

const LoginPage = React.lazy(() => import("@/pages/LoginPage.jsx"));
const PublicBoardPage = React.lazy(() => import("@/pages/PublicBoardPage.jsx"));

export function PublicRoutes() {
  return (
    <>
      <Route path="/" element={<Navigate to="/admin/theme-analytics" replace />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/b/:uid/:boardId" element={<PublicBoardPage />} />
    </>
  );
}

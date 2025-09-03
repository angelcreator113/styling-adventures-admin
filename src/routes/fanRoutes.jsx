// src/routes/fanRoutes.jsx
import React from "react";
import { Route, Navigate } from "react-router-dom";
import FanHome from "@/pages/home/FanHome.jsx";

export function FanRoutes() {
  return (
    <>
      {/* Optional: when someone hits "/", send them to /home (only inside Fan shell) */}
      <Route index element={<Navigate to="home" replace />} />

      {/* Fan pages */}
      <Route path="home" element={<FanHome />} />
      {/* e.g. <Route path="closet" element={<Closet />} /> */}
    </>
  );
}

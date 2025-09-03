// src/creator/CreatorLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import SidebarCreator from "@/components/nav/SidebarCreator.jsx";
import AdminTopbar from "@/admin/AdminTopbar"; // same topbar with role switcher

export default function CreatorLayout() {
  return (
    <div className="app-shell" data-shell="creator">
      <AdminTopbar />

      <div className="app-shell__body">
        <aside className="app-sidebar" data-sidebar="creator">
          <SidebarCreator />
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

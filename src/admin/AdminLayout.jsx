// src/admin/AdminLayout.jsx
import React from "react";
import SidebarAdmin from "@/components/nav/SidebarAdmin.jsx";
import AdminTopbar from "@/admin/AdminTopbar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
     <div className="app-shell" data-shell="admin">
      {/* Topbar */}
      <AdminTopbar />

      {/* Main shell body: sidebar + content */}
      <div className="app-shell__body">
        <aside className="app-sidebar" data-sidebar="admin">
          <SidebarAdmin />
        </aside>

        <main className="app-main">
          <div className="main-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

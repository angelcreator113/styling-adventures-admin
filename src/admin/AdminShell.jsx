// src/admin/AdminShell.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppShell from "@/components/AppShell.jsx";
import SidebarAdmin from "@/components/nav/SidebarAdmin.jsx";

export default function AdminShell() {
  const location = useLocation();
  return (
    <AppShell
      Sidebar={SidebarAdmin}
      sidebarProps={{ currentPath: location.pathname }}
      shell="admin"
    >
      <Outlet />
    </AppShell>
  );
}

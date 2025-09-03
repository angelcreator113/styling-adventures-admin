// src/components/FanShell.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppShell from "@/components/AppShell.jsx";
import SidebarFan from "@/components/nav/SidebarFan.jsx";

export default function FanShell() {
  const location = useLocation();
  return (
    <AppShell
      Sidebar={SidebarFan}
      sidebarProps={{ currentPath: location.pathname }}
      shell="fan"
    >
      <Outlet />
    </AppShell>
  );
}

// src/components/CreatorShell.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppShell from "@/components/AppShell.jsx";
import SidebarCreator from "@/components/nav/SidebarCreator.jsx";

export default function CreatorShell() {
  const location = useLocation();
  return (
    <AppShell
      Sidebar={SidebarCreator}
      sidebarProps={{ currentPath: location.pathname }}
      shell="creator"
    >
      <Outlet />
    </AppShell>
  );
}

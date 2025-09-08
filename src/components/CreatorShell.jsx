// src/components/CreatorShell.jsx
import React from "react";
import { Outlet } from "react-router-dom";   // ← add this
import SidebarNav from "@/components/SidebarNav";
import "@/css/components/sidebar.css";

export default function CreatorShell() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarNav role="creator" />
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

import React from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./topbar/Topbar.jsx";
import Sidebar from "./Sidebar.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-shell__body">
        <Sidebar />
        <main id="main-content" className="app-main" role="main" aria-live="polite">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

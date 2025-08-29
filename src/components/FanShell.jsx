// src/components/FanShell.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarFan from "@/components/nav/SidebarFan.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";

export default function FanShell() {
  useFocusMainOnRouteChange();
  const location = useLocation();

  // ✅ keep collapsed in state (and persisted)
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("fanSidebarCollapsed") === "1"
  );

  useEffect(() => {
    sessionStorage.setItem("fanSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Optional: allow other parts of the app to toggle the sidebar
  useEffect(() => {
    const onToggle = () => setCollapsed((v) => !v);
    window.addEventListener("app:sidebar-toggle", onToggle);
    return () => window.removeEventListener("app:sidebar-toggle", onToggle);
  }, []);

  return (
    <div className="app-shell" data-sidebar={collapsed ? "collapsed" : "open"}>
      <Topbar className="app-topbar" showRoleSwitcher />
      <div className="app-shell__body">
        <aside
          id="fan-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Fan navigation"
        >
          <SidebarFan collapsed={collapsed} currentPath={location.pathname} />
          {/* optional collapse control inside the sidebar:
          <div className="sidebar-utils">
            <button className="sidebar-toggle" onClick={() => setCollapsed((v) => !v)}>
              <span className="txt">{collapsed ? "Expand" : "Collapse"}</span>
            </button>
          </div> */}
        </aside>

        <main id="main-content" className="app-main" role="main" aria-live="polite">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

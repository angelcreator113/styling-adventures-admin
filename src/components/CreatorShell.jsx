import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarCreator from "@/components/nav/SidebarCreator.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";

export default function CreatorShell() {
  useFocusMainOnRouteChange();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("creatorSidebarCollapsed") === "1"
  );

  useEffect(() => {
    sessionStorage.setItem("creatorSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const onToggle = () => setCollapsed(v => !v);
    window.addEventListener("app:sidebar-toggle", onToggle);
    return () => window.removeEventListener("app:sidebar-toggle", onToggle);
  }, []);

  return (
    <div className="app-shell">
      {/* No rightAccessory; keep the role switcher visible */}
      <Topbar className="app-topbar" showRoleSwitcher />
      <div className="app-shell__body">
        <aside
          id="creator-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Creator navigation"
        >
          <SidebarCreator collapsed={collapsed} currentPath={location.pathname} />
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


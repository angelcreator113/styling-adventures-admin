import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarAdmin from "@/components/nav/SidebarAdmin.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";

import { Menu, X } from "lucide-react";

/**
 * AdminShell
 * - Topbar and Sidebar render eagerly (never inside Suspense) to prevent frame flicker
 * - Only the Outlet is lazy/suspenseful
 * - Memoizes rightAccessory so Topbar doesn’t re-render on unrelated state changes
 * - Persists sidebar collapsed state in sessionStorage
 */
export default function AdminShell() {
  useFocusMainOnRouteChange();
  const loc = useLocation();

  // Persist collapsed state for this tab
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("adminSidebarCollapsed") === "1"
  );
  useEffect(() => {
    sessionStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Memoize the right side of the topbar so Topbar doesn’t re-render each state change elsewhere
  const rightAccessory = useMemo(
    () => (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-pressed={collapsed}
          aria-controls="admin-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Icons keep width stable vs text like “Open/Hide” */}
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
        {/* If you later add a role switcher, memoize it too before placing here */}
        {/* <RoleSwitcherTopbar /> */}
      </div>
    ),
    [collapsed]
  );

  // Memoize the sidebar element so minor top-level renders don’t rebuild it
  const sidebarEl = useMemo(
    () => (
      <aside
        id="admin-sidebar"
        className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
        aria-label="Admin navigation"
      >
        <SidebarAdmin collapsed={collapsed} currentPath={loc.pathname} />
      </aside>
    ),
    [collapsed, loc.pathname]
  );

  return (
    <div className="app-shell">
      {/* Topbar is eager and receives a memoized accessory */}
      <Topbar className="app-topbar" rightAccessory={rightAccessory} />

      {/* Fixed two-column layout; only Outlet is under Suspense */}
      <div className="app-shell__body">
        {sidebarEl}

        <main
          id="main-content"
          className="app-main"
          role="main"
          aria-live="polite"
          tabIndex={-1}
        >
          <ErrorBoundary>
            <React.Suspense
              fallback={
                <section className="container" style={{ padding: 16 }}>
                  <div
                    className="dashboard-card"
                    role="status"
                    aria-live="polite"
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid #ccc",
                        borderTopColor: "#7c3aed",
                        animation: "spin .9s linear infinite",
                      }}
                    />
                    <span>Loading…</span>
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </section>
              }
            >
              <Outlet />
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}


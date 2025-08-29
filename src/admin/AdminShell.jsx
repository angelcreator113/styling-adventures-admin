// src/admin/AdminShell.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AdminTopbar from "@/admin/AdminTopbar.jsx";
import SidebarAdmin from "@/components/nav/SidebarAdmin.jsx";
import ErrorBoundary from "@/components/ErrorBoundary.jsx";
import useFocusMainOnRouteChange from "@/hooks/useFocusMainOnRouteChange";
import Icon from "@/components/Icon.jsx";

export default function AdminShell() {
  useFocusMainOnRouteChange();
  const location = useLocation();

  // remember collapsed state between page loads
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("adminSidebarCollapsed") === "1"
  );

  useEffect(() => {
    sessionStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // allow a global event to toggle the sidebar
  useEffect(() => {
    const onToggle = () => setCollapsed((v) => !v);
    window.addEventListener("app:sidebar-toggle", onToggle);
    return () => window.removeEventListener("app:sidebar-toggle", onToggle);
  }, []);

  // topbar right accessory: a sidebar toggle icon
  const topbarToggleBtn = (
    <button
      type="button"
      className="icon-btn"
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
      onClick={() => window.dispatchEvent(new Event("app:sidebar-toggle"))}
    >
      <Icon name="menu" />
    </button>
  );

  return (
    <div className="app-shell">
      {/* AdminTopbar shows the Role Switcher only for admins */}
      <AdminTopbar className="app-topbar" rightAccessory={topbarToggleBtn} />

      <div className="app-shell__body">
        <aside
          id="admin-sidebar"
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label="Admin navigation"
        >
          <SidebarAdmin collapsed={collapsed} currentPath={location.pathname} />
        </aside>

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

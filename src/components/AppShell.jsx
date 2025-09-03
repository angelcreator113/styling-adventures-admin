// src/components/AppShell.jsx
import React, { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/topbar/Topbar.jsx";
import Icon from "@/components/Icon.jsx";

/**
 * Generic application shell used by Fan/Creator/Admin shells.
 *
 * Props:
 * - Sidebar: React component for the left nav
 * - sidebarProps: props forwarded to Sidebar
 * - shell: "fan" | "creator" | "admin" (affects storage key + data attribute)
 * - children: routed content (Outlet)
 */
export default function AppShell({
  Sidebar,
  sidebarProps = {},
  shell = "fan",
  children,
}) {
  const storageKey = useMemo(() => `${shell}SidebarCollapsed`, [shell]);

  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem(storageKey) === "1"
  );

  useEffect(() => {
    sessionStorage.setItem(storageKey, collapsed ? "1" : "0");
  }, [collapsed, storageKey]);

  // allow any button to dispatch "app:sidebar-toggle"
  useEffect(() => {
    const onToggle = () => setCollapsed((v) => !v);
    window.addEventListener("app:sidebar-toggle", onToggle);
    return () => window.removeEventListener("app:sidebar-toggle", onToggle);
  }, []);

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
    <div className="app-shell" data-shell={shell} style={{ pointerEvents: "auto" }}>
      {/* Make any decorative pseudo-elements click-through.
         Move this to your global CSS when convenient. */}
      <style>{`
        .app-shell::before,
        .app-shell::after,
        .app-main::before,
        .app-main::after {
          pointer-events: none !important;
        }
      `}</style>

      <Topbar
        className="app-topbar"
        rightAccessory={topbarToggleBtn}
        showRoleSwitcher
      />

      <div className="app-shell__body">
        <aside
          className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
          aria-label={`${shell} navigation`}
        >
          {Sidebar ? <Sidebar collapsed={collapsed} {...sidebarProps} /> : null}
        </aside>

        <main
          id="main-content"
          className="app-main"
          role="main"
          tabIndex={-1}
          aria-live="polite"
          /* Isolate stacking so nothing floats above content by accident */
          style={{ position: "relative", zIndex: 0, isolation: "isolate", pointerEvents: "auto" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

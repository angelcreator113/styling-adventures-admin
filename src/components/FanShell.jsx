import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import Topbar from "@/components/topbar/Topbar.jsx";
import SidebarFan from "@/components/nav/SidebarFan.jsx";

export default function FanShell() {
  const loc = useLocation();

  return (
    <div className="app-shell">
      {/* Top bar (role switcher, account, search, etc.) */}
      <Topbar className="app-topbar" />

      <div className="app-shell__body">
        <aside className="app-sidebar">
          <SidebarFan currentPath={loc.pathname} />
        </aside>

        <main id="main-content" className="app-main" role="main" tabIndex={-1}>
          <React.Suspense
            fallback={
              <section className="container" style={{ padding: 16 }}>
                <div role="status">Loading…</div>
              </section>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}


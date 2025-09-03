// src/pages/home/AdminHome.jsx
import React, { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
// import ThemeManager from "@/components/ThemeManager.jsx"; // ⛔️ avoid eager import

const ThemeManager = lazy(() => import("@/components/ThemeManager.jsx")); // ✅

export default function AdminHome() {
  const navigate = useNavigate();

  // ... your cards array ...

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Back Office</h1>

      {/* cards grid ... */}

      {/* Theme Manager as its own card/section */}
      <div style={{ marginTop: 24 }}>
        <div className="dashboard-card">
          <div className="card__body">
            <h3 className="card__title">Theme Manager</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              Create, edit, and link themes to icons. Includes voting settings.
            </p>

            {/* Local Suspense so AdminHome renders instantly */}
            <Suspense
              fallback={
                <div className="muted" style={{ fontSize: 14 }}>
                  Loading Theme Manager…
                </div>
              }
            >
              <ThemeManager />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

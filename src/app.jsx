import React, { Suspense } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import AppShell from "./components/AppShell.jsx";
import Home from "./pages/home.jsx";

import UploadClosetPage from "./pages/UploadClosetPage.jsx";
import UploadVoicePage from "./pages/UploadVoicePage.jsx";
import UploadEpisodePage from "./pages/UploadEpisodePage.jsx";
import MetaPage from "./pages/MetaPage.jsx";

const Fallback = () => (
  <section className="container" style={{ padding: "12px 16px" }}>
    <div className="dashboard-card" role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #ccc", borderTopColor: "#7c3aed", animation: "spin .9s linear infinite" }} />
      <span>Loading…</span>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </section>
);

const NotFound = () => (
  <section className="container" style={{ padding: "12px 16px" }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>404 — Page not found</h1>
      <p style={{ marginTop: 8 }}>
        We couldn’t find that page. <Link to="/home">Go to Home</Link>
      </p>
    </div>
  </section>
);

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Layout route */}
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/closet" element={<UploadClosetPage />} />
          <Route path="/voice" element={<UploadVoicePage />} />
          <Route path="/episodes" element={<UploadEpisodePage />} />
          <Route path="/meta" element={<MetaPage />} />

          {/* Legacy redirects (old tabs) */}
          <Route path="/closet/upload" element={<Navigate to="/closet" replace />} />
          <Route path="/closet/dashboard" element={<Navigate to="/closet" replace />} />
          <Route path="/voice/upload" element={<Navigate to="/voice" replace />} />
          <Route path="/voice/dashboard" element={<Navigate to="/voice" replace />} />
          <Route path="/episodes/upload" element={<Navigate to="/episodes" replace />} />
          <Route path="/episodes/dashboard" element={<Navigate to="/episodes" replace />} />

          {/* In-shell 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

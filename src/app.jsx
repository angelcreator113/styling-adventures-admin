// src/App.jsx
import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppShell from '@/components/AppShell.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import PublicOnly from '@/routes/PublicOnly.jsx'; // ← adjust path if you placed it elsewhere

// Eager: keep login light & fast
import LoginPage from '@/pages/LoginPage.jsx';

// Lazy pages (loaded only when visited)
const Home              = React.lazy(() => import('@/pages/home.jsx'));
const UploadClosetPage  = React.lazy(() => import('@/pages/UploadClosetPage.jsx'));
const UploadVoicePage   = React.lazy(() => import('@/pages/UploadVoicePage.jsx'));
const UploadEpisodePage = React.lazy(() => import('@/pages/UploadEpisodePage.jsx'));
const MetaPage          = React.lazy(() => import('@/pages/MetaPage.jsx'));
const StorageSmoke      = React.lazy(() => import('@/pages/StorageSmoke.jsx'));

const Fallback = () => (
  <section className="container" style={{ padding: 16 }}>
    <div
      className="dashboard-card"
      role="status"
      aria-live="polite"
      style={{ display: 'flex', gap: 12, alignItems: 'center' }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid #ccc',
          borderTopColor: '#7c3aed',
          animation: 'spin .9s linear infinite'
        }}
      />
      <span>Loading…</span>
    </div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </section>
);

const NotFound = () => (
  <section className="container" style={{ padding: 16 }}>
    <div className="dashboard-card">
      <h1 style={{ margin: 0 }}>404 — Page not found</h1>
      <p style={{ marginTop: 8 }}><a href="/home">Go to Home</a></p>
    </div>
  </section>
);

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* root -> home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* PUBLIC */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        {/* PROTECTED LAYOUT */}
        <Route element={<AppShell />}>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/closet"
            element={
              <ProtectedRoute>
                <UploadClosetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voice"
            element={
              <ProtectedRoute>
                <UploadVoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/episodes"
            element={
              <ProtectedRoute>
                <UploadEpisodePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meta"
            element={
              <ProtectedRoute>
                <MetaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storage-smoke"
            element={
              <ProtectedRoute>
                <StorageSmoke />
              </ProtectedRoute>
            }
          />

          {/* Legacy redirects */}
          <Route path="/closet/upload"      element={<Navigate to="/closet" replace />} />
          <Route path="/closet/dashboard"   element={<Navigate to="/closet" replace />} />
          <Route path="/voice/upload"       element={<Navigate to="/voice" replace />} />
          <Route path="/voice/dashboard"    element={<Navigate to="/voice" replace />} />
          <Route path="/episodes/upload"    element={<Navigate to="/episodes" replace />} />
          <Route path="/episodes/dashboard" element={<Navigate to="/episodes" replace />} />

          {/* 404 (inside shell so it still looks like the app) */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

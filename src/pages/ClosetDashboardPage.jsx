// src/pages/ClosetDashboardPage.jsx
import React from "react";
import PanelTabs from "@/components/PanelTabs.jsx";
import ClosetDashboard from "@/components/ClosetDashboard.jsx";
import "@/css/closet-dashboard.css"; // <-- new CSS file below

export default function ClosetDashboardPage() {
  return (
    <main className="container closet-dashboard">
      <PanelTabs base="/closet" />
      <section className="panel panel-card">
        <h1 className="text-xl font-semibold mb-4">Closet Dashboard</h1>
        <ClosetDashboard />
      </section>
    </main>
  );
}

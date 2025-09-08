// src/components/nav/SidebarAdmin.jsx
import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ROUTE_MANIFEST } from "@/routes/manifest";

export default function SidebarAdmin({ collapsed = false }) {
  // Build sections from the manifest (admin block only)
  const sections = useMemo(() => {
    const items = (ROUTE_MANIFEST.admin || []);
    const byGroup = items.reduce((acc, i) => {
      const g = i.group || "Admin";
      (acc[g] ||= []).push(i);
      return acc;
    }, {});
    return Object.entries(byGroup).map(([title, items]) => ({ title, items }));
  }, []);

  return (
    <nav className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`} aria-label="Admin navigation">
      {sections.map((sec) => (
        <div key={sec.title} className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title" aria-hidden>{sec.title}</div>}
          <ul className="sidebar-list" role="list">
            {sec.items.map(({ path, label }) => (
              <li key={path}>
                {/* ABSOLUTE links so they never stack /home */}
                <NavLink to={path} end className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}>
                  <span className="sidebar-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

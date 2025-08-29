// src/components/nav/SidebarFan.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Shirt,
  Wand2,
  CalendarDays,
  Sparkles,
  MessageCircle,
  Ghost,
  Trophy,
  Pin,
  PanelsTopLeft,
} from "lucide-react";

export default function SidebarFan({ collapsed = false }) {
  const groups = [
    {
      title: "My Closet",
      items: [
        { to: "home", label: "Homepage", icon: Home, end: true },
        { to: "closet", label: "Closet", icon: Shirt },
        { to: "outfits/builder", label: "Outfit Builder", icon: Wand2 },
        { to: "planner", label: "Planner", icon: Pin },
      ],
    },
    {
      title: "Community",
      items: [
        { to: "boards", label: "Boards", icon: PanelsTopLeft },
        { to: "community/spotlights", label: "Top Picks", icon: Sparkles },
        { to: "community/forum", label: "Bestie Chat", icon: MessageCircle },
        { to: "community/confessions", label: "Confessions", icon: Ghost },
        { to: "community/challenges", label: "Challenges", icon: Trophy },
      ],
    },
    {
      title: "Extras",
      items: [
        { to: "vip", label: "VIP", icon: Sparkles },
        { to: "calendar", label: "Calendar", icon: CalendarDays },
      ],
    },
  ];

  return (
    <nav className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`} aria-label="Fan navigation">
      {groups.map((g) => (
        <div key={g.title}>
          {!collapsed && <div className="sidebar-section-title">{g.title}</div>}
          <ul className="sidebar-list" role="list">
            {g.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `sidebar-link ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={18} aria-hidden="true" />
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

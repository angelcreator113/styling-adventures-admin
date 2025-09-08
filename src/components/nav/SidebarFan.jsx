// src/components/nav/SidebarFan.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import { auth } from "@/utils/init-firebase";

// If you have /public/logo.svg this works; otherwise swap to your asset.
import logoUrl from "@/assets/img/logo.png";

export default function SidebarFan() {
  const u = auth.currentUser;
  const friendly =
    u?.displayName ||
    (u?.email ? u.email.split("@")[0] : null) ||
    "Bestie, Bestie, welcome back!";

  return (
    <div className="sidebar fan-sidebar">
      {/* Brand / Logo */}
      <div className="sidebar__brand">
        <Link to="/home" className="sidebar__brand-link" aria-label="Go home">
          <img src={logoUrl} alt="Styling Adventures" className="sidebar__logo" />
          <span className="sidebar__brand-text">Styling Adventures</span>
        </Link>
      </div>

      {/* Friendly greeting */}
      <div className="sidebar__greeting">
        <div className="sidebar__greeting-title">{friendly}</div>
      </div>

      {/* Nav sections */}
      <nav className="sidebar__nav">
        <div className="sidebar__section">
          <div className="sidebar__section-title">Comfort</div>
          <NavLink to="/home" className="sidebar__link">Home</NavLink>
          <NavLink to="/closet" className="sidebar__link">Closet</NavLink>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-title">Let’s Talk</div>
          <NavLink to="/blog" className="sidebar__link">The Blog</NavLink>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-title">My Stuff</div>
          <NavLink to="/boards" className="sidebar__link">Boards</NavLink>
          <NavLink to="/spotlights" className="sidebar__link">Spotlights</NavLink>
          <NavLink to="/planner" className="sidebar__link">Planner</NavLink>
          <NavLink to="/calendar" className="sidebar__link">Calendar</NavLink>
          <NavLink to="/challenges" className="sidebar__link">Challenges</NavLink>
          <NavLink to="/outfit-builder" className="sidebar__link">Outfit Builder</NavLink>
        </div>
      </nav>

      {/* Bottom-anchored Bestie Lounge */}
      <div className="sidebar__footer">
        <Link to="/vip" className="bestie-lounge" aria-label="Open Bestie Lounge">
          Bestie Lounge
        </Link>
      </div>
    </div>
  );
}

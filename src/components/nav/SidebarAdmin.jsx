import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3, Palette, Video, Film, Wrench, Database,
  Layers3, BookOpen, Puzzle, Lightbulb, Home,
  Image as ImageIcon,
} from "lucide-react";
import { ROUTES } from "@/routes/constants";

const cx = (isActive) => `sidebar-link ${isActive ? "is-active" : ""}`;

export default function SidebarAdmin({ collapsed = false }) {
  const [themeOpen, setThemeOpen] = useState(true);
  const [episodesOpen, setEpisodesOpen] = useState(true);

  const contentGroup = {
    title: "Content",
    items: [{ to: ROUTES.adminSpaces, label: "Spaces (All creators)", icon: Layers3 }],
  };

  const toolsGroup = {
    title: "Tools",
    items: [
      { to: ROUTES.adminMeta,     label: "Meta & Tools",   icon: Wrench   },
      { to: ROUTES.adminStorage,  label: "Storage Smoke",  icon: Database },
    ],
  };

  return (
    <nav className={`sidebar-nav ${collapsed ? "is-collapsed" : ""}`} aria-label="Admin navigation">
      {/* Home */}
      <div className="sidebar-section">
        <ul className="sidebar-list" role="list">
          <li>
            <NavLink to={ROUTES.adminHome} className={({ isActive }) => cx(isActive)} end>
              <Home size={18} className="sidebar-link__icon" aria-hidden />
              <span className="sidebar-label">Home</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Content + Tools */}
      {[contentGroup, toolsGroup].map((g) => (
        <div key={g.title} className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">{g.title}</div>}
          <ul className="sidebar-list" role="list">
            {g.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => cx(isActive)}>
                  <Icon size={18} className="sidebar-link__icon" aria-hidden />
                  <span className="sidebar-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Episodes (collapsible) */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">Episodes</div>}
        <ul className="sidebar-list" role="list">
          <li>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => setEpisodesOpen((v) => !v)}
              aria-expanded={episodesOpen}
              aria-controls="episodes-submenu"
            >
              <Film size={18} className="sidebar-link__icon" />
              <span className="sidebar-label">Episodes</span>
              <span className="sidebar-expand-icon">{episodesOpen ? "▾" : "▸"}</span>
            </button>
          </li>
          {episodesOpen && (
            <li>
              <ul id="episodes-submenu" className="sidebar-submenu">
                <li>
                  <NavLink to={ROUTES.adminEpisodes} className={({ isActive }) => cx(isActive)}>
                    <Film size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Upload Episodes</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.adminClips} className={({ isActive }) => cx(isActive)}>
                    <Video size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Clips</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.adminEpisodeBackgrounds} className={({ isActive }) => cx(isActive)}>
                    <ImageIcon size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Episode Backgrounds</span>
                  </NavLink>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>

      {/* Themes (collapsible) */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">Themes</div>}
        <ul className="sidebar-list" role="list">
          <li>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => setThemeOpen((v) => !v)}
              aria-expanded={themeOpen}
              aria-controls="theme-submenu"
            >
              <Palette size={18} className="sidebar-link__icon" />
              <span className="sidebar-label">Themes</span>
              <span className="sidebar-expand-icon">{themeOpen ? "▾" : "▸"}</span>
            </button>
          </li>
          {themeOpen && (
            <li>
              <ul id="theme-submenu" className="sidebar-submenu">
                <li>
                  <NavLink to={ROUTES.adminThemes} className={({ isActive }) => cx(isActive)}>
                    <BookOpen size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Theme Library</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.adminThemeManager} className={({ isActive }) => cx(isActive)}>
                    <Puzzle size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Theme Manager</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.adminThemeAnalytics} className={({ isActive }) => cx(isActive)}>
                    <BarChart3 size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Theme Analytics</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={ROUTES.adminThemeVoting} className={({ isActive }) => cx(isActive)}>
                    <Lightbulb size={18} className="sidebar-link__icon" />
                    <span className="sidebar-label">Voting Settings</span>
                  </NavLink>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
// ⬇️ point at where your manifest actually lives
import { NAV_MANIFEST } from "@/routes/manifest";
import { useAuth } from "@/context/AuthContext";
import SidebarGreeting from "@/components/SidebarGreeting";

// tiny icon shim (swap with your icon system later)
const Icon = ({ name }) => (
  <span aria-hidden style={{ width: 16, display: "inline-block" }}>
    {name ? "•" : ""}
  </span>
);

function canSee(item, ctx) {
  if (item.requires?.role && item.requires.role !== ctx.role) return false;
  if (item.requires?.scope && !ctx.scopes?.[item.requires.scope]) return false;
  if (typeof item.showIf === "function" && !item.showIf(ctx)) return false;
  return true;
}

export default function SidebarNav({ role, className = "" }) {
  const { role: authRole, token } = useAuth() ?? {};
  const location = useLocation();

  // Build context for gating
  const ctx = {
    role: role || authRole,
    scopes: token?.adminScopes || token?.creatorScopes || {},
    flags: {
      forum: import.meta.env.VITE_FEATURE_FORUM === "true",
      confessions: import.meta.env.VITE_FEATURE_CONFESSIONS === "true",
    },
    isVip: token?.vip === true,
  };

  const items = (NAV_MANIFEST[role || authRole] || []).filter((it) =>
    canSee(it, ctx)
  );

  return (
    <aside className={`sidebar ${className}`}>
      <nav className="sidebar-nav">
        {/* friendly greeting */}
        <div className="sidebar-section" style={{ paddingBottom: 0 }}>
          <SidebarGreeting />
        </div>

        {items.map((it, idx) => {
          if (it.type === "section") {
            return (
              <div key={`sec-${idx}`} className="sidebar-section">
                <div className="sidebar-section-title">{it.label}</div>
              </div>
            );
          }
          if (it.type === "divider") {
            return <div key={`div-${idx}`} className="sidebar-sep" />;
          }
          if (it.type === "external") {
            return (
              <a
                key={`ext-${idx}`}
                className="sidebar-link"
                href={it.href}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name={it.icon} />
                <span className="sidebar-label">{it.label}</span>
              </a>
            );
          }

          // default: link
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "is-active" : ""}`
              }
              end={it.exact === true}
            >
              <Icon name={it.icon} />
              <span className="sidebar-label">{it.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Minimal inline fallback in case CSS isn't loaded yet */}
      <style>{`
        .sidebar { width: 220px; padding: 8px 10px; }
        .sidebar-section-title { font-size: 12px; letter-spacing:.02em; text-transform:uppercase; color:#9aa1a9; margin: 10px 8px 6px; }
        .sidebar-sep { height:1px; background:#eee; margin:10px 0; }
        .sidebar-link { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:10px; text-decoration:none; color:#111827; }
        .sidebar-link:hover { background:#f8fafc; }
        .sidebar-link.is-active { background:#eef2ff; color:#1e40af; font-weight:600; }
      `}</style>
    </aside>
  );
}

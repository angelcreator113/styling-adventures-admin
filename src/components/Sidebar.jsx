import React from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/Icon.jsx";

export default function Sidebar() {
  const { pathname } = useLocation();
  const is = (p) => pathname.startsWith(p);

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar-inner">
        <header className="sidebar-header">
          <Link to="/home" className="sb-brand">
            <img
              className="sb-brand-logo"
              src="/images/lala-avatar.png"
              alt=""
              aria-hidden="true"
            />
            <span className="sb-brand-text">Digital Closet</span>
          </Link>
        </header>

        <nav className="sidebar-nav">
          <div className="sb-section">
            <div className="sb-label">Main</div>
            <ul className="nav-list">
              <li>
                <Link to="/home" className={`nav-item ${is("/home") ? "active" : ""}`}>
                  <span className="nav-ico"><Icon name="home" /></span>
                  <span className="nav-label">Home</span>
                </Link>
              </li>
              <li>
                <Link to="/closet" className={`nav-item ${is("/closet") ? "active" : ""}`}>
                  <span className="nav-ico"><Icon name="hanger" /></span>
                  <span className="nav-label">Closet</span>
                </Link>
              </li>
              <li>
                <Link to="/voice" className={`nav-item ${is("/voice") ? "active" : ""}`}>
                  <span className="nav-ico"><Icon name="mic" /></span>
                  <span className="nav-label">Voice</span>
                </Link>
              </li>
              <li>
                <Link to="/episodes" className={`nav-item ${is("/episodes") ? "active" : ""}`}>
                  <span className="nav-ico"><Icon name="film" /></span>
                  <span className="nav-label">Episodes</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="sb-section">
            <div className="sb-label">Admin</div>
            <ul className="nav-list">
              <li>
                <Link to="/meta" className={`nav-item ${is("/meta") ? "active" : ""}`}>
                  <span className="nav-ico"><Icon name="settings" /></span>
                  <span className="nav-label">Meta / Panels</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link to="/settings" className="icon-btn" title="Settings" aria-label="Settings">
            <Icon name="settings" />
          </Link>
          <Link to="/help" className="icon-btn" title="Help" aria-label="Help">
            <Icon name="help" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

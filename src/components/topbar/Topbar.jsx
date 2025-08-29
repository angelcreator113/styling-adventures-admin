// src/components/topbar/Topbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "@/utils/init-firebase";
import "@/css/components/topbar.css";

import Icon from "@/components/Icon.jsx";
import TopbarSearch from "@/components/topbar/TopbarSearch.jsx";
import TopbarStatusPill from "@/components/topbar/TopbarStatusPill.jsx";
import Breadcrumbs from "@/components/topbar/Breadcrumbs.jsx";
import NotificationsMenu from "@/components/topbar/NotificationsMenu.jsx";
import AvatarMenu from "@/components/topbar/AvatarMenu.jsx";
import FeaturesPopover from "@/components/topbar/FeaturesPopover.jsx";
import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx";
import QuickActionsMenu from "@/components/topbar/QuickActionsMenu.jsx";

import { useThemeMode } from "@/hooks/useThemeMode";
import { setThemeMode, readTheme } from "@/utils/theme";
import { useBreadcrumbs } from "@/components/topbar/useBreadcrumbs.js";
import { useTopbarShortcuts } from "@/components/topbar/useTopbarShortcuts.js";
import { saveGreetingName, markLogin } from "@/js/greeting-store";
import { useUserRole } from "@/hooks/RoleGates.jsx";

import logo from "@/assets/img/logo.png";

export default function Topbar({
  status,
  className = "",
  onToggleSidebar,
  rightAccessory = null,
  // shell must pass this when you want the switcher available on that shell
  showRoleSwitcher = false,
  roleSwitcherProps = {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const themeMode = useThemeMode();

  // Role from your hook (e.g., /users/{uid} or local), PLUS claim from Firebase.
  const { effectiveRole } = useUserRole();
  const [adminClaim, setAdminClaim] = useState(false);

  // One auth listener: greet + detect admin claim
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminClaim(false);
        return;
      }
      const base = user.displayName || (user.email ? user.email.split("@")[0] : "");
      if (base) saveGreetingName(base);
      markLogin();

      try {
        const tok = await getIdTokenResult(user);
        setAdminClaim(!!tok.claims?.admin || tok.claims?.role === "admin");
      } catch {
        setAdminClaim(false);
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = adminClaim || effectiveRole === "admin";

  const [hasPageTitle, setHasPageTitle] = useState(false);
  useEffect(() => {
    setHasPageTitle(!!document.querySelector(".page-title"));
  }, [location.pathname]);

  const { items: breadcrumbItems, hasItems } = useBreadcrumbs(location.pathname);

  const [q, setQ] = useState("");
  const [pending, setPending] = useState(false);
  const searchInputRef = useRef(null);
  const onSubmit = (e) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    setPending(true);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };
  useEffect(() => {
    if (pending) setPending(false);
  }, [location.pathname]);

  useTopbarShortcuts({
    searchInputRef,
    primary: { onClick: () => navigate("/closet/upload") },
  });

  const pct = useMemo(() => {
    if (!status) return null;
    const match = status.match(/(\d{1,3})\s*%/);
    const n = match ? Math.max(0, Math.min(100, parseInt(match[1], 10))) : null;
    return Number.isFinite(n) ? n : null;
  }, [status]);

  const cycleTheme = () => {
    const current = readTheme();
    const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
    setThemeMode(next);
  };
  const themeIcon = themeMode === "dark" ? "sun" : themeMode === "light" ? "moon" : "sun-moon";

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fallbackToggleSidebar = () => {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    const open = shell.getAttribute("data-sidebar") === "open";
    shell.setAttribute("data-sidebar", open ? "" : "open");
    document.body.classList.toggle("body-lock", !open);
  };
  const handleToggleSidebar = () => {
    if (typeof onToggleSidebar === "function") onToggleSidebar();
    else fallbackToggleSidebar();
  };

  const primaryAction = {
    label: "Start Closet Upload",
    onClick: () => navigate("/closet/upload"),
  };

  return (
    <header
      id="topbar"
      className={`topbar ${compact ? "is-compact" : ""} ${className || ""}`}
      role="banner"
    >
      <div className="container">
        <div className="topbar__inner">
          {/* LEFT */}
          <div className="topbar__left">
            <a href="/home" className="topbar__brand" aria-label="Styling Adventures">
              <img className="brand-img" src={logo} alt="" />
            </a>

            <button
              type="button"
              className="btn sm ghost hide-toggle"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <Icon name="menu" />
            </button>

            {!hasPageTitle && hasItems && (
              <span className="hide-on-mobile" style={{ marginLeft: 6 }}>
                <Breadcrumbs items={breadcrumbItems} />
              </span>
            )}
          </div>

          {/* CENTER */}
          <div className="topbar__center">
            {status ? (
              <TopbarStatusPill status={status} pct={pct} />
            ) : (
              <TopbarSearch
                q={q}
                pending={pending}
                inputRef={searchInputRef}
                onChange={setQ}
                onSubmit={onSubmit}
              />
            )}
          </div>

          {/* RIGHT */}
          <div className="topbar__right">
            <div className="menu-anchor">
              <QuickActionsMenu primary={primaryAction} />
            </div>

            <div className="menu-anchor features-anchor">
              <FeaturesPopover />
            </div>

            <button
              type="button"
              className="icon-btn"
              aria-label={`Theme: ${themeMode}`}
              title={`Theme: ${themeMode}`}
              onClick={cycleTheme}
            >
              <Icon name={themeIcon} />
            </button>

            <div className="menu-anchor">
              <NotificationsMenu />
            </div>

            {/* Only for admins, and only when the shell opted-in */}
            {showRoleSwitcher && isAdmin && (
              <div className="popover-anchor select-anchor" data-role-switcher>
                <RoleSwitcherTopbar {...roleSwitcherProps} />
              </div>
            )}

            <div className="menu-anchor">
              <AvatarMenu />
            </div>

            {rightAccessory}
          </div>
        </div>
      </div>
    </header>
  );
}

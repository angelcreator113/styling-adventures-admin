// src/components/Topbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/init-firebase";

import { usePrimaryAction } from "@/hooks/usePrimaryAction";
import { useThemeMode } from "@/hooks/useThemeMode";
import { setThemeMode, readTheme } from "@/utils/theme";
import { saveGreetingName, markLogin, makeGreeting } from "@/js/greeting-store";

import Icon from "@/components/Icon.jsx";

import TopbarSearch from "@/components/topbar/TopbarSearch.jsx";
import TopbarStatusPill from "@/components/topbar/TopbarStatusPill.jsx";
import Breadcrumbs from "@/components/topbar/Breadcrumbs.jsx";
import QuickActionsMenu from "@/components/topbar/QuickActionsMenu.jsx";
import NotificationsMenu from "@/components/topbar/NotificationsMenu.jsx";
import AvatarMenu from "@/components/topbar/AvatarMenu.jsx";

import { useBreadcrumbs } from "@/components/topbar/useBreadcrumbs.js";
import { useTopbarShortcuts } from "@/components/topbar/useTopbarShortcuts.js";

export default function Topbar({ status }) {
  const location = useLocation();
  const navigate = useNavigate();
  const primary = usePrimaryAction();
  const themeMode = useThemeMode();

  const [, setGreeting] = useState(makeGreeting());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const base = user.displayName || (user.email ? user.email.split("@")[0] : "");
        if (base) saveGreetingName(base);
        markLogin();
        const el = document.getElementById("sidebar-greeting");
        if (el) {
          el.textContent = `Bestie, ${base || "Bestie"}, Welcome Back!`;
          setGreeting(makeGreeting());
        }
      }
    });
    return () => unsub();
  }, []);

  // breadcrumbs (hide if page renders its own H1)
  const [hasPageTitle, setHasPageTitle] = useState(false);
  useEffect(() => {
    setHasPageTitle(!!document.querySelector(".page-title"));
  }, [location.pathname]);
  const { items: breadcrumbItems, hasItems } = useBreadcrumbs(location.pathname);

  // search
  const [q, setQ] = useState("");
  const [pending, setPending] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setPending(true);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
  }
  useEffect(() => {
    if (pending) setPending(false);
  }, [location.pathname]);

  // keyboard shortcuts (/ and Cmd/Ctrl+K handled in hook)
  useTopbarShortcuts({ searchInputRef, primary });

  // optional percent for status pill
  const pct = useMemo(() => {
    if (!status) return null;
    const m = status.match(/(\d{1,3})\s*%/);
    const n = m ? Math.max(0, Math.min(100, parseInt(m[1], 10))) : null;
    return Number.isFinite(n) ? n : null;
  }, [status]);

  // theme
  const cycleTheme = () => {
    const cur = readTheme();
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    setThemeMode(next);
  };
  const themeIcon = themeMode === "dark" ? "sun" : themeMode === "light" ? "moon" : "sun-moon";

  // compact on scroll
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header id="topbar" className={`topbar ${compact ? "is-compact" : ""}`} role="banner">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="container">
        <div className="topbar__inner topbar--3col">
          {/* LEFT: crumbs */}
          <div className="topbar__left">
            {!hasPageTitle && hasItems && <Breadcrumbs items={breadcrumbItems} />}
          </div>

          {/* CENTER: search or status */}
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

          {/* RIGHT: actions */}
          <div className="topbar__right">
            {!status && (
              <>
                {/* Mobile drawer toggle (visible ≤768px) */}
                <button
                  className="icon-btn show-on-mobile"
                  aria-label="Open menu"
                  title="Menu"
                  onClick={() => {
                    const shell = document.querySelector(".app-shell");
                    const open = shell?.getAttribute("data-sidebar") === "open";
                    shell?.setAttribute("data-sidebar", open ? "" : "open");
                    document.body.classList.toggle("body-lock", !open);
                  }}
                >
                  <Icon name="menu" />
                </button>

                <QuickActionsMenu primary={primary} />

                {/* Mobile search trigger */}
                <button
                  className="icon-btn show-on-mobile"
                  aria-label="Open search"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  title="Search"
                >
                  <Icon name="search" />
                </button>
              </>
            )}

            <button
              className="icon-btn"
              aria-label={`Theme: ${themeMode}`}
              title={`Theme: ${themeMode}`}
              onClick={cycleTheme}
            >
              <Icon name={themeIcon} />
            </button>

            <NotificationsMenu />
            <AvatarMenu />
          </div>
        </div>
      </div>

      {!status && mobileSearchOpen && (
        <div className="mobile-search">
          <TopbarSearch
            q={q}
            pending={pending}
            inputRef={searchInputRef}
            onChange={setQ}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </header>
  );
}

// src/nav/manifest.js

// Role-aware, feature-flag-aware sidebar manifest.
//
// Item types: "section" | "link" | "divider" | "external"
// Optional gating per item:
//   requires.role: "fan" | "creator" | "admin"
//   requires.scope: "some.scope.key"
//   showIf: (ctx) => boolean
//
// ctx passed to showIf looks like:
//   { role, scopes, flags, isVip }

export const NAV_MANIFEST = {
  /* ===========================
   * FAN NAV
   * =========================== */
  fan: [
    { type: "section", label: "Comfort" },
    { type: "link", to: "/home", label: "Home", icon: "home" },
    { type: "link", to: "/closet", label: "Closet", icon: "closet" },

    { type: "section", label: "Let's Talk" },
    // The Blog (ForumThreadPage.jsx)
    { type: "link", to: "/blog", label: "The Blog", icon: "newspaper" },

    { type: "section", label: "The Secret Style Room" },
    // Confessions (Secret Style Room)
    {
      type: "link",
      to: "/confessions",
      label: "Confessions",
      icon: "sparkles",
      showIf: (ctx) => !!ctx?.flags?.confessions,
    },

    { type: "section", label: "MY STUFF" },
    // If you have a boards route, keep it; otherwise remove.
    { type: "link", to: "/boards", label: "Boards", icon: "board", showIf: () => true },
    // Sidebar/* pages
    { type: "link", to: "/spotlights", label: "Spotlights", icon: "star" },
    { type: "link", to: "/planner", label: "Planner", icon: "calendar-check" },
    { type: "link", to: "/calendar", label: "Calendar", icon: "calendar-days" },
    { type: "link", to: "/challenges", label: "Challenges", icon: "trophy" },
    { type: "link", to: "/outfit-builder", label: "Outfit Builder", icon: "shirt" },

    { type: "section", label: "PREMIUM" },
    // Bestie Lounge (TSX component lives at pages/lounge/BestieLounge.tsx)
    { type: "link", to: "/the-bestie-lounge", label: "Bestie Lounge", icon: "heart" },
    // Gate VIP if you use it. Set token.vip true in custom claims to show.
    { type: "link", to: "/vip", label: "VIP", icon: "crown", showIf: (ctx) => !!ctx?.isVip },

    { type: "divider" },
    {
      type: "external",
      href: "mailto:support@stylingadventures.example?subject=Help",
      label: "Support",
      icon: "life-buoy",
    },
  ],

  /* ===========================
   * CREATOR NAV
   * =========================== */
  creator: [
    { type: "section", label: "CREATOR" },
    { type: "link", to: "/creator/home", label: "Home", icon: "home" },
    { type: "link", to: "/creator/spaces", label: "Spaces", icon: "folder" },
    { type: "link", to: "/creator/boards", label: "Boards", icon: "board" },

    { type: "section", label: "WORKFLOW" },
    // Creator-side mirrors of Sidebar/* pages
    

    // Optional analytics page if present & scoped
    {
      type: "link",
      to: "/creator/analytics",
      label: "Analytics",
      icon: "chart",
      requires: { scope: "analytics.view" },
    },

    { type: "divider" },
    {
      type: "external",
      href: "https://docs.stylingadventures.example/creator",
      label: "Creator Docs",
      icon: "book",
    },
  ],
};

export default NAV_MANIFEST;

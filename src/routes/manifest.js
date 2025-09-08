// src/routes/manifest.js
// Single source of truth used by: Sidebar(s), Command Palette, and any nav UIs.
// Tip: keep labels short & human-friendly. Paths must match your actual routes.

export const ROUTE_MANIFEST = {
  admin: [
    { group: "Admin",   label: "Dashboard",        path: "/admin/home" },
    { group: "Admin",   label: "Users (Roles)",    path: "/admin/users" },
    { group: "Admin",   label: "Invites",          path: "/admin/invites" },
    { group: "Admin",   label: "Role Definitions", path: "/admin/role-defs" },
    { group: "Admin",   label: "Boards",           path: "/admin/boards" },
    { group: "Admin",   label: "Chat Manager",     path: "/admin/chat" },

    { group: "Themes",  label: "Theme Library",    path: "/admin/themes/library" },
    { group: "Themes",  label: "Theme Studio",     path: "/admin/themes/studio" },
    { group: "Themes",  label: "Manage Themes",    path: "/admin/themes/manage" },
    { group: "Themes",  label: "Theme Analytics",  path: "/admin/themes/analytics" },

    { group: "Content", label: "Spaces",           path: "/admin/spaces" },
    { group: "Content", label: "Episodes",         path: "/admin/content/episodes" },
    { group: "Content", label: "Clips",            path: "/admin/content/clips" },
    { group: "Content", label: "Closet Uploads",   path: "/admin/content/closet" },
    { group: "Content", label: "Content Editor",   path: "/admin/content/editor" },

    { group: "Tools",   label: "Meta & Tools",     path: "/admin/meta" },
    { group: "Tools",   label: "Storage Smoke",    path: "/admin/storage" },
  ],

  creator: [
    { group: "Creator", label: "Home",             path: "/creator/home" },
    { group: "Creator", label: "Spaces",           path: "/creator/spaces" },
    { group: "Creator", label: "Upload Episode",   path: "/episodes" },
    { group: "Creator", label: "Pinterest",        path: "/creator/pinterest" },
    { group: "Creator", label: "Instagram",        path: "/creator/instagram" },
    { group: "Creator", label: "YouTube",          path: "/creator/youtube" },
    { group: "Creator", label: "Insights",         path: "/creator/insights" },
    { group: "Creator", label: "Calendar",         path: "/creator/calendar" },
  ],

  // NOTE: keep these for Command Palette / global search
  fan: [
    { group: "Fan",     label: "Home",             path: "/home" },
    { group: "Fan",     label: "Closet",           path: "/closet" },
    { group: "Fan",     label: "Boards",           path: "/boards" },
    { group: "Fan",     label: "Outfit Builder",   path: "/outfit-builder" },
    { group: "Fan",     label: "Planner",          path: "/planner" },
    { group: "Fan",     label: "Spotlights",       path: "/spotlights" },
    { group: "Fan",     label: "The Blog",         path: "/blog" },
    { group: "Fan",     label: "Confessions",      path: "/confessions" },
    { group: "Fan",     label: "Challenges",       path: "/challenges" },
    { group: "Fan",     label: "Bestie Lounge",    path: "/the-bestie-lounge" },
    { group: "Fan",     label: "VIP",              path: "/vip" },
    { group: "Fan",     label: "Calendar",         path: "/calendar" },
  ],

  global: [
    { group: "Global",  label: "Boards",           path: "/boards" },
    { group: "Global",  label: "Calendar",         path: "/calendar" },
  ],
};

// role → which groups they may see in the palette
export const ROLE_GROUP_ACCESS = {
  admin:   ["admin", "creator", "fan", "global"],
  creator: ["creator", "fan", "global"],
  fan:     ["fan", "global"],
};

/* ------------------------------------------------------------------
   Sidebar manifest:
   - What the actual left sidebar renders, with sections + icons.
   - Fan/Creator get the links you asked for, grouped just so.
   - Icons are symbolic names for your icon system.
------------------------------------------------------------------- */

export const NAV_MANIFEST = {
  /* =========================
   * FAN
   * ========================= */
  fan: [
    { type: "section", label: "Comfort" },
    { type: "link", to: "/home",           label: "Home",    icon: "home" },
    { type: "link", to: "/closet",         label: "Closet",  icon: "closet" },

    { type: "section", label: "Let's Talk" },
    { type: "link", to: "/blog",           label: "The Blog", icon: "newspaper" },

    { type: "section", label: "The Secret Style Room" },
    { type: "link", to: "/confessions",    label: "Confessions", icon: "sparkles",
      showIf: (ctx) => ctx.flags.confessions !== false },

    { type: "section", label: "My Stuff" },
    { type: "link", to: "/boards",         label: "Boards",        icon: "board" },
    { type: "link", to: "/spotlights",     label: "Spotlights",     icon: "star" },
    { type: "link", to: "/planner",        label: "Planner",        icon: "calendar-check" },
    { type: "link", to: "/calendar",       label: "Calendar",       icon: "calendar-days" },
    { type: "link", to: "/challenges",     label: "Challenges",     icon: "trophy" },
    { type: "link", to: "/outfit-builder", label: "Outfit Builder", icon: "shirt" },

    { type: "section", label: "Premium" },
    { type: "link", to: "/the-bestie-lounge", label: "Bestie Lounge", icon: "heart" },
    { type: "link", to: "/vip",              label: "VIP",            icon: "crown",
      showIf: (ctx) => ctx.isVip === true },

    { type: "divider" },
    { type: "external",
      href: "mailto:support@stylingadventures.example?subject=Help",
      label: "Support", icon: "life-buoy" },
  ],

  /* =========================
   * CREATOR
   * ========================= */
  creator: [
    { type: "section", label: "Creator" },
    { type: "link", to: "/creator/home",     label: "Home",    icon: "home" },
    { type: "link", to: "/creator/spaces",   label: "Spaces",  icon: "folder" },
    { type: "link", to: "/creator/boards",   label: "Boards",  icon: "board" },

    { type: "section", label: "Workflow" },
    { type: "link", to: "/creator/spotlights",     label: "Spotlights",     icon: "star" },
    { type: "link", to: "/creator/planner",        label: "Planner",        icon: "calendar-check" },
    { type: "link", to: "/creator/calendar",       label: "Calendar",       icon: "calendar-days" },
    { type: "link", to: "/creator/challenges",     label: "Challenges",     icon: "trophy" },
    { type: "link", to: "/creator/outfit-builder", label: "Outfit Builder", icon: "shirt" },

    { type: "divider" },
    { type: "external",
      href: "https://docs.stylingadventures.example/creator",
      label: "Creator Docs", icon: "book" },
  ],
};

export default ROUTE_MANIFEST;

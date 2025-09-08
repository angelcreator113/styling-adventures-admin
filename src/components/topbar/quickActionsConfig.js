// topbar/quickActionsConfig.js
export const quickActions = {
  admin: [
    { label: "New Invite", to: "/admin/invites" },
    { label: "Open Theme Studio", to: "/admin/themes/studio" },
    { label: "Content Editor", to: "/admin/content/editor" },
  ],
  creator: [
    { label: "Upload Episode", to: "/episodes" },
    { label: "Open Spaces", to: "/creator/spaces" },
  ],
  fan: [
    { label: "Build Outfit", to: "/outfits/builder" },
    { label: "Community Forum", to: "/community/forum" },
  ],
};

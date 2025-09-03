// src/routes/constants.js
export const ROUTES = {
  // ----- Admin -----
  adminHome: "/admin/home",

  adminSpaces: "/admin/spaces",

  adminMeta: "/admin/meta",
  adminStorage: "/admin/storage",

  adminEpisodes: "/admin/episodes",
  adminClips: "/admin/episodes/clips",
  adminEpisodeBackgrounds: "/admin/episodes/backgrounds",

  adminThemes: "/admin/themes",            // Theme Library (list page)
  adminThemeManager: "/admin/themes/studio", // Theme Studio / Manager
  adminThemeAnalytics: "/admin/themes/analytics",
  adminThemeVoting: "/admin/themes/voting",

  // ----- Creator -----
  creatorHome: "/creator/home",
  creatorFiles: "/creator/files",
  creatorCalendar: "/creator/calendar",
  creatorInsights: "/creator/insights",
  creatorPinterest: "/creator/pinterest",
  creatorInstagram: "/creator/instagram",
  creatorYoutube: "/creator/youtube",
  creatorMoneyChat: "/creator/money-chat", // optional if/when you add it

  // ----- Fan -----
  fanHome: "/home",
  fanCloset: "/closet",
  fanOutfitBuilder: "/outfits/builder",
  fanPlanner: "/planner",

  fanBoards: "/boards",
  fanTopPicks: "/community/spotlights",
  fanForum: "/community/forum",
  fanConfessions: "/community/confessions",
  fanChallenges: "/community/challenges",

  fanVip: "/vip",
  fanCalendar: "/calendar",
};

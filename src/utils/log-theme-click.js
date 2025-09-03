import { logEvent } from "@/utils/log-theme-click"; // similar to logThemeVote

function handleClick(theme) {
  logEvent("theme_click", {
    themeId: theme.id,
    themeName: theme.name
  });
}

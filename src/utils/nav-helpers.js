// src/utils/nav-helpers.js
export const norm = (p) => {
  if (!p) return "/";
  let s = p.replace(/\/{2,}/g, "/");
  // collapse accidental '/home/home' just in case
  s = s.replace(/\/home\/home(\/|$)/, "/home$1");
  return s;
};

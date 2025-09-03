// utils/rollout.js
export function userInRollout(uid, percent) {
  if (!uid) return false;
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return (hash % 100) < (Number(percent) || 0);
}

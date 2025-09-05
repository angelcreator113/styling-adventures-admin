import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/utils/init-firebase";

/** Assign base role + admin sub-roles to a user (Super Admin only). */
export async function assignUserRoles({ uid, role, adminRoles = [] }) {
  const fn = httpsCallable(getFunctions(), "setUserRoles"); // cloud function name
  const res = await fn({ uid, role, adminRoles });
  // If you changed your own roles, refresh your token so UI updates immediately.
  await auth.currentUser?.getIdToken(true);
  return res.data; // { ok: true, scopes: {...} }
}

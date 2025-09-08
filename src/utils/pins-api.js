import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/utils/init-firebase";

const fns = getFunctions(app);

export async function setAdminPin(uid, pin) {
  const fn = httpsCallable(fns, "adminSetPin");
  const { data } = await fn({ uid, pin });
  return data;
}
export async function clearAdminPin(uid) {
  const fn = httpsCallable(fns, "adminSetPin");
  // Clear by sending null; function should treat null as "remove"
  const { data } = await fn({ uid, pin: null });
  return data;
}
export async function expireAdminSession(uid) {
  const fn = httpsCallable(fns, "adminExpireSession"); // small helper in functions (optional)
  const { data } = await fn({ uid });
  return data;
}

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getRoles, primaryRole, getCachedRoles } from "@/utils/roles";

const LS_KEY = "debug:roleOverride";
const DEV_FLAG_KEY = "debug:allowAnyRole";

// ----- Local override helpers -----
export function getRoleOverride() {
  try {
    return localStorage.getItem(LS_KEY) || null;
  } catch {
    return null;
  }
}

export function setRoleOverride(role) {
  try {
    localStorage.setItem(LS_KEY, role);
  } catch {}
  window.dispatchEvent(new CustomEvent("role-override", { detail: role }));
}

export function clearRoleOverride() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent("role-override", { detail: null }));
}

// Dev helper: allow any role on localhost when this flag is set
const devAllowAny = () =>
  import.meta.env.DEV && localStorage.getItem(DEV_FLAG_KEY) === "1";

export function enableDevAllowAnyRole() {
  localStorage.setItem(DEV_FLAG_KEY, "1");
  // recommend a reload after toggling
}
export function disableDevAllowAnyRole() {
  localStorage.removeItem(DEV_FLAG_KEY);
}

// ----- Main hook -----
export function useUserRole() {
  const [loading, setLoading] = useState(true);
  const [realRoles, setRealRoles] = useState(() => getCachedRoles().roles || ["fan"]);
  const [fanEnabled, setFanEnabled] = useState(false);
  const [effectiveRole, setEffectiveRole] = useState("fan");

  useEffect(() => {
    let profileUnsub = null;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRealRoles(["fan"]);
        setFanEnabled(false);
        setLoading(false);
        return;
      }

      const roles = await getRoles();
      setRealRoles(roles);
      setLoading(false);

      try {
        const pRef = doc(db, `users/${u.uid}/settings/profile`);
        profileUnsub = onSnapshot(pRef, (snap) => {
          setFanEnabled(!!snap.data()?.fanEnabled);
        });
      } catch {
        setFanEnabled(false);
      }
    });

    return () => {
      unsub?.();
      profileUnsub?.();
    };
  }, []);

  const real = useMemo(() => primaryRole(realRoles), [realRoles]);

  const roleOptions = useMemo(() => {
    // 🔧 DEV ESCAPE HATCH: when enabled on localhost, let the switcher offer all roles
    if (devAllowAny()) return ["fan", "creator", "admin"];

    if (real === "admin") return ["fan", "creator", "admin"];
    if (real === "creator") return fanEnabled ? ["fan", "creator"] : ["creator"];
    return [];
  }, [real, fanEnabled]); // dev flag changes usually come with a reload

  useEffect(() => {
    const applyOverride = () => {
      const override = getRoleOverride();
      const options = devAllowAny() ? ["fan", "creator", "admin"] : roleOptions;
      setEffectiveRole(override && options.includes(override) ? override : real);
    };

    applyOverride();

    // Note: 'storage' only fires across tabs. For same-tab toggling, reload
    window.addEventListener("storage", applyOverride);
    window.addEventListener("role-override", applyOverride);
    return () => {
      window.removeEventListener("storage", applyOverride);
      window.removeEventListener("role-override", applyOverride);
    };
  }, [real, roleOptions]);

  return {
    loading,
    role: real,               // primary role from backend
    effectiveRole,            // view-as role after override
    roleOptions,              // what the switcher should offer
    fanEnabled,
    isRealAdmin: real === "admin",
    isAdmin: effectiveRole === "admin",
    isCreator: effectiveRole === "admin" || effectiveRole === "creator",
    setRoleOverride,
    clearRoleOverride,
  };
}


// src/hooks/useIsAdmin.js
import { useEffect, useState } from "react";
import { auth } from "@/utils/init-firebase";

// Checks Firebase custom claims for admin OR roles[] includes 'admin'
export default function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      try {
        if (!u) {
          setIsAdmin(false);
          setReady(true);
          return;
        }
        const { claims } = await u.getIdTokenResult(true);
        const roles = claims?.roles || claims?.role || [];
        const isAdminClaim = !!claims?.admin || (Array.isArray(roles) && roles.includes("admin"));
        setIsAdmin(isAdminClaim);
      } catch {
        setIsAdmin(false);
      } finally {
        setReady(true);
      }
    });
    return unsub;
  }, []);

  return { isAdmin, ready };
}

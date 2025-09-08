// src/hooks/useVip.ts
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/init-firebase";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * VIP if:
 *  - custom claim vip === true
 *  - OR users/{uid}/settings/profile has tier === 'vip' or vipActive === true
 */
export default function useVip() {
  const [vip, setVip] = useState<boolean>(false);

  useEffect(() => {
    let stopProfile: (() => void) | null = null;
    let mounted = true;

    async function sync() {
      const u = auth.currentUser;
      if (!u) { setVip(false); return; }

      // claims
      const tok = await u.getIdTokenResult(true);
      const claimVip = !!tok.claims?.vip;

      // profile doc
      stopProfile = onSnapshot(doc(db, `users/${u.uid}/settings/profile`), (snap) => {
        const d = (snap.data() as any) || {};
        const docVip = d?.tier === "vip" || d?.vipActive === true;
        if (mounted) setVip(claimVip || docVip);
      });
    }

    sync();
    return () => { mounted = false; if (stopProfile) stopProfile(); };
  }, []);

  return vip;
}

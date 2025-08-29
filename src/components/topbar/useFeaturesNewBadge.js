import { useEffect, useState } from "react";
import { db } from "@/utils/init-firebase";
import { collection, getDocs, query } from "firebase/firestore";

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

export function useFeaturesNewBadge() {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "public/features_topics")));
        const now = Date.now();
        let found = false;
        for (const d of snap.docs) {
          const u = Number(d.data()?.updatedAt || 0);
          if (u && now - u < TWO_WEEKS) { found = true; break; }
        }
        if (!cancel) setHasNew(found);
      } catch {
        if (!cancel) setHasNew(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return hasNew;
}

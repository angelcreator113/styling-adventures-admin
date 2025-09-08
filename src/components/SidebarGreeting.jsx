// src/components/SidebarGreeting.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/utils/init-firebase";

export default function SidebarGreeting() {
  const [greetingName, setGreetingName] = useState("Bestie");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() || {};
        setGreetingName(data.greetingName || user.displayName || "Bestie");
        setReturning(Boolean(data.lastLogin));
        // touch lastLogin
        await setDoc(
          ref,
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
      } else {
        // first login: create doc
        await setDoc(
          ref,
          {
            greetingName: user.displayName || "Bestie",
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
        setGreetingName(user.displayName || "Bestie");
        setReturning(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="sidebar-greeting">
      {returning
        ? `Bestie, ${greetingName}, welcome back!`
        : `Bestie, ${greetingName}, welcome!`}
    </div>
  );
}


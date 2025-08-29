// src/admin/AdminTopbar.jsx
import React, { useEffect, useState } from "react";
import Topbar from "@/components/topbar/Topbar.jsx";
import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx";
import { auth } from "@/utils/init-firebase";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";

export default function AdminTopbar(props) {
  const [isAdmin, setIsAdmin] = useState(false);

  // gate on the admin claim
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setIsAdmin(false);
      try {
        const t = await getIdTokenResult(user);
        setIsAdmin(!!t.claims?.admin || t.claims?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // optional: force-refresh claims after switching
  const refreshMyRole = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return toast.error("Not signed in.");
      toast.loading("Refreshing role…", { id: "refresh-role" });
      await user.getIdToken(true);
      toast.dismiss("refresh-role");
      toast.success("Role refreshed!");
      setTimeout(() => window.location.reload(), 250);
    } catch {
      toast.dismiss("refresh-role");
      toast.error("Couldn’t refresh role.");
    }
  };

  const adminSlot = isAdmin ? (
    <div className="admin-topbar-slot">
      <RoleSwitcherTopbar onRefresh={refreshMyRole} />
    </div>
  ) : null;

  // merge any accessory from the shell (e.g., sidebar toggle) with the role switcher
  const mergedAccessory = (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {props.rightAccessory}
      {adminSlot}
    </div>
  );

  return <Topbar {...props} rightAccessory={mergedAccessory} />;
}

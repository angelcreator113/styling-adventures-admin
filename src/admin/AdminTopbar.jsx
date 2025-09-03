import React, { useEffect, useState } from "react";
import Topbar from "@/components/topbar/Topbar.jsx";
import RoleSwitcherTopbar from "@/components/topbar/RoleSwitcherTopbar.jsx";
import { auth } from "@/utils/init-firebase";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

export default function AdminTopbar(props) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setIsAdmin(false);
      try {
        const { claims } = await user.getIdTokenResult(true);
        const roles = Array.isArray(claims?.roles) ? claims.roles : [];
        const role = typeof claims?.role === "string" ? claims.role : null;
        const adminFlag = !!claims?.admin;
        setIsAdmin(adminFlag || role === "admin" || roles.includes("admin"));
      } catch {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  const refreshMyRole = async () => {
    const user = auth.currentUser;
    if (!user) return toast.error("Not signed in.");
    toast.loading("Refreshing role…", { id: "refresh-role" });
    try {
      await user.getIdToken(true);
      toast.success("Role refreshed!", { id: "refresh-role" });
      setTimeout(() => window.location.reload(), 200);
    } catch {
      toast.error("Couldn’t refresh role.", { id: "refresh-role" });
    }
  };

  const rightAccessory = (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {props.rightAccessory}
      {isAdmin ? <RoleSwitcherTopbar onRefresh={refreshMyRole} /> : null}
    </div>
  );

  return <Topbar {...props} rightAccessory={rightAccessory} />;
}

// src/components/topbar/QuickActionsMenu.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_MANIFEST, ROLE_GROUP_ACCESS } from "@/routes/manifest";
import { useAuth } from "@/context/AuthContext";

export default function QuickActionsMenu() {
  const { role = "fan" } = useAuth?.() ?? { role: "fan" };
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // pick 5 “most useful” targets per role (customize the heuristic)
  const actions = useMemo(() => {
    const allowed = ROLE_GROUP_ACCESS[role] || ["fan", "global"];
    const pool = allowed.flatMap((key) => ROUTE_MANIFEST[key] || []);
    // naive prioritization: Admin/Content first, then Themes/Creator/etc.
    const score = (item) => {
      const g = (item.group || "").toLowerCase();
      if (g.includes("content")) return 100;
      if (g.includes("admin")) return 95;
      if (g.includes("creator")) return 80;
      if (g.includes("themes")) return 70;
      if (g.includes("fan")) return 50;
      return 40;
    };
    return [...pool].sort((a,b) => score(b) - score(a)).slice(0, 5);
  }, [role]);

  useEffect(() => {
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div className="qa" ref={ref}>
      <button className="icon-btn" aria-haspopup="menu" aria-expanded={open} title="Quick actions"
        onClick={() => setOpen((v) => !v)}>
        ⚡
      </button>
      {open && (
        <div className="qa-menu" role="menu">
          {actions.map((a) => (
            <button
              key={a.path}
              role="menuitem"
              className="qa-item"
              onClick={() => { setOpen(false); navigate(a.path); }}
            >
              <span className="qa-label">{a.label}</span>
              <span className="qa-kicker">{a.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

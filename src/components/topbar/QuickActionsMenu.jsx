// src/components/topbar/QuickActionsMenu.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function QuickActionsMenu({ primary }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const runPrimary = () => {
    if (typeof primary?.onClick === "function") primary.onClick();
    else navigate("/closet/upload");
    setOpen(false);
  };

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        className="tb-btn primary"
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Quick actions"
      >
        + New
      </button>

      {open && (
        <div className="menu topbar-panel qa-menu" data-topbar-panel role="menu" style={{ minWidth: 260 }}>
          <button type="button" className="menu-item cta" role="menuitem" onClick={runPrimary}>
            {primary?.label ?? "Start Closet Upload"}
          </button>
        </div>
      )}
    </div>
  );
}

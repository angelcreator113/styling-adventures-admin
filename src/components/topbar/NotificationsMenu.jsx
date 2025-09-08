// src/components/topbar/NotificationsMenu.jsx
import React, { useRef, useState, useEffect } from "react";
import Icon from "@/components/Icon";

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setOpen(v => !v)}
      >
        <Icon name="bell" />
      </button>

      {open && (
        <div className="menu" role="menu" style={{ minWidth: 280 }}>
          <div className="menu-item" role="menuitem" tabIndex={-1}>
            No new notifications.
          </div>
        </div>
      )}
    </div>
  );
}


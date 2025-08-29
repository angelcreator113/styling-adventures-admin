// src/components/topbar/NotificationsMenu.jsx
import React, { useRef, useState, useEffect } from "react";
import Icon from "@/components/Icon.jsx"; // keep the .jsx if your imports require it

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);

  // close when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc, { passive: true });
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  // close on Escape, restore focus to the button
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        ref={btnRef}
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
        <div
          className="menu"
          role="menu"
          style={{ minWidth: 280 }}
        >
          <div className="menu-item" role="menuitem" tabIndex={-1} aria-disabled="true" style={{ opacity: .8 }}>
            No new notifications.
          </div>
        </div>
      )}
    </div>
  );
}


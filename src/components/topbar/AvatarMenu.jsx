// src/components/topbar/AvatarMenu.jsx
import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/init-firebase";
import Icon from "@/components/Icon";

export default function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

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

  const doLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        title="Account"
        onClick={() => setOpen(v => !v)}
      >
        <Icon name="user" />
      </button>

      {open && (
        <div className="menu" role="menu" style={{ minWidth: 220 }}>
          <div className="menu-item" role="menuitem" tabIndex={-1}>
            <strong>My Account</strong>
          </div>
          <Link to="/home" className="menu-item" role="menuitem" tabIndex={-1}>
            <Icon name="home" /> Home
          </Link>
          <Link to="/boards" className="menu-item" role="menuitem" tabIndex={-1}>
            <Icon name="layout" /> Boards
          </Link>
          <Link to="/admin/home" className="menu-item" role="menuitem" tabIndex={-1}>
            <Icon name="shield" /> Admin Console
          </Link>
          <div className="menu-sep" role="separator" />
          <button className="menu-item" role="menuitem" onClick={doLogout}>
            <Icon name="log-out" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}



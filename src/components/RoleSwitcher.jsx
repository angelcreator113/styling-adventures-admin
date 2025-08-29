import React from "react";
import RoleSwitcher from "@/components/RoleSwitcher.jsx";

export default function RoleSwitcherTopbar({ onRefresh }) {
  return (
    <div className="topbar-role-switcher">
      <RoleSwitcher />
      <button
        className="icon-btn ml-2"
        title="Refresh Role"
        aria-label="Refresh role"
        onClick={onRefresh}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-refresh-cw"
        >
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 14.89-6.36L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-14.83 6.38L3 16" />
        </svg>
      </button>
    </div>
  );
}


import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole, setRoleOverride, clearRoleOverride } from "@/hooks/RoleGates";

export default function RoleSwitcherTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: realRole, effectiveRole, roleOptions } = useUserRole();

  if (!roleOptions?.length) return null;

  const options = useMemo(() => {
    const labels = {
      admin: "Admin (full)",
      creator: "View as: Creator",
      fan: "View as: Fan",
    };
    // cosmetic: admin last
    const sorted = [...roleOptions].sort((a, b) => (a === "admin") - (b === "admin"));
    return sorted.map((role) => ({
      value: role === realRole ? "" : role, // "" = no override
      label: labels[role] || role,
      role,
    }));
  }, [roleOptions, realRole]);

  // current UI value: empty means "no override" (showing real role)
  const currentValue = effectiveRole === realRole ? "" : effectiveRole;

  // Direct homes (don’t rely on intermediate redirects)
  const roleHomes = useMemo(
    () => ({
      "": realRole === "admin" ? "/admin/home" : realRole === "creator" ? "/creator/home" : "/home",
      admin: "/admin/home",
      creator: "/creator/home",
      fan: "/home",
    }),
    [realRole]
  );

  const areaOf = (pathname) => {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/creator")) return "creator";
    return "fan";
  };

  const onChange = useCallback(
    (e) => {
      const selected = e.target.value; // "" | "admin" | "creator" | "fan"
      if (selected === currentValue) return;

      // 1) Apply override first
      if (!selected) clearRoleOverride();
      else setRoleOverride(selected);

      // 2) Compute where to go
      const targetHome = roleHomes[selected || ""] || "/home";
      const targetArea = selected || realRole; // admin|creator|fan
      const currentArea = areaOf(location.pathname);

      // 3) Only navigate if the shell (area) changes
      if (currentArea !== targetArea) {
        // Let role state settle, then jump straight to the proper home
        setTimeout(() => navigate(targetHome, { replace: true }), 0);
      }
      // If the area is already correct, no navigation needed.
    },
    [currentValue, roleHomes, location.pathname, navigate, realRole]
  );

  return (
    <label className="role-switcher" title={`Current role: ${effectiveRole}`}>
      <span className="sr-only">Switch role view</span>
      <select
        className="select"
        value={currentValue}
        onChange={onChange}
        aria-label="Switch role view"
      >
        {options.map((opt) => (
          <option key={`${opt.role}-${opt.value || "default"}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

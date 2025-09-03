import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole, setRoleOverride, clearRoleOverride } from "@/hooks/RoleGates";

/** Pure role-view selector (no refresh button, no admin gate) */
export default function RoleViewSelect() {
  const nav = useNavigate();
  const loc = useLocation();
  const { role: realRole, effectiveRole, roleOptions } = useUserRole();

  if (!roleOptions?.length) return null;

  const options = useMemo(() => {
    const labels = { admin: "Admin (full)", creator: "View as: Creator", fan: "View as: Fan" };
    const sorted = [...roleOptions].sort((a, b) => (a === "admin") - (b === "admin"));
    return sorted.map((r) => ({
      value: r === realRole ? "" : r,   // "" = no override
      label: labels[r] || r,
      role: r,
    }));
  }, [roleOptions, realRole]);

  const currentValue = effectiveRole === realRole ? "" : effectiveRole;

  const homes = useMemo(
    () => ({
      "": realRole === "admin" ? "/admin/home" : realRole === "creator" ? "/creator/home" : "/home",
      admin: "/admin/home",
      creator: "/creator/home",
      fan: "/home",
    }),
    [realRole]
  );

  const areaOf = (p) =>
    p.startsWith("/admin") ? "admin" : p.startsWith("/creator") ? "creator" : "fan";

  const onChange = useCallback(
    (e) => {
      const val = e.target.value; // "" | "creator" | "fan" | "admin"
      if (val === currentValue) return;

      if (!val) clearRoleOverride();
      else setRoleOverride(val);

      const target = homes[val || ""] || "/home";
      const desiredArea = val || (realRole || "fan");
      const currentArea = areaOf(loc.pathname);

      if (currentArea !== desiredArea) {
        setTimeout(() => nav(target, { replace: true }), 0);
      }
    },
    [currentValue, homes, loc.pathname, nav, realRole]
  );

  return (
    <label className="role-switcher" title={`Role: ${effectiveRole}`}>
      <span className="sr-only">Switch role view</span>
      <select
        className="select"
        value={currentValue}
        onChange={onChange}
        aria-label="Switch role view"
      >
        {options.map((o) => (
          <option key={`${o.role}-${o.value || "default"}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

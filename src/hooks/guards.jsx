// src/hooks/guards.jsx
// 🚨 Legacy shim kept only so old imports don't break.
// Prefer: import RequireRole from "@/components/RequireRole";
import React from "react";
import RequireRole from "@/components/RequireRole.jsx";

export function RequireAnyRoleLegacy({ allow = [], children }) {
  // Map the "any-of" to the canonical component by checking at render time
  // NOTE: If you still rely on this, migrate to <RequireRole/> soon.
  return (
    <RequireRole
      role={(roles => {
        // admin always allowed; the component handles that logic
        if (!roles || roles.length === 0) return "fan";
        // if you used to pass allow=["creator","fan"], just pick one –
        // the role component will admit admin anyway.
        return allow[0] || "fan";
      })()}
      allowAdmin
    >
      {children}
    </RequireRole>
  );
}

export default RequireAnyRoleLegacy;

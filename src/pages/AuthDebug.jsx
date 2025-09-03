// src/pages/AuthDebug.jsx
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthDebug() {
  const { user, loading } = useAuth();
  return (
    <pre style={{ padding: 16, background: "#111827", color: "white" }}>
      {JSON.stringify(
        { loading, hasUser: !!user, uid: user?.uid || null, email: user?.email || null },
        null,
        2
      )}
    </pre>
  );
}

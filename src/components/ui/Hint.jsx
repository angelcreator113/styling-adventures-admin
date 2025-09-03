import React from "react";

export default function Hint({ title = "Tip", children }) {
  return (
    <span
      title={typeof children === "string" ? children : title}
      aria-label={typeof children === "string" ? children : title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        marginLeft: 8,
        borderRadius: "50%",
        fontSize: 12,
        fontWeight: 700,
        background: "rgba(124,58,237,.12)",
        color: "#7c3aed",
        border: "1px solid rgba(124,58,237,.35)",
        cursor: "help",
        userSelect: "none",
      }}
    >
      i
    </span>
  );
}

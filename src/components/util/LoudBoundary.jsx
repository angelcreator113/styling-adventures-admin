// src/components/util/LoudBoundary.jsx
import React from "react";

export default class LoudBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[LoudBoundary caught]", error, info);
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            margin: 12,
            padding: 12,
            border: "2px solid #ef4444",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: 8,
          }}
        >
          <strong>Admin route crashed:</strong>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {error?.stack || String(error)}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #991b1b",
              background: "#ffe4e6",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

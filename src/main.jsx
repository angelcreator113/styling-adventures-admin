// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// single global CSS entry (imports everything else)
import "@/css/index.css";

// theme bootstrapping
import { initTheme } from "@/utils/theme";

// a11y scaffolding (idempotent)
import { ensureA11yScaffold } from "@/js/a11y/ensure-scaffold";

initTheme();
ensureA11yScaffold();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

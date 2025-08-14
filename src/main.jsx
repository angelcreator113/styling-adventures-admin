// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // <- fix casing to match file
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext"; // <- use alias

// single global CSS entry (imports everything else)
import "@/css/index.css";

// theme bootstrapping
import { initTheme } from "@/utils/theme";

// a11y scaffolding (idempotent)
import { ensureA11yScaffold } from "@/js/a11y/ensure-scaffold";

initTheme();
ensureA11yScaffold();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element "#root" not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import AppRouter from "@/routes/AppRouter.jsx";

import "@/css/index.css";
import { initTheme } from "@/utils/theme";
import { ensureA11yScaffold } from "@/js/a11y/ensure-scaffold";

initTheme();
ensureA11yScaffold();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);


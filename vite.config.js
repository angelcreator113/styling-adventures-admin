import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vite configuration
export default defineConfig(({ command }) => ({
  appType: "spa", // Ensures React Router handles refreshes properly

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Ensure this resolves to the correct 'src' directory
    },
  },

  server: {
    host: "127.0.0.1",
    port: 5174,       // fixed port
    strictPort: true,
    open: true,

    proxy: {
      "/sessionLogin":  "http://localhost:3000",
      "/sessionLogout": "http://localhost:3000",
      "/smoke":         "http://localhost:3000",
      "/whoami":        "http://localhost:3000",
      // No proxy for /admin — React Router handles it
    },

    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5174,
    },
  },

  optimizeDeps: {
    include: ["recharts"],
    exclude: ["firebase", "firebase/app", "firebase/auth", "lucide-react"],
    force: command === "serve",
  },

  ssr: {
    noExternal: ["firebase"],
  },
}));

// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/sessionLogin': 'http://localhost:3000',
      '/sessionLogout': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/smoke': 'http://localhost:3000',
    },
  },
  // 🔧 Stop Vite from pre-bundling Firebase (eliminates the 504 loop)
  optimizeDeps: {
    exclude: ['firebase', 'firebase/app', 'firebase/auth'],
    force: command === 'serve', // force a clean optimize on first run
  },
  // (harmless in SPA dev; avoids edge SSR transforms treating firebase as external)
  ssr: {
    noExternal: ['firebase'],
  },
}))

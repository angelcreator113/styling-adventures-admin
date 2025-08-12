// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
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
})

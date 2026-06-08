import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Dev proxy: the frontend calls "/api/..." and Vite forwards to the
    // ASP.NET Core backend, sidestepping CORS during local development.
    proxy: {
      '/api': {
        target: 'http://localhost:5056',
        changeOrigin: true,
      },
    },
  },
})

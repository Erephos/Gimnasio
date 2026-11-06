/* global process */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// En desarrollo, /api se redirige al backend para evitar problemas de CORS.
// El destino se puede cambiar con la variable DEV_API_TARGET.
const apiTarget = process.env.DEV_API_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
})

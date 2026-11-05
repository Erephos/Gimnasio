<<<<<<< HEAD
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
=======
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
>>>>>>> 0aa17df66e9861c378ac78d1fc49477c137a5d85
})

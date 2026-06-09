import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração optimizada para garantir um build rápido e estável na Vercel
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
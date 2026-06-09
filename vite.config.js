import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração padrão limpa do Vite para evitar conflitos no build da Vercel
export default defineConfig({
  plugins: [react()]
})
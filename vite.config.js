import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Força o processamento explícito do CSS no build da Vercel
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
})
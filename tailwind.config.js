/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        silver: {
          50: '#f5f6f7',
          100: '#e4e7eb',
          200: '#cbd2d9',
          300: '#9aa5b1',
          400: '#7b8794',
          500: '#616e7c',
          600: '#48535e',
          700: '#323f4b',
          800: '#1f2933',  // Grafite metálico médio
          900: '#121b22',  // Prata escuro profundo
          950: '#0a0f12',  // Fundo super escuro metálico
        },
        gold: {
          300: '#f7e7a8',
          400: '#e5c060',
          500: '#d4af37',  // Dourado clássico premium
          600: '#b89229',
          700: '#91711c',
        }
      },
      boxShadow: {
        'gold-relief': '0 0 10px rgba(212, 175, 55, 0.25), inset 0 1px 2px rgba(212, 175, 55, 0.1)',
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.45)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quatree: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981', // Verde esmeralda premium
          600: '#059669',
          800: '#065f46',
          900: '#064e3b',
          amber: '#f59e0b',
        },
        slate: {
          950: '#090d16',
        }
      }
    },
  },
  plugins: [],
}

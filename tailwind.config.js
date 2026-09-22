/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        boutique: {
          50: '#FDFBF9',
          100: '#F7F3EE',
          200: '#EFE7DD',
          300: '#DFD2C0',
          400: '#C5B198',
          500: '#A78F73',
          600: '#8C7358',
          700: '#715A43',
          800: '#5A4633',
          900: '#433426',
        },
        gold: {
          50: '#FCF9EE',
          100: '#F7F0D4',
          200: '#EFE0A8',
          300: '#E4CC73',
          400: '#D7B442',
          500: '#C5A028',
          600: '#A47F1D',
          700: '#836018',
          800: '#694B18',
          900: '#573D17',
        },
        charcoal: {
          DEFAULT: '#1C1917',
          light: '#292524',
          muted: '#57534E',
          subtle: '#78716C',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -4px rgba(28, 25, 23, 0.06)',
        'elevated': '0 20px 40px -6px rgba(28, 25, 23, 0.12)',
      }
    },
  },
  plugins: [],
}

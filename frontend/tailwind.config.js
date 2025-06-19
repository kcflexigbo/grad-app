/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        'brand-dark': '#212529',
        'brand-text': '#495057',
        'brand-light': '#F8F9FA',
        'brand-accent': {
          DEFAULT: '#c09a5b', // A sophisticated gold
          'hover': '#ae8a4f',
        },
      }
    },
  },
  plugins: [],
}
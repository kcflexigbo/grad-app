/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- This is the most important line
  ],
  theme: {
    extend: {
      backgroundImage: {
        'noise': "url('/noise.svg')",
      }
    },
  },
  plugins: [],
}
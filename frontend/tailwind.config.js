/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0B213F",
        accent: "#00E5C2",
        "accent-magenta": "#FF2D95",
      },
    },
  },
  plugins: [],
}
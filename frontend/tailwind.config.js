/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0E14",
        cardBg: "rgba(22, 28, 38, 0.7)",
        primary: "#14b8a6", // Teal
        secondary: "#a855f7", // Purple
        accent: "#3b82f6", // Blue
      }
    },
  },
  plugins: [],
}

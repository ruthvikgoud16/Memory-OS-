/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#050505",
        surface1: "#111111",
        surface2: "#1A1A1A",
        primary: "#10B981", // Emerald
        secondary: "#8B5CF6", // Purple
        tertiary: "#06B6D4", // Cyan
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 25s ease-in-out infinite',
        'float-medium': 'float-reverse 30s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-40px, 40px) scale(0.95)' },
          '66%': { transform: 'translate(30px, -30px) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}

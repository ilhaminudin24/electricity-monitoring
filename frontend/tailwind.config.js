/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#0066ff",
        "secondary": "#00CCBB",
        "background-light": "#FFFFFF",
        "background-alt": "#F5F7FA",
        "background-dark": "#0f1723",
        "text-main": "#101418",
        "text-main": "#101418",
        "text-sub": "#5e718d",
        "energy-teal": "#07883b",
        "energy-yellow": "#eab308",
        "alert-amber": "#f59e0b",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "xl": "2rem",
        "2xl": "3rem"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 10px 40px -10px rgba(0, 102, 255, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        }
      }
    },
  },
  plugins: [],
}


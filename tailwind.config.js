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
      },
      colors: {
        bg: {
          primary: '#F6F3EE',    // Warm off-white
          secondary: '#EEE9E1',  // Darker beige
        },
        surface: {
          white: '#FFFEFC',
        },
        text: {
          primary: '#1E211F',
          secondary: '#6A6F68',
        },
        accent: {
          DEFAULT: '#1F3B2E',    // Deep Forest
          hover: '#152A21',
        },
        highlight: '#B7A896',    // Champagne Taupe
        border: {
          light: 'rgba(30, 33, 31, 0.08)',
        }
      },
      boxShadow: {
        'card-hover': '0 28px 70px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
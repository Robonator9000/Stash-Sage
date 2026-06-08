/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0d0a08',
        leather: '#16110e',
        'leather-light': '#1e1814',
        'leather-lighter': '#2a221d',
        brass: '#3a3028',
        parchment: '#ece6df',
        stone: '#8a7d72',
        ash: '#5c5248',
        herb: '#2d8a4e',
        'herb-dark': '#1a6b38',
        'herb-light': '#4aaf6e',
        ember: '#d4924a',
        bronze: '#c47f3c',
        lavender: '#8b6fc9',
      },
    },
  },
  plugins: [],
};

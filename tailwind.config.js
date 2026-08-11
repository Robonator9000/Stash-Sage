/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#0b1120',
        midnight: '#111827',
        surface: '#1a2332',
        'surface-light': '#243044',
        edge: '#2e3d55',
        frost: '#e2e8f0',
        mist: '#94a3b8',
        haze: '#64748b',
        cyanx: '#06b6d4',
        emera: '#10b981',
        'cyanx-dark': '#0891b2',
        'emera-dark': '#059669',
        amberx: '#f59e0b',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

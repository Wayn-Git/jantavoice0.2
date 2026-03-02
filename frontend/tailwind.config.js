/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#FF9933', dark: '#E8720C', pale: '#FFF3E0' },
        india: { green: '#138808', 'green-dark': '#0A5C04', 'green-pale': '#E8F5E9' },
        gray: {
          50: '#FAFAFA',
          100: '#FAFAFA',
          200: '#E5E7EB', // Borders
          300: '#E5E7EB',
          400: '#999999', // Light text
          500: '#555555', // Medium text
          600: '#555555',
          700: '#1A1A1A',
          800: '#1A1A1A', // Dark text
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'heart-pop': 'heartPop 0.35s ease',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        heartPop: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.4)' } },
      },
    },
  },
  plugins: [],
}

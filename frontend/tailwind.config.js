/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#FF9933', dark: '#E8801A', light: '#FFBA66', pale: '#FFF4E8' },
        india: { green: '#138808', 'green-dark': '#0D6B06', 'green-pale': '#EBF7E9' },
        ashoka: { DEFAULT: '#000080', mid: '#0000C8', light: '#3333CC', pale: '#E8E8FF' },
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'heart-pop': 'heartPop 0.35s ease',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        heartPop: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.4)' } },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#343F36', light: '#4A5C4D', dark: '#1E2920' },
        sage: { DEFAULT: '#758B70', light: '#8FA68A', dark: '#5C6E57' },
        cream: { DEFAULT: '#F3EFE5', dark: '#E8E0D0' },
        earth: { DEFAULT: '#B68C62', light: '#C9A87E', dark: '#8D6B47' },
        paper: { DEFAULT: '#FAF9F5', dark: '#F0EDE5' },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        editorial: ['Lora', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'page-turn': 'pageTurn 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}

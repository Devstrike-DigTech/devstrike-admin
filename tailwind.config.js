/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#931F5A',
        secondary: '#353B77',
        ink: {
          DEFAULT: '#1B1831',
          950: '#100D22',
          900: '#16132B',
          800: '#221E3D',
        },
        surface: '#F6F4F9',
      },
      fontFamily: {
        sans: ['Urbanist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #931F5A 0%, #353B77 100%)',
        'brand-gradient-d': 'linear-gradient(135deg, #B0256C 0%, #931F5A 35%, #353B77 100%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,24,49,0.04), 0 8px 24px -12px rgba(27,24,49,0.14)',
        lift: '0 2px 4px rgba(27,24,49,0.04), 0 24px 48px -20px rgba(27,24,49,0.28)',
        glow: '0 10px 30px -10px rgba(147,31,90,0.55)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'none' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'none' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      // `backwards` fill only, so no transform lingers after the animation
      // (a held transform turns the element into a containing block for fixed children).
      animation: {
        'fade-in': 'fade-in 0.2s ease-out backwards',
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'pop-in': 'pop-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) backwards',
      },
    },
  },
  plugins: [],
};

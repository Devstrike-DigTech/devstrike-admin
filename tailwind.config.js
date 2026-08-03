/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#931F5A',
        secondary: '#353B77',
        ink: '#1B1831',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#10B981', // Green 500
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        dark: {
          DEFAULT: '#0F1117',
          50: '#1F2937',
          100: '#1A1F2E',
          200: '#151A27',
          300: '#111520',
          400: '#0F1117',
          500: '#0C0E13',
          600: '#0A0B0F',
          700: '#08090C',
          800: '#060709',
          900: '#040506',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

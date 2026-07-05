/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calmBlue: {
          50: '#F8FAFC',
          100: '#E8F4F8',
          200: '#C5E2EE',
          500: '#1E40AF',
        },
        contrastYellow: '#FEF08A',
        contrastDark: '#171717',
      },
      animation: {
        'pulse-gentle': 'pulseGentle 2s infinite ease-in-out',
      },
      keyframes: {
        pulseGentle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        },
      },
    },
  },
  plugins: [],
}

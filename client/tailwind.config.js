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
          50: '#fff5ed',
          100: '#ffe8d5',
          200: '#ffd0aa',
          300: '#ffb074',
          400: '#ff863b',
          500: '#fa5d00', // Signature vibrant orange from design image
          600: '#fa5a00',
          700: '#d94700',
          800: '#ad3806',
          900: '#8c300a',
        },
        surface: {
          50: '#f8f9fa',
          100: '#f3f4f6',
          200: '#e5e7eb',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 30px -5px rgba(250, 93, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

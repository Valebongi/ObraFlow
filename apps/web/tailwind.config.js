/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F5C518',
          hover: '#D4A800',
          light: '#FEF3C7',
          dark: '#B8860B',
        },
        dark: {
          DEFAULT: '#111111',
          card: '#1A1A1A',
          hover: '#222222',
          muted: '#333333',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F8F8F8',
          tertiary: '#F0F0F0',
        },
        text: {
          primary: '#111111',
          secondary: '#717171',
          muted: '#A0A0A0',
          placeholder: '#A0A0A0',
        },
        border: {
          DEFAULT: '#E2E2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        4.5: '1.125rem',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      boxShadow: {
        brand: '0 4px 14px rgba(245, 197, 24, 0.3)',
      },
    },
  },
  plugins: [],
};

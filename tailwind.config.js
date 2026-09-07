/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C75B39',
          50: '#FDF3EF',
          100: '#FAE5DC',
          200: '#F4C9B8',
          300: '#EBA689',
          400: '#DE8260',
          500: '#C75B39',
          600: '#AF4A2C',
          700: '#8D3B25',
          800: '#713225',
          900: '#5C2B21'
        },
        charcoal: {
          DEFAULT: '#1E293B',
          dark: '#16202F',
          light: '#334155'
        },
        sand: {
          DEFAULT: '#FDF6F0',
          dark: '#F5EAE0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(30, 41, 59, 0.06), 0 1px 2px 0 rgba(30, 41, 59, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(30, 41, 59, 0.08), 0 2px 4px 0 rgba(30, 41, 59, 0.04)'
      }
    }
  },
  plugins: []
};

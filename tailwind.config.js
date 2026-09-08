/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--pn-primary) / <alpha-value>)',
          50: 'rgb(var(--pn-primary-50) / <alpha-value>)',
          100: 'rgb(var(--pn-primary-100) / <alpha-value>)',
          200: 'rgb(var(--pn-primary-200) / <alpha-value>)',
          300: 'rgb(var(--pn-primary-300) / <alpha-value>)',
          400: 'rgb(var(--pn-primary-400) / <alpha-value>)',
          500: 'rgb(var(--pn-primary-500) / <alpha-value>)',
          600: 'rgb(var(--pn-primary-600) / <alpha-value>)',
          700: 'rgb(var(--pn-primary-700) / <alpha-value>)',
          800: 'rgb(var(--pn-primary-800) / <alpha-value>)',
          900: 'rgb(var(--pn-primary-900) / <alpha-value>)'
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Palette dynamique — contrôlée par les variables CSS --pn-primary-* */
        primary: {
          DEFAULT: 'rgb(var(--pn-primary) / <alpha-value>)',
          50:  'rgb(var(--pn-primary-50)  / <alpha-value>)',
          100: 'rgb(var(--pn-primary-100) / <alpha-value>)',
          200: 'rgb(var(--pn-primary-200) / <alpha-value>)',
          300: 'rgb(var(--pn-primary-300) / <alpha-value>)',
          400: 'rgb(var(--pn-primary-400) / <alpha-value>)',
          500: 'rgb(var(--pn-primary-500) / <alpha-value>)',
          600: 'rgb(var(--pn-primary-600) / <alpha-value>)',
          700: 'rgb(var(--pn-primary-700) / <alpha-value>)',
          800: 'rgb(var(--pn-primary-800) / <alpha-value>)',
          900: 'rgb(var(--pn-primary-900) / <alpha-value>)',
        },

        /* Bleu marine fixe (identité de marque PressNet) */
        navy: {
          DEFAULT: '#142B4A',
          deep:    '#102238',
          light:   '#1E3A5F',
          muted:   '#6B829C',
        },

        /* Fond général */
        surface: '#F5F7FA',

        /* Alias pour compatibilité avec les anciens composants */
        charcoal: {
          DEFAULT: '#142B4A',
          dark:    '#102238',
          light:   '#1E3A5F',
        },
        sand: {
          DEFAULT: '#F5F7FA',
          dark:    '#ECF0F5',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },

      boxShadow: {
        card:       '0 1px 3px 0 rgba(20,43,74,0.06), 0 1px 2px 0 rgba(20,43,74,0.04)',
        'card-hover': '0 4px 16px 0 rgba(20,43,74,0.10), 0 2px 4px 0 rgba(20,43,74,0.06)',
        nav:        '2px 0 24px 0 rgba(20,43,74,0.18)',
      },

      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },

      backgroundImage: {
        'navy-gradient': 'linear-gradient(160deg, #142B4A 0%, #102238 100%)',
        'navy-subtle':   'linear-gradient(160deg, #1E3A5F 0%, #142B4A 100%)',
      },
    },
  },
  plugins: [],
};

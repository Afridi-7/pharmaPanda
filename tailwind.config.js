/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PharmaPanda brand palette — warm, human, educational.
        ink: {
          DEFAULT: '#252825', // dark text
          muted: '#73766F', // muted text
        },
        forest: {
          DEFAULT: '#26332E', // primary dark (headings, nav)
          900: '#1B2521',
          800: '#26332E',
          700: '#374A41',
        },
        moss: {
          DEFAULT: '#5F8068', // warm green (primary action)
          600: '#527059',
          500: '#5F8068',
          400: '#7E9A85',
        },
        sage: {
          DEFAULT: '#A8B9A3', // soft sage (positive)
          300: '#C3CFBF',
          200: '#DCE4D9',
          100: '#EDF1EB',
        },
        cream: {
          DEFAULT: '#F7F3EA',
          light: '#FCFBF7', // warm white
        },
        beige: {
          DEFAULT: '#E8DFCF', // warm beige (borders, dividers)
          dark: '#D8CDB8',
        },
        terracotta: {
          DEFAULT: '#C98267', // warnings
          600: '#B26B50',
          100: '#F3E2DA',
        },
        honey: {
          DEFAULT: '#E7C979', // attention
          600: '#D4AF52',
          100: '#FAF0D8',
        },
        alert: {
          DEFAULT: '#B3413A', // real red — serious clinical safety only
          100: '#F6E1DF',
        },
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(38, 51, 46, 0.04), 0 8px 24px -12px rgba(38, 51, 46, 0.14)',
        lift: '0 2px 4px rgba(38, 51, 46, 0.05), 0 18px 40px -18px rgba(38, 51, 46, 0.22)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'panda-blink': {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0.1)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'panda-blink': 'panda-blink 5s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

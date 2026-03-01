/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effef7',
          100: '#d9fbea',
          200: '#b5f5d6',
          300: '#7aebb5',
          400: '#3dd68e',
          500: '#14bd6e',
          600: '#099958',
          700: '#0b7a49',
          800: '#0e603b',
          900: '#0d4f33',
          950: '#032c1b',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc170',
          400: '#ff9d37',
          500: '#ff8010',
          600: '#f06506',
          700: '#c74b07',
          800: '#9e3b0e',
          900: '#7f330f',
        },
        surface: {
          base: '#f6f8fa',
          raised: '#ffffff',
          elevated: '#ffffff',
        },
        border: {
          DEFAULT: '#e2e6eb',
          subtle: '#eef1f4',
          strong: '#cdd3db',
        },
        card: {
          bg: '#fffcf0',
          border: '#8b6914',
          header: '#6b4f10',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        heading: '-0.03em',
      },
      lineHeight: {
        body: '1.7',
      },
      boxShadow: {
        raised: '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        elevated: '0 1px 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.08) inset',
        floating: '0 1px 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.06) inset',
        'glow-brand': '0 0 20px rgba(20,189,110,0.15), 0 0 60px rgba(20,189,110,0.08)',
        'glow-accent': '0 0 20px rgba(255,128,16,0.15), 0 0 60px rgba(255,128,16,0.08)',
        'card-allergy': '0 2px 4px rgba(139,105,20,0.1), 0 8px 24px rgba(139,105,20,0.08), 0 0 0 1px rgba(139,105,20,0.12)',
      },
      animation: {
        'score-fill': 'scoreFill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'score-count': 'scoreCount 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        scoreFill: {
          '0%': { transform: 'scaleX(0)', opacity: '0.5' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scoreCount: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

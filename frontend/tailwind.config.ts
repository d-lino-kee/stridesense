import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Strava-esque energetic orange as the primary accent.
        brand: {
          50: '#fff5ed',
          100: '#ffe9d5',
          200: '#fed0aa',
          300: '#fdb074',
          400: '#fb843c',
          500: '#f96316',
          600: '#ea4b0c',
          700: '#c2360c',
          800: '#9a2d12',
          900: '#7c2812',
        },
        ink: {
          DEFAULT: '#0f172a',
          soft: '#334155',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)',
        glow: '0 12px 40px -12px rgba(249,99,22,0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #f96316 0%, #fb843c 45%, #f59e0b 100%)',
        'hero-grid':
          'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config

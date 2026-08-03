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
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)',
        glow: '0 12px 40px -12px rgba(249,99,22,0.55)',
        lift: '0 20px 50px -20px rgba(15,23,42,0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #f96316 0%, #fb843c 45%, #f59e0b 100%)',
        'brand-mesh':
          'radial-gradient(at 0% 0%, rgba(249,99,22,0.18) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(245,158,11,0.16) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(251,132,60,0.14) 0px, transparent 50%)',
        'hero-grid':
          'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)',
        'map-mesh':
          'linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '75%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'draw-dash': {
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        'pop-in': 'pop-in 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'ping-slow': 'ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite',
        'draw-dash': 'draw-dash 2.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        // Palette métal profond
        metal: {
          950: '#030303',
          900: '#0A0A0A',
          850: '#0F0F0F',
          800: '#141414',
          750: '#1A1A1A',
          700: '#1F1F1F',
          600: '#2A2A2A',
          500: '#383838',
          400: '#505050',
          300: '#707070',
          200: '#A0A0A0',
          150: '#C0C0C0',
          100: '#D8D8D8',
          50:  '#F0F0F0',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          bright: '#E8E8E8',
          deep:   '#888888',
        },
        accent: {
          DEFAULT: '#C8C8C8',
          glow: 'rgba(200,200,200,0.15)',
        }
      },
      backgroundImage: {
        'metal-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0F0F0F 100%)',
        'silver-gradient': 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 50%, #A8A8A8 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'glow-radial': 'radial-gradient(ellipse at center, rgba(200,200,200,0.08) 0%, transparent 70%)',
      },
      boxShadow: {
        'metal': '0 1px 0 rgba(255,255,255,0.05), 0 -1px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.6)',
        'glow': '0 0 30px rgba(200,200,200,0.1)',
        'glow-lg': '0 0 60px rgba(200,200,200,0.15)',
        'inner-bright': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
    },
  },
  plugins: [],
};

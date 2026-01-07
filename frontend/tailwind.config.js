/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary - Deep Navy (trust, intelligence, professional)
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929',
        },
        // Accent - Warm Coral (food, appetite, warmth)
        coral: {
          50: '#fff5f5',
          100: '#ffe3e0',
          200: '#ffc9c2',
          300: '#ffa599',
          400: '#ff7a6b',
          500: '#ff6b5b',
          600: '#f74d3c',
          700: '#d63a2a',
          800: '#b02f22',
          900: '#8f2a1f',
        },
        // Secondary - Fresh Mint (success, fresh, modern)
        mint: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6df',
          300: '#5eead0',
          400: '#2dd4bb',
          500: '#14b8a3',
          600: '#0d9485',
          700: '#0f766b',
          800: '#115e57',
          900: '#134e48',
        },
        // Background - Warm Cream (cozy, inviting)
        cream: {
          50: '#fffaf5',   // Warmer base - hint of peach
          100: '#fff8f0',  // Main warm background
          200: '#fef3e8',  // Slightly deeper
          300: '#fdebd8',  // Card hover states
          400: '#f9dcc4',  // Accents
          500: '#f0cab0',  // Darker accents
        },
        // Neutral - Warm Gray (keeping for compatibility)
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Legacy - Amber (for warnings, keeping)
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Warm Sage Green (fresh, natural, calming)
        sage: {
          50: '#f6f7f4',
          100: '#e3e7dd',
          200: '#c8d0be',
          300: '#a5b296',
          400: '#849473',
          500: '#697a59',
          600: '#526145',
          700: '#414d38',
          800: '#363f30',
          900: '#2f362a',
          950: '#171c14',
        },
        // Warm Terracotta (earthy, appetizing, cozy)
        terracotta: {
          50: '#fdf6f3',
          100: '#fbeae3',
          200: '#f7d5c7',
          300: '#f0b69f',
          400: '#e78f6f',
          500: '#db6b47',
          600: '#c9533a',
          700: '#a84130',
          800: '#8a382c',
          900: '#723228',
        },
        // Butter Yellow (warm, inviting, cheerful)
        butter: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Success, Warning, Error
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-xs': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'soft-sm': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'soft-md': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'soft-lg': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        'soft-xl': '0 25px 50px -12px rgb(0 0 0 / 0.1)',
        'glow-coral': '0 0 40px rgba(255, 107, 91, 0.15)',
        'glow-mint': '0 0 40px rgba(20, 184, 163, 0.15)',
        'glow-primary': '0 0 40px rgba(51, 78, 104, 0.15)',
        'glow-warm': '0 0 50px rgba(255, 200, 150, 0.2)',
        'card-hover': '0 25px 50px -12px rgba(51, 78, 104, 0.15)',
        'card-warm': '0 8px 30px -8px rgba(219, 107, 71, 0.12)',
        'card-cozy': '0 12px 40px -10px rgba(255, 107, 91, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.03)',
        'inner-warm': 'inset 0 2px 8px 0 rgba(255, 200, 150, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'card-lift': 'cardLift 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        cardLift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
          '100%': { transform: 'translateY(-6px)', boxShadow: '0 25px 50px -12px rgba(51, 78, 104, 0.15)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        bounceGentle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 91, 0.15)' },
          '50%': { boxShadow: '0 0 35px rgba(255, 107, 91, 0.25)' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-rtl'),
  ],
}

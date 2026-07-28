/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', '0.875rem'],
        xs: ['0.75rem', '1rem'],
        sm: ['0.8125rem', '1.25rem'],
        base: ['0.875rem', '1.5rem'],
        lg: ['1rem', '1.5rem'],
        xl: ['1.125rem', '1.5rem'],
        '2xl': ['1.25rem', '1.5rem'],
        '3xl': ['1.5rem', '1.75rem'],
        '4xl': ['1.875rem', '2.25rem'],
        '5xl': ['2.25rem', '2.5rem'],
        '6xl': ['3rem', '1'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        background: '#09090B',
        foreground: '#FAFAFA',
        surface: '#111113',
        card: {
          DEFAULT: '#18181B',
          hover: '#1c1c1f',
          foreground: '#FAFAFA',
        },
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          foreground: '#FAFAFA',
          muted: 'hsl(var(--primary-muted))',
        },
        success: {
          DEFAULT: '#22C55E',
          foreground: '#FAFAFA',
          muted: 'hsl(var(--success-muted))',
        },
        danger: {
          DEFAULT: '#EF4444',
          foreground: '#FAFAFA',
          muted: 'hsl(var(--danger-muted))',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FAFAFA',
          muted: 'hsl(var(--warning-muted))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: '#FAFAFA',
          muted: 'hsl(var(--info-muted))',
        },
        muted: {
          DEFAULT: '#1A1A1E',
          foreground: '#71717A',
        },
        accent: {
          DEFAULT: '#18181B',
          foreground: '#FAFAFA',
        },
        secondary: {
          DEFAULT: '#18181B',
          foreground: '#A1A1AA',
        },
        sidebar: {
          DEFAULT: '#09090B',
          foreground: '#FAFAFA',
          muted: '#71717A',
          active: '#4F46E5',
          accent: '#18181B',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed)',
        topbar: 'var(--topbar-height)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.95)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-slow) var(--ease-out)',
        'fade-up': 'fade-up var(--duration-slow) var(--ease-out)',
        'fade-down': 'fade-down var(--duration-slow) var(--ease-out)',
        'slide-in': 'slide-in var(--duration-normal) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--duration-normal) var(--ease-out)',
        'scale-in': 'scale-in var(--duration-normal) var(--ease-out)',
        'scale-out': 'scale-out var(--duration-normal) var(--ease-in)',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 2s linear infinite',
        'accordion-down': 'accordion-down var(--duration-normal) var(--ease-out)',
        'accordion-up': 'accordion-up var(--duration-normal) var(--ease-out)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

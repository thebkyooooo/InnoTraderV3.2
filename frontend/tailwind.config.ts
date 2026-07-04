import type { Config } from 'tailwindcss'
import containerQueries from '@tailwindcss/container-queries'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    // 너비 브레이크포인트 — xs(480px)를 추가하고 기본값 유지 (순서 보존)
    screens: {
      'xs':   '480px',
      'sm':   '640px',
      'md':   '768px',
      'lg':   '1024px',
      'xl':   '1280px',
      '2xl':  '1536px',
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        'xs': '480px',
        '2xl': '1400px',
      },
    },
    extend: {
      // 높이(viewport height) 기준 브레이크포인트 — 너비 기준 sm/md/lg/xl/2xl과 별개
      screens: {
        'h-sm':  { raw: '(min-height: 640px)' },
        'h-md':  { raw: '(min-height: 800px)' },
        'h-lg':  { raw: '(min-height: 1080px)' },
        'h-xl':  { raw: '(min-height: 1280px)' },
        'h-2xl': { raw: '(min-height: 1440px)' },
        'h-2xl-sm': { raw: '(min-height: 1440px) and (min-width: 640px)' },
        'h-2xl-2xl': { raw: '(min-height: 1440px) and (min-width: 1536px)' },
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // InnoTrader 브랜드 색상
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        // 트레이딩 전용 색상
        profit: {
          DEFAULT: '#16a34a',
          light: '#dcfce7',
        },
        loss: {
          DEFAULT: '#dc2626',
          light: '#fee2e2',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'price-flash-up': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(22, 163, 74, 0.2)' },
        },
        'price-flash-down': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(220, 38, 38, 0.2)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'price-flash-up': 'price-flash-up 0.5s ease-out',
        'price-flash-down': 'price-flash-down 0.5s ease-out',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [containerQueries],
}

export default config

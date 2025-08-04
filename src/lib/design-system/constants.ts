// Design System Constants
// Separated to prevent circular dependencies and reduce bundle size

export const designSystem = {
  colors: {
    background: '#FAFAFA',
    primary: '#191919',
    accent: '#199BEC',
    surface: '#FFFFFF',
    'surface-secondary': '#F5F5F5',
    'text-primary': '#191919',
    'text-secondary': '#6B7280',
    'text-muted': '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  typography: {
    fontFamily: 'Inter',
    scale: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    '0': '0px',
    '1': '4px', // 0.5 * 8px
    '2': '8px', // 1 * 8px
    '3': '12px', // 1.5 * 8px
    '4': '16px', // 2 * 8px
    '5': '20px', // 2.5 * 8px
    '6': '24px', // 3 * 8px
    '8': '32px', // 4 * 8px
    '10': '40px', // 5 * 8px
    '12': '48px', // 6 * 8px
    '16': '64px', // 8 * 8px
    '20': '80px', // 10 * 8px
    '24': '96px', // 12 * 8px
  },
  borderRadius: {
    none: '0',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

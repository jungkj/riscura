/**
 * Design Tokens - Core visual design system
 * Defines all visual design elements for consistent UI across the platform
 */

// Spacing System - Based on 4px grid
export const spacing = {
  // Base spacing units
  xs: '4px', // 0.25rem
  sm: '8px', // 0.5rem
  md: '16px', // 1rem
  lg: '24px', // 1.5rem
  xl: '32px', // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
  '4xl': '96px', // 6rem

  // Component-specific spacing
  component: {
    padding: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    margin: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    gap: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
  },

  // Layout spacing
  layout: {
    containerPadding: '24px',
    sectionGap: '48px',
    cardGap: '16px',
    listItemGap: '8px',
  },
} as const

// Typography System
export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },

  // Font sizes
  fontSize: {
    xs: '12px', // 0.75rem
    sm: '14px', // 0.875rem
    base: '16px', // 1rem
    lg: '18px', // 1.125rem
    xl: '20px', // 1.25rem
    '2xl': '24px', // 1.5rem
    '3xl': '30px', // 1.875rem
    '4xl': '36px', // 2.25rem
    '5xl': '48px', // 3rem
    '6xl': '60px', // 3.75rem
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    tight: '1.2',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Semantic typography styles
  heading: {
    h1: {
      fontSize: '36px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '30px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.3',
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '20px',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '16px',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '0em',
    },
  },

  body: {
    large: {
      fontSize: '18px',
      fontWeight: '400',
      lineHeight: '1.6',
    },
    base: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    small: {
      fontSize: '14px',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    xs: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '1.4',
    },
  },

  caption: {
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '1.3',
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
  },

  code: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.4',
    fontFamily: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
  },
} as const

// Color System - Semantic and accessible colors
export const colors = {
  // Primary brand colors
  primary: {
    50: '#EBF8FF',
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: '#199BEC', // Main brand color
    600: '#1976D2',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#0A2E5C',
  },

  // Neutral colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#1A1A1A',
  },

  // Semantic colors
  semantic: {
    success: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },

  // Interactive colors
  interactive: {
    primary: '#199BEC',
    primaryHover: '#1976D2',
    primaryActive: '#1565C0',
    primaryDisabled: '#BDBDBD',

    secondary: '#F5F5F5',
    secondaryHover: '#EEEEEE',
    secondaryActive: '#E0E0E0',

    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerActive: '#B91C1C',

    success: '#22C55E',
    successHover: '#16A34A',
    successActive: '#15803D',
  },

  // Text colors
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#6B6B6B',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
    link: '#199BEC',
    linkHover: '#1976D2',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#F5F5F5',
  },

  // Border colors
  border: {
    primary: '#E0E0E0',
    secondary: '#EEEEEE',
    tertiary: '#F5F5F5',
    focus: '#199BEC',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },

  // Status colors for components
  status: {
    compliant: '#22C55E',
    nonCompliant: '#EF4444',
    inProgress: '#3B82F6',
    pending: '#F59E0B',
    overdue: '#DC2626',
    completed: '#16A34A',
    notStarted: '#9E9E9E',
    deactivated: '#757575',
  },
} as const

// Elevation System - Box shadows and z-index
export const elevation = {
  // Box shadows
  shadow: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Component-specific shadows
  component: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    tooltip: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    buttonHover: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const

// Border Radius System
export const borderRadius = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',

  // Component-specific radius
  component: {
    button: '6px',
    card: '8px',
    input: '6px',
    badge: '4px',
    avatar: '50%',
    modal: '12px',
    tooltip: '6px',
  },
} as const

// Animation System
export const animation = {
  // Duration
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },

  // Common transitions
  transition: {
    default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors:
      'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideInUp: {
      from: { transform: 'translateY(100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideInDown: {
      from: { transform: 'translateY(-100%)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideInRight: {
      from: { transform: 'translateX(100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.9)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.9)', opacity: 0 },
    },
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
} as const

// Breakpoints for responsive design
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Component sizing
export const sizing = {
  // Icon sizes
  icon: {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // Avatar sizes
  avatar: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
    '2xl': '96px',
  },

  // Button heights
  button: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
  },

  // Input heights
  input: {
    xs: '28px',
    sm: '36px',
    md: '40px',
    lg: '48px',
    xl: '56px',
  },

  // Container max widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Design tokens object combining all systems
export const designTokens = {
  spacing,
  typography,
  colors,
  elevation,
  borderRadius,
  animation,
  breakpoints,
  sizing,
} as const

// Type definitions for TypeScript
export type SpacingToken = keyof typeof spacing
export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
export type ElevationToken = keyof typeof elevation;
export type BorderRadiusToken = keyof typeof borderRadius;
export type AnimationToken = keyof typeof animation;
export type BreakpointToken = keyof typeof breakpoints;
export type SizingToken = keyof typeof sizing;

// Helper functions for accessing tokens
export const getSpacing = (token: string): string => {
  const keys = token.split('.')
  let value: any = spacing;
  for (const key of keys) {
    value = value[key];
  }
  return value || '0px';
}

export const getColor = (token: string): string => {
  const keys = token.split('.');
  let value: any = colors;
  for (const key of keys) {
    value = value[key];
  }
  return value || '#000000';
}

export const getTypography = (token: string): any => {
  const keys = token.split('.');
  let value: any = typography;
  for (const key of keys) {
    value = value[key];
  }
  return value || {}
}

export const getShadow = (token: string): string => {
  const keys = token.split('.');
  let value: any = elevation.shadow;
  for (const key of keys) {
    value = value[key];
  }
  return value || 'none';
}

export default designTokens;

// Global Styles and Design System
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Design Tokens
export const designTokens = {
  colors: {
    // Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
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
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '6rem', // 96px
    '5xl': '8rem', // 128px
  },

  typography: {
    fontSizes: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
    },
    fontWeights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '350ms ease',
    bounce: '250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Animation Keyframes
export const animations = {
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
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  bounce: {
    '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
    '40%, 43%': { transform: 'translate3d(0, -30px, 0)' },
    '70%': { transform: 'translate3d(0, -15px, 0)' },
    '90%': { transform: 'translate3d(0, -4px, 0)' },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  ping: {
    '75%, 100%': {
      transform: 'scale(2)',
      opacity: 0,
    },
  },
};

// CSS-in-JS Style Generator
export const generateStyles = () => {
  const styles = `
    /* Global CSS Variables */
    :root {
      /* Colors */
      --primary-50: ${designTokens.colors.primary[50]};
      --primary-100: ${designTokens.colors.primary[100]};
      --primary-200: ${designTokens.colors.primary[200]};
      --primary-300: ${designTokens.colors.primary[300]};
      --primary-400: ${designTokens.colors.primary[400]};
      --primary-500: ${designTokens.colors.primary[500]};
      --primary-600: ${designTokens.colors.primary[600]};
      --primary-700: ${designTokens.colors.primary[700]};
      --primary-800: ${designTokens.colors.primary[800]};
      --primary-900: ${designTokens.colors.primary[900]};
      
      --success-50: ${designTokens.colors.success[50]};
      --success-500: ${designTokens.colors.success[500]};
      --success-600: ${designTokens.colors.success[600]};
      
      --warning-50: ${designTokens.colors.warning[50]};
      --warning-500: ${designTokens.colors.warning[500]};
      --warning-600: ${designTokens.colors.warning[600]};
      
      --error-50: ${designTokens.colors.error[50]};
      --error-500: ${designTokens.colors.error[500]};
      --error-600: ${designTokens.colors.error[600]};
      
      /* Spacing */
      --spacing-xs: ${designTokens.spacing.xs};
      --spacing-sm: ${designTokens.spacing.sm};
      --spacing-md: ${designTokens.spacing.md};
      --spacing-lg: ${designTokens.spacing.lg};
      --spacing-xl: ${designTokens.spacing.xl};
      --spacing-2xl: ${designTokens.spacing['2xl']};
      --spacing-3xl: ${designTokens.spacing['3xl']};
      --spacing-4xl: ${designTokens.spacing['4xl']};
      --spacing-5xl: ${designTokens.spacing['5xl']};
      
      /* Typography */
      --font-size-xs: ${designTokens.typography.fontSizes.xs};
      --font-size-sm: ${designTokens.typography.fontSizes.sm};
      --font-size-base: ${designTokens.typography.fontSizes.base};
      --font-size-lg: ${designTokens.typography.fontSizes.lg};
      --font-size-xl: ${designTokens.typography.fontSizes.xl};
      --font-size-2xl: ${designTokens.typography.fontSizes['2xl']};
      --font-size-3xl: ${designTokens.typography.fontSizes['3xl']};
      --font-size-4xl: ${designTokens.typography.fontSizes['4xl']};
      --font-size-5xl: ${designTokens.typography.fontSizes['5xl']};
      
      /* Shadows */
      --shadow-sm: ${designTokens.shadows.sm};
      --shadow-base: ${designTokens.shadows.base};
      --shadow-md: ${designTokens.shadows.md};
      --shadow-lg: ${designTokens.shadows.lg};
      --shadow-xl: ${designTokens.shadows.xl};
      --shadow-2xl: ${designTokens.shadows['2xl']};
      
      /* Border Radius */
      --radius-sm: ${designTokens.borderRadius.sm};
      --radius-base: ${designTokens.borderRadius.base};
      --radius-md: ${designTokens.borderRadius.md};
      --radius-lg: ${designTokens.borderRadius.lg};
      --radius-xl: ${designTokens.borderRadius.xl};
      --radius-2xl: ${designTokens.borderRadius['2xl']};
      --radius-3xl: ${designTokens.borderRadius['3xl']};
      --radius-full: ${designTokens.borderRadius.full};
      
      /* Transitions */
      --transition-fast: ${designTokens.transitions.fast};
      --transition-base: ${designTokens.transitions.base};
      --transition-slow: ${designTokens.transitions.slow};
      --transition-bounce: ${designTokens.transitions.bounce};
    }
    
    /* Animation Keyframes */
    ${Object.entries(animations)
      .map(
        ([name, keyframes]) => `
      @keyframes ${name} {
        ${Object.entries(keyframes)
          .map(
            ([key, value]) => `
          ${key} {
            ${Object.entries(value as any)
              .map(([prop, val]) => `${prop}: ${val};`)
              .join('\n            ')}
          }
        `
          )
          .join('\n        ')}
      }
    `
      )
      .join('\n    ')}
    
    /* Global Base Styles */
    * {
      box-sizing: border-box;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-feature-settings: "rlig" 1, "calt" 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Focus Styles */
    .focus-visible {
      outline: 2px solid var(--primary-500);
      outline-offset: 2px;
    }
    
    /* Selection Styles */
    ::selection {
      background-color: var(--primary-100);
      color: var(--primary-900);
    }
    
    /* Scrollbar Styles */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: hsl(var(--muted));
    }
    
    ::-webkit-scrollbar-thumb {
      background: hsl(var(--muted-foreground) / 0.3);
      border-radius: var(--radius-full);
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: hsl(var(--muted-foreground) / 0.5);
    }
    
    /* Utility Classes */
    .animate-fade-in {
      animation: fadeIn var(--transition-base);
    }
    
    .animate-fade-out {
      animation: fadeOut var(--transition-base);
    }
    
    .animate-slide-in-up {
      animation: slideInUp var(--transition-base);
    }
    
    .animate-slide-in-down {
      animation: slideInDown var(--transition-base);
    }
    
    .animate-slide-in-left {
      animation: slideInLeft var(--transition-base);
    }
    
    .animate-slide-in-right {
      animation: slideInRight var(--transition-base);
    }
    
    .animate-scale-in {
      animation: scaleIn var(--transition-base);
    }
    
    .animate-scale-out {
      animation: scaleOut var(--transition-base);
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    
    .animate-shake {
      animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    
    /* Transition Utilities */
    .transition-fast {
      transition: all var(--transition-fast);
    }
    
    .transition-base {
      transition: all var(--transition-base);
    }
    
    .transition-slow {
      transition: all var(--transition-slow);
    }
    
    .transition-bounce {
      transition: all var(--transition-bounce);
    }
    
    /* Shadow Utilities */
    .shadow-glow {
      box-shadow: 0 0 20px var(--primary-500);
    }
    
    .shadow-glow-success {
      box-shadow: 0 0 20px var(--success-500);
    }
    
    .shadow-glow-warning {
      box-shadow: 0 0 20px var(--warning-500);
    }
    
    .shadow-glow-error {
      box-shadow: 0 0 20px var(--error-500);
    }
    
    /* Interactive States */
    .interactive {
      transition: all var(--transition-base);
      cursor: pointer;
    }
    
    .interactive:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .interactive:active {
      transform: translateY(0);
      box-shadow: var(--shadow-sm);
    }
    
    /* Glass Effect */
    .glass {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .glass-dark {
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Gradient Utilities */
    .gradient-primary {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
    }
    
    .gradient-success {
      background: linear-gradient(135deg, var(--success-500), var(--success-700));
    }
    
    .gradient-warning {
      background: linear-gradient(135deg, var(--warning-500), var(--warning-700));
    }
    
    .gradient-error {
      background: linear-gradient(135deg, var(--error-500), var(--error-700));
    }
    
    /* Text Utilities */
    .text-gradient {
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    /* Loading States */
    .loading-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    /* Accessibility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    /* Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    
    /* High Contrast Mode */
    @media (prefers-contrast: high) {
      .interactive:hover {
        outline: 2px solid currentColor;
      }
    }
    
    /* Print Styles */
    @media print {
      .no-print {
        display: none !important;
      }
      
      .print-break-before {
        break-before: page;
      }
      
      .print-break-after {
        break-after: page;
      }
      
      .print-break-inside-avoid {
        break-inside: avoid;
      }
    }
    
    /* Mobile Optimizations */
    @media (max-width: 768px) {
      /* Larger touch targets on mobile */
      button,
      [role="button"],
      input[type="button"],
      input[type="submit"],
      input[type="reset"] {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Prevent zoom on input focus */
      input,
      select,
      textarea {
        font-size: 16px;
      }
    }
    
    /* Dark Mode Adjustments */
    @media (prefers-color-scheme: dark) {
      .glass {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .loading-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      }
    }
  `;

  return styles;
};

// Global Styles Component
export const GlobalStyles: React.FC = () => {
  React.useEffect(() => {
    // Inject styles into document head
    const styleElement = document.createElement('style');
    styleElement.textContent = generateStyles();
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return null;
};

// Utility Components
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, size = 'lg', className }) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  );
};

interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: keyof typeof designTokens.spacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className,
}) => {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const spacingValue = designTokens.spacing[spacing];
  const spacingClass = direction === 'row' ? `gap-x-[${spacingValue}]` : `gap-y-[${spacingValue}]`;

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClass,
        spacingClass,
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
    >
      {children}
    </div>
  );
};

interface GridProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: keyof typeof designTokens.spacing;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ children, columns = 1, gap = 'md', className }) => {
  const getColumnClass = () => {
    if (typeof columns === 'number') {
      return `grid-cols-${columns}`;
    }

    const classes = [];
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

    return classes.join(' ');
  };

  const gapValue = designTokens.spacing[gap];

  return (
    <div className={cn('grid', getColumnClass(), `gap-[${gapValue}]`, className)}>{children}</div>
  );
};

// All exports are handled as named exports above

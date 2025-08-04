// Theme Provider and Configuration System
export interface ThemeColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    card: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
  };
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Status colors
  status: {
    online: string;
    offline: string;
    away: string;
    busy: string;
  };
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: [string, string];
    sm: [string, string];
    base: [string, string];
    lg: [string, string];
    xl: [string, string];
    '2xl': [string, string];
    '3xl': [string, string];
    '4xl': [string, string];
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
}

// Riscura Theme Definition - Bold Black Lines & Cream Background
export const riscuraTheme: Theme = {
  name: 'riscura',
  colors: {
    primary: {
      50: '#FDF8F1',
      100: '#FAEEE1',
      200: '#F5DBC2',
      300: '#EFC49A',
      400: '#E8A871',
      500: '#D8C3A5',
      600: '#C4A882',
      700: '#A8915F',
      800: '#8A7A4A',
      900: '#6B5F38',
      950: '#4A4028',
    },
    background: {
      primary: '#F5F1E9', // Cream background
      secondary: '#FAFAFA', // Soft white for cards
      tertiary: '#FFFFFF', // Pure white for emphasis
      overlay: 'rgba(25, 25, 25, 0.8)',
      card: '#FAFAFA', // Consistent card background
    },
    text: {
      primary: '#191919', // Bold black text
      secondary: '#191919', // All text bold black for consistency
      muted: '#191919', // Even muted text is bold black
      disabled: '#A8A8A8', // Only disabled text is gray
      inverse: '#FFFFFF', // White text on dark backgrounds
    },
    semantic: {
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
    status: {
      online: '#10B981',
      offline: '#6B7280',
      away: '#F59E0B',
      busy: '#EF4444',
    },
    border: {
      primary: '#191919', // Bold black borders
      secondary: '#191919', // All borders bold black
      focus: '#191919', // Focus borders also bold black
      error: '#DC2626', // Error borders remain red
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', '1rem'],
      sm: ['0.875rem', '1.25rem'],
      base: ['1rem', '1.5rem'],
      lg: ['1.125rem', '1.75rem'],
      xl: ['1.25rem', '1.75rem'],
      '2xl': ['1.5rem', '2rem'],
      '3xl': ['1.875rem', '2.25rem'],
      '4xl': ['2.25rem', '2.5rem'],
    },
    fontWeight: {
      normal: '600', // Changed from 400 to 600 for bold text
      medium: '600', // All weights are bold
      semibold: '700', // Semibold is now extra bold
      bold: '800', // Bold is now extra heavy
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Theme utilities
export class ThemeService {
  private static currentTheme: Theme = riscuraTheme;
  private static listeners: Set<(theme: Theme) => void> = new Set();

  public static getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  public static setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.updateCSSVariables(theme);
    this.notifyListeners(theme);
  }

  public static addThemeListener(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private static notifyListeners(theme: Theme): void {
    this.listeners.forEach((callback) => callback(theme));
  }

  private static updateCSSVariables(theme: Theme): void {
    const root = document.documentElement;

    // Update CSS custom properties
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    Object.entries(theme.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-background-${key}`, value);
    });

    Object.entries(theme.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });

    Object.entries(theme.colors.semantic).forEach(([key, value]) => {
      root.style.setProperty(`--color-semantic-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono.join(', '));
  }

  public static getColor(colorPath: string): string {
    const paths = colorPath.split('.');
    let current: any = this.currentTheme.colors;

    for (const path of paths) {
      current = current[path];
      if (!current) return '#000000';
    }

    return current;
  }

  public static getSpacing(size: keyof ThemeSpacing): string {
    return this.currentTheme.spacing[size];
  }

  public static getFontSize(size: keyof ThemeTypography['fontSize']): [string, string] {
    return this.currentTheme.typography.fontSize[size];
  }

  public static getBorderRadius(size: keyof ThemeBorderRadius): string {
    return this.currentTheme.borderRadius[size];
  }

  public static getShadow(size: keyof ThemeShadows): string {
    return this.currentTheme.shadows[size];
  }

  public static getAnimationDuration(speed: keyof ThemeAnimations['duration']): string {
    return this.currentTheme.animations.duration[speed];
  }

  public static getAnimationEasing(_type: keyof ThemeAnimations['easing']): string {
    return this.currentTheme.animations.easing[type];
  }

  // Utility functions for common operations
  public static isDarkMode(): boolean {
    // For now, we only have light mode theme
    return false;
  }

  public static getContrastColor(backgroundColor: string): string {
    // Simple contrast calculation - in production, use a proper contrast library
    const rgb = this.hexToRgb(backgroundColor);
    if (!rgb) return this.currentTheme.colors.text.primary;

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128
      ? this.currentTheme.colors.text.primary
      : this.currentTheme.colors.text.inverse;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const _result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // Initialize theme on load
  public static initialize(): void {
    this.updateCSSVariables(this.currentTheme);
  }
}

// React hook for theme
export function useTheme() {
  const [theme, setTheme] = React.useState(ThemeService.getCurrentTheme());

  React.useEffect(() => {
    return ThemeService.addThemeListener(setTheme);
  }, []);

  return {
    theme,
    setTheme: ThemeService.setTheme,
    getColor: ThemeService.getColor,
    getSpacing: ThemeService.getSpacing,
    getFontSize: ThemeService.getFontSize,
    getBorderRadius: ThemeService.getBorderRadius,
    getShadow: ThemeService.getShadow,
    getAnimationDuration: ThemeService.getAnimationDuration,
    getAnimationEasing: ThemeService.getAnimationEasing,
    isDarkMode: ThemeService.isDarkMode,
    getContrastColor: ThemeService.getContrastColor,
  };
}

// Initialize theme when module loads
if (typeof document !== 'undefined') {
  ThemeService.initialize();
}

// Add React import declaration
declare const React: typeof import('react');

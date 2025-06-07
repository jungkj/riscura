import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'neutral';
export type ThemeAccent = 'warm' | 'cool' | 'neutral';
export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';

export interface ThemeCustomization {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: number;
  fontFamily: string;
  shadows: boolean;
  animations: boolean;
}

export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  accent: ThemeAccent;
  density: ThemeDensity;
  reducedMotion: boolean;
  highContrast: boolean;
  customization: Partial<ThemeCustomization>;
  systemPreference: 'light' | 'dark';
}

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
    glass: string;
  };
  
  // Foreground colors
  foreground: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    inverse: string;
  };
  
  // Brand colors
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  
  // Status colors
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Interactive colors
  interactive: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    danger: string;
    dangerHover: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    hover: string;
  };
  
  // Chart colors (accessibility-first)
  chart: {
    primary: string[];
    categorical: string[];
    sequential: string[];
    diverging: string[];
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
    sans: string;
    mono: string;
    display: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    inner: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Light theme configuration
const lightTheme: ThemeConfig = {
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
      glass: 'rgba(255, 255, 255, 0.8)'
    },
    foreground: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      muted: '#94a3b8',
      inverse: '#ffffff'
    },
    brand: {
      primary: '#3b82f6',
      secondary: '#e0e7ff',
      accent: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    interactive: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      secondary: '#f1f5f9',
      secondaryHover: '#e2e8f0',
      danger: '#ef4444',
      dangerHover: '#dc2626'
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
      hover: '#94a3b8'
    },
    chart: {
      primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
      categorical: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16', '#f97316'],
      sequential: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
      diverging: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fed7d7', '#dbeafe', '#93c5fd', '#3b82f6']
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem'
  },
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      display: '"Inter Display", "Inter", sans-serif'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out'
  }
};

// Dark theme configuration
const darkTheme: ThemeConfig = {
  ...lightTheme,
  colors: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: '#1e293b',
      overlay: 'rgba(0, 0, 0, 0.75)',
      glass: 'rgba(15, 23, 42, 0.8)'
    },
    foreground: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      tertiary: '#cbd5e1',
      muted: '#64748b',
      inverse: '#0f172a'
    },
    brand: {
      primary: '#60a5fa',
      secondary: '#1e293b',
      accent: '#a78bfa',
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
    },
    status: {
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    },
    interactive: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryActive: '#2563eb',
      secondary: '#334155',
      secondaryHover: '#475569',
      danger: '#f87171',
      dangerHover: '#ef4444'
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
      hover: '#64748b'
    },
    chart: {
      primary: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'],
      categorical: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#a3e635', '#fb923c'],
      sequential: ['#1e293b', '#334155', '#475569', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
      diverging: ['#f87171', '#fca5a5', '#fed7d7', '#fef3f2', '#f0f9ff', '#dbeafe', '#93c5fd', '#60a5fa']
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
  }
};

export class ThemeManager {
  private settings: ThemeSettings;
  private listeners: ((theme: ThemeConfig, settings: ThemeSettings) => void)[] = [];
  private mediaQuery: MediaQueryList | null = null;

  constructor(initialSettings?: Partial<ThemeSettings>) {
    this.settings = {
      mode: 'system',
      colorScheme: 'blue',
      accent: 'neutral',
      density: 'comfortable',
      reducedMotion: false,
      highContrast: false,
      customization: {},
      systemPreference: 'light',
      ...initialSettings
    };

    this.initializeSystemPreference();
    this.loadFromStorage();
  }

  /**
   * Initialize system preference detection
   */
  private initializeSystemPreference(): void {
    if (typeof window === 'undefined') return;

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.settings.systemPreference = this.mediaQuery.matches ? 'dark' : 'light';

    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', (e) => {
      this.settings.systemPreference = e.matches ? 'dark' : 'light';
      if (this.settings.mode === 'system') {
        this.notifyListeners();
      }
    });

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.settings.reducedMotion = reducedMotionQuery.matches;
    
    reducedMotionQuery.addEventListener('change', (e) => {
      this.settings.reducedMotion = e.matches;
      this.notifyListeners();
    });
  }

  /**
   * Load settings from storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('riscura-theme-settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load theme settings from storage:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('riscura-theme-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save theme settings to storage:', error);
    }
  }

  /**
   * Get current theme configuration
   */
  getCurrentTheme(): ThemeConfig {
    const effectiveMode = this.getEffectiveMode();
    const baseTheme = effectiveMode === 'dark' ? darkTheme : lightTheme;
    
    // Apply customizations
    return this.applyCustomizations(baseTheme);
  }

  /**
   * Get effective theme mode (resolving 'system' and 'auto')
   */
  private getEffectiveMode(): 'light' | 'dark' {
    if (this.settings.mode === 'light' || this.settings.mode === 'dark') {
      return this.settings.mode;
    }
    
    if (this.settings.mode === 'system') {
      return this.settings.systemPreference;
    }
    
    if (this.settings.mode === 'auto') {
      // Auto mode: dark from 6 PM to 6 AM
      const hour = new Date().getHours();
      return hour >= 18 || hour < 6 ? 'dark' : 'light';
    }
    
    return 'light';
  }

  /**
   * Apply theme customizations
   */
  private applyCustomizations(baseTheme: ThemeConfig): ThemeConfig {
    const customized = { ...baseTheme };
    const { customization } = this.settings;

    if (customization.primaryColor) {
      customized.colors.brand.primary = customization.primaryColor;
      customized.colors.interactive.primary = customization.primaryColor;
    }

    if (customization.borderRadius !== undefined) {
      const radius = `${customization.borderRadius}rem`;
      customized.borderRadius = {
        ...customized.borderRadius,
        md: radius,
        lg: `${customization.borderRadius * 1.5}rem`,
        xl: `${customization.borderRadius * 2}rem`
      };
    }

    if (customization.fontFamily) {
      customized.typography.fontFamily.sans = customization.fontFamily;
    }

    // Apply high contrast mode
    if (this.settings.highContrast) {
      const mode = this.getEffectiveMode();
      if (mode === 'dark') {
        customized.colors.foreground.primary = '#ffffff';
        customized.colors.background.primary = '#000000';
      } else {
        customized.colors.foreground.primary = '#000000';
        customized.colors.background.primary = '#ffffff';
      }
    }

    return customized;
  }

  /**
   * Update theme settings
   */
  updateSettings(newSettings: Partial<ThemeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Apply theme to DOM
   */
  applyTheme(): void {
    if (typeof document === 'undefined') return;

    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties
    this.applyCSSVariables(theme);

    // Apply theme class
    const effectiveMode = this.getEffectiveMode();
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveMode);

    // Apply density class
    root.classList.remove('compact', 'comfortable', 'spacious');
    root.classList.add(this.settings.density);

    // Apply accessibility preferences
    if (this.settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }

  /**
   * Apply CSS custom properties
   */
  private applyCSSVariables(theme: ThemeConfig): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const { colors, spacing, typography, borderRadius, shadows, transitions } = theme;

    // Apply color variables
    Object.entries(colors).forEach(([category, categoryColors]) => {
      Object.entries(categoryColors).forEach(([name, value]) => {
        if (Array.isArray(value)) {
          value.forEach((color, index) => {
            root.style.setProperty(`--color-${category}-${name}-${index}`, color);
          });
        } else {
          root.style.setProperty(`--color-${category}-${name}`, value);
        }
      });
    });

    // Apply spacing variables
    Object.entries(spacing).forEach(([name, value]) => {
      root.style.setProperty(`--spacing-${name}`, value);
    });

    // Apply typography variables
    Object.entries(typography.fontFamily).forEach(([name, value]) => {
      root.style.setProperty(`--font-family-${name}`, value);
    });

    Object.entries(typography.fontSize).forEach(([name, value]) => {
      root.style.setProperty(`--font-size-${name}`, value);
    });

    // Apply other variables
    Object.entries(borderRadius).forEach(([name, value]) => {
      root.style.setProperty(`--border-radius-${name}`, value);
    });

    Object.entries(shadows).forEach(([name, value]) => {
      root.style.setProperty(`--shadow-${name}`, value);
    });

    Object.entries(transitions).forEach(([name, value]) => {
      root.style.setProperty(`--transition-${name}`, value);
    });
  }

  /**
   * Add change listener
   */
  addListener(listener: (theme: ThemeConfig, settings: ThemeSettings) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const theme = this.getCurrentTheme();
    this.listeners.forEach(listener => listener(theme, this.settings));
    this.applyTheme();
  }

  /**
   * Get current settings
   */
  getSettings(): ThemeSettings {
    return { ...this.settings };
  }

  /**
   * Generate theme CSS for export
   */
  generateCSS(): string {
    const theme = this.getCurrentTheme();
    let css = ':root {\n';

    // Add all CSS variables
    const addVariables = (obj: any, prefix: string) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
          addVariables(value, `${prefix}-${key}`);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            css += `  --${prefix}-${key}-${index}: ${item};\n`;
          });
        } else {
          css += `  --${prefix}-${key}: ${value};\n`;
        }
      });
    };

    addVariables(theme.colors, 'color');
    addVariables(theme.spacing, 'spacing');
    addVariables(theme.typography, 'typography');
    addVariables(theme.borderRadius, 'border-radius');
    addVariables(theme.shadows, 'shadow');
    addVariables(theme.transitions, 'transition');

    css += '}\n';

    // Add responsive design utilities
    css += `
@media (prefers-reduced-motion: reduce) {
  .reduce-motion *,
  .reduce-motion *::before,
  .reduce-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.high-contrast {
  filter: contrast(150%);
}

.compact {
  --density-multiplier: 0.75;
}

.comfortable {
  --density-multiplier: 1;
}

.spacious {
  --density-multiplier: 1.25;
}
`;

    return css;
  }
}

// Theme context
export const ThemeContext = createContext<{
  theme: ThemeConfig;
  settings: ThemeSettings;
  updateSettings: (settings: Partial<ThemeSettings>) => void;
  manager: ThemeManager;
}>({
  theme: lightTheme,
  settings: {
    mode: 'system',
    colorScheme: 'blue',
    accent: 'neutral',
    density: 'comfortable',
    reducedMotion: false,
    highContrast: false,
    customization: {},
    systemPreference: 'light'
  },
  updateSettings: () => {},
  manager: new ThemeManager()
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager] = useState(() => new ThemeManager());
  const [theme, setTheme] = useState(() => manager.getCurrentTheme());
  const [settings, setSettings] = useState(() => manager.getSettings());

  useEffect(() => {
    const unsubscribe = manager.addListener((newTheme, newSettings) => {
      setTheme(newTheme);
      setSettings(newSettings);
    });

    // Apply initial theme
    manager.applyTheme();

    return unsubscribe;
  }, [manager]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    manager.updateSettings(newSettings);
  };

  return (
    <ThemeContext.Provider value={{ theme, settings, updateSettings, manager }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeManager; 
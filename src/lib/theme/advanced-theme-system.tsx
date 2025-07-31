'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'neutral';

export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Default themes
export const lightTheme: ThemeConfig = {
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#8b5cf6',
    muted: '#f3f4f6',
    border: '#e5e7eb',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
};

export const darkTheme: ThemeConfig = {
  colors: {
    background: '#0f172a',
    foreground: '#f8fafc',
    primary: '#3b82f6',
    secondary: '#94a3b8',
    accent: '#8b5cf6',
    muted: '#1e293b',
    border: '#334155',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
};

// Theme Manager
export class ThemeManager {
  private settings: ThemeSettings = {
    mode: 'system',
    colorScheme: 'blue',
    reducedMotion: false,
    highContrast: false,
  };

  private listeners: ((theme: ThemeConfig, settings: ThemeSettings) => void)[] = [];

  constructor(initialSettings?: Partial<ThemeSettings>) {
    if (initialSettings) {
      this.settings = { ...this.settings, ...initialSettings };
    }
    this.loadFromStorage();
  }

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

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('riscura-theme-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save theme settings to storage:', error);
    }
  }

  getCurrentTheme(): ThemeConfig {
    const mode = this.getEffectiveMode();
    return mode === 'dark' ? darkTheme : lightTheme;
  }

  private getEffectiveMode(): 'light' | 'dark' {
    if (this.settings.mode === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return this.settings.mode as 'light' | 'dark';
  }

  updateSettings(newSettings: Partial<ThemeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
  }

  applyTheme(): void {
    if (typeof document === 'undefined') return;

    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Apply mode class
    const mode = this.getEffectiveMode();
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
  }

  addListener(listener: (theme: ThemeConfig, settings: ThemeSettings) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const theme = this.getCurrentTheme();
    this.listeners.forEach((listener) => listener(theme, this.settings));
  }

  getSettings(): ThemeSettings {
    return { ...this.settings };
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
    reducedMotion: false,
    highContrast: false,
  },
  updateSettings: () => {},
  manager: new ThemeManager(),
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

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface WCAGComplianceSettings {
  contrastLevel: 'AA' | 'AAA';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromacy';
  highContrast: boolean;
  reducedMotion: boolean;
  focusIndicators: 'default' | 'enhanced' | 'high-contrast';
  screenReaderOptimizations: boolean;
  keyboardNavigation: boolean;
  autoAnnouncements: boolean;
}

export interface ContrastRatio {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  passes: boolean;
}

export interface ColorBlindFilter {
  name: string;
  css: string;
  description: string;
}

export interface FocusIndicatorStyle {
  outline: string;
  outlineOffset: string;
  boxShadow?: string;
  borderRadius?: string;
}

// WCAG 2.1 AA compliance thresholds
export const WCAGThresholds = {
  CONTRAST_AA_NORMAL: 4.5,
  CONTRAST_AA_LARGE: 3,
  CONTRAST_AAA_NORMAL: 7,
  CONTRAST_AAA_LARGE: 4.5,
  LARGE_TEXT_SIZE: 18, // px
  LARGE_TEXT_WEIGHT: 700,
  TOUCH_TARGET_SIZE: 44, // px minimum
  FOCUS_INDICATOR_WIDTH: 2, // px minimum
} as const;

export class ContrastCalculator {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(hexColor: string): number {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const getRGBValue = (val: number) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };
    
    const rLin = getRGBValue(r);
    const gLin = getRGBValue(g);
    const bLin = getRGBValue(b);
    
    // Calculate relative luminance
    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getRelativeLuminance(color1);
    const luminance2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Check if contrast ratio meets WCAG standards
   */
  static checkContrastCompliance(
    foreground: string,
    background: string,
    fontSize: number = 16,
    fontWeight: number = 400,
    level: 'AA' | 'AAA' = 'AA'
  ): ContrastRatio {
    const ratio = this.getContrastRatio(foreground, background);
    
    // Determine if text is considered "large"
    const isLargeText = fontSize >= WCAGThresholds.LARGE_TEXT_SIZE || 
                       (fontSize >= 14 && fontWeight >= WCAGThresholds.LARGE_TEXT_WEIGHT);
    
    // Get required ratio based on level and text size
    const requiredRatio = level === 'AAA' 
      ? (isLargeText ? WCAGThresholds.CONTRAST_AAA_LARGE : WCAGThresholds.CONTRAST_AAA_NORMAL)
      : (isLargeText ? WCAGThresholds.CONTRAST_AA_LARGE : WCAGThresholds.CONTRAST_AA_NORMAL);
    
    // Determine compliance level
    let complianceLevel: 'AAA' | 'AA' | 'A' | 'FAIL';
    if (ratio >= WCAGThresholds.CONTRAST_AAA_NORMAL) {
      complianceLevel = 'AAA';
    } else if (ratio >= WCAGThresholds.CONTRAST_AA_NORMAL) {
      complianceLevel = 'AA';
    } else if (ratio >= WCAGThresholds.CONTRAST_AA_LARGE) {
      complianceLevel = 'A';
    } else {
      complianceLevel = 'FAIL';
    }
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      level: complianceLevel,
      passes: ratio >= requiredRatio
    };
  }
  
  /**
   * Suggest accessible color alternatives
   */
  static suggestAccessibleColors(
    foreground: string,
    background: string,
    targetRatio: number = WCAGThresholds.CONTRAST_AA_NORMAL
  ): { lighter: string; darker: string } {
    const backgroundLuminance = this.getRelativeLuminance(background);
    
    // Calculate required foreground luminance
    const requiredLighterLuminance = (backgroundLuminance + 0.05) * targetRatio - 0.05;
    const requiredDarkerLuminance = (backgroundLuminance + 0.05) / targetRatio - 0.05;
    
    // Convert luminance back to hex (simplified approach)
    const luminanceToHex = (luminance: number): string => {
      const value = Math.round(Math.pow(luminance / 0.2126, 1/2.4) * 255);
      const clampedValue = Math.max(0, Math.min(255, value));
      const hex = clampedValue.toString(16).padStart(2, '0');
      return `#${hex}${hex}${hex}`;
    };
    
    return {
      lighter: luminanceToHex(Math.min(1, requiredLighterLuminance)),
      darker: luminanceToHex(Math.max(0, requiredDarkerLuminance))
    };
  }
}

export class ColorBlindnessSimulator {
  /**
   * Color blindness simulation matrices
   */
  static filters: Record<string, ColorBlindFilter> = {
    protanopia: {
      name: 'Protanopia (Red-blind)',
      description: 'Difficulty distinguishing red and green',
      css: `
        filter: url('#protanopia-filter');
        -webkit-filter: url('#protanopia-filter');
      `
    },
    deuteranopia: {
      name: 'Deuteranopia (Green-blind)',
      description: 'Difficulty distinguishing red and green',
      css: `
        filter: url('#deuteranopia-filter');
        -webkit-filter: url('#deuteranopia-filter');
      `
    },
    tritanopia: {
      name: 'Tritanopia (Blue-blind)',
      description: 'Difficulty distinguishing blue and yellow',
      css: `
        filter: url('#tritanopia-filter');
        -webkit-filter: url('#tritanopia-filter');
      `
    },
    monochromacy: {
      name: 'Monochromacy (Complete color blindness)',
      description: 'No color perception',
      css: `
        filter: grayscale(100%);
        -webkit-filter: grayscale(100%);
      `
    }
  };
  
  /**
   * Generate SVG filters for color blindness simulation
   */
  static generateSVGFilters(): string {
    return `
      <svg style="position: absolute; width: 0; height: 0; overflow: hidden;">
        <defs>
          <!-- Protanopia (Red-blind) -->
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="
              0.567 0.433 0     0 0
              0.558 0.442 0     0 0  
              0     0.242 0.758 0 0
              0     0     0     1 0"/>
          </filter>
          
          <!-- Deuteranopia (Green-blind) -->
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="
              0.625 0.375 0     0 0
              0.7   0.3   0     0 0
              0     0.3   0.7   0 0
              0     0     0     1 0"/>
          </filter>
          
          <!-- Tritanopia (Blue-blind) -->
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="
              0.95  0.05  0     0 0
              0     0.433 0.567 0 0
              0     0.475 0.525 0 0
              0     0     0     1 0"/>
          </filter>
        </defs>
      </svg>
    `;
  }
  
  /**
   * Apply color blindness filter to element
   */
  static applyFilter(element: HTMLElement, filterType: keyof typeof this.filters): void {
    if (filterType === 'none') {
      element.style.filter = '';
      return;
    }
    
    const filter = this.filters[filterType];
    if (filter) {
      element.style.filter = filter.css.split(':')[1].trim();
    }
  }
  
  /**
   * Test color combinations for color blindness accessibility
   */
  static testColorCombination(
    foreground: string,
    background: string
  ): Record<string, { accessible: boolean; alternative?: string }> {
    const results: Record<string, { accessible: boolean; alternative?: string }> = {};
    
    // For each color blindness type, check if the combination is still distinguishable
    Object.keys(this.filters).forEach(filterType => {
      // This is a simplified check - in a real implementation,
      // you would apply the color transformation and check contrast
      const contrast = ContrastCalculator.getContrastRatio(foreground, background);
      results[filterType] = {
        accessible: contrast >= WCAGThresholds.CONTRAST_AA_NORMAL,
        alternative: contrast < WCAGThresholds.CONTRAST_AA_NORMAL 
          ? ContrastCalculator.suggestAccessibleColors(foreground, background).darker
          : undefined
      };
    });
    
    return results;
  }
}

export class FocusManager {
  /**
   * Enhanced focus indicator styles
   */
  static focusStyles: Record<string, FocusIndicatorStyle> = {
    default: {
      outline: '2px solid #2563eb',
      outlineOffset: '2px'
    },
    enhanced: {
      outline: '3px solid #2563eb',
      outlineOffset: '2px',
      boxShadow: '0 0 0 1px #ffffff, 0 0 0 4px #2563eb'
    },
    'high-contrast': {
      outline: '4px solid #000000',
      outlineOffset: '2px',
      boxShadow: '0 0 0 2px #ffffff, 0 0 0 6px #000000'
    }
  };
  
  /**
   * Apply focus indicator style to element
   */
  static applyFocusStyle(element: HTMLElement, style: keyof typeof this.focusStyles): void {
    const focusStyle = this.focusStyles[style];
    
    element.style.outline = focusStyle.outline;
    element.style.outlineOffset = focusStyle.outlineOffset;
    
    if (focusStyle.boxShadow) {
      element.style.boxShadow = focusStyle.boxShadow;
    }
    
    if (focusStyle.borderRadius) {
      element.style.borderRadius = focusStyle.borderRadius;
    }
  }
  
  /**
   * Create focus trap for modal/dialog elements
   */
  static createFocusTrap(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    firstElement?.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
  
  /**
   * Save and restore focus for better UX
   */
  static saveFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement;
  }
  
  static restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }
}

export class ScreenReaderOptimizer {
  /**
   * ARIA labels for common interface elements
   */
  static ariaLabels = {
    navigation: 'Main navigation',
    search: 'Search',
    menu: 'Menu',
    close: 'Close',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    required: 'Required field',
    optional: 'Optional field',
    sortAscending: 'Sort ascending',
    sortDescending: 'Sort descending',
    expandMenu: 'Expand menu',
    collapseMenu: 'Collapse menu',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    firstPage: 'First page',
    lastPage: 'Last page'
  };
  
  /**
   * Create live region for announcements
   */
  static createLiveRegion(politeness: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    
    return liveRegion;
  }
  
  /**
   * Announce message to screen readers
   */
  static announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = this.createLiveRegion(politeness);
    liveRegion.textContent = message;
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }
  
  /**
   * Generate semantic HTML structure for complex components
   */
  static generateSemanticStructure(type: 'table' | 'list' | 'navigation' | 'form'): {
    container: string;
    items: string;
    labels: string[];
  } {
    switch (type) {
      case 'table':
        return {
          container: 'table',
          items: 'tr',
          labels: ['role="table"', 'aria-label', 'caption']
        };
      case 'list':
        return {
          container: 'ul',
          items: 'li',
          labels: ['role="list"', 'aria-label']
        };
      case 'navigation':
        return {
          container: 'nav',
          items: 'a',
          labels: ['role="navigation"', 'aria-label="Main navigation"']
        };
      case 'form':
        return {
          container: 'form',
          items: 'fieldset',
          labels: ['role="form"', 'aria-label', 'novalidate']
        };
      default:
        return {
          container: 'div',
          items: 'div',
          labels: []
        };
    }
  }
}

// WCAG Compliance Context
export const WCAGComplianceContext = createContext<{
  settings: WCAGComplianceSettings;
  updateSettings: (settings: Partial<WCAGComplianceSettings>) => void;
  checkContrast: (fg: string, bg: string) => ContrastRatio;
  applyColorBlindFilter: (filter: string) => void;
  announceToScreenReader: (message: string) => void;
}>({
  settings: {
    contrastLevel: 'AA',
    fontSize: 'medium',
    colorBlindMode: 'none',
    highContrast: false,
    reducedMotion: false,
    focusIndicators: 'default',
    screenReaderOptimizations: true,
    keyboardNavigation: true,
    autoAnnouncements: true
  },
  updateSettings: () => {},
  checkContrast: () => ({ ratio: 0, level: 'FAIL', passes: false }),
  applyColorBlindFilter: () => {},
  announceToScreenReader: () => {}
});

export const useWCAGCompliance = () => {
  const context = useContext(WCAGComplianceContext);
  if (!context) {
    throw new Error('useWCAGCompliance must be used within WCAGComplianceProvider');
  }
  return context;
};

// WCAG Compliance Provider Component
export const WCAGComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WCAGComplianceSettings>({
    contrastLevel: 'AA',
    fontSize: 'medium',
    colorBlindMode: 'none',
    highContrast: false,
    reducedMotion: false,
    focusIndicators: 'default',
    screenReaderOptimizations: true,
    keyboardNavigation: true,
    autoAnnouncements: true
  });

  const updateSettings = (newSettings: Partial<WCAGComplianceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const checkContrast = (foreground: string, background: string): ContrastRatio => {
    return ContrastCalculator.checkContrastCompliance(
      foreground,
      background,
      settings.fontSize === 'large' ? 18 : 16,
      400,
      settings.contrastLevel
    );
  };

  const applyColorBlindFilter = (filterType: string) => {
    const bodyElement = document.body;
    if (filterType === 'none') {
      bodyElement.style.filter = '';
    } else {
      ColorBlindnessSimulator.applyFilter(bodyElement, filterType as keyof typeof ColorBlindnessSimulator.filters);
    }
  };

  const announceToScreenReader = (message: string) => {
    if (settings.autoAnnouncements) {
      ScreenReaderOptimizer.announce(message, 'polite');
    }
  };

  // Apply global settings when they change
  useEffect(() => {
    // Apply font size
    const fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px'
    }[settings.fontSize];
    
    document.documentElement.style.fontSize = fontSize;

    // Apply high contrast mode
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }

    // Apply color blind filter
    applyColorBlindFilter(settings.colorBlindMode);

  }, [settings]);

  // Add SVG filters to DOM
  useEffect(() => {
    const svgFilters = ColorBlindnessSimulator.generateSVGFilters();
    const div = document.createElement('div');
    div.innerHTML = svgFilters;
    document.body.appendChild(div.firstChild as Node);

    return () => {
      const svgElement = document.querySelector('svg[style*="position: absolute"]');
      if (svgElement) {
        document.body.removeChild(svgElement);
      }
    };
  }, []);

  return (
    <WCAGComplianceContext.Provider
      value={{
        settings,
        updateSettings,
        checkContrast,
        applyColorBlindFilter,
        announceToScreenReader
      }}
    >
      {children}
    </WCAGComplianceContext.Provider>
  );
};

// Utility functions for React components
export const useContrastCheck = (foreground: string, background: string) => {
  const { checkContrast } = useWCAGCompliance();
  return checkContrast(foreground, background);
};

export const useScreenReaderAnnouncement = () => {
  const { announceToScreenReader } = useWCAGCompliance();
  return announceToScreenReader;
};

export const useFocusTrap = (isActive: boolean) => {
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef) return;
    
    const cleanup = FocusManager.createFocusTrap(containerRef);
    return cleanup;
  }, [isActive, containerRef]);

  return setContainerRef;
}; 
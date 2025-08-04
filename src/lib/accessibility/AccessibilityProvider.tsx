'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Types
interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  screenReaderMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (_settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (selector: string) => void;
  trapFocus: (container: HTMLElement) => () => void;
  skipToContent: () => void;
  getAriaLabel: (key: string, fallback?: string) => string;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  currentFocusId: string | null;
}

// ARIA Labels Dictionary
const ariaLabels = {
  // Navigation
  'nav.main': 'Main navigation',
  'nav.breadcrumb': 'Breadcrumb navigation',
  'nav.pagination': 'Pagination navigation',
  'nav.skip-to-content': 'Skip to main content',
  'nav.skip-to-nav': 'Skip to navigation',

  // Actions
  'action.close': 'Close dialog',
  'action.menu': 'Open menu',
  'action.search': 'Search',
  'action.filter': 'Filter results',
  'action.sort': 'Sort options',
  'action.export': 'Export data',
  'action.refresh': 'Refresh data',
  'action.add': 'Add new item',
  'action.edit': 'Edit item',
  'action.delete': 'Delete item',
  'action.save': 'Save changes',
  'action.cancel': 'Cancel action',

  // Data
  'data.loading': 'Loading data',
  'data.empty': 'No data available',
  'data.error': 'Error loading data',
  'data.selected': 'Selected items',
  'data.total': 'Total items',

  // Forms
  'form.required': 'Required field',
  'form.optional': 'Optional field',
  'form.error': 'Field has an error',
  'form.help': 'Help text',
  'form.password-show': 'Show password',
  'form.password-hide': 'Hide password',

  // Status
  'status.success': 'Success',
  'status.warning': 'Warning',
  'status.error': 'Error',
  'status.info': 'Information',
  'status.progress': 'Progress indicator',

  // Risk Management Specific
  'risk.score': 'Risk score',
  'risk.level': 'Risk level',
  'risk.status': 'Risk status',
  'risk.owner': 'Risk owner',
  'risk.category': 'Risk category',
  'risk.controls': 'Associated controls',
  'risk.assessment': 'Risk assessment',
  'risk.mitigation': 'Risk mitigation',
};

// Context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Custom Hooks
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const useAnnouncements = () => {
  const { announceToScreenReader } = useAccessibility();

  const announceNavigation = useCallback(
    (page: string) => {
      announceToScreenReader(`Navigated to ${page}`, 'polite');
    },
    [announceToScreenReader]
  );

  const announceAction = useCallback(
    (_action: string, success: boolean = true) => {
      const message = success ? `${action} completed successfully` : `${action} failed`;
      announceToScreenReader(message, success ? 'polite' : 'assertive');
    },
    [announceToScreenReader]
  );

  const announceDataUpdate = useCallback(
    (_count: number, type: string) => {
      announceToScreenReader(`${count} ${type} loaded`, 'polite');
    },
    [announceToScreenReader]
  );

  const announceError = useCallback(
    (__error: string) => {
      announceToScreenReader(`Error: ${error}`, 'assertive');
    },
    [announceToScreenReader]
  );

  return {
    announceNavigation,
    announceAction,
    announceDataUpdate,
    announceError,
  };
};

export const useFocusManagement = () => {
  const { focusElement, trapFocus, currentFocusId } = useAccessibility();
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) firstElement.focus();
  }, []);

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) lastElement.focus();
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    focusElement,
    trapFocus,
    currentFocusId,
  };
};

export const useKeyboardNavigation = () => {
  const { settings } = useAccessibility();

  const handleKeyPress = useCallback(
    (
      event: React.KeyboardEvent,
      handlers: {
        onEnter?: () => void;
        onSpace?: () => void;
        onEscape?: () => void;
        onArrowUp?: () => void;
        onArrowDown?: () => void;
        onArrowLeft?: () => void;
        onArrowRight?: () => void;
        onTab?: () => void;
        onShiftTab?: () => void;
      }
    ) => {
      if (!settings.keyboardNavigation) return;

      const { key, shiftKey } = event;

      switch (key) {
        case 'Enter':
          handlers.onEnter?.();
          break;
        case ' ':
          event.preventDefault();
          handlers.onSpace?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'ArrowUp':
          event.preventDefault();
          handlers.onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          handlers.onArrowDown?.();
          break;
        case 'ArrowLeft':
          handlers.onArrowLeft?.();
          break;
        case 'ArrowRight':
          handlers.onArrowRight?.();
          break;
        case 'Tab':
          if (shiftKey) {
            handlers.onShiftTab?.();
          } else {
            handlers.onTab?.();
          }
          break;
      }
    },
    [settings.keyboardNavigation]
  );

  return { handleKeyPress };
};

// Provider Component
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    screenReaderMode: false,
    fontSize: 'medium',
    colorBlindMode: 'none',
    keyboardNavigation: true,
  });

  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize settings from system preferences and localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        // console.warn('Failed to parse saved accessibility settings:', error);
      }
    }

    // Detect system preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updateFromSystem = () => {
      setSettings((prev) => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches,
      }));
    };

    updateFromSystem();

    mediaQueries.reducedMotion.addListener(updateFromSystem);
    mediaQueries.highContrast.addListener(updateFromSystem);

    return () => {
      mediaQueries.reducedMotion.removeListener(updateFromSystem);
      mediaQueries.highContrast.removeListener(updateFromSystem);
    };
  }, []);

  // Update CSS variables when settings change
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--font-size-base', fontSizes[settings.fontSize]);

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion);

    // Color blind mode
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(settings.colorBlindMode);
    }

    // Focus visible
    root.classList.toggle('focus-visible', settings.focusVisible);

    // Screen reader mode
    root.classList.toggle('screen-reader-mode', settings.screenReaderMode);

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (announcementRef.current) {
        announcementRef.current.setAttribute('aria-live', priority);
        announcementRef.current.textContent = message;

        // Clear after announcement
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = '';
          }
        }, 1000);
      }
    },
    []
  );

  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      setCurrentFocusId(element.id || selector);
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const getAriaLabel = useCallback((key: string, fallback?: string) => {
    return ariaLabels[key as keyof typeof ariaLabels] || fallback || key;
  }, []);

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    focusElement,
    trapFocus,
    skipToContent,
    getAriaLabel,
    isReducedMotion: settings.reducedMotion,
    isHighContrast: settings.highContrast,
    currentFocusId,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Skip Links */}
      <div className="sr-only">
        <button
          onClick={skipToContent}
          className="skip-link focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline"
        >
          {getAriaLabel('nav.skip-to-content')}
        </button>
      </div>

      {/* Screen Reader Announcements */}
      <div ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      {/* Content */}
      <div
        className={cn(
          'accessibility-root',
          settings.highContrast && 'high-contrast',
          settings.reducedMotion && 'reduced-motion',
          settings.focusVisible && 'focus-visible',
          settings.screenReaderMode && 'screen-reader-mode',
          `font-size-${settings.fontSize}`,
          settings.colorBlindMode !== 'none' && settings.colorBlindMode
        )}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Accessibility Utility Components
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

export const LiveRegion: React.FC<{
  children: React.ReactNode;
  level?: 'polite' | 'assertive';
  atomic?: boolean;
}> = ({ children, level = 'polite', atomic = true }) => (
  <div aria-live={level} aria-atomic={atomic} className="sr-only">
    {children}
  </div>
);

export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}> = ({ children, active = true, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trapFocus } = useFocusManagement();

  useEffect(() => {
    if (active && containerRef.current) {
      return trapFocus(containerRef.current);
    }
  }, [active, trapFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export const AriaLabel: React.FC<{
  labelKey: string;
  fallback?: string;
  children: (label: string) => React.ReactNode;
}> = ({ labelKey, fallback, children }) => {
  const { getAriaLabel } = useAccessibility();
  const label = getAriaLabel(labelKey, fallback);
  return <>{children(label)}</>;
};

export default AccessibilityProvider;

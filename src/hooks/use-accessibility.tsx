import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
  enableScreenReaderSupport?: boolean;
  trapFocus?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    enableScreenReaderSupport = true,
    trapFocus = false,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for user preferences
  useEffect(() => {
    const checkPreferences = () => {
      // Check for high contrast mode
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      setIsHighContrastMode(highContrast);

      // Check for reduced motion preference
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(reducedMotionQuery.matches);
    };

    checkPreferences();

    // Listen for changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    highContrastQuery.addEventListener('change', checkPreferences);
    reducedMotionQuery.addEventListener('change', checkPreferences);

    return () => {
      highContrastQuery.removeEventListener('change', checkPreferences);
      reducedMotionQuery.removeEventListener('change', checkPreferences);
    };
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const focusableArray = Array.from(focusableElements) as HTMLElement[];
    const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Tab':
        if (trapFocus) {
          event.preventDefault();
          const nextIndex = event.shiftKey
            ? (currentIndex - 1 + focusableArray.length) % focusableArray.length
            : (currentIndex + 1) % focusableArray.length;
          focusableArray[nextIndex]?.focus();
        }
        break;

      case 'ArrowDown':
      case 'ArrowRight': {
        event.preventDefault();
        const nextElement = focusableArray[currentIndex + 1] || focusableArray[0];
        nextElement?.focus();
        break;
      }

      case 'ArrowUp':
      case 'ArrowLeft': {
        event.preventDefault();
        const prevElement = focusableArray[currentIndex - 1] || focusableArray[focusableArray.length - 1];
        prevElement?.focus();
        break;
      }

      case 'Home':
        event.preventDefault();
        focusableArray[0]?.focus();
        break;

      case 'End':
        event.preventDefault();
        focusableArray[focusableArray.length - 1]?.focus();
        break;

      case 'Escape':
        // Allow parent components to handle escape
        break;
    }
  }, [enableKeyboardNavigation, trapFocus]);

  // Focus management
  const focusFirst = useCallback(() => {
    if (!enableFocusManagement || !containerRef.current) return;

    const firstFocusable = containerRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
  }, [enableFocusManagement]);

  const focusLast = useCallback(() => {
    if (!enableFocusManagement || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastFocusable?.focus();
  }, [enableFocusManagement]);

  // Screen reader announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enableScreenReaderSupport) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [enableScreenReaderSupport]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // ARIA helpers
  const getAriaProps = useCallback((options: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
  } = {}) => {
    const props: Record<string, unknown> = {};

    if (options.label) props['aria-label'] = options.label;
    if (options.labelledBy) props['aria-labelledby'] = options.labelledBy;
    if (options.describedBy) props['aria-describedby'] = options.describedBy;
    if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
    if (options.selected !== undefined) props['aria-selected'] = options.selected;
    if (options.disabled !== undefined) props['aria-disabled'] = options.disabled;
    if (options.required !== undefined) props['aria-required'] = options.required;
    if (options.invalid !== undefined) props['aria-invalid'] = options.invalid;
    if (options.live) props['aria-live'] = options.live;
    if (options.atomic !== undefined) props['aria-atomic'] = options.atomic;

    return props;
  }, []);

  // Skip link functionality
  const createSkipLink = useCallback((targetId: string, text: string = 'Skip to main content') => {
    return {
      href: `#${targetId}`,
      className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded',
      children: text,
      onFocus: () => announce(`Skip link: ${text}`),
    };
  }, [announce]);

  return {
    containerRef,
    isHighContrastMode,
    reducedMotion,
    focusFirst,
    focusLast,
    announce,
    getAriaProps,
    createSkipLink,
  };
};

// Hook for managing focus trap in modals/dialogs
export const useFocusTrap = (isActive: boolean = true) => {
  const { containerRef, focusFirst, focusLast } = useAccessibility({
    trapFocus: isActive,
    enableKeyboardNavigation: isActive,
  });

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Focus first element when trap becomes active
      const timer = setTimeout(focusFirst, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, focusFirst]);

  return { containerRef, focusFirst, focusLast };
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      };

      // Create shortcut string (e.g., "ctrl+s", "alt+shift+n")
      const shortcutParts = [];
      if (modifiers.ctrl) shortcutParts.push('ctrl');
      if (modifiers.alt) shortcutParts.push('alt');
      if (modifiers.shift) shortcutParts.push('shift');
      if (modifiers.meta) shortcutParts.push('meta');
      shortcutParts.push(key);

      const shortcutString = shortcutParts.join('+');
      const handler = shortcuts[shortcutString];

      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for live region announcements
export const useLiveRegion = () => {
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = message;
    }
  }, []);

  const LiveRegion = useCallback((): JSX.Element => (
    <div
      ref={regionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  return { announce, LiveRegion };
}; 
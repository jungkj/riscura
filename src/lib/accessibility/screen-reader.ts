'use client';

// Screen reader utilities for enhanced accessibility
export class ScreenReaderUtils {
  private static announceElement: HTMLElement | null = null;
  private static politeElement: HTMLElement | null = null;
  private static assertiveElement: HTMLElement | null = null;

  // Initialize screen reader announcement elements
  static init(): void {
    if (typeof window === 'undefined') return;

    // Create live regions for announcements
    if (!this.announceElement) {
      this.announceElement = document.createElement('div');
      this.announceElement.setAttribute('aria-live', 'polite');
      this.announceElement.setAttribute('aria-atomic', 'true');
      this.announceElement.className = 'sr-only';
      this.announceElement.id = 'screen-reader-announcements';
      document.body.appendChild(this.announceElement);
    }

    if (!this.politeElement) {
      this.politeElement = document.createElement('div');
      this.politeElement.setAttribute('aria-live', 'polite');
      this.politeElement.setAttribute('aria-atomic', 'true');
      this.politeElement.className = 'sr-only';
      this.politeElement.id = 'screen-reader-polite';
      document.body.appendChild(this.politeElement);
    }

    if (!this.assertiveElement) {
      this.assertiveElement = document.createElement('div');
      this.assertiveElement.setAttribute('aria-live', 'assertive');
      this.assertiveElement.setAttribute('aria-atomic', 'true');
      this.assertiveElement.className = 'sr-only';
      this.assertiveElement.id = 'screen-reader-assertive';
      document.body.appendChild(this.assertiveElement);
    }
  }

  // Announce message to screen readers
  static announce(
    message: string, 
    priority: 'polite' | 'assertive' = 'polite',
    delay = 100
  ): void {
    if (typeof window === 'undefined') return;

    this.init();

    const element = priority === 'assertive' ? this.assertiveElement : this.politeElement;
    if (!element) return;

    // Clear previous message
    element.textContent = '';

    // Set new message with slight delay to ensure screen readers pick it up
    setTimeout(() => {
      element.textContent = message;
    }, delay);

    // Clear message after announcement
    setTimeout(() => {
      element.textContent = '';
    }, delay + 3000);
  }

  // Announce form validation errors
  static announceFormError(fieldName: string, error: string): void {
    this.announce(`${fieldName}: ${error}`, 'assertive');
  }

  // Announce navigation changes
  static announceNavigation(location: string): void {
    this.announce(`Navigated to ${location}`, 'polite');
  }

  // Announce data loading states
  static announceLoading(isLoading: boolean, context = ''): void {
    if (isLoading) {
      this.announce(`Loading ${context}...`, 'polite');
    } else {
      this.announce(`${context} loaded`, 'polite');
    }
  }

  // Announce action completion
  static announceAction(action: string, success = true): void {
    const message = success 
      ? `${action} completed successfully`
      : `${action} failed`;
    this.announce(message, success ? 'polite' : 'assertive');
  }

  // Announce dynamic content changes
  static announceContentChange(description: string): void {
    this.announce(`Content updated: ${description}`, 'polite');
  }

  // Create accessible description for complex UI elements
  static createDescription(element: HTMLElement, description: string): string {
    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    element.parentNode?.insertBefore(descElement, element.nextSibling);
    element.setAttribute('aria-describedby', descId);
    
    return descId;
  }

  // Cleanup function
  static cleanup(): void {
    if (this.announceElement) {
      this.announceElement.remove();
      this.announceElement = null;
    }
    if (this.politeElement) {
      this.politeElement.remove();
      this.politeElement = null;
    }
    if (this.assertiveElement) {
      this.assertiveElement.remove();
      this.assertiveElement = null;
    }
  }
}

// Hook for screen reader announcements
export function useScreenReader() {
  useEffect(() => {
    ScreenReaderUtils.init();
    return () => ScreenReaderUtils.cleanup();
  }, []);

  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    ScreenReaderUtils.announce(message, priority);
  }, []);

  const announceFormError = useCallback((fieldName: string, error: string) => {
    ScreenReaderUtils.announceFormError(fieldName, error);
  }, []);

  const announceNavigation = useCallback((location: string) => {
    ScreenReaderUtils.announceNavigation(location);
  }, []);

  const announceLoading = useCallback((isLoading: boolean, context = '') => {
    ScreenReaderUtils.announceLoading(isLoading, context);
  }, []);

  const announceAction = useCallback((action: string, success = true) => {
    ScreenReaderUtils.announceAction(action, success);
  }, []);

  const announceContentChange = useCallback((description: string) => {
    ScreenReaderUtils.announceContentChange(description);
  }, []);

  return {
    announce,
    announceFormError,
    announceNavigation,
    announceLoading,
    announceAction,
    announceContentChange
  };
}

// Utility functions for ARIA attributes
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'aria'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create ARIA label from text content
  createLabel: (text: string, context?: string): string => {
    const cleanText = text.replace(/[^\w\s]/gi, '').trim();
    return context ? `${context}: ${cleanText}` : cleanText;
  },

  // Get accessible name for element
  getAccessibleName: (element: HTMLElement): string => {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }

    // Check placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // Check text content
    return element.textContent || '';
  },

  // Set up ARIA relationships
  setupRelationship: (
    element: HTMLElement,
    relatedElement: HTMLElement,
    relationship: 'labelledby' | 'describedby' | 'controls' | 'owns'
  ): void => {
    if (!relatedElement.id) {
      relatedElement.id = ariaUtils.generateId();
    }
    
    const existingIds = element.getAttribute(`aria-${relationship}`) || '';
    const newIds = existingIds 
      ? `${existingIds} ${relatedElement.id}`
      : relatedElement.id;
    
    element.setAttribute(`aria-${relationship}`, newIds);
  },

  // Remove ARIA relationship
  removeRelationship: (
    element: HTMLElement,
    relatedElementId: string,
    relationship: 'labelledby' | 'describedby' | 'controls' | 'owns'
  ): void => {
    const existingIds = element.getAttribute(`aria-${relationship}`) || '';
    const newIds = existingIds
      .split(' ')
      .filter(id => id !== relatedElementId)
      .join(' ');
    
    if (newIds) {
      element.setAttribute(`aria-${relationship}`, newIds);
    } else {
      element.removeAttribute(`aria-${relationship}`);
    }
  }
};

// Screen reader detection
export function detectScreenReader(): {
  hasScreenReader: boolean;
  type: string | null;
} {
  if (typeof window === 'undefined') {
    return { hasScreenReader: false, type: null };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common screen reader indicators
  const screenReaders = [
    { name: 'JAWS', indicators: ['jaws', 'freedom scientific'] },
    { name: 'NVDA', indicators: ['nvda'] },
    { name: 'VoiceOver', indicators: ['voiceover'] },
    { name: 'TalkBack', indicators: ['talkback'] },
    { name: 'Orca', indicators: ['orca'] },
    { name: 'Dragon', indicators: ['dragon'] }
  ];

  for (const sr of screenReaders) {
    if (sr.indicators.some(indicator => userAgent.includes(indicator))) {
      return { hasScreenReader: true, type: sr.name };
    }
  }

  // Check for other indicators
  const hasAccessibilityFeatures = (
    window.speechSynthesis ||
    'speechSynthesis' in window ||
    navigator.userAgent.includes('accessibility') ||
    document.documentElement.hasAttribute('data-screen-reader')
  );

  return { 
    hasScreenReader: hasAccessibilityFeatures, 
    type: hasAccessibilityFeatures ? 'Unknown' : null 
  };
}

// Focus management utilities
export const focusUtils = {
  // Trap focus within element
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Move focus to element
  moveFocusTo: (element: HTMLElement, options: { preventScroll?: boolean } = {}) => {
    element.focus({ preventScroll: options.preventScroll });
  },

  // Get next focusable element
  getNextFocusable: (current: HTMLElement, direction: 'next' | 'previous' = 'next'): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    const nextIndex = direction === 'next' 
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    return focusableElements[nextIndex];
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'a[href]',
      'button',
      'textarea',
      'input[type="text"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      'select',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return focusableSelectors.some(selector => element.matches(selector)) &&
           !element.hasAttribute('disabled') &&
           element.offsetParent !== null;
  }
};

export default ScreenReaderUtils; 
import React from 'react';

// Accessibility utility functions and components
export interface AccessibilityOptions {
  announceToScreenReader?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  colorContrast?: boolean;
  reducedMotion?: boolean;
}

// Screen reader announcement service
export class ScreenReaderService {
  private static announcer: HTMLElement | null = null;

  public static initialize(): void {
    if (typeof document === 'undefined') return;

    // Create live region for announcements
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.position = 'absolute';
    this.announcer.style.left = '-10000px';
    this.announcer.style.width = '1px';
    this.announcer.style.height = '1px';
    this.announcer.style.overflow = 'hidden';
    document.body.appendChild(this.announcer);
  }

  public static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer) this.initialize();
    if (!this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement to avoid repetition
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }
}

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  private static trapStack: { container: HTMLElement; restoreFocus: HTMLElement | null }[] = [];

  public static saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusStack.push(activeElement);
    }
  }

  public static restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  public static trapFocus(container: HTMLElement): () => void {
    const previouslyFocused = document.activeElement as HTMLElement;
    this.trapStack.push({ container, restoreFocus: previouslyFocused });

    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      const trap = this.trapStack.pop();
      if (trap?.restoreFocus) {
        trap.restoreFocus.focus();
      }
    };
  }

  public static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  public static moveFocusToNext(): void {
    const focusable = this.getAllFocusableElements();
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusable.length;
    focusable[nextIndex]?.focus();
  }

  public static moveFocusToPrevious(): void {
    const focusable = this.getAllFocusableElements();
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    focusable[prevIndex]?.focus();
  }

  private static getAllFocusableElements(): HTMLElement[] {
    return this.getFocusableElements(document.body);
  }
}

// Color contrast utilities
export class ColorContrastUtils {
  public static calculateContrast(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  public static meetsWCAGAA(foreground: string, background: string): boolean {
    return this.calculateContrast(foreground, background) >= 4.5;
  }

  public static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.calculateContrast(foreground, background) >= 7;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : null;
  }

  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;

    const sR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const sG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const sB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
  }
}

// Motion preference utilities
export class MotionUtils {
  public static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  public static addMotionListener(callback: (prefersReduced: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  public static handleArrowNavigation(
    event: React.KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
  ): number {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  }
}

// ARIA utilities
export class AriaUtils {
  public static generateId(prefix: string = 'riscura'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public static announcePolite(message: string): void {
    ScreenReaderService.announce(message, 'polite');
  }

  public static announceAssertive(message: string): void {
    ScreenReaderService.announce(message, 'assertive');
  }

  public static setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  public static setAriaDescribedBy(element: HTMLElement, describerId: string): void {
    const existing = element.getAttribute('aria-describedby');
    if (existing) {
      element.setAttribute('aria-describedby', `${existing} ${describerId}`);
    } else {
      element.setAttribute('aria-describedby', describerId);
    }
  }

  public static setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  public static setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  public static setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }
}

// React hooks for accessibility
export function useAccessibleAnnouncement() {
  return {
    announcePolite: (message: string) => ScreenReaderService.announce(message, 'polite'),
    announceAssertive: (message: string) => ScreenReaderService.announce(message, 'assertive'),
  };
}

export function useFocusTrap(isActive: boolean) {
  const ref = React.useRef<HTMLElement>(null);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (isActive && ref.current) {
      cleanupRef.current = FocusManager.trapFocus(ref.current);
    } else if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isActive]);

  return ref;
}

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() =>
    MotionUtils.prefersReducedMotion()
  );

  React.useEffect(() => {
    return MotionUtils.addMotionListener(setPrefersReducedMotion);
  }, []);

  return prefersReducedMotion;
}

export function useAriaId(prefix?: string) {
  const id = React.useMemo(() => AriaUtils.generateId(prefix), [prefix]);
  return id;
}

export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const newIndex = KeyboardNavigation.handleArrowNavigation(
        event,
        items,
        currentIndex,
        orientation
      );
      setCurrentIndex(newIndex);
    },
    [items, currentIndex, orientation]
  );

  return { currentIndex, setCurrentIndex, handleKeyDown };
}

// High-level accessibility component
export interface AccessibleContainerProps {
  children: React.ReactNode;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  announceOnMount?: string;
  trapFocus?: boolean;
  className?: string;
}

export const AccessibleContainer: React.FC<AccessibleContainerProps> = ({
  children,
  role,
  ariaLabel,
  ariaDescribedBy,
  announceOnMount,
  trapFocus = false,
  className,
}) => {
  const focusTrapRef = useFocusTrap(trapFocus);
  const { announcePolite } = useAccessibleAnnouncement();

  React.useEffect(() => {
    if (announceOnMount) {
      announcePolite(announceOnMount);
    }
  }, [announceOnMount, announcePolite]);

  return React.createElement(
    'div',
    {
      ref: focusTrapRef,
      role,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      className,
    },
    children
  );
};

// Initialize services
if (typeof document !== 'undefined') {
  ScreenReaderService.initialize();
}

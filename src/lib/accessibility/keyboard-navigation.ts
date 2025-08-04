'use client';

import { useEffect, useCallback, useRef } from 'react';

// Types for keyboard navigation
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  scope?: 'global' | 'component';
  preventDefault?: boolean;
}

export interface NavigationConfig {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEnterActivation?: boolean;
  enableEscapeHandling?: boolean;
  enableHomeEndKeys?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  skipDisabled?: boolean;
  autoFocus?: boolean;
}

export interface FocusableElement extends HTMLElement {
  disabled?: boolean;
  'aria-disabled'?: string;
  tabIndex?: number;
}

// Keyboard navigation utilities
export class KeyboardNavigationManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private focusableSelectors = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]:not([disabled])',
    'summary:not([disabled])',
    'audio[controls]:not([disabled])',
    'video[controls]:not([disabled])',
  ].join(',');

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Global keyboard event listener
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this))

    // Add default shortcuts
    this.addDefaultShortcuts()
  }

  private addDefaultShortcuts(): void {
    // Skip to main content
    this.addShortcut({
      key: 'Enter',
      altKey: true,
      action: () => this.skipToMain(),
      description: 'Skip to main content',
      scope: 'global',
    })

    // Focus search
    this.addShortcut({
      key: '/',
      action: () => this.focusSearch(),
      description: 'Focus search input',
      scope: 'global',
      preventDefault: true,
    })

    // Open help
    this.addShortcut({
      key: '?',
      shiftKey: true,
      action: () => this.openHelp(),
      description: 'Open keyboard shortcuts help',
      scope: 'global',
      preventDefault: true,
    })

    // Close modal/dialog
    this.addShortcut({
      key: 'Escape',
      action: () => this.closeModal(),
      description: 'Close modal or dialog',
      scope: 'global',
    })
  }

  // Add keyboard shortcut
  addShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.set(key, shortcut);
  }

  // Remove keyboard shortcut
  removeShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): void {
    const key = this.getShortcutKey(shortcut)
    this.shortcuts.delete(key);
  }

  // Generate shortcut key for storage
  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const modifiers = [
      shortcut.ctrlKey && 'ctrl',
      shortcut.altKey && 'alt',
      shortcut.shiftKey && 'shift',
      shortcut.metaKey && 'meta',
    ]
      .filter(Boolean)
      .join('+')

    return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key || '';
  }

  // Handle global keydown events
  private handleGlobalKeydown(event: KeyboardEvent): void {
    const key = this.getShortcutKey({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    })

    const shortcut = this.shortcuts.get(key);
    if (shortcut && (shortcut.scope === 'global' || !shortcut.scope)) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      shortcut.action();
    }
  }

  // Get all focusable elements in container
  getFocusableElements(container: HTMLElement = document.body): FocusableElement[] {
    const elements = Array.from(
      container.querySelectorAll(this.focusableSelectors)
    ) as FocusableElement[]

    return elements.filter((element) => {
      // Check if element is visible
      if (element.offsetParent === null && element.tagName !== 'SUMMARY') {
        return false
      }

      // Check if element is disabled
      if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
        return false
      }

      // Check tabindex
      const tabIndex = element.tabIndex
      if (tabIndex < 0) {
        return false;
      }

      return true;
    });
  }

  // Focus first focusable element
  focusFirst(container: HTMLElement = document.body): boolean {
    const focusable = this.getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[0].focus();
      return true;
    }
    return false;
  }

  // Focus last focusable element
  focusLast(container: HTMLElement = document.body): boolean {
    const focusable = this.getFocusableElements(container)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
      return true;
    }
    return false;
  }

  // Focus next/previous element
  focusNext(current: HTMLElement, container: HTMLElement = document.body, wrap = true): boolean {
    const focusable = this.getFocusableElements(container)
    const currentIndex = focusable.indexOf(current as FocusableElement);

    if (currentIndex === -1) return false;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= focusable.length) {
      nextIndex = wrap ? 0 : focusable.length - 1;
    }

    if (nextIndex !== currentIndex) {
      focusable[nextIndex].focus();
      return true;
    }

    return false;
  }

  focusPrevious(
    current: HTMLElement,
    container: HTMLElement = document.body,
    wrap = true
  ): boolean {
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(current as FocusableElement);

    if (currentIndex === -1) return false;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = wrap ? focusable.length - 1 : 0;
    }

    if (prevIndex !== currentIndex) {
      focusable[prevIndex].focus();
      return true;
    }

    return false;
  }

  // Create focus trap
  createFocusTrap(container: HTMLElement): () => void {
    const focusable = this.getFocusableElements(container)
    if (focusable.length === 0) return () => {}

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstElement.focus()

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Default shortcut actions
  private skipToMain(): void {
    const main = document.querySelector('main, [role="main"], #main-content')
    if (main) {
      (main as HTMLElement).focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private focusSearch(): void {
    const search = document.querySelector(
      'input[type="search"], input[placeholder*="search" i], #search'
    );
    if (search) {
      (search as HTMLElement).focus();
    }
  }

  private openHelp(): void {
    // Dispatch custom event for help modal
    document.dispatchEvent(new CustomEvent('keyboard-help-requested'))
  }

  private closeModal(): void {
    // Find and close any open modals/dialogs
    const modal = document.querySelector(
      '[role="dialog"][aria-modal="true"], .modal[aria-hidden="false"]'
    )
    if (modal) {
      const closeButton = modal.querySelector(
        '[aria-label*="close" i], .close-button, .modal-close'
      );
      if (closeButton) {
        (closeButton as HTMLElement).click();
      } else {
        // Dispatch custom close event
        modal.dispatchEvent(new CustomEvent('modal-close-requested'))
      }
    }
  }

  // Get all shortcuts for help display
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // Cleanup
  destroy(): void {
    document.removeEventListener('keydown', this.handleGlobalKeydown.bind(this))
    this.shortcuts.clear();
  }
}

// Create global instance
export const keyboardNav = new KeyboardNavigationManager()

// Hook for keyboard navigation within components
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  config: NavigationConfig = {}
) {
  const {
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableEnterActivation = true,
    enableEscapeHandling = true,
    enableHomeEndKeys = true,
    orientation = 'both',
    wrap = true,
    skipDisabled = true,
    autoFocus = false,
  } = config

  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      const target = event.target as HTMLElement;
      const container = containerRef.current;

      // Check if event should be handled
      if (!container.contains(target)) return

      let handled = false;

      if (enableArrowKeys) {
        switch (event.key) {
          case 'ArrowDown':
            if (orientation === 'vertical' || orientation === 'both') {
              handled = keyboardNav.focusNext(target, container, wrap);
            }
            break;
          case 'ArrowUp':
            if (orientation === 'vertical' || orientation === 'both') {
              handled = keyboardNav.focusPrevious(target, container, wrap);
            }
            break;
          case 'ArrowRight':
            if (orientation === 'horizontal' || orientation === 'both') {
              handled = keyboardNav.focusNext(target, container, wrap);
            }
            break;
          case 'ArrowLeft':
            if (orientation === 'horizontal' || orientation === 'both') {
              handled = keyboardNav.focusPrevious(target, container, wrap);
            }
            break;
        }
      }

      if (enableHomeEndKeys) {
        switch (event.key) {
          case 'Home':
            handled = keyboardNav.focusFirst(container);
            break;
          case 'End':
            handled = keyboardNav.focusLast(container);
            break;
        }
      }

      if (enableEnterActivation && event.key === 'Enter') {
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
          target.click();
          handled = true;
        }
      }

      if (enableEscapeHandling && event.key === 'Escape') {
        // Blur current element or close component
        target.blur()
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [
      containerRef,
      enableArrowKeys,
      enableTabNavigation,
      enableEnterActivation,
      enableEscapeHandling,
      enableHomeEndKeys,
      orientation,
      wrap,
      skipDisabled,
    ]
  );

  // Add component-specific shortcuts
  const addShortcut = useCallback((shortcut: Omit<KeyboardShortcut, 'scope'>) => {
    const componentShortcut = { ...shortcut, scope: 'component' as const }
    keyboardNav.addShortcut(componentShortcut);
    shortcutsRef.current.push(componentShortcut);
  }, []);

  // Remove component shortcuts
  const removeShortcut = useCallback(
    (shortcut: Omit<KeyboardShortcut, 'action' | 'description' | 'scope'>) => {
      keyboardNav.removeShortcut(shortcut)
      shortcutsRef.current = shortcutsRef.current.filter(
        (s) => keyboardNav['getShortcutKey'](s) !== keyboardNav['getShortcutKey'](shortcut)
      );
    },
    []
  );

  // Focus management
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      return keyboardNav.focusFirst(containerRef.current)
    }
    return false;
  }, [containerRef]);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      return keyboardNav.focusLast(containerRef.current);
    }
    return false;
  }, [containerRef]);

  const createFocusTrap = useCallback(() => {
    if (containerRef.current) {
      return keyboardNav.createFocusTrap(containerRef.current);
    }
    return () => {}
  }, [containerRef]);

  // Setup and cleanup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    // Auto focus if enabled
    if (autoFocus) {
      focusFirst()
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Clean up component shortcuts
      shortcutsRef.current.forEach((shortcut) => {
        keyboardNav.removeShortcut(shortcut)
      });
      shortcutsRef.current = [];
    }
  }, [handleKeyDown, autoFocus, focusFirst]);

  return {
    addShortcut,
    removeShortcut,
    focusFirst,
    focusLast,
    createFocusTrap,
    getFocusableElements: () =>
      containerRef.current ? keyboardNav.getFocusableElements(containerRef.current) : [],
  }
}

// Hook for managing focus within modals/dialogs
export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>,
  options: { autoFocus?: boolean; restoreFocus?: boolean } = {}
) {
  const { autoFocus = true, restoreFocus = true } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Clean up existing trap
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null;
      }

      // Restore focus if needed
      if (!isActive && restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null;
      }

      return;
    }

    // Store current focus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    // Create focus trap
    cleanupRef.current = keyboardNav.createFocusTrap(containerRef.current)

    // Auto focus first element if needed
    if (autoFocus) {
      keyboardNav.focusFirst(containerRef.current)
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, [isActive, containerRef, autoFocus, restoreFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [restoreFocus]);
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' },
    { href: '#footer', label: 'Skip to footer' },
  ]

  const createSkipLink = useCallback((link: { href: string; label: string }) => {
    const skipLink = document.createElement('a');
    skipLink.href = link.href;
    skipLink.textContent = link.label;
    skipLink.className =
      'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline';

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.href);
      if (target) {
        (target as HTMLElement).focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return skipLink;
  }, []);

  const renderSkipLinks = useCallback(() => {
    return skipLinks.map((link) => createSkipLink(link));
  }, [createSkipLink]);

  return { skipLinks, renderSkipLinks }
}

// Utility functions
export const keyboardUtils = {
  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    return keyboardNav.getFocusableElements().includes(element as FocusableElement)
  },

  // Get next focusable element in tab order
  getNextFocusable: (current: HTMLElement): HTMLElement | null => {
    const focusable = keyboardNav.getFocusableElements()
    const currentIndex = focusable.indexOf(current as FocusableElement);

    if (currentIndex === -1 || currentIndex === focusable.length - 1) {
      return null;
    }

    return focusable[currentIndex + 1];
  },

  // Get previous focusable element in tab order
  getPreviousFocusable: (current: HTMLElement): HTMLElement | null => {
    const focusable = keyboardNav.getFocusableElements()
    const currentIndex = focusable.indexOf(current as FocusableElement);

    if (currentIndex <= 0) {
      return null;
    }

    return focusable[currentIndex - 1];
  },

  // Check if key combination matches
  matchesShortcut: (event: KeyboardEvent, shortcut: Partial<KeyboardShortcut>): boolean => {
    return (
      event.key === shortcut.key &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.altKey === !!shortcut.altKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.metaKey === !!shortcut.metaKey
    )
  },

  // Format shortcut for display
  formatShortcut: (shortcut: Partial<KeyboardShortcut>): string => {
    const modifiers = []

    if (shortcut.ctrlKey) modifiers.push('Ctrl');
    if (shortcut.altKey) modifiers.push('Alt');
    if (shortcut.shiftKey) modifiers.push('Shift');
    if (shortcut.metaKey) modifiers.push('Cmd');

    modifiers.push(shortcut.key || '');

    return modifiers.join(' + ');
  },
}

export default KeyboardNavigationManager;

import React from 'react';
import { AriaUtils } from '../accessibility/AccessibilityUtils';

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: (event: KeyboardEvent) => void;
  category?: string;
  enabled?: boolean;
  global?: boolean;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// Key combination utilities
export class KeyCombination {
  public static fromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key);
    
    return parts.join('+');
  }

  public static fromShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey || shortcut.metaKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    parts.push(shortcut.key);
    
    return parts.join('+');
  }

  public static matches(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    const eventCombo = this.fromEvent(event);
    const shortcutCombo = this.fromShortcut(shortcut);
    return eventCombo === shortcutCombo;
  }

  public static format(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    
    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.altKey) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.shiftKey) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    
    // Format special keys
    const keyMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Enter': '↵',
      'Escape': 'Esc',
      'Backspace': '⌫',
      'Delete': 'Del',
      'Tab': '⇥',
      ' ': 'Space'
    };
    
    const key = keyMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(key);
    
    return parts.join(isMac ? '' : '+');
  }
}

// Keyboard shortcut manager
export class KeyboardShortcutManager {
  private static shortcuts: Map<string, KeyboardShortcut> = new Map();
  private static globalShortcuts: Map<string, KeyboardShortcut> = new Map();
  private static contexts: Map<string, Set<string>> = new Map();
  private static currentContext: string | null = null;
  private static isEnabled: boolean = true;

  public static initialize(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Set up default shortcuts
    this.setupDefaultShortcuts();
  }

  private static setupDefaultShortcuts(): void {
    // Global shortcuts
    this.registerGlobal({
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      category: 'Navigation'
    });

    this.registerGlobal({
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        this.showShortcutsModal();
      },
      category: 'Help'
    });

    this.registerGlobal({
      key: 'Escape',
      description: 'Close modal/cancel',
      action: () => {
        // Close any open modals or cancel current action
        const closeButtons = document.querySelectorAll('[data-close-modal], [data-cancel]');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLElement).click();
        }
      },
      category: 'Navigation'
    });

    // Navigation shortcuts
    this.register('navigation', {
      key: 'g',
      ctrlKey: true,
      description: 'Go to dashboard',
      action: () => {
        window.location.href = '/dashboard';
      },
      category: 'Navigation'
    });

    this.register('navigation', {
      key: 'r',
      ctrlKey: true,
      description: 'Go to risks',
      action: () => {
        window.location.href = '/dashboard/risks';
      },
      category: 'Navigation'
    });

    this.register('navigation', {
      key: 'c',
      ctrlKey: true,
      description: 'Go to controls',
      action: () => {
        window.location.href = '/dashboard/controls';
      },
      category: 'Navigation'
    });

    this.register('navigation', {
      key: 'd',
      ctrlKey: true,
      description: 'Go to documents',
      action: () => {
        window.location.href = '/dashboard/documents';
      },
      category: 'Navigation'
    });

    // Form shortcuts
    this.register('form', {
      key: 's',
      ctrlKey: true,
      description: 'Save form',
      action: (event) => {
        event.preventDefault();
        const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
        if (saveButton && !saveButton.disabled) {
          saveButton.click();
        }
      },
      category: 'Forms'
    });

    this.register('form', {
      key: 'Enter',
      ctrlKey: true,
      description: 'Submit form',
      action: (event) => {
        event.preventDefault();
        const submitButton = document.querySelector('[data-submit-button]') as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      },
      category: 'Forms'
    });

    // Table shortcuts
    this.register('table', {
      key: 'n',
      description: 'Create new item',
      action: () => {
        const createButton = document.querySelector('[data-create-button]') as HTMLButtonElement;
        if (createButton) {
          createButton.click();
        }
      },
      category: 'Tables'
    });

    this.register('table', {
      key: 'e',
      description: 'Edit selected item',
      action: () => {
        const editButton = document.querySelector('[data-edit-button]') as HTMLButtonElement;
        if (editButton) {
          editButton.click();
        }
      },
      category: 'Tables'
    });

    this.register('table', {
      key: 'Delete',
      description: 'Delete selected item',
      action: () => {
        const deleteButton = document.querySelector('[data-delete-button]') as HTMLButtonElement;
        if (deleteButton) {
          deleteButton.click();
        }
      },
      category: 'Tables'
    });

    // Modal shortcuts
    this.register('modal', {
      key: 'Enter',
      description: 'Confirm action',
      action: () => {
        const confirmButton = document.querySelector('[data-confirm-button]') as HTMLButtonElement;
        if (confirmButton && !confirmButton.disabled) {
          confirmButton.click();
        }
      },
      category: 'Modals'
    });
  }

  public static register(context: string, shortcut: KeyboardShortcut): void {
    const key = KeyCombination.fromShortcut(shortcut);
    const fullKey = `${context}:${key}`;
    
    this.shortcuts.set(fullKey, { ...shortcut, enabled: shortcut.enabled ?? true });
    
    if (!this.contexts.has(context)) {
      this.contexts.set(context, new Set());
    }
    this.contexts.get(context)!.add(key);
  }

  public static registerGlobal(shortcut: KeyboardShortcut): void {
    const key = KeyCombination.fromShortcut(shortcut);
    this.globalShortcuts.set(key, { ...shortcut, enabled: shortcut.enabled ?? true, global: true });
  }

  public static unregister(context: string, key: string): void {
    const fullKey = `${context}:${key}`;
    this.shortcuts.delete(fullKey);
    
    const contextShortcuts = this.contexts.get(context);
    if (contextShortcuts) {
      contextShortcuts.delete(key);
    }
  }

  public static setContext(context: string | null): void {
    this.currentContext = context;
  }

  public static getContext(): string | null {
    return this.currentContext;
  }

  public static enable(): void {
    this.isEnabled = true;
  }

  public static disable(): void {
    this.isEnabled = false;
  }

  public static getShortcuts(context?: string): KeyboardShortcut[] {
    const shortcuts: KeyboardShortcut[] = [];
    
    // Add global shortcuts
    this.globalShortcuts.forEach((shortcut) => {
      if (shortcut.enabled) {
        shortcuts.push(shortcut);
      }
    });
    
    // Add context-specific shortcuts
    if (context) {
      const contextShortcuts = this.contexts.get(context);
      if (contextShortcuts) {
        contextShortcuts.forEach((key) => {
          const fullKey = `${context}:${key}`;
          const shortcut = this.shortcuts.get(fullKey);
          if (shortcut && shortcut.enabled) {
            shortcuts.push(shortcut);
          }
        });
      }
    }
    
    return shortcuts;
  }

  public static getShortcutGroups(context?: string): ShortcutGroup[] {
    const shortcuts = this.getShortcuts(context);
    const groups = new Map<string, KeyboardShortcut[]>();
    
    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(shortcut);
    });
    
    return Array.from(groups.entries()).map(([name, shortcuts]) => ({
      name,
      shortcuts
    }));
  }

  private static handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow some shortcuts even in inputs
      const allowedInInputs = ['Escape', 's', 'z', 'y'];
      const key = KeyCombination.fromEvent(event);
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      
      if (!allowedInInputs.includes(event.key) || !hasModifier) {
        return;
      }
    }
    
    const key = KeyCombination.fromEvent(event);
    
    // Check global shortcuts first
    const globalShortcut = this.globalShortcuts.get(key);
    if (globalShortcut && globalShortcut.enabled) {
      event.preventDefault();
      globalShortcut.action(event);
      return;
    }
    
    // Check context-specific shortcuts
    if (this.currentContext) {
      const fullKey = `${this.currentContext}:${key}`;
      const shortcut = this.shortcuts.get(fullKey);
      if (shortcut && shortcut.enabled) {
        event.preventDefault();
        shortcut.action(event);
        return;
      }
    }
  }

  private static showShortcutsModal(): void {
    // Create and show shortcuts modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;
    
    const groups = this.getShortcutGroups(this.currentContext || undefined);
    
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Keyboard Shortcuts</h2>
        <button data-close-modal style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
      </div>
      ${groups.map(group => `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 500; color: #374151;">${group.name}</h3>
          <div style="display: grid; gap: 8px;">
            ${group.shortcuts.map(shortcut => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #6B7280;">${shortcut.description}</span>
                <kbd style="
                  background: #F3F4F6;
                  border: 1px solid #D1D5DB;
                  border-radius: 4px;
                  padding: 2px 8px;
                  font-family: monospace;
                  font-size: 12px;
                  color: #374151;
                ">${KeyCombination.format(shortcut)}</kbd>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeButton = content.querySelector('[data-close-modal]');
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeButton?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Focus close button for accessibility
    (closeButton as HTMLElement)?.focus();
  }
}

// React hooks for keyboard shortcuts
export function useKeyboardShortcut(
  shortcut: Omit<KeyboardShortcut, 'action'>,
  action: (event: KeyboardEvent) => void,
  deps: React.DependencyList = []
): void {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (KeyCombination.matches(event, shortcut as KeyboardShortcut)) {
        event.preventDefault();
        action(event);
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, deps);
}

export function useKeyboardContext(context: string): void {
  React.useEffect(() => {
    KeyboardShortcutManager.setContext(context);
    return () => {
      KeyboardShortcutManager.setContext(null);
    };
  }, [context]);
}

export function useKeyboardShortcuts(
  shortcuts: Array<{
    shortcut: Omit<KeyboardShortcut, 'action'>;
    action: (event: KeyboardEvent) => void;
  }>,
  deps: React.DependencyList = []
): void {
  React.useEffect(() => {
    const handlers = shortcuts.map(({ shortcut, action }) => {
      const handler = (event: KeyboardEvent) => {
        if (KeyCombination.matches(event, shortcut as KeyboardShortcut)) {
          event.preventDefault();
          action(event);
        }
      };
      
      document.addEventListener('keydown', handler);
      return handler;
    });
    
    return () => {
      handlers.forEach(handler => {
        document.removeEventListener('keydown', handler);
      });
    };
  }, deps);
}

// Keyboard shortcut component
export interface KeyboardShortcutDisplayProps {
  shortcut: KeyboardShortcut;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const KeyboardShortcutDisplay: React.FC<KeyboardShortcutDisplayProps> = ({
  shortcut,
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: { fontSize: '10px', padding: '2px 4px' },
    md: { fontSize: '12px', padding: '4px 6px' },
    lg: { fontSize: '14px', padding: '6px 8px' }
  };
  
  const style = {
    ...sizeStyles[size],
    background: '#F3F4F6',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#374151',
    display: 'inline-block'
  };
  
  return (
    <kbd className={className} style={style}>
      {KeyCombination.format(shortcut)}
    </kbd>
  );
};

// Keyboard shortcuts help component
export interface KeyboardShortcutsHelpProps {
  context?: string;
  className?: string;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  context,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const groups = KeyboardShortcutManager.getShortcutGroups(context);
  
  if (groups.length === 0) return null;
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className}
        style={{
          background: 'none',
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6B7280'
        }}
        aria-label="Show keyboard shortcuts"
      >
        Keyboard Shortcuts (?)
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            {groups.map((group, index) => (
              <div key={index} style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '500', color: '#374151' }}>
                  {group.name}
                </h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}
                    >
                      <span style={{ color: '#6B7280' }}>{shortcut.description}</span>
                      <KeyboardShortcutDisplay shortcut={shortcut} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Initialize keyboard shortcuts
if (typeof document !== 'undefined') {
  KeyboardShortcutManager.initialize();
} 
'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Types
export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// Keyboard shortcuts configuration
export const defaultShortcuts: ShortcutGroup[] = [
  {
    name: 'Navigation',
    shortcuts: [
      {
        key: 'g h',
        description: 'Go to Dashboard',
        action: () => (window.location.href = '/dashboard'),
        category: 'navigation',
      },
      {
        key: 'g r',
        description: 'Go to Risks',
        action: () => (window.location.href = '/dashboard/risks'),
        category: 'navigation',
      },
      {
        key: 'g c',
        description: 'Go to Controls',
        action: () => (window.location.href = '/dashboard/controls'),
        category: 'navigation',
      },
    ],
  },
  {
    name: 'Actions',
    shortcuts: [
      {
        key: 'n',
        description: 'New Item',
        action: () => console.log('New item'),
        category: 'actions',
      },
      {
        key: 'e',
        description: 'Edit',
        action: () => console.log('Edit'),
        category: 'actions',
      },
      {
        key: 'Escape',
        description: 'Close Modal/Cancel',
        action: () => console.log('Cancel'),
        category: 'actions',
      },
    ],
  },
];

// Keyboard combination utility
export class KeyCombination {
  static format(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('⌘');

    parts.push(shortcut.key);

    return parts.join(' + ');
  }

  static matches(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrl &&
      !!event.altKey === !!shortcut.alt &&
      !!event.shiftKey === !!shortcut.shift &&
      !!event.metaKey === !!shortcut.meta
    );
  }
}

// Keyboard shortcuts manager
export class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;

  constructor() {
    this.setupEventListeners();
    this.loadDefaultShortcuts();
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Skip if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Check for matches
    for (const shortcut of this.shortcuts.values()) {
      if (KeyCombination.matches(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }

  private loadDefaultShortcuts(): void {
    defaultShortcuts.forEach((group) => {
      group.shortcuts.forEach((shortcut) => {
        this.addShortcut(shortcut);
      });
    });
  }

  addShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  removeShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut);
    this.shortcuts.delete(key);
  }

  private generateKey(shortcut: KeyboardShortcut): string {
    return `${shortcut.ctrl ? 'ctrl+' : ''}${shortcut.alt ? 'alt+' : ''}${shortcut.shift ? 'shift+' : ''}${shortcut.meta ? 'meta+' : ''}${shortcut.key}`;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }
}

// Keyboard shortcut display component
export const KeyboardShortcutDisplay: React.FC<{
  shortcut: KeyboardShortcut;
  className?: string;
}> = ({ shortcut, className = '' }) => {
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#374151',
  };

  return (
    <kbd className={className} style={style}>
      {KeyCombination.format(shortcut)}
    </kbd>
  );
};

// Main keyboard shortcuts overlay component
export const KeyboardShortcutsOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          setIsOpen(true);
        }
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6b7280',
          zIndex: 1000,
        }}
        aria-label="Show keyboard shortcuts"
      >
        Keyboard Shortcuts (?)
      </button>
    );
  }

  return (
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
        zIndex: 1000,
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {defaultShortcuts.map((group, index) => (
          <div key={index} style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: '500',
                color: '#374151',
              }}
            >
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
                    padding: '8px 0',
                  }}
                >
                  <span style={{ color: '#6b7280' }}>{shortcut.description}</span>
                  <KeyboardShortcutDisplay shortcut={shortcut} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook for using keyboard shortcuts
export const useKeyboardShortcuts = () => {
  const [manager] = useState(() => new KeyboardShortcutsManager());

  const addShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      manager.addShortcut(shortcut);
    },
    [manager]
  );

  const removeShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      manager.removeShortcut(shortcut);
    },
    [manager]
  );

  const enable = useCallback(() => {
    manager.enable();
  }, [manager]);

  const disable = useCallback(() => {
    manager.disable();
  }, [manager]);

  return {
    addShortcut,
    removeShortcut,
    enable,
    disable,
    shortcuts: manager.getShortcuts(),
  };
};

export default KeyboardShortcutsManager;

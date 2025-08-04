'use client';

import React, { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Contrast, Eye, EyeOff, Palette, Settings } from 'lucide-react';

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  onToggle?: (isHighContrast: boolean) => void;
}

export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  className = '',
  showLabel = true,
  variant = 'button',
  size = 'md',
  onToggle,
}) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    // Check for saved preference
    const saved = localStorage.getItem('riscura-high-contrast');
    const preferredHighContrast = saved === 'true';

    // Check for system preference
    const systemPreference = window.matchMedia('(prefers-contrast: high)').matches;

    const shouldUseHighContrast = preferredHighContrast || systemPreference;

    if (shouldUseHighContrast) {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('riscura-high-contrast')) {
        setIsHighContrast(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
        onToggle?.(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isClient, onToggle]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);

    // Save preference
    localStorage.setItem('riscura-high-contrast', newValue.toString());

    // Apply to document
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Announce change to screen readers
    const announcement = document.getElementById('accessibility-announcements');
    if (announcement) {
      announcement.textContent = `High contrast mode ${newValue ? 'enabled' : 'disabled'}`;
    }

    onToggle?.(newValue);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  if (!isClient) {
    // Prevent hydration mismatch
    return null;
  }

  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {Boolean(showLabel) && (
          <label
            htmlFor="high-contrast-toggle"
            className="text-sm font-medium text-contrast-medium cursor-pointer"
          >
            High Contrast
          </label>
        )}
        <button
          id="high-contrast-toggle"
          role="switch"
          aria-checked={isHighContrast}
          aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
          onClick={toggleHighContrast}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-interactive-focus
            ${isHighContrast ? 'bg-interactive-primary' : 'bg-gray-300'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isHighContrast ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
          <span className="sr-only">
            High contrast mode is {isHighContrast ? 'enabled' : 'disabled'}
          </span>
        </button>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <DaisyBadge
        className={`
          cursor-pointer transition-colors
          ${
            isHighContrast
              ? 'bg-interactive-primary text-white hover:bg-interactive-primaryHover'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          ${className}
        `}
        onClick={toggleHighContrast}
        role="button"
        aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleHighContrast();
          }
        }}
      >
        <Contrast className={`${getIconSize()} mr-1`} aria-hidden="true" />
        {Boolean(showLabel) && <span>{isHighContrast ? 'High Contrast On' : 'High Contrast Off'}</span>}
      </DaisyBadge>
    );
  }

  // Default button variant
  return (
    <DaisyButton
      variant={isHighContrast ? 'default' : 'secondary'}
      size={size === 'md' ? 'default' : size}
      onClick={toggleHighContrast}
      className={`
        ${getSizeClasses()}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-interactive-focus
        ${className}
      `}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={isHighContrast}
    >
      <Contrast className={`${getIconSize()} ${showLabel ? 'mr-2' : ''}`} aria-hidden="true" />
      {Boolean(showLabel) && <span>{isHighContrast ? 'High Contrast On' : 'High Contrast'}</span>}
      <span className="sr-only">
        High contrast mode is {isHighContrast ? 'enabled' : 'disabled'}
      </span>
    </DaisyButton>
  );
};

// Accessibility preferences panel component
export const AccessibilityPanel: React.FC<{
  className?: string;
  onClose?: () => void;
}> = ({ className = '', onClose }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check for saved preferences
    const savedMotion = localStorage.getItem('riscura-reduced-motion') === 'true';
    const savedFontSize = localStorage.getItem('riscura-font-size') || 'medium';

    // Check for system preferences
    const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setReducedMotion(savedMotion || systemReducedMotion);
    setFontSize(savedFontSize);

    // Apply preferences
    if (savedMotion || systemReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }

    document.documentElement.setAttribute('data-font-size', savedFontSize);
  }, []);

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('riscura-reduced-motion', newValue.toString());

    if (newValue) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  };

  const changeFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('riscura-font-size', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  if (!isClient) return null;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg shadow-lg p-6 space-y-6
        focus-trap
        ${className}
      `}
      role="dialog"
      aria-labelledby="accessibility-panel-title"
      aria-describedby="accessibility-panel-description"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="accessibility-panel-title" className="text-lg font-semibold text-contrast-medium">
            Accessibility Settings
          </h2>
          <p id="accessibility-panel-description" className="text-sm text-contrast-low mt-1">
            Customize your viewing experience
          </p>
        </div>
        {Boolean(onClose) && (
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close accessibility settings"
          >
            ×
          </DaisyButton>
        )}
      </div>

      <div className="space-y-4">
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-contrast-medium">High Contrast Mode</label>
            <p className="text-xs text-contrast-low">
              Increases color contrast for better visibility
            </p>
          </div>
          <HighContrastToggle variant="switch" showLabel={false} />
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-contrast-medium">Reduce Motion</label>
            <p className="text-xs text-contrast-low">Minimizes animations and transitions</p>
          </div>
          <button
            role="switch"
            aria-checked={reducedMotion}
            aria-label={`${reducedMotion ? 'Disable' : 'Enable'} reduced motion`}
            onClick={toggleReducedMotion}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-interactive-focus
              ${reducedMotion ? 'bg-interactive-primary' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Font Size Options */}
        <div>
          <label className="text-sm font-medium text-contrast-medium block mb-2">Font Size</label>
          <div className="flex gap-2">
            {[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
              { value: 'extra-large', label: 'Extra Large' },
            ].map((option) => (
              <DaisyButton
                key={option.value}
                variant={fontSize === option.value ? 'default' : 'secondary'}
                size="sm"
                onClick={() => changeFontSize(option.value)}
                aria-pressed={fontSize === option.value}
              >
                {option.label}
              </DaisyButton>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-contrast-low">
          These settings are saved locally and will persist across sessions.
        </p>
      </div>
    </div>
  );
};

// Announcement region for accessibility updates
export const AccessibilityAnnouncements: React.FC = () => {
  return (
    <div
      id="accessibility-announcements"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
};

export default HighContrastToggle;

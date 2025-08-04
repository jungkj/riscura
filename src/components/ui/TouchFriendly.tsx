'use client';

import React, { useState, useRef, useEffect } from 'react';
import { designTokens } from '@/lib/design-system/tokens';

// Touch-friendly button with larger touch targets
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg';
  touchSize?: 'default' | 'large';
  children: React.ReactNode;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  touchSize = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }

  const sizeClasses = {
    sm: touchSize === 'large' ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: touchSize === 'large' ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: touchSize === 'large' ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Touch-friendly card with tap feedback
interface TouchCardProps {
  children: React.ReactNode
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  hapticFeedback = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true);
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10); // Light haptic feedback
      }
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false);
  }

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  }

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200
        ${Boolean(onClick) && !disabled ? 'cursor-pointer hover:shadow-md active:shadow-sm' : ''}
        ${isPressed ? 'scale-98 shadow-sm' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      role={onClick ? 'button' : undefined}
      tabIndex={Boolean(onClick) && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

// Swipeable container for mobile gestures
interface SwipeableProps {
  children: React.ReactNode
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}) => {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY }
    setIsDragging(true);
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startPos.current || !isDragging) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > threshold || absDeltaY > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    startPos.current = null;
    setIsDragging(false);
  }

  return (
    <div
      className={`${className} ${isDragging ? 'select-none' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Touch-friendly input with larger touch targets
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string;
  touchSize?: 'default' | 'large';
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  touchSize = 'default',
  className = '',
  ...props
}) => {
  const inputClasses = `
    w-full px-4 py-3 border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200
    ${touchSize === 'large' ? 'min-h-[48px] text-lg' : 'min-h-[44px]'}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `;

  return (
    <div className="space-y-2">
      {Boolean(label) && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input className={inputClasses} {...props} />
      {Boolean(error) && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Touch-friendly select dropdown
interface TouchSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string;
  options: Array<{ value: string; label: string }>;
  touchSize?: 'default' | 'large';
}

export const TouchSelect: React.FC<TouchSelectProps> = ({
  label,
  error,
  options,
  touchSize = 'default',
  className = '',
  ...props
}) => {
  const selectClasses = `
    w-full px-4 py-3 border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200 bg-white
    ${touchSize === 'large' ? 'min-h-[48px] text-lg' : 'min-h-[44px]'}
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `;

  return (
    <div className="space-y-2">
      {Boolean(label) && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select className={selectClasses} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {Boolean(error) && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Touch-friendly toggle switch
interface TouchToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TouchToggle: React.FC<TouchToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: { switch: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3' },
    md: { switch: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { switch: 'w-14 h-8', thumb: 'w-6 h-6', translate: 'translate-x-6' },
  }

  const { switch: switchClass, thumb: thumbClass, translate: translateClass } = sizeClasses[size];

  return (
    <div className="flex items-start space-x-3">
      <button
        type="button"
        className={`
          ${switchClass} relative inline-flex items-center rounded-full transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            ${thumbClass} inline-block rounded-full bg-white shadow transform transition-transform duration-200
            ${checked ? translateClass : 'translate-x-1'}
          `} />
      </button>

      {(label || description) && (
        <div className="flex-1">
          {Boolean(label) && <div className="text-sm font-medium text-gray-900">{label}</div>}
          {Boolean(description) && <div className="text-sm text-gray-500">{description}</div>}
        </div>
      )}
    </div>
  );
}

// Touch-friendly tab navigation
interface TouchTabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TouchTabs: React.FC<TouchTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm min-h-[48px]
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  );
}

// Progressive loading component for mobile
interface ProgressiveLoaderProps {
  isLoading: boolean
  hasMore: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  threshold?: number;
}

export const ProgressiveLoader: React.FC<DaisyProgressiveLoaderProps />= ({
  isLoading,
  hasMore,
  onLoadMore,
  children,
  threshold = 100,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !isLoading) {
        onLoadMore();
      }
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {children}
      {Boolean(isLoading) && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      {!hasMore && (
        <div className="text-center py-4 text-gray-500 text-sm">No more items to load</div>
      )}
    </div>
  );
}

export default {
  TouchButton,
  TouchCard,
  Swipeable,
  TouchInput,
  TouchSelect,
  TouchToggle,
  TouchTabs,
  ProgressiveLoader,
}

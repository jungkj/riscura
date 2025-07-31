'use client';

import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  createContext, 
  useContext,
  PropsWithChildren 
} from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';

// ARIA Labels Dictionary
export const ariaLabels = {
  // Navigation
  'nav.main': 'Main navigation',
  'nav.breadcrumb': 'Breadcrumb navigation',
  'nav.pagination': 'Pagination navigation',
  'nav.skip-content': 'Skip to main content',
  'nav.skip-nav': 'Skip to navigation',
  
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
  'action.expand': 'Expand section',
  'action.collapse': 'Collapse section',
  
  // Data
  'data.loading': 'Loading data, please wait',
  'data.empty': 'No data available',
  'data.error': 'Error loading data',
  'data.selected': 'Selected items',
  'data.total': 'Total items',
  'data.filtered': 'Filtered results',
  
  // Forms
  'form.required': 'Required field',
  'form.optional': 'Optional field',
  'form.error': 'Field has an error',
  'form.help': 'Help text',
  'form.password-show': 'Show password',
  'form.password-hide': 'Hide password',
  
  // Status
  'status.success': 'Success message',
  'status.warning': 'Warning message',
  'status.error': 'Error message',
  'status.info': 'Information message',
  'status.progress': 'Progress indicator',
};

// Accessibility Context
interface AccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  getAriaLabel: (key: string) => string;
  isHighContrast: boolean;
  reducedMotion: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Screen Reader Announcements
export const useScreenReaderAnnouncements = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announceMessage };
};

// Focus Management Hook
export const useFocusManagement = () => {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    };

  return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((element: HTMLElement) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = () => {
  const handleArrowNavigation = useCallback((
    e: KeyboardEvent, 
    items: HTMLElement[], 
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) => {
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
      return newIndex;
    }
    
    return currentIndex;
  }, []);

  return { handleArrowNavigation };
};

// High Contrast Detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced Motion Detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Skip Links Component
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a 
        href="#main-content" 
        className="absolute top-0 left-0 z-50 p-4 bg-[#199BEC] text-white font-medium rounded-br-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {ariaLabels['nav.skip-content']}
      </a>
      <a 
        href="#main-navigation" 
        className="absolute top-0 left-24 z-50 p-4 bg-[#199BEC] text-white font-medium rounded-br-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {ariaLabels['nav.skip-nav']}
      </a>
    </div>
  );
};

// Accessible Modal Component
interface AccessibleModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { trapFocus, restoreFocus } = useFocusManagement();
  const { announceMessage } = useScreenReaderAnnouncements();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      announceMessage(`${title} dialog opened`);
      
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    } else {
      if (previousFocusRef.current) {
        restoreFocus(previousFocusRef.current);
      }
    }
  }, [isOpen, trapFocus, restoreFocus, announceMessage, title]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={cn(
          "bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-[#191919] font-inter">
            {title}
          </h2>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={ariaLabels['action.close']}
            className="h-8 w-8 p-0" >
  <X className="h-4 w-4" />
</DaisyButton>
          </DaisyButton>
        </div>
        {children}
      </div>
    </div>
  );
};

// Accessible Tooltip Component
interface AccessibleTooltipProps extends PropsWithChildren {
  content: string;
  className?: string;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  }, []);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? tooltipId.current : undefined}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={cn(
            "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1",
            "bg-gray-900 text-white text-sm rounded shadow-lg z-50 whitespace-nowrap",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// Status Message Component
interface StatusMessageProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  onClose,
  className
}) => {
  const { announceMessage } = useScreenReaderAnnouncements();

  useEffect(() => {
    announceMessage(`${ariaLabels[`status.${type}`]}: ${message}`, type === 'error' ? 'assertive' : 'polite');
  }, [message, type, announceMessage]);

  const getIcon = () => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const Icon = getIcon();

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        getColors(),
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium font-inter">{message}</span>
      {onClose && (
        <DaisyButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={ariaLabels['action.close']}
          className="h-6 w-6 p-0 hover:bg-transparent" >
  <X className="h-4 w-4" />
</DaisyButton>
        </DaisyButton>
      )}
    </div>
  );
};

// Accessibility Provider
export const AccessibilityProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { announceMessage } = useScreenReaderAnnouncements();
  const isHighContrast = useHighContrast();
  const reducedMotion = useReducedMotion();

  const getAriaLabel = useCallback((key: string): string => {
    return ariaLabels[key as keyof typeof ariaLabels] || key;
  }, []);

  const contextValue: AccessibilityContextType = {
    announceMessage,
    getAriaLabel,
    isHighContrast,
    reducedMotion,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      <SkipLinks />
      {children}
    </AccessibilityContext.Provider>
  );
}; 
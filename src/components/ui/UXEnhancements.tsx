'use client';

import React, {
  Component,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from 'react';
import { cn } from '@/lib/utils';
import { useAccessibility } from '@/lib/accessibility/AccessibilityProvider';
import { usePerformance } from '@/lib/performance/PerformanceProvider';

// Types
interface LoadingState {
  isLoading: boolean
  progress?: number;
  message?: string;
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
}

interface ErrorInfo {
  componentStack: string;
  errorBoundary: string;
}

interface AnimationConfig {
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number;
  stagger?: number;
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (__error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number | boolean>;
  },
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(__error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(__error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Auto-reset after 5 seconds
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }, 5000);
  }

  componentDidUpdate(prevProps: any) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-error">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h3>
          <p className="text-text-secondary mb-4">
            We're sorry, but something unexpected happened. The page will automatically reload
            shortly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Components
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-surface-tertiary border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export const LoadingDots: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className={cn('flex space-x-1', className)} role="status" aria-label="Loading">
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: '0ms' }}
    />
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: '150ms' }}
    />
    <div
      className="w-2 h-2 bg-primary rounded-full animate-bounce"
      style={{ animationDelay: '300ms' }}
    />
    <span className="sr-only">Loading...</span>
  </div>
);

export const LoadingPulse: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn('space-y-3', className)} role="status" aria-label="Loading content">
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className="h-4 bg-surface-secondary rounded animate-pulse"
        style={{
          width: `${Math.random() * 40 + 60}%`,
          animationDelay: `${index * 200}ms`,
        }}
      />
    ))}
    <span className="sr-only">Loading content...</span>
  </div>
);

export const SkeletonLoader: React.FC<{
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({ variant = 'text', width, height, className }) => {
  const baseClasses = 'animate-pulse bg-surface-secondary';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    card: 'h-48 rounded-lg',
  }

  const style = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? 16 : variant === 'circular' ? width : 192),
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: ReactNode;
  loadingComponent?: ReactNode;
  blur?: boolean;
  className?: string;
}> = ({ isLoading, children, loadingComponent, blur = true, className }) => (
  <div className={cn('relative', className)}>
    <div className={cn(isLoading && blur && 'blur-sm transition-all duration-300')}>{children}</div>
    {Boolean(isLoading) && (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 backdrop-blur-sm">
        {loadingComponent || <LoadingSpinner size="lg" />}
      </div>
    )}
  </div>
);

// Progress Components
export const ProgressBar: React.FC<{
  progress: number
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}> = ({ progress, max = 100, className, showLabel = false, color = 'primary' }) => {
  const percentage = Math.min((progress / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={cn('h-full transition-all duration-500 ease-out', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {Boolean(showLabel) && (
        <div className="mt-2 text-sm text-text-secondary text-right">{Math.round(percentage)}%</div>
      )}
    </div>
  );
}

export const CircularProgress: React.FC<{
  progress: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}> = ({
  progress,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  color = 'primary',
}) => {
  const percentage = Math.min((progress / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
  }

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', colorClasses[color])}
        />
      </svg>
      {Boolean(showLabel) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Animation Components
export const FadeIn: React.FC<{
  children: ReactNode
  duration?: number;
  delay?: number;
  className?: string;
  triggerOnce?: boolean;
}> = ({ children, duration = 500, delay = 0, className, triggerOnce = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { isReducedMotion } = useAccessibility();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [triggerOnce, isReducedMotion]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        isReducedMotion && 'transition-none',
        className
      )}
      style={{
        transitionDuration: isReducedMotion ? '0ms' : `${duration}ms`,
        transitionDelay: isReducedMotion ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export const SlideIn: React.FC<{
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  distance?: number;
  className?: string;
}> = ({ children, direction = 'up', duration = 500, delay = 0, distance = 20, className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { isReducedMotion } = useAccessibility();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [isReducedMotion]);

  const transforms = {
    left: isVisible ? 'translateX(0)' : `translateX(-${distance}px)`,
    right: isVisible ? 'translateX(0)' : `translateX(${distance}px)`,
    up: isVisible ? 'translateY(0)' : `translateY(${distance}px)`,
    down: isVisible ? 'translateY(0)' : `translateY(-${distance}px)`,
  }

  return (
    <div
      ref={elementRef}
      className={cn('transition-all', isReducedMotion && 'transition-none', className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: transforms[direction],
        transitionDuration: isReducedMotion ? '0ms' : `${duration}ms`,
        transitionDelay: isReducedMotion ? '0ms' : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export const StaggeredList: React.FC<{
  children: ReactNode[];
  staggerDelay?: number;
  duration?: number;
  className?: string;
}> = ({ children, staggerDelay = 100, duration = 500, className }) => {
  const { isReducedMotion } = useAccessibility();

  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          duration={duration}
          delay={isReducedMotion ? 0 : index * staggerDelay}
          triggerOnce
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Notification Components
export const Toast: React.FC<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
  className?: string;
}> = ({ message, type = 'info', duration = 5000, onClose, className }) => {
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, type, duration, onClose, announceToScreenReader]);

  const typeClasses = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-black',
    info: 'bg-surface-primary text-text-primary border border-surface-tertiary',
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        typeClasses[type],
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="text-lg" aria-hidden="true">
        {icons[type]}
      </span>
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-current hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

// Hooks for UX Enhancement
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>();

  const startLoading = useCallback((msg?: string) => {
    setIsLoading(true);
    setProgress(0);
    setMessage(msg);
  }, []);

  const updateProgress = useCallback((_value: number, msg?: string) => {
    setProgress(Math.min(Math.max(value, 0), 100));
    if (msg) setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setProgress(100);
    setMessage(undefined);
  }, []);

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    stopLoading,
  }
}

export const useToast = () => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
    }>
  >([]);

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'warning' | 'info' = 'info',
      duration?: number
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const ToastContainer = useMemo(() => {
    const Component = ({ className }: { className?: string }) => (
      <div className={cn('fixed top-4 right-4 z-50 space-y-2', className)}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    );
    Component.displayName = 'ToastContainer';
    return Component;
  }, [toasts, removeToast]);

  return {
    addToast,
    removeToast,
    ToastContainer,
    toasts,
  }
}

export const useProgressiveEnhancement = () => {
  const [isEnhanced, setIsEnhanced] = useState(false);
  const { settings } = usePerformance();

  useEffect(() => {
    // Progressive enhancement based on capabilities
    const hasJS = true; // We're in React, so JS is available
    const hasModernFeatures = 'IntersectionObserver' in window && 'fetch' in window;
    const hasGoodConnection = settings.enableCodeSplitting;

    setIsEnhanced(hasJS && hasModernFeatures && hasGoodConnection);
  }, [settings.enableCodeSplitting]);

  return { isEnhanced }
}

export default {
  ErrorBoundary,
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  SkeletonLoader,
  LoadingOverlay,
  ProgressBar,
  CircularProgress,
  FadeIn,
  SlideIn,
  StaggeredList,
  Toast,
  useLoadingState,
  useToast,
  useProgressiveEnhancement,
}

/**
 * Comprehensive Mobile Optimization Framework for Riscura
 * Provides enterprise-grade mobile responsiveness with performance optimization
 */

import { useEffect, useState, useCallback, useRef, createElement } from 'react';
import { useMediaQuery } from '@/lib/responsive/use-media-query';

// ============================================================================
// DEVICE DETECTION AND BREAKPOINTS
// ============================================================================

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
  pixelRatio: number;
  isTouch: boolean;
  platform: 'ios' | 'android' | 'web';
  viewport: {
    width: number;
    height: number;
    safeAreaTop: number;
    safeAreaBottom: number;
  };
}

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const DEVICE_BREAKPOINTS = {
  mobile: BREAKPOINTS.md - 1,
  tablet: BREAKPOINTS.lg - 1,
  desktop: BREAKPOINTS.lg,
} as const;

// ============================================================================
// DEVICE DETECTION HOOK
// ============================================================================

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        orientation: 'landscape',
        width: 1024,
        height: 768,
        pixelRatio: 1,
        isTouch: false,
        platform: 'web',
        viewport: { width: 1024, height: 768, safeAreaTop: 0, safeAreaBottom: 0 },
      };
    }

    return getDeviceInfo();
  });

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const resizeHandler = () => updateDeviceInfo();
    const orientationHandler = () => setTimeout(updateDeviceInfo, 100);

    window.addEventListener('resize', resizeHandler);
    mediaQuery.addEventListener('change', orientationHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      mediaQuery.removeEventListener('change', orientationHandler);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}

function getDeviceInfo(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  // Detect device type
  let type: DeviceInfo['type'] = 'desktop';
  if (width <= DEVICE_BREAKPOINTS.mobile) type = 'mobile';
  else if (width <= DEVICE_BREAKPOINTS.tablet) type = 'tablet';

  // Detect orientation
  const orientation: DeviceInfo['orientation'] = width < height ? 'portrait' : 'landscape';

  // Detect touch capability
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect platform
  let platform: DeviceInfo['platform'] = 'web';
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) platform = 'ios';
  else if (/android/.test(userAgent)) platform = 'android';

  // Calculate safe area (for notch support)
  const safeAreaTopValue = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0';
  const safeAreaBottomValue = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0';
  
  const safeAreaTop = parseInt(safeAreaTopValue, 10) || 0;
  const safeAreaBottom = parseInt(safeAreaBottomValue, 10) || 0;

  return {
    type,
    orientation,
    width,
    height,
    pixelRatio,
    isTouch,
    platform,
    viewport: {
      width,
      height,
      safeAreaTop,
      safeAreaBottom,
    },
  };
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const device = useDeviceInfo();
  
  switch (device.type) {
    case 'mobile':
      return values.mobile ?? values.default;
    case 'tablet':
      return values.tablet ?? values.default;
    case 'desktop':
      return values.desktop ?? values.default;
    default:
      return values.default;
  }
}

export function useBreakpointValue<T>(breakpoints: Partial<Record<keyof typeof BREAKPOINTS, T>>): T | undefined {
  const isXs = useMediaQuery(`(max-width: ${BREAKPOINTS.xs - 1}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.xs}px) and (max-width: ${BREAKPOINTS.sm - 1}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`);
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);

  if (is2xl && breakpoints['2xl']) return breakpoints['2xl'];
  if (isXl && breakpoints.xl) return breakpoints.xl;
  if (isLg && breakpoints.lg) return breakpoints.lg;
  if (isMd && breakpoints.md) return breakpoints.md;
  if (isSm && breakpoints.sm) return breakpoints.sm;
  if (isXs && breakpoints.xs) return breakpoints.xs;

  // Return the largest available breakpoint as fallback
  const availableBreakpoints = Object.keys(breakpoints) as (keyof typeof BREAKPOINTS)[];
  const sortedBreakpoints = availableBreakpoints.sort((a, b) => BREAKPOINTS[b] - BREAKPOINTS[a]);
  return breakpoints[sortedBreakpoints[0]];
}

// ============================================================================
// MOBILE OPTIMIZATION COMPONENTS
// ============================================================================

export interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
  enableTouch?: boolean;
  enableGestures?: boolean;
  safeArea?: boolean;
}

export function MobileOptimized({
  children,
  className = '',
  enableTouch = true,
  enableGestures = false,
  safeArea = true,
}: MobileOptimizedProps) {
  const device = useDeviceInfo();
  
  const optimizedClassName = [
    className,
    // Touch optimization
    enableTouch && device.isTouch ? 'touch-manipulation select-none' : '',
    // Safe area support
    safeArea && device.platform === 'ios' ? 'pb-safe-area-bottom pt-safe-area-top' : '',
    // Platform-specific optimizations
    device.platform === 'ios' ? 'ios-optimized' : '',
    device.platform === 'android' ? 'android-optimized' : '',
  ].filter(Boolean).join(' ');

  return createElement('div', {
    className: optimizedClassName,
    'data-device-type': device.type,
  }, children);
}

// ============================================================================
// TOUCH OPTIMIZATION
// ============================================================================

export interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  haptic?: boolean;
}

export function TouchOptimizedButton({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  haptic = true,
  onClick,
  ...props
}: TouchOptimizedButtonProps) {
  const device = useDeviceInfo();
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback for mobile devices
    if (haptic && device.isTouch && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.(e);
  }, [onClick, haptic, device.isTouch]);

  const sizeClasses = {
    sm: 'min-h-[40px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-base',
    lg: 'min-h-[48px] px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100',
  };

  const touchClasses = device.isTouch 
    ? 'touch-manipulation active:scale-95 transition-transform duration-150'
    : 'hover:scale-105 transition-transform duration-200';

  const combinedClassName = [
    'rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses[size],
    variantClasses[variant],
    touchClasses,
    className,
  ].join(' ');

  return createElement('button', {
    className: combinedClassName,
    onClick: handleClick,
    ...props,
  }, children);
}

// ============================================================================
// GESTURE SUPPORT
// ============================================================================

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocity?: number;
}

export function useSwipeGesture(config: SwipeGestureConfig) {
  const startTouch = useRef<Touch | null>(null);
  const endTouch = useRef<Touch | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startTouch.current = e.touches[0];
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startTouch.current) return;
    
    endTouch.current = e.changedTouches[0];
    
    const deltaX = endTouch.current.clientX - startTouch.current.clientX;
    const deltaY = endTouch.current.clientY - startTouch.current.clientY;
    const threshold = config.threshold || 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          config.onSwipeRight?.();
        } else {
          config.onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          config.onSwipeDown?.();
        } else {
          config.onSwipeUp?.();
        }
      }
    }
    
    startTouch.current = null;
    endTouch.current = null;
  }, [config]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// ============================================================================
// MOBILE LAYOUT UTILITIES
// ============================================================================

export function useAdaptiveColumns() {
  return useResponsiveValue({
    mobile: 1,
    tablet: 2,
    desktop: 3,
    default: 3,
  });
}

export function useAdaptiveSpacing() {
  return useResponsiveValue({
    mobile: 'p-4 space-y-4',
    tablet: 'p-6 space-y-6', 
    desktop: 'p-8 space-y-8',
    default: 'p-8 space-y-8',
  });
}

export function useAdaptiveTextSize() {
  return useResponsiveValue({
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
    default: 'text-base',
  });
}

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  quality?: number;
}

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  threshold = 0.1,
  quality = 75,
  className = '',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const device = useDeviceInfo();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  // Generate responsive src for different screen sizes
  const responsiveSrc = isInView ? generateResponsiveSrc(src, device.width, quality) : placeholder;

  return createElement('img', {
    ref: imgRef,
    src: responsiveSrc,
    alt,
    className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    onLoad: () => setIsLoaded(true),
    loading: 'lazy',
    ...props,
  });
}

function generateResponsiveSrc(src: string, width: number, quality: number): string {
  // If it's a Next.js optimized image, add responsive parameters
  if (src.startsWith('/_next/image')) {
    return src;
  }
  
  // For external images, determine appropriate size
  let targetWidth = width;
  if (width <= BREAKPOINTS.sm) targetWidth = Math.min(width * 2, 640);
  else if (width <= BREAKPOINTS.md) targetWidth = Math.min(width * 2, 1024);
  else targetWidth = Math.min(width, 1920);

  // Add query parameters for image optimization services
  const url = new URL(src, window.location.origin);
  url.searchParams.set('w', targetWidth.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
}

// ============================================================================
// MOBILE FORM OPTIMIZATION
// ============================================================================

export interface MobileFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function MobileFormField({
  label,
  error,
  required,
  children,
  className = '',
}: MobileFormFieldProps) {
  const device = useDeviceInfo();
  
  const fieldClassName = [
    'space-y-2',
    device.type === 'mobile' ? 'mb-6' : 'mb-4',
    className,
  ].join(' ');

  return createElement('div', {
    className: fieldClassName,
  }, [
    createElement('label', {
      key: 'label',
      className: `block font-medium ${device.type === 'mobile' ? 'text-base' : 'text-sm'} text-gray-700`,
    }, [
      label,
      required && createElement('span', {
        key: 'required',
        className: 'text-red-500 ml-1',
      }, '*'),
    ]),
    children,
    error && createElement('p', {
      key: 'error',
      className: `text-red-600 ${device.type === 'mobile' ? 'text-sm' : 'text-xs'}`,
    }, error),
  ]);
}

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

export function useA11yAnnouncement() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface MobilePerformanceMetrics {
  deviceType: string;
  screenSize: string;
  connectionType: string;
  renderTime: number;
  memoryUsage: number;
  batteryLevel?: number;
}

export function useMobilePerformanceMonitoring() {
  const device = useDeviceInfo();
  const [metrics, setMetrics] = useState<MobilePerformanceMetrics | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measurePerformance = async () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const memory = (performance as any).memory;
      const battery = 'getBattery' in navigator ? await (navigator as any).getBattery() : null;

      const performanceEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const renderTime = performanceEntry.loadEventEnd - performanceEntry.navigationStart;

      setMetrics({
        deviceType: device.type,
        screenSize: `${device.width}x${device.height}`,
        connectionType: connection?.effectiveType || 'unknown',
        renderTime,
        memoryUsage: memory?.usedJSHeapSize || 0,
        batteryLevel: battery?.level ? Math.round(battery.level * 100) : undefined,
      });
    };

    measurePerformance();
  }, [device]);

  return metrics;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  useMediaQuery,
  BREAKPOINTS,
  DEVICE_BREAKPOINTS,
};

export type {
  DeviceInfo,
  MobilePerformanceMetrics,
};
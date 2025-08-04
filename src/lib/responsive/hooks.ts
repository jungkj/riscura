import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions following Tailwind CSS standards
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  breakpoint: Breakpoint;
  width: number;
  height: number;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

// Enhanced device detection hook
export const useDevice = (): DeviceInfo => {
  const [device, setDevice] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        breakpoint: 'lg',
        width: 1024,
        height: 768,
        isTouchDevice: false,
        orientation: 'landscape',
        pixelRatio: 1,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
      breakpoint: getBreakpoint(width),
      width,
      height,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: width > height ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDevice({
        type: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
        breakpoint: getBreakpoint(width),
        width,
        height,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1,
      });
    };

    const handleOrientationChange = () => {
      // Small delay to get accurate dimensions after orientation change
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return device;
};

// Get current breakpoint based on width
const getBreakpoint = (width: number): Breakpoint => {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Responsive value hook - returns different values based on breakpoint
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
  const device = useDevice();
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

  // Find the first defined value at or below current breakpoint
  const currentBreakpointIndex = breakpointOrder.indexOf(device.breakpoint);

  for (let i = currentBreakpointIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  // Fallback to first available value
  return Object.values(values)[0];
};

// Media query hook
export const useMediaQuery = (_query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);

    updateMatches();
    media.addEventListener('change', updateMatches);

    return () => media.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
};

// Sidebar state management hook
export const useSidebarState = () => {
  const device = useDevice();
  const [isOpen, setIsOpen] = useState(() => device.type === 'desktop');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-manage sidebar based on device type
  useEffect(() => {
    if (device.type === 'mobile') {
      setIsOpen(false);
      setIsCollapsed(false);
    } else if (device.type === 'tablet') {
      setIsOpen(true);
      setIsCollapsed(true);
    } else {
      setIsOpen(true);
      setIsCollapsed(false);
    }
  }, [device.type]);

  const toggle = useCallback(() => {
    if (device.type === 'mobile') {
      setIsOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [device.type]);

  const close = useCallback(() => {
    if (device.type === 'mobile') {
      setIsOpen(false);
    }
  }, [device.type]);

  return {
    isOpen,
    isCollapsed,
    toggle,
    close,
    device,
  };
};

// Touch gesture detection hook
export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold = 50
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Must be a quick gesture (less than 300ms) and move enough distance
      if (deltaTime > 300) return;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > threshold && absDeltaX > absDeltaY) {
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipe, threshold]);
};

// Keyboard shortcuts hook
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      let shortcut = '';
      if (ctrl) shortcut += 'ctrl+';
      if (shift) shortcut += 'shift+';
      if (alt) shortcut += 'alt+';
      shortcut += key;

      const action = shortcuts[shortcut];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Viewport dimensions hook
export const useViewport = () => {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Safe area insets hook (for devices with notches, etc.)
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

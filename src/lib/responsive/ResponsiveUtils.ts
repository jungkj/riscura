import React from 'react';

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query utilities
export class MediaQueryUtils {
  public static getMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): string {
    const value = breakpoints[breakpoint];
    return `(${type}-width: ${value}px)`;
  }

  public static matches(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(this.getMediaQuery(breakpoint, type)).matches;
  }

  public static addListener(
    breakpoint: Breakpoint,
    callback: (matches: boolean) => void,
    type: 'min' | 'max' = 'min'
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const mediaQuery = window.matchMedia(this.getMediaQuery(breakpoint, type));
    const handleChange = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }

  public static getCurrentBreakpoint(): Breakpoint {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;

    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }
}

// Device detection utilities
export class DeviceUtils {
  public static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  public static isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  }

  public static isDesktop(): boolean {
    return !this.isMobile() && !this.isTablet();
  }

  public static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  public static getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 1024, height: 768 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  public static getOrientation(): 'portrait' | 'landscape' {
    const { width, height } = this.getViewportSize();
    return width > height ? 'landscape' : 'portrait';
  }
}

// Responsive design utilities
export class ResponsiveUtils {
  public static getResponsiveValue<T>(
    breakpointValues: Partial<Record<Breakpoint, T>>,
    fallback: T
  ): T {
    const currentBreakpoint = MediaQueryUtils.getCurrentBreakpoint();
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

    // Find the largest breakpoint that has a value and is <= current breakpoint
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (breakpointValues[bp] !== undefined) {
        return breakpointValues[bp]!;
      }
    }

    return fallback;
  }

  public static generateResponsiveClasses(
    property: string,
    values: Partial<Record<Breakpoint, string | number>>
  ): string {
    const classes: string[] = [];

    Object.entries(values).forEach(([breakpoint, value]) => {
      const bp = breakpoint as Breakpoint;
      const prefix = bp === 'xs' ? '' : `${bp}:`;
      classes.push(`${prefix}${property}-${value}`);
    });

    return classes.join(' ');
  }

  public static clamp(_value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  public static scaleValue(
    _value: number,
    fromBreakpoint: Breakpoint,
    toBreakpoint: Breakpoint,
    scaleFactor: number = 0.8
  ): number {
    const fromWidth = breakpoints[fromBreakpoint];
    const toWidth = breakpoints[toBreakpoint];
    const currentWidth = DeviceUtils.getViewportSize().width;

    if (currentWidth <= toWidth) {
      return value * scaleFactor;
    }

    if (currentWidth >= fromWidth) {
      return value;
    }

    // Linear interpolation between breakpoints
    const ratio = (currentWidth - toWidth) / (fromWidth - toWidth);
    return value * (scaleFactor + ratio * (1 - scaleFactor));
  }
}

// Touch and gesture utilities
export class TouchUtils {
  public static addTouchSupport(element: HTMLElement): () => void {
    if (!DeviceUtils.isTouchDevice()) return () => {};

    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      if (!isScrolling) {
        isScrolling = deltaY > deltaX;
      }

      // Prevent horizontal scrolling if vertical scrolling is detected
      if (!isScrolling && deltaX > 10) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }

  public static addSwipeGesture(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
    threshold: number = 50
  ): () => void {
    if (!DeviceUtils.isTouchDevice()) return () => {};

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Ignore if too slow or too short
      if (deltaTime > 300 || (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold)) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else {
        // Vertical swipe
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
}

// React hooks for responsive design
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() =>
    MediaQueryUtils.getCurrentBreakpoint()
  );

  React.useEffect(() => {
    const handleResize = () => {
      setBreakpoint(MediaQueryUtils.getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

export function useMediaQuery(breakpoint: Breakpoint, type: 'min' | 'max' = 'min'): boolean {
  const [matches, setMatches] = React.useState(() => MediaQueryUtils.matches(breakpoint, type));

  React.useEffect(() => {
    return MediaQueryUtils.addListener(breakpoint, setMatches, type);
  }, [breakpoint, type]);

  return matches;
}

export function useViewportSize() {
  const [size, setSize] = React.useState(() => DeviceUtils.getViewportSize());

  React.useEffect(() => {
    const handleResize = () => {
      setSize(DeviceUtils.getViewportSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export function useOrientation() {
  const [orientation, setOrientation] = React.useState(() => DeviceUtils.getOrientation());

  React.useEffect(() => {
    const handleResize = () => {
      setOrientation(DeviceUtils.getOrientation());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orientation;
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState(() => ({
    isMobile: DeviceUtils.isMobile(),
    isTablet: DeviceUtils.isTablet(),
    isDesktop: DeviceUtils.isDesktop(),
    isTouchDevice: DeviceUtils.isTouchDevice(),
  }));

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType({
        isMobile: DeviceUtils.isMobile(),
        isTablet: DeviceUtils.isTablet(),
        isDesktop: DeviceUtils.isDesktop(),
        isTouchDevice: DeviceUtils.isTouchDevice(),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

export function useResponsiveValue<T>(
  breakpointValues: Partial<Record<Breakpoint, T>>,
  fallback: T
): T {
  const breakpoint = useBreakpoint();

  return React.useMemo(() => {
    return ResponsiveUtils.getResponsiveValue(breakpointValues, fallback);
  }, [breakpointValues, fallback, breakpoint]);
}

export function useSwipeGesture(
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold: number = 50
) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    return TouchUtils.addSwipeGesture(ref.current, onSwipe, threshold);
  }, [onSwipe, threshold]);

  return ref;
}

// Responsive component utilities
export interface ResponsiveProps {
  xs?: React.ReactNode;
  sm?: React.ReactNode;
  md?: React.ReactNode;
  lg?: React.ReactNode;
  xl?: React.ReactNode;
  '2xl'?: React.ReactNode;
}

export const ResponsiveRender: React.FC<ResponsiveProps> = (props) => {
  const breakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

  // Find the best matching breakpoint
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (props[bp] !== undefined) {
      return React.createElement(React.Fragment, {}, props[bp]);
    }
  }

  return null;
};

// CSS-in-JS responsive utilities
export function generateResponsiveStyles(
  property: string,
  values: Partial<Record<Breakpoint, string | number>>
): Record<string, any> {
  const styles: Record<string, any> = {};

  Object.entries(values).forEach(([breakpoint, value]) => {
    const bp = breakpoint as Breakpoint;

    if (bp === 'xs') {
      styles[property] = value;
    } else {
      const mediaQuery = MediaQueryUtils.getMediaQuery(bp);
      if (!styles[`@media ${mediaQuery}`]) {
        styles[`@media ${mediaQuery}`] = {};
      }
      styles[`@media ${mediaQuery}`][property] = value;
    }
  });

  return styles;
}

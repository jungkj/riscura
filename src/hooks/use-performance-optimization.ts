import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring utilities
export const performanceMonitor = {
  startMeasure: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  },

  endMeasure: (name: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name, 'measure')[0];

      if (process.env.NODE_ENV === 'development' && measure) {
        // console.log(`⚡ Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
      }

      return measure?.duration || 0;
    }
    return 0;
  },

  clearMeasures: (name?: string) => {
    if (typeof performance !== 'undefined') {
      if (name) {
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      } else {
        performance.clearMarks();
        performance.clearMeasures();
      }
    }
  },
};

// Debounced callback hook with performance tracking
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  delay: number = 0
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (delay === 0) {
        return callback(...args);
      }

      timeoutRef.current = setTimeout(() => {
        performanceMonitor.startMeasure('callback-execution');
        callback(...args);
        performanceMonitor.endMeasure('callback-execution');
      }, delay);
    }) as T,
    [...deps, delay]
  );
};

// Memoized value with size tracking
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  return useMemo(() => {
    performanceMonitor.startMeasure(`memo-${debugName || 'anonymous'}`);
    const result = factory();
    performanceMonitor.endMeasure(`memo-${debugName || 'anonymous'}`);

    // Track memory usage in development
    if (process.env.NODE_ENV === 'development' && debugName) {
      try {
        const size = JSON.stringify(result).length;
        if (size > 10000) {
          // Warn about large memoized values
          // console.warn(`📊 Large memoized value detected: ${debugName} (${size} bytes)`);
        }
      } catch (error) {
        // Handle circular references or non-serializable values
        // console.warn(`📊 Could not measure size for memoized value: ${debugName}`);
      }
    }

    return result;
  }, deps);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (_options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { ref: elementRef, isIntersecting, hasIntersected };
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    containerProps: {
      style: { height: containerHeight, overflow: 'auto' },
      onScroll: handleScroll,
    },
  };
};

// Performance metrics tracking
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  totalRenderTime: number;
  avgRenderTime: number;
}

export const usePerformanceMetrics = (componentName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    totalRenderTime: 0,
    avgRenderTime: 0,
  });

  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
  });

  useEffect(() => {
    if (startTime.current) {
      const renderTime =
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime.current;
      const metrics = metricsRef.current;

      metrics.renderCount++;
      metrics.lastRenderTime = renderTime;
      metrics.totalRenderTime += renderTime;
      metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount;

      if (process.env.NODE_ENV === 'development' && metrics.renderCount % 10 === 0) {
        // console.log(`📊 ${componentName} Performance:`, {
          renders: metrics.renderCount,
          lastRender: `${renderTime.toFixed(2)}ms`,
          avgRender: `${metrics.avgRenderTime.toFixed(2)}ms`,
        });
      }
    }
  });

  return metricsRef.current;
};

// Animation performance utilities
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

// Bundle size optimization utilities
export const preloadRoute = (routePath: string) => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = routePath;
    document.head.appendChild(link);
  }
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Throttled scroll hook
export const useThrottledScroll = (callback: (scrollY: number) => void, delay: number = 16) => {
  const lastRan = useRef(Date.now());

  const throttledCallback = useCallback(() => {
    if (Date.now() - lastRan.current >= delay) {
      callback(window.scrollY);
      lastRan.current = Date.now();
    }
  }, [callback, delay]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);
};

// Device pixel ratio hook for high-DPI displays
export const useDevicePixelRatio = () => {
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setDevicePixelRatio(window.devicePixelRatio || 1);

    const handleChange = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    // Listen for changes in device pixel ratio
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return devicePixelRatio;
};

// Hook for component lazy loading
export const useLazyComponent = () => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());

  const loadComponent = useCallback(
    (componentName: string) => {
      if (!loadedComponents.has(componentName)) {
        setLoadedComponents((prev) => new Set([...prev, componentName]));
      }
    },
    [loadedComponents]
  );

  const isComponentLoaded = useCallback(
    (componentName: string) => {
      return loadedComponents.has(componentName);
    },
    [loadedComponents]
  );

  return { loadComponent, isComponentLoaded };
};

// Memory usage monitoring hook
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      setMemoryInfo((performance as any).memory);
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Network status hook for performance adaptation
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const updateNetworkStatus = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
      });
    };

    const handleOnline = () => setNetworkStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkStatus((prev) => ({ ...prev, isOnline: false }));

    updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};

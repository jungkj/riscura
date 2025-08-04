import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    setMetrics((prev) => ({
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime:
        prev.averageRenderTime === 0 ? renderTime : (prev.averageRenderTime + renderTime) / 2,
    }));

    if (process.env.NODE_ENV === 'development') {
      // console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  useEffect(() => {
    startTime.current = performance.now();
  });

  return metrics;
};

// Debounced value hook for performance optimization
export const useDebounce = <T>(_value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const lastRun = useRef<number>(0);

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
};

// Memoized calculation hook
export const useMemoizedCalculation = <T, R>(_data: T[],
  calculator: (_data: T[]) => R,
  dependencies: unknown[] = []
): R => {
  return useMemo(() => {
    const start = performance.now();
    const _result = calculator(data);
    const end = performance.now();

    if (process.env.NODE_ENV === 'development') {
      // console.log(`Calculation took ${(end - start).toFixed(2)}ms`);
    }

    return result;
  }, [data, calculator, ...dependencies]);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(items: T[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
};

// Intersection observer hook for lazy loading
export const useIntersectionObserver = (_options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (isIntersecting && src && !isLoaded) {
      const img = new Image();

      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };

      img.onerror = () => {
        setIsError(true);
      };

      img.src = src;
    }
  }, [isIntersecting, src, isLoaded]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
};

// Memory usage monitoring hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (
          performance as {
            memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
          }
        ).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Bundle size analyzer hook
export const useBundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    loadTime: number;
    resourceCount: number;
    totalSize: number;
  } | null>(null);

  useEffect(() => {
    const analyzeBundleSize = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const totalSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      setBundleInfo({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        resourceCount: resources.length,
        totalSize,
      });
    };

    if (document.readyState === 'complete') {
      analyzeBundleSize();
    } else {
      window.addEventListener('load', analyzeBundleSize);
      return () => window.removeEventListener('load', analyzeBundleSize);
    }
  }, []);

  return bundleInfo;
};

// Optimized state update hook
export const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const nextState =
        typeof newValue === 'function' ? (newValue as (prev: T) => T)(prevState) : newValue;

      // Only update if value actually changed
      if (Object.is(nextState, stateRef.current)) {
        return prevState;
      }

      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [state, optimizedSetState] as const;
};

// Performance-optimized component wrapper
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const OptimizedComponent = React.memo(Component);
  OptimizedComponent.displayName =
    displayName || `Optimized(${Component.displayName || Component.name})`;
  return OptimizedComponent;
};

// Hook for measuring component performance
export const useComponentPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const [performanceData, setPerformanceData] = useState({
    averageRenderTime: 0,
    renderCount: 0,
    lastRenderTime: 0,
  });

  // Mark render start
  renderStartTime.current = performance.now();
  renderCount.current += 1;

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;

    setPerformanceData((prev) => ({
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime:
        prev.renderCount === 0
          ? renderTime
          : (prev.averageRenderTime * prev.renderCount + renderTime) / renderCount.current,
    }));

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      // console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  return performanceData;
};

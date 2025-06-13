import React, { 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect, 
  useState, 
  memo, 
  lazy, 
  Suspense 
} from 'react';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';

// Performance monitoring utilities
export const performanceMonitor = {
  startMeasure: (name: string) => {
    performance.mark(`${name}-start`);
  },
  
  endMeasure: (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = performance.getEntriesByName(name, 'measure')[0];
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
    }
    
    return measure.duration;
  },
  
  clearMeasures: (name?: string) => {
    if (name) {
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
};

// Optimized memo with display name
export const optimizedMemo = <P extends object>(
  Component: ComponentType<P>,
  displayName?: string,
  areEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) => {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = displayName || `Optimized(${Component.displayName || Component.name})`;
  return MemoizedComponent;
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
      const size = JSON.stringify(result).length;
      if (size > 10000) { // Warn about large memoized values
        console.warn(`📊 Large memoized value detected: ${debugName} (${size} bytes)`);
      }
    }
    
    return result;
  }, deps);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

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

// Lazy loading wrapper component
interface LazyWrapperProps extends PropsWithChildren {
  fallback?: ReactNode;
  height?: string | number;
  className?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback, 
  height = 200,
  className 
}) => {
  const { ref, hasIntersected } = useIntersectionObserver();

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {hasIntersected ? children : fallback}
    </div>
  );
};

// Component lazy loading utility
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  const LazyComponentWrapper: React.FC<P> = (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
  
  return LazyComponentWrapper;
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
    startTime.current = performance.now();
  });

  useEffect(() => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current;
      const metrics = metricsRef.current;
      
      metrics.renderCount++;
      metrics.lastRenderTime = renderTime;
      metrics.totalRenderTime += renderTime;
      metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount;
      
      if (process.env.NODE_ENV === 'development' && metrics.renderCount % 10 === 0) {
        console.log(`📊 ${componentName} Performance:`, {
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
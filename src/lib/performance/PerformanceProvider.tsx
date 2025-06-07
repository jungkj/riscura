'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  useCallback, 
  useMemo,
  Suspense,
  lazy 
} from 'react';
import { cn } from '@/lib/utils';

// Types
interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage: number;
  networkSpeed: 'slow' | 'fast' | 'unknown';
}

interface PerformanceSettings {
  enableVirtualScrolling: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableOfflineMode: boolean;
  maxCacheSize: number;
  preloadStrategy: 'none' | 'viewport' | 'aggressive';
  compressionLevel: 'low' | 'medium' | 'high';
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  settings: PerformanceSettings;
  updateSettings: (settings: Partial<PerformanceSettings>) => void;
  isOnline: boolean;
  networkSpeed: 'slow' | 'fast' | 'unknown';
  cacheData: (key: string, data: any, ttl?: number) => void;
  getCachedData: (key: string) => any;
  clearCache: () => void;
  preloadComponent: (componentPath: string) => Promise<any>;
  measurePerformance: (label: string, fn: () => void) => void;
}

// Context
const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Custom Hooks
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};

export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      top: (visibleRange.startIndex + index) * itemHeight,
    }));
  }, [items, visibleRange, itemHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerProps: {
      style: { height: containerHeight },
      onScroll: handleScroll,
    },
  };
};

export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });
    
    observer.observe(target);
    
    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);
  
  return targetRef;
};

export const useLazyLoading = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  
  const observeElement = useCallback((id: string, element: HTMLElement) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleElements(prev => new Set(prev).add(id));
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(element);
    
    return () => observer.unobserve(element);
  }, []);
  
  const isVisible = useCallback((id: string) => {
    return visibleElements.has(id);
  }, [visibleElements]);
  
  return { observeElement, isVisible };
};

export const useOfflineData = () => {
  const { isOnline, cacheData, getCachedData } = usePerformance();
  
  const fetchWithCache = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> => {
    // Try cache first if offline
    if (!isOnline) {
      const cached = getCachedData(key);
      if (cached) return cached;
      throw new Error('No cached data available offline');
    }
    
    try {
      const data = await fetcher();
      cacheData(key, data, ttl);
      return data;
    } catch (error) {
      // Fallback to cache on network error
      const cached = getCachedData(key);
      if (cached) return cached;
      throw error;
    }
  }, [isOnline, cacheData, getCachedData]);
  
  return { fetchWithCache, isOnline };
};

// Performance Monitoring
const measureWebVitals = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {};
    
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          metrics.firstInputDelay = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // CLS
      new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cumulativeLayoutShift = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
    }
    
    // Navigation Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;
        metrics.firstContentfulPaint = navEntry.domContentLoadedEventEnd - navEntry.navigationStart;
      }
    }
    
    // Memory Usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    // Network Speed Detection
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      metrics.networkSpeed = ['slow-2g', '2g'].includes(effectiveType) ? 'slow' : 'fast';
    } else {
      metrics.networkSpeed = 'unknown';
    }
    
    setTimeout(() => {
      resolve(metrics as PerformanceMetrics);
    }, 1000);
  });
};

// Cache Implementation
class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  set(key: string, data: any, ttl: number = 300000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Provider Component
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
    memoryUsage: 0,
    networkSpeed: 'unknown',
  });
  
  const [settings, setSettings] = useState<PerformanceSettings>({
    enableVirtualScrolling: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    enableOfflineMode: true,
    maxCacheSize: 100,
    preloadStrategy: 'viewport',
    compressionLevel: 'medium',
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const cacheRef = useRef(new PerformanceCache(settings.maxCacheSize));
  const componentCacheRef = useRef(new Map<string, Promise<any>>());
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Initialize performance metrics
  useEffect(() => {
    // Temporarily disable to fix console errors
    // measureWebVitals().then(setMetrics);
    console.log('Performance metrics monitoring disabled to prevent console errors');
  }, []);
  
  // Update cache size when settings change
  useEffect(() => {
    cacheRef.current = new PerformanceCache(settings.maxCacheSize);
  }, [settings.maxCacheSize]);
  
  const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  const cacheData = useCallback((key: string, data: any, ttl: number = 300000) => {
    cacheRef.current.set(key, data, ttl);
  }, []);
  
  const getCachedData = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);
  
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    componentCacheRef.current.clear();
  }, []);
  
  const preloadComponent = useCallback(async (componentPath: string): Promise<any> => {
    if (componentCacheRef.current.has(componentPath)) {
      return componentCacheRef.current.get(componentPath);
    }
    
    const promise = import(componentPath);
    componentCacheRef.current.set(componentPath, promise);
    
    try {
      return await promise;
    } catch (error) {
      componentCacheRef.current.delete(componentPath);
      throw error;
    }
  }, []);
  
  const measurePerformance = useCallback((label: string, fn: () => void) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`${label}-start`);
      fn();
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    } else {
      fn();
    }
  }, []);
  
  const value: PerformanceContextType = {
    metrics,
    settings,
    updateSettings,
    isOnline,
    networkSpeed: metrics.networkSpeed,
    cacheData,
    getCachedData,
    clearCache,
    preloadComponent,
    measurePerformance,
  };
  
  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Performance Components

// Lazy Image Component
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, width, height, className, placeholder, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observer.observe(img);
    
    return () => observer.unobserve(img);
  }, []);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);
  
  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);
  
  if (hasError) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-secondary", className)}>
        <span className="text-text-secondary text-sm">Failed to load image</span>
      </div>
    );
  }
  
  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      {!isLoaded && placeholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder}
        </div>
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

// Virtual Scrolling Component
export const VirtualScrollContainer: React.FC<{
  items: any[];
  itemHeight: number;
  height: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}> = ({ items, itemHeight, height, renderItem, overscan = 5, className }) => {
  const { visibleItems, totalHeight, containerProps } = useVirtualScrolling(
    items,
    itemHeight,
    height,
    overscan
  );
  
  return (
    <div
      {...containerProps}
      className={cn("overflow-auto", className)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Code Splitting Component
export const LazyComponent: React.FC<{
  componentPath: string;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}> = ({ componentPath, fallback, onError }) => {
  const LazyComponentImpl = useMemo(() => {
    return lazy(() => import(componentPath).catch(error => {
      onError?.(error);
      // Return a fallback component
      return { default: () => <div>Failed to load component</div> };
    }));
  }, [componentPath, onError]);
  
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponentImpl />
    </Suspense>
  );
};

// Preload Link Component
export const PreloadLink: React.FC<{
  href: string;
  children: React.ReactNode;
  strategy?: 'hover' | 'visible' | 'immediate';
  className?: string;
}> = ({ href, children, strategy = 'hover', className }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [preloaded, setPreloaded] = useState(false);
  
  const preload = useCallback(() => {
    if (preloaded) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    setPreloaded(true);
  }, [href, preloaded]);
  
  useEffect(() => {
    if (strategy === 'immediate') {
      preload();
    } else if (strategy === 'visible' && linkRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            preload();
            observer.unobserve(linkRef.current!);
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(linkRef.current);
      
      return () => observer.disconnect();
    }
  }, [strategy, preload]);
  
  const handleMouseEnter = useCallback(() => {
    if (strategy === 'hover') {
      preload();
    }
  }, [strategy, preload]);
  
  return (
    <a
      ref={linkRef}
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </a>
  );
};

export default PerformanceProvider;
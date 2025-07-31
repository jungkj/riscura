'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  useCallback, 
  useMemo
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

export const useVirtualScrolling = (
  items: any[],
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

export const useOfflineData = () => {
  const { isOnline, cacheData, getCachedData } = usePerformance();
  
  const fetchWithCache = useCallback(
    async (key: string, fetcher: () => Promise<any>, ttl: number = 300000) => {
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
    },
    [isOnline, cacheData, getCachedData]
  );
  
  return { fetchWithCache, isOnline };
};

// Cache Implementation
class PerformanceCache {
  private cache = new Map();
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
  const componentCacheRef = useRef(new Map());
  
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
  
  const contextValue = {
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
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Simplified Components
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
  
  if (!isInView) {
    return (
      <div ref={imgRef} className={cn('bg-gray-200 animate-pulse', className)} style={{ width, height }}>
        {placeholder}
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className={cn('bg-gray-200 flex items-center justify-center', className)} style={{ width, height }}>
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || <span className="text-gray-500 text-sm">Loading...</span>}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        className={cn('transition-opacity duration-300', isLoaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  );
};

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
      className={cn('overflow-auto', className)}
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

export default PerformanceProvider; 
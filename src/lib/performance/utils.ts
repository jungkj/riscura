// Performance Utility Functions
import { performanceMonitor } from './monitoring';

// Performance measurement utilities
export const measurePerformance = {
  // Measure function execution time
  time: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    return performanceMonitor.timeFunction(name, fn);
  },

  // Mark performance points
  mark: (name: string): void => {
    performanceMonitor.mark(name);
  },

  // Measure between marks
  measure: (name: string, startMark: string, endMark?: string): number | null => {
    return performanceMonitor.measure(name, startMark, endMark);
  },

  // Get navigation timing
  getNavigationTiming: (): PerformanceNavigationTiming | null => {
    if (typeof performance === 'undefined') return null;
    const entries = performance.getEntriesByType('navigation');
    return entries[0] as PerformanceNavigationTiming;
  },

  // Get resource timing
  getResourceTiming: (url?: string): PerformanceResourceTiming[] => {
    if (typeof performance === 'undefined') return [];
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return url ? entries.filter((entry) => entry.name.includes(url)) : entries;
  },

  // Calculate page load metrics
  getPageLoadMetrics: () => {
    const navigation = measurePerformance.getNavigationTiming();
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ssl:
        navigation.secureConnectionStart > 0
          ? navigation.connectEnd - navigation.secureConnectionStart
          : 0,
      ttfb: navigation.responseStart - navigation.navigationStart,
      download: navigation.responseEnd - navigation.responseStart,
      domInteractive: navigation.domInteractive - navigation.navigationStart,
      domComplete: navigation.domComplete - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
    };
  },
};

// Memory management utilities
export const memoryUtils = {
  // Get memory usage information
  getMemoryUsage: (): any => {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  },

  // Monitor memory leaks
  detectMemoryLeaks: (threshold: number = 80): boolean => {
    const usage = memoryUtils.getMemoryUsage();
    return usage ? usage.percentage > threshold : false;
  },

  // Force garbage collection (development only)
  forceGC: (): void => {
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      (window as any).gc();
    }
  },
};

// Bundle analysis utilities
export const bundleUtils = {
  // Analyze bundle size
  analyzeBundleSize: async (): Promise<{
    total: number;
    javascript: number;
    css: number;
    images: number;
    fonts: number;
  }> => {
    const resources = measurePerformance.getResourceTiming();

    const analysis = {
      total: 0,
      javascript: 0,
      css: 0,
      images: 0,
      fonts: 0,
    };

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      analysis.total += size;

      if (resource.name.includes('.js')) {
        analysis.javascript += size;
      } else if (resource.name.includes('.css')) {
        analysis.css += size;
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) {
        analysis.images += size;
      } else if (/\.(woff|woff2|ttf|otf)/.test(resource.name)) {
        analysis.fonts += size;
      }
    });

    return analysis;
  },

  // Check if resources are compressed
  checkCompression: (): { compressed: number; uncompressed: number; ratio: number } => {
    const resources = measurePerformance.getResourceTiming();
    let compressed = 0;
    let uncompressed = 0;

    resources.forEach((resource) => {
      if (resource.transferSize < resource.decodedBodySize) {
        compressed++;
      } else {
        uncompressed++;
      }
    });

    const total = compressed + uncompressed;
    const ratio = total > 0 ? (compressed / total) * 100 : 0;

    return { compressed, uncompressed, ratio };
  },
};

// Image optimization utilities
export const imageUtils = {
  // Check if WebP is supported
  supportsWebP: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  // Check if AVIF is supported
  supportsAVIF: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => resolve(avif.height === 2);
      avif.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  },

  // Get optimal image format
  getOptimalFormat: async (): Promise<'avif' | 'webp' | 'jpeg'> => {
    const [supportsAVIF, supportsWebP] = await Promise.all([
      imageUtils.supportsAVIF(),
      imageUtils.supportsWebP(),
    ]);

    if (supportsAVIF) return 'avif';
    if (supportsWebP) return 'webp';
    return 'jpeg';
  },

  // Calculate image compression ratio
  calculateCompressionRatio: (originalSize: number, compressedSize: number): number => {
    return ((originalSize - compressedSize) / originalSize) * 100;
  },
};

// Network performance utilities
export const networkUtils = {
  // Get connection information
  getConnectionInfo: (): any => {
    if (typeof navigator === 'undefined') return null;

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  },

  // Test network speed
  testNetworkSpeed: async (): Promise<{ downloadSpeed: number; latency: number }> => {
    const startTime = performance.now();

    try {
      // Download a small test file
      const response = await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      // Estimate download speed (very rough)
      const downloadSpeed = response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!) / (latency / 1000)
        : 0;

      return { downloadSpeed, latency };
    } catch (error) {
      return { downloadSpeed: 0, latency: 0 };
    }
  },

  // Check if user prefers reduced data
  prefersReducedData: (): boolean => {
    const connection = networkUtils.getConnectionInfo();
    return connection?.saveData || false;
  },
};

// Virtualization utilities
export const virtualizationUtils = {
  // Calculate optimal virtual list settings
  calculateVirtualSettings: (totalItems: number, containerHeight: number, itemHeight: number) => {
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const overscan = Math.min(10, Math.ceil(visibleItems * 0.5));
    const bufferSize = Math.min(50, Math.ceil(totalItems * 0.1));

    return {
      visibleItems,
      overscan,
      bufferSize,
      totalHeight: totalItems * itemHeight,
    };
  },

  // Implement data sampling for large datasets
  sampleData: <T>(_data: T[], maxItems: number, strategy: 'uniform' | 'random' = 'uniform'): T[] => {
    if (data.length <= maxItems) return data;

    if (strategy === 'random') {
      const sampled: T[] = [];
      const indices = new Set<number>();

      while (indices.size < maxItems) {
        indices.add(Math.floor(Math.random() * data.length));
      }

      Array.from(indices)
        .sort((a, b) => a - b)
        .forEach((index) => {
          sampled.push(data[index]);
        });

      return sampled;
    } else {
      // Uniform sampling
      const step = Math.ceil(data.length / maxItems);
      return data.filter((_, index) => index % step === 0);
    }
  },
};

// Debouncing and throttling utilities
export const optimizationUtils = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number, immediate?: boolean): T => {
    let timeout: NodeJS.Timeout | null = null;

    return ((...args: any[]) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    }) as T;
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;

    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  // Request idle callback wrapper
  requestIdleCallback: (callback: () => void, timeout: number = 5000): void => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 1);
    }
  },

  // Batch DOM updates
  batchDOMUpdates: (updates: (() => void)[]): void => {
    optimizationUtils.requestIdleCallback(() => {
      updates.forEach((update) => update());
    });
  },
};

// Performance scoring utilities
export const scoringUtils = {
  // Calculate Lighthouse-style performance score
  calculatePerformanceScore: (metrics: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  }): number => {
    // Simplified scoring based on Lighthouse weights
    const fcpScore = scoringUtils.scoreMetric(metrics.fcp, 1800, 3000);
    const lcpScore = scoringUtils.scoreMetric(metrics.lcp, 2500, 4000);
    const fidScore = scoringUtils.scoreMetric(metrics.fid, 100, 300, true);
    const clsScore = scoringUtils.scoreMetric(metrics.cls, 0.1, 0.25, true);
    const ttfbScore = scoringUtils.scoreMetric(metrics.ttfb, 600, 1500);

    // Weighted average (simplified Lighthouse weights)
    return Math.round(
      fcpScore * 0.15 +
        lcpScore * 0.25 +
        fidScore * 0.15 +
        clsScore * 0.15 +
        ttfbScore * 0.15 +
        85 * 0.15 // Other metrics placeholder
    );
  },

  // Score individual metric
  scoreMetric: (
    value: number,
    goodThreshold: number,
    poorThreshold: number,
    lowerIsBetter: boolean = false
  ): number => {
    if (lowerIsBetter) {
      if (value <= goodThreshold) return 100;
      if (value >= poorThreshold) return 0;
      return Math.round(100 - ((value - goodThreshold) / (poorThreshold - goodThreshold)) * 100);
    } else {
      if (value >= goodThreshold) return 100;
      if (value <= poorThreshold) return 0;
      return Math.round(((value - poorThreshold) / (goodThreshold - poorThreshold)) * 100);
    }
  },

  // Get performance grade
  getPerformanceGrade: (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },
};

// Export all utilities
export default {
  measurePerformance,
  memoryUtils,
  bundleUtils,
  imageUtils,
  networkUtils,
  virtualizationUtils,
  optimizationUtils,
  scoringUtils,
};

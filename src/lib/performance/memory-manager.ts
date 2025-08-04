import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { memoryConfig } from '@/config/performance';

export interface MemoryConfig {
  maxMemoryUsage: number; // MB
  gcThreshold: number; // MB
  monitoringInterval: number; // ms
  enableMemoryProfiling: boolean;
  enableResourceTracking: boolean;
  autoCleanup: boolean;
  resourceLimits: {
    maxWebSocketConnections: number;
    maxFileUploadSize: number; // MB
    maxCacheSize: number; // MB
    maxEventListeners: number;
  };
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercent: number;
  gcCount: number;
  resourceCount: {
    eventListeners: number;
    intervals: number;
    timeouts: number;
    webSockets: number;
    fileHandles: number;
  };
}

export interface ResourceLeak {
  type: 'eventListener' | 'interval' | 'timeout' | 'webSocket' | 'memory';
  source: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CleanupFunction {
  (): void;
}

export interface ResourceHandle {
  id: string;
  type: string;
  source: string;
  cleanup: CleanupFunction;
  createdAt: Date;
}

// Default memory configuration
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMemoryUsage: memoryConfig.maxUsageMb,
  gcThreshold: memoryConfig.gcThresholdMb,
  monitoringInterval: memoryConfig.monitoringIntervalMs,
  enableMemoryProfiling: process.env.NODE_ENV === 'development',
  enableResourceTracking: memoryConfig.enabled,
  autoCleanup: memoryConfig.autoCleanup,
  resourceLimits: {
    maxWebSocketConnections: 100,
    maxFileUploadSize: 100, // 100MB
    maxCacheSize: 200, // 200MB
    maxEventListeners: 1000,
  },
};

export class MemoryManager {
  private config: MemoryConfig;
  private metrics: MemoryMetrics = {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryUsagePercent: 0,
    gcCount: 0,
    resourceCount: {
      eventListeners: 0,
      intervals: 0,
      timeouts: 0,
      webSockets: 0,
      fileHandles: 0,
    },
  };
  private resourceHandles: Map<string, ResourceHandle> = new Map();
  private memoryLeaks: ResourceLeak[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private weakRefs: any[] = [];
  private finalizationRegistry: any;

  constructor(_config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };

    // Initialize finalization registry for cleanup if available
    if (typeof FinalizationRegistry !== 'undefined') {
      this.finalizationRegistry = new FinalizationRegistry((id: string) => {
        this.handleResourceFinalization(id);
      });
    }

    this.initializeMonitoring();
  }

  /**
   * Initialize memory monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring if enabled
    if (this.config.enableMemoryProfiling) {
      this.startMemoryMonitoring();
    }

    // Set up global error handlers for resource leaks
    this.setupLeakDetection();

    // Set up automatic cleanup
    if (this.config.autoCleanup) {
      this.setupAutoCleanup();
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    this.monitoringInterval = setInterval(() => {
      this.updateMemoryMetrics();
      this.detectMemoryLeaks();

      // Trigger GC if memory usage is high
      if (this.metrics.memoryUsagePercent > 80) {
        this.requestGarbageCollection();
      }
    }, this.config.monitoringInterval);

    // Register cleanup for the monitoring interval
    this.registerResource('monitoring-interval', 'interval', 'MemoryManager', () => {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
    });
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    if (typeof window === 'undefined') return;

    // Use performance.memory if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.usedJSHeapSize = memory.usedJSHeapSize;
      this.metrics.totalJSHeapSize = memory.totalJSHeapSize;
      this.metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      this.metrics.memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }

    // Update resource counts
    this.updateResourceCounts();
  }

  /**
   * Update resource counts
   */
  private updateResourceCounts(): void {
    this.metrics.resourceCount = {
      eventListeners: this.countResourcesByType('eventListener'),
      intervals: this.countResourcesByType('interval'),
      timeouts: this.countResourcesByType('timeout'),
      webSockets: this.countResourcesByType('webSocket'),
      fileHandles: this.countResourcesByType('fileHandle'),
    };
  }

  /**
   * Count resources by type
   */
  private countResourcesByType(_type: string): number {
    let count = 0;
    for (const handle of this.resourceHandles.values()) {
      if (handle.type === type) count++;
    }
    return count;
  }

  /**
   * Set up leak detection
   */
  private setupLeakDetection(): void {
    if (typeof window === 'undefined') return;

    // Override addEventListener to track event listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      const _result = originalAddEventListener.call(this, type, listener, options);

      // Track this event listener
      const id = `listener-${Date.now()}-${Math.random()}`;
      memoryManager.registerResource(id, 'eventListener', 'EventTarget', () => {
        this.removeEventListener(type, listener as EventListener, options);
      });

      return result;
    };

    // Override setTimeout and setInterval
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalClearTimeout = window.clearTimeout;
    const originalClearInterval = window.clearInterval;

    window.setTimeout = function (callback: any, delay?: any, ...args: any[]): number {
      const timeoutId = originalSetTimeout.call(this, callback, delay, ...args);
      const id = `timeout-${timeoutId}`;

      memoryManager.registerResource(id, 'timeout', 'window', () => {
        originalClearTimeout(timeoutId);
      });

      return timeoutId as number;
    } as any;

    window.setInterval = function (callback: any, delay?: any, ...args: any[]): number {
      const intervalId = originalSetInterval.call(this, callback, delay, ...args);
      const id = `interval-${intervalId}`;

      memoryManager.registerResource(id, 'interval', 'window', () => {
        originalClearInterval(intervalId);
      });

      return intervalId as number;
    } as any;
  }

  /**
   * Set up automatic cleanup
   */
  private setupAutoCleanup(): void {
    if (typeof window === 'undefined') return;

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Clean up on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performPartialCleanup();
      }
    });

    // Periodic cleanup
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 300000); // Every 5 minutes
  }

  /**
   * Register a resource for tracking
   */
  registerResource(id: string, type: string, source: string, cleanup: CleanupFunction): void {
    const handle: ResourceHandle = {
      id,
      type,
      source,
      cleanup,
      createdAt: new Date(),
    };

    this.resourceHandles.set(id, handle);

    // Check resource limits
    this.checkResourceLimits(type);
  }

  /**
   * Unregister a resource
   */
  unregisterResource(id: string): void {
    const handle = this.resourceHandles.get(id);
    if (handle) {
      try {
        handle.cleanup();
      } catch (error) {
        // console.error(`Error cleaning up resource ${id}:`, error)
      }
      this.resourceHandles.delete(id);
    }
  }

  /**
   * Check resource limits
   */
  private checkResourceLimits(_type: string): void {
    const count = this.countResourcesByType(type);
    const limits = this.config.resourceLimits;

    let limit = 0;
    switch (type) {
      case 'eventListener':
        limit = limits.maxEventListeners;
        break;
      case 'webSocket':
        limit = limits.maxWebSocketConnections;
        break;
    }

    if (limit > 0 && count > limit) {
      this.reportResourceLeak({
        type: type as any,
        source: 'ResourceLimitCheck',
        timestamp: new Date(),
        details: { count, limit },
        severity: 'high',
      });

      // Auto-cleanup oldest resources if enabled
      if (this.config.autoCleanup) {
        this.cleanupOldestResources(type, count - limit);
      }
    }
  }

  /**
   * Cleanup oldest resources of a specific type
   */
  private cleanupOldestResources(_type: string, count: number): void {
    const resources = Array.from(this.resourceHandles.values())
      .filter((handle) => handle.type === type)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, count);

    resources.forEach((handle) => {
      this.unregisterResource(handle.id);
    });
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeaks(): void {
    // Check for memory growth patterns
    if (this.metrics.memoryUsagePercent > 90) {
      this.reportResourceLeak({
        type: 'memory',
        source: 'MemoryMonitor',
        timestamp: new Date(),
        details: {
          usagePercent: this.metrics.memoryUsagePercent,
          usedMemory: this.metrics.usedJSHeapSize,
        },
        severity: 'critical',
      });
    }

    // Check for resource leaks
    this.detectResourceLeaks();
  }

  /**
   * Detect resource leaks
   */
  private detectResourceLeaks(): void {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);

    // Check for old resources that might be leaks
    for (const handle of this.resourceHandles.values()) {
      if (handle.createdAt < fiveMinutesAgo) {
        this.reportResourceLeak({
          type: handle.type as any,
          source: handle.source,
          timestamp: now,
          details: {
            id: handle.id,
            age: now.getTime() - handle.createdAt.getTime(),
          },
          severity: 'medium',
        });
      }
    }
  }

  /**
   * Report resource leak
   */
  private reportResourceLeak(leak: ResourceLeak): void {
    this.memoryLeaks.push(leak);

    // Keep only recent leaks
    if (this.memoryLeaks.length > 100) {
      this.memoryLeaks = this.memoryLeaks.slice(-50);
    }

    // Log critical leaks
    if (leak.severity === 'critical') {
      // console.error('Critical resource leak detected:', leak)
    } else if (this.config.enableMemoryProfiling) {
      // console.warn('Resource leak detected:', leak)
    }
  }

  /**
   * Handle resource finalization
   */
  private handleResourceFinalization(id: string): void {
    this.unregisterResource(id);
  }

  /**
   * Request garbage collection
   */
  private requestGarbageCollection(): void {
    // Try to trigger GC if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        this.metrics.gcCount++;
      } catch (error) {
        // console.warn('Unable to trigger garbage collection:', error)
      }
    }

    // Clean up weak references
    this.cleanupWeakRefs();
  }

  /**
   * Clean up weak references
   */
  private cleanupWeakRefs(): void {
    this.weakRefs = this.weakRefs.filter((ref) => ref.deref() !== undefined);
  }

  /**
   * Add weak reference for tracking
   */
  addWeakRef<T extends object>(obj: T): any {
    if (typeof WeakRef !== 'undefined') {
      const ref = new WeakRef(obj);
      this.weakRefs.push(ref);
      return ref;
    }
    return obj; // Fallback for older environments
  }

  /**
   * Perform partial cleanup
   */
  private performPartialCleanup(): void {
    // Clean up caches
    this.clearOldCacheEntries();

    // Clean up event listeners from hidden elements
    this.cleanupHiddenElementListeners();

    // Request garbage collection
    this.requestGarbageCollection();
  }

  /**
   * Perform periodic cleanup
   */
  private performPeriodicCleanup(): void {
    // Clean up old resources
    const _oneHourAgo = new Date(Date.now() - 3600000);

    for (const [id, handle] of this.resourceHandles.entries()) {
      if (handle.createdAt < oneHourAgo) {
        this.unregisterResource(id);
      }
    }

    // Clear old memory leaks
    this.memoryLeaks = this.memoryLeaks.filter(
      (leak) => leak.timestamp.getTime() > oneHourAgo.getTime()
    );
  }

  /**
   * Clear old cache entries
   */
  private clearOldCacheEntries(): void {
    // Implementation would depend on specific cache implementation
    // This is a placeholder for cache cleanup logic
  }

  /**
   * Clean up event listeners from hidden elements
   */
  private cleanupHiddenElementListeners(): void {
    const hiddenElements = document.querySelectorAll('[style*="display: none"], .hidden');

    hiddenElements.forEach((element) => {
      // Remove resources associated with hidden elements
      for (const [id, handle] of this.resourceHandles.entries()) {
        if (handle.source.includes(element.tagName)) {
          this.unregisterResource(id);
        }
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get resource leaks
   */
  getResourceLeaks(): ResourceLeak[] {
    return [...this.memoryLeaks];
  }

  /**
   * Get resource handles
   */
  getResourceHandles(): ResourceHandle[] {
    return Array.from(this.resourceHandles.values());
  }

  /**
   * Force cleanup of all resources
   */
  cleanup(): void {
    // Clean up all registered resources
    for (const [id, handle] of this.resourceHandles.entries()) {
      try {
        handle.cleanup();
      } catch (error) {
        // console.error(`Error cleaning up resource ${id}:`, error)
      }
    }
    this.resourceHandles.clear();

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Clear metrics
    this.metrics = {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUsagePercent: 0,
      gcCount: 0,
      resourceCount: {
        eventListeners: 0,
        intervals: 0,
        timeouts: 0,
        webSockets: 0,
        fileHandles: 0,
      },
    };

    // Clear leaks
    this.memoryLeaks = [];
  }
}

// React hooks for memory management

/**
 * Hook for automatic resource cleanup
 */
export const useMemoryCleanup = (
  resourceId: string,
  type: string,
  cleanup: CleanupFunction
): void => {
  useEffect(() => {
    memoryManager.registerResource(resourceId, type, 'React Hook', cleanup);

    return () => {
      memoryManager.unregisterResource(resourceId);
    };
  }, [resourceId, type, cleanup]);
};

/**
 * Hook for tracking component memory usage
 */
export const useMemoryTracking = (componentName: string) => {
  const renderCount = useRef(0);
  const createdAt = useRef(new Date());

  useEffect(() => {
    renderCount.current++;

    // Register component for tracking
    const id = `component-${componentName}-${Date.now()}`;
    memoryManager.registerResource(id, 'component', componentName, () => {
      // Component cleanup logic
    });

    return () => {
      memoryManager.unregisterResource(id);
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    age: Date.now() - createdAt.current.getTime(),
  };
};

/**
 * Hook for managing intervals with automatic cleanup
 */
export const useManagedInterval = (
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = []
): void => {
  const savedCallback = useRef(callback);
  const intervalId = useRef<NodeJS.Timeout>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      intervalId.current = id;

      const resourceId = `managed-interval-${Date.now()}`;
      memoryManager.registerResource(resourceId, 'interval', 'useManagedInterval', () => {
        clearInterval(id);
      });

      return () => {
        clearInterval(id);
        memoryManager.unregisterResource(resourceId);
      };
    }
  }, [delay, ...deps]);
};

/**
 * Hook for managing event listeners with automatic cleanup
 */
export const useManagedEventListener = <T extends Event>(
  element: EventTarget | null,
  eventType: string,
  handler: (event: T) => void,
  options?: AddEventListenerOptions
): void => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventHandler = (event: Event) => handlerRef.current(event as T);
    element.addEventListener(eventType, eventHandler, options);

    const resourceId = `managed-listener-${eventType}-${Date.now()}`;
    memoryManager.registerResource(resourceId, 'eventListener', 'useManagedEventListener', () => {
      element.removeEventListener(eventType, eventHandler, options);
    });

    return () => {
      element.removeEventListener(eventType, eventHandler, options);
      memoryManager.unregisterResource(resourceId);
    };
  }, [element, eventType, options]);
};

/**
 * Hook for optimized memoization with memory tracking
 */
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const memoValue = useMemo(() => {
    const value = factory();

    // Track large objects
    if (debugName && typeof value === 'object' && value !== null) {
      const resourceId = `memo-${debugName}-${Date.now()}`;
      memoryManager.registerResource(resourceId, 'memoization', debugName, () => {
        // Cleanup logic for memoized value if needed
      });
    }

    return value;
  }, deps);

  return memoValue;
};

/**
 * Hook for memory metrics monitoring
 */
export const useMemoryMetrics = (): {
  metrics: MemoryMetrics;
  leaks: ResourceLeak[];
  isMemoryHigh: boolean;
} => {
  const [metrics, setMetrics] = useState<MemoryMetrics>(memoryManager.getMetrics());
  const [leaks, setLeaks] = useState<ResourceLeak[]>(memoryManager.getResourceLeaks());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(memoryManager.getMetrics());
      setLeaks(memoryManager.getResourceLeaks());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    leaks,
    isMemoryHigh: metrics.memoryUsagePercent > 80,
  };
};

// Global memory manager instance
export const memoryManager = new MemoryManager();

// Initialize memory manager
if (typeof window !== 'undefined') {
  (window as any).__RISCURA_MEMORY_MANAGER__ = memoryManager;
}

export default MemoryManager;

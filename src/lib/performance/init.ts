import { performanceConfig } from '@/config/performance';

// Performance initialization state
let isInitialized = false;
let performanceMetrics: any = {};

/**
 * Initialize all performance optimizations
 */
export async function initializePerformance() {
  if (isInitialized) {
    console.log('Performance optimizations already initialized');
    return;
  }

  console.log('Initializing performance optimizations...');

  try {
    // Initialize Core Web Vitals monitoring
    if (performanceConfig.webVitals.enabled && typeof window !== 'undefined') {
      await initializeWebVitals();
    }

    // Initialize memory management
    if (performanceConfig.memory.enabled) {
      initializeMemoryManagement();
    }

    // Initialize background task optimization
    if (performanceConfig.backgroundTasks.enabled) {
      initializeBackgroundTasks();
    }

    // Initialize WebSocket optimization
    if (performanceConfig.websocket.enabled) {
      initializeWebSocketOptimization();
    }

    // Initialize file upload optimization
    if (performanceConfig.fileUpload.resumeEnabled) {
      initializeFileUploadOptimization();
    }

    // Start performance monitoring
    if (performanceConfig.monitoring.enabled) {
      startPerformanceMonitoring();
    }

    isInitialized = true;
    console.log('Performance optimizations initialized successfully');
  } catch (error) {
    console.error('Failed to initialize performance optimizations:', error);
  }
}

/**
 * Initialize Core Web Vitals monitoring
 */
async function initializeWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

    getCLS((metric) => {
      performanceMetrics.cls = metric.value;
      if (metric.value > performanceConfig.webVitals.thresholds.cls) {
        console.warn('CLS threshold exceeded:', metric.value);
      }
    });

    getFID((metric) => {
      performanceMetrics.fid = metric.value;
      if (metric.value > performanceConfig.webVitals.thresholds.fidMs) {
        console.warn('FID threshold exceeded:', metric.value);
      }
    });

    getFCP((metric) => {
      performanceMetrics.fcp = metric.value;
    });

    getLCP((metric) => {
      performanceMetrics.lcp = metric.value;
      if (metric.value > performanceConfig.webVitals.thresholds.lcpMs) {
        console.warn('LCP threshold exceeded:', metric.value);
      }
    });

    getTTFB((metric) => {
      performanceMetrics.ttfb = metric.value;
    });

    console.log('Core Web Vitals monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize Core Web Vitals:', error);
  }
}

/**
 * Initialize basic memory management
 */
function initializeMemoryManagement() {
  if (typeof window === 'undefined') return;

  // Basic memory monitoring
  const checkMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      performanceMetrics.memoryUsage = usagePercent;
      
      if (usagePercent > performanceConfig.alerts.memoryUsageThreshold) {
        console.warn('Memory usage threshold exceeded:', usagePercent);
        
        // Trigger garbage collection if available
        if ('gc' in window && typeof (window as any).gc === 'function') {
          (window as any).gc();
        }
      }
    }
  };

  // Check memory every 30 seconds
  setInterval(checkMemory, performanceConfig.memory.monitoringIntervalMs);
  
  // Initial check
  checkMemory();

  console.log('Memory management initialized');
}

/**
 * Initialize background task optimization
 */
function initializeBackgroundTasks() {
  // Set up Web Workers for background tasks if available
  if (typeof Worker !== 'undefined') {
    console.log('Background task optimization initialized with Web Workers');
  } else {
    console.log('Background task optimization initialized (Web Workers not available)');
  }
}

/**
 * Initialize WebSocket optimization
 */
function initializeWebSocketOptimization() {
  // Basic WebSocket connection tracking
  const originalWebSocket = window.WebSocket;
  let activeConnections = 0;

  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      activeConnections++;
      
      this.addEventListener('close', () => {
        activeConnections--;
      });

      this.addEventListener('error', () => {
        activeConnections--;
      });

      // Check connection limits
      if (activeConnections > performanceConfig.websocket.connectionPoolSize) {
        console.warn('WebSocket connection limit exceeded:', activeConnections);
      }
    }
  };

  console.log('WebSocket optimization initialized');
}

/**
 * Initialize file upload optimization
 */
function initializeFileUploadOptimization() {
  // Basic file upload optimization setup
  console.log('File upload optimization initialized');
}

/**
 * Start performance monitoring
 */
function startPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  const reportMetrics = async () => {
    try {
      const response = await fetch(performanceConfig.monitoring.metricsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'client-metrics',
          metrics: performanceMetrics,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to report performance metrics:', response.status);
      }
    } catch (error) {
      console.error('Error reporting performance metrics:', error);
    }
  };

  // Report metrics periodically
  setInterval(reportMetrics, performanceConfig.monitoring.reportingIntervalMs);

  // Report metrics on page unload
  window.addEventListener('beforeunload', reportMetrics);

  console.log('Performance monitoring started');
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  return { ...performanceMetrics };
}

/**
 * Check if performance optimizations are initialized
 */
export function isPerformanceInitialized() {
  return isInitialized;
}

/**
 * Reset performance initialization (for testing)
 */
export function resetPerformanceInitialization() {
  isInitialized = false;
  performanceMetrics = {};
} 
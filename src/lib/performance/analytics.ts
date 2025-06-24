// Performance Analytics System for Production Monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  navigationType?: string;
  effectiveConnectionType?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export interface UserInteractionMetric {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error';
  element?: string;
  value?: number;
  timestamp: number;
  duration?: number;
  path: string;
  userAgent: string;
  sessionId: string;
}

export interface ResourceMetric {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
  nextHopProtocol: string;
}

export interface PerformanceReport {
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  deviceInfo: {
    memory?: number;
    cores?: number;
    platform: string;
    language: string;
  };
  webVitals: PerformanceMetric[];
  interactions: UserInteractionMetric[];
  resources: ResourceMetric[];
  customMetrics: Record<string, number>;
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    url: string;
    line?: number;
    column?: number;
  }>;
}

export interface AnalyticsConfig {
  enableWebVitals: boolean;
  enableUserInteractions: boolean;
  enableResourceTiming: boolean;
  enableErrorTracking: boolean;
  enableCustomMetrics: boolean;
  sampleRate: number;
  reportingEndpoint?: string;
  reportingInterval: number;
  maxReports: number;
  enableDebugMode: boolean;
  enableRealUserMonitoring: boolean;
}

class PerformanceAnalytics {
  private config: AnalyticsConfig;
  private sessionId: string;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteractionMetric[] = [];
  private resources: ResourceMetric[] = [];
  private customMetrics: Record<string, number> = {};
  private errors: PerformanceReport['errors'] = [];
  private reportQueue: PerformanceReport[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTime: number;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enableWebVitals: true,
      enableUserInteractions: true,
      enableResourceTiming: true,
      enableErrorTracking: true,
      enableCustomMetrics: true,
      sampleRate: 1.0,
      reportingInterval: 30000, // 30 seconds
      maxReports: 100,
      enableDebugMode: false,
      enableRealUserMonitoring: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();

    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    // Initialize Web Vitals tracking
    if (this.config.enableWebVitals) {
      this.setupWebVitals();
    }

    // Initialize user interaction tracking
    if (this.config.enableUserInteractions) {
      this.setupUserInteractionTracking();
    }

    // Initialize resource timing tracking
    if (this.config.enableResourceTiming) {
      this.setupResourceTimingTracking();
    }

    // Initialize error tracking
    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Initialize reporting
    this.setupReporting();

    // Initialize navigation tracking
    this.setupNavigationTracking();

    // Initialize custom performance observers
    this.setupPerformanceObservers();
  }

  private setupWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      if (Math.random() > this.config.sampleRate) return;

      const performanceMetric: PerformanceMetric = {
        name: metric.name,
        value: metric.value,
        rating: this.getRating(metric.name, metric.value),
        timestamp: Date.now(),
        id: metric.id,
        navigationType: this.getNavigationType(),
        effectiveConnectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency,
      };

      this.metrics.push(performanceMetric);

      if (this.config.enableDebugMode) {
        console.log('Web Vital recorded:', performanceMetric);
      }
    };

    // Track Core Web Vitals
    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }

  private setupUserInteractionTracking(): void {
    const trackInteraction = (type: UserInteractionMetric['type'], event: Event) => {
      if (Math.random() > this.config.sampleRate) return;

      const target = event.target as HTMLElement;
      const interaction: UserInteractionMetric = {
        type,
        element: this.getElementSelector(target),
        timestamp: Date.now(),
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
      };

      // Add specific data based on interaction type
      if (type === 'scroll') {
        interaction.value = window.scrollY;
      } else if (type === 'click') {
        interaction.duration = performance.now() - this.startTime;
      }

      this.interactions.push(interaction);

      if (this.config.enableDebugMode) {
        console.log('User interaction recorded:', interaction);
      }
    };

    // Track clicks
    document.addEventListener('click', (event) => {
      trackInteraction('click', event);
    }, { passive: true });

    // Track scrolling (throttled)
    let scrollTimeout: number;
    document.addEventListener('scroll', (event) => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        trackInteraction('scroll', event);
      }, 100);
    }, { passive: true });

    // Track input interactions
    document.addEventListener('input', (event) => {
      trackInteraction('input', event);
    }, { passive: true });
  }

  private setupResourceTimingTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          const resource: ResourceMetric = {
            name: resourceEntry.name,
            type: this.getResourceType(resourceEntry.name),
            size: resourceEntry.transferSize || 0,
            duration: resourceEntry.duration,
            startTime: resourceEntry.startTime,
            transferSize: resourceEntry.transferSize || 0,
            encodedBodySize: resourceEntry.encodedBodySize || 0,
            decodedBodySize: resourceEntry.decodedBodySize || 0,
            initiatorType: resourceEntry.initiatorType,
            nextHopProtocol: resourceEntry.nextHopProtocol || '',
          };

          this.resources.push(resource);

          if (this.config.enableDebugMode) {
            console.log('Resource timing recorded:', resource);
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource timing observation failed:', error);
    }
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      const error = {
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno,
      };

      this.errors.push(error);

      if (this.config.enableDebugMode) {
        console.log('Error recorded:', error);
      }
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      };

      this.errors.push(error);

      if (this.config.enableDebugMode) {
        console.log('Promise rejection recorded:', error);
      }
    });
  }

  private setupReporting(): void {
    // Send reports at regular intervals
    setInterval(() => {
      this.sendReport();
    }, this.config.reportingInterval);

    // Send report before page unload
    window.addEventListener('beforeunload', () => {
      this.sendReport(true);
    });

    // Send report when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendReport(true);
      }
    });
  }

  private setupNavigationTracking(): void {
    // Track navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordCustomMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.recordCustomMetric('load_event', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordCustomMetric('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
        this.recordCustomMetric('tcp_connect', navigation.connectEnd - navigation.connectStart);
        this.recordCustomMetric('server_response', navigation.responseEnd - navigation.requestStart);
      }
    });
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Long Task Observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordCustomMetric('long_task', entry.duration);
          
          if (this.config.enableDebugMode) {
            console.log('Long task detected:', entry.duration);
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn('Long task observation not supported');
    }

    // Layout Shift Observer
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.recordCustomMetric('layout_shift', (entry as any).value);
          }
        }
      });

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', layoutShiftObserver);
    } catch (error) {
      console.warn('Layout shift observation not supported');
    }
  }

  // Public methods
  public recordCustomMetric(name: string, value: number): void {
    if (!this.config.enableCustomMetrics) return;

    this.customMetrics[name] = value;

    if (this.config.enableDebugMode) {
      console.log('Custom metric recorded:', { name, value });
    }
  }

  public startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordCustomMetric(name, duration);
    };
  }

  public trackPageView(path?: string): void {
    const interaction: UserInteractionMetric = {
      type: 'navigation',
      timestamp: Date.now(),
      path: path || window.location.pathname,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
    };

    this.interactions.push(interaction);
  }

  public getMetrics(): PerformanceReport {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceInfo: {
        memory: this.getDeviceMemory(),
        cores: navigator.hardwareConcurrency,
        platform: navigator.platform,
        language: navigator.language,
      },
      webVitals: [...this.metrics],
      interactions: [...this.interactions],
      resources: [...this.resources],
      customMetrics: { ...this.customMetrics },
      errors: [...this.errors],
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.interactions = [];
    this.resources = [];
    this.customMetrics = {};
    this.errors = [];
  }

  public sendReport(immediate = false): void {
    const report = this.getMetrics();
    
    if (report.webVitals.length === 0 && report.interactions.length === 0) {
      return; // No data to report
    }

    this.reportQueue.push(report);

    // Limit queue size
    if (this.reportQueue.length > this.config.maxReports) {
      this.reportQueue.shift();
    }

    if (this.config.reportingEndpoint) {
      this.sendToEndpoint(immediate);
    }

    // Clear metrics after reporting
    this.clearMetrics();
  }

  private async sendToEndpoint(immediate = false): Promise<void> {
    if (this.reportQueue.length === 0) return;

    const reports = [...this.reportQueue];
    this.reportQueue = [];

    try {
      const payload = {
        reports,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };

      if (immediate && 'sendBeacon' in navigator) {
        // Use sendBeacon for immediate sending (e.g., page unload)
        navigator.sendBeacon(
          this.config.reportingEndpoint!,
          JSON.stringify(payload)
        );
      } else {
        // Use fetch for regular reporting
        await fetch(this.config.reportingEndpoint!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (this.config.enableDebugMode) {
        console.log('Performance report sent:', payload);
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
      // Re-add reports to queue for retry
      this.reportQueue.unshift(...reports);
    }
  }

  // Private utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
    };

    const [good, poor] = thresholds[metricName] || [0, Infinity];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationType(): string {
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation?.type || 'unknown';
    }
    return 'unknown';
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      js: 'script',
      css: 'stylesheet',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',
      woff: 'font',
      woff2: 'font',
      ttf: 'font',
      eot: 'font',
    };

    return typeMap[extension || ''] || 'other';
  }

  public disconnect(): void {
    // Disconnect all performance observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Send final report
    this.sendReport(true);
  }
}

// Create singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

// Export class for custom instances
export { PerformanceAnalytics };

// Utility functions
export const trackCustomEvent = (name: string, value?: number): void => {
  performanceAnalytics.recordCustomMetric(name, value || 1);
};

export const timeFunction = <T extends (...args: any[]) => any>(
  name: string,
  fn: T
): T => {
  return ((...args: any[]) => {
    const endTiming = performanceAnalytics.startTiming(name);
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => endTiming());
    } else {
      endTiming();
      return result;
    }
  }) as T;
};

export const withPerformanceTracking = <T extends React.ComponentType<any>>(
  Component: T,
  name?: string
): T => {
  const componentName = name || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    React.useEffect(() => {
      const endTiming = performanceAnalytics.startTiming(`render_${componentName}`);
      return endTiming;
    });

    return React.createElement(Component, { ...props, ref });
  });
  
  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  
  return WrappedComponent as unknown as T;
}; 
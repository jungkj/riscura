/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals, custom metrics, and application performance
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Custom business metrics
interface BusinessMetrics {
  userRegistrationTime: number;
  rcsaCreationTime: number;
  documentProcessingTime: number;
  reportGenerationTime: number;
  apiResponseTime: number;
  databaseQueryTime: number;
}

// Performance data storage
interface PerformanceData {
  webVitals: Record<string, Metric>;
  businessMetrics: Partial<BusinessMetrics>;
  pageLoadTimes: Record<string, number>;
  apiMetrics: Record<string, { responseTime: number; errorRate: number }>;
}

class PerformanceMonitor {
  private performanceData: PerformanceData = {
    webVitals: {},
    businessMetrics: {},
    pageLoadTimes: {},
    apiMetrics: {},
  };

  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializeCustomMetrics();
      this.initializeResourceMonitoring();
    }
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initializeWebVitals(): void {
    const sendToAnalytics = (metric: Metric) => {
      this.performanceData.webVitals[metric.name] = metric;

      // Send to Sentry
      Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${metric.name}: ${metric.value}`,
        level: 'info',
        data: {
          name: metric.name,
          value: metric.value,
          rating: this.getMetricRating(metric),
          delta: metric.delta,
          id: metric.id,
        },
      });

      // Send to external analytics
      this.sendToExternalAnalytics('web_vital', {
        metric_name: metric.name,
        value: metric.value,
        rating: this.getMetricRating(metric),
        page: window.location.pathname,
        timestamp: Date.now(),
      });

      // Alert on poor performance
      if (this.getMetricRating(metric) === 'poor') {
        this.alertPoorPerformance(metric);
      }
    };

    // Track all Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }

  /**
   * Initialize custom business metrics tracking
   */
  private initializeCustomMetrics(): void {
    // Track page load times
    const navigationObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;

          this.performanceData.pageLoadTimes[window.location.pathname] = pageLoadTime;

          this.sendToExternalAnalytics('page_load', {
            page: window.location.pathname,
            load_time: pageLoadTime,
            dom_ready: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
            first_byte: navEntry.responseStart - navEntry.navigationStart,
          });
        }
      });
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);

    // Track resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resourceEntry.duration > 1000) {
            // 1 second
            Sentry.addBreadcrumb({
              category: 'slow-resource',
              message: `Slow resource: ${resourceEntry.name}`,
              level: 'warning',
              data: {
                url: resourceEntry.name,
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize,
              },
            });
          }
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  /**
   * Initialize resource monitoring (memory, network, etc.)
   */
  private initializeResourceMonitoring(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;

        this.sendToExternalAnalytics('memory_usage', {
          used_heap: memory.usedJSHeapSize,
          total_heap: memory.totalJSHeapSize,
          heap_limit: memory.jsHeapSizeLimit,
          usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        });

        // Alert on high memory usage
        const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (memoryUsagePercentage > 80) {
          Sentry.captureMessage('High memory usage detected', {
            level: 'warning',
            extra: {
              memoryUsage: memoryUsagePercentage,
              usedHeap: memory.usedJSHeapSize,
              totalHeap: memory.totalJSHeapSize,
            },
          });
        }
      }, 30000); // Every 30 seconds
    }

    // Monitor network connectivity
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      this.sendToExternalAnalytics('network_info', {
        effective_type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        save_data: connection.saveData,
      });
    }
  }

  /**
   * Track custom business metrics
   */
  trackBusinessMetric(
    name: keyof BusinessMetrics,
    value: number,
    context?: Record<string, any>
  ): void {
    this.performanceData.businessMetrics[name] = value;

    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'business-metric',
      message: `${name}: ${value}ms`,
      level: 'info',
      data: {
        metric: name,
        value,
        context,
      },
    });

    // Send to external analytics
    this.sendToExternalAnalytics('business_metric', {
      metric_name: name,
      value,
      context,
      timestamp: Date.now(),
    });

    // Alert on poor business metrics
    this.checkBusinessMetricThresholds(name, value);
  }

  /**
   * Track API performance
   */
  trackApiCall(endpoint: string, method: string, responseTime: number, status: number): void {
    const key = `${method} ${endpoint}`;

    if (!this.performanceData.apiMetrics[key]) {
      this.performanceData.apiMetrics[key] = { responseTime: 0, errorRate: 0 };
    }

    // Update response time (rolling average)
    this.performanceData.apiMetrics[key].responseTime =
      (this.performanceData.apiMetrics[key].responseTime + responseTime) / 2;

    // Update error rate
    const isError = status >= 400;
    this.performanceData.apiMetrics[key].errorRate =
      (this.performanceData.apiMetrics[key].errorRate + (isError ? 1 : 0)) / 2;

    // Send to external analytics
    this.sendToExternalAnalytics('api_call', {
      endpoint,
      method,
      response_time: responseTime,
      status,
      is_error: isError,
      timestamp: Date.now(),
    });

    // Alert on slow APIs
    if (responseTime > 2000) {
      // 2 seconds
      Sentry.captureMessage('Slow API call detected', {
        level: 'warning',
        tags: {
          endpoint,
          method,
        },
        extra: {
          responseTime,
          status,
        },
      });
    }

    // Alert on high error rates
    if (isError && status >= 500) {
      Sentry.captureMessage('Server error in API call', {
        level: 'error',
        tags: {
          endpoint,
          method,
        },
        extra: {
          responseTime,
          status,
        },
      });
    }
  }

  /**
   * Get metric rating (good, needs-improvement, poor)
   */
  private getMetricRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    if (metric.value <= thresholds.good) return 'good';
    if (metric.value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Alert on poor performance
   */
  private alertPoorPerformance(metric: Metric): void {
    Sentry.captureMessage(`Poor ${metric.name} performance`, {
      level: 'warning',
      tags: {
        metric_name: metric.name,
        rating: 'poor',
      },
      extra: {
        value: metric.value,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      },
    });
  }

  /**
   * Check business metric thresholds
   */
  private checkBusinessMetricThresholds(name: keyof BusinessMetrics, value: number): void {
    const thresholds = {
      userRegistrationTime: 5000, // 5 seconds
      rcsaCreationTime: 3000, // 3 seconds
      documentProcessingTime: 30000, // 30 seconds
      reportGenerationTime: 15000, // 15 seconds
      apiResponseTime: 1000, // 1 second
      databaseQueryTime: 500, // 500ms
    };

    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      Sentry.captureMessage(`Slow ${name} detected`, {
        level: 'warning',
        tags: {
          business_metric: name,
        },
        extra: {
          value,
          threshold,
          page: typeof window !== 'undefined' ? window.location.pathname : 'server',
        },
      });
    }
  }

  /**
   * Send data to external analytics services
   */
  private sendToExternalAnalytics(event: string, data: Record<string, any>): void {
    // Send to Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, data);
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, data);
    }

    // Send to custom analytics endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: Date.now(),
          session_id: this.getSessionId(),
        }),
      }).catch(() => {
        // Silently fail - don't break the app for analytics
      });
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get current performance snapshot
   */
  getPerformanceSnapshot(): PerformanceData {
    return { ...this.performanceData };
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// Convenience functions
export const trackBusinessMetric = (
  name: keyof BusinessMetrics,
  value: number,
  context?: Record<string, any>
) => {
  getPerformanceMonitor().trackBusinessMetric(name, value, context);
};

export const trackApiCall = (
  endpoint: string,
  method: string,
  responseTime: number,
  status: number
) => {
  getPerformanceMonitor().trackApiCall(endpoint, method, responseTime, status);
};

export const getPerformanceData = () => {
  return getPerformanceMonitor().getPerformanceSnapshot();
};

export { PERFORMANCE_THRESHOLDS, type BusinessMetrics, type PerformanceData };

// TODO: Replace with real web-vitals metrics
export function getCLS() {
  return 0;
}
export function getFID() {
  return 0;
}
export function getFCP() {
  return 0;
}
export function getLCP() {
  return 0;
}
export function getTTFB() {
  return 0;
}

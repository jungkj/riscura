import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift

  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  tti: number | null; // Time to Interactive
  fmp: number | null; // First Meaningful Paint
  si: number | null; // Speed Index

  // Performance scores
  performanceScore: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

export interface PerformanceOptimization {
  type: 'image' | 'font' | 'javascript' | 'css' | 'network' | 'layout';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
}

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  connectionType: string;
  effectiveType: string;
  deviceMemory: number;
  hardwareConcurrency: number;
  viewport: { width: number; height: number };
}

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 }, // milliseconds
  fid: { good: 100, needsImprovement: 300 }, // milliseconds
  cls: { good: 0.1, needsImprovement: 0.25 }, // score
  fcp: { good: 1800, needsImprovement: 3000 }, // milliseconds
  ttfb: { good: 800, needsImprovement: 1800 }, // milliseconds
};

export class CoreWebVitalsMonitor {
  private metrics: Partial<WebVitalsMetrics> = {};
  private listeners: ((metrics: WebVitalsMetrics) => void)[] = [];
  private deviceCapabilities: DeviceCapabilities | null = null;

  constructor() {
    this.initializeMonitoring();
    this.detectDeviceCapabilities();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor LCP (Largest Contentful Paint)
    getLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.updateMetrics();
    });

    // Monitor FID (First Input Delay)
    getFID((metric) => {
      this.metrics.fid = metric.value;
      this.updateMetrics();
    });

    // Monitor CLS (Cumulative Layout Shift)
    getCLS((metric) => {
      this.metrics.cls = metric.value;
      this.updateMetrics();
    });

    // Monitor FCP (First Contentful Paint)
    getFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.updateMetrics();
    });

    // Monitor TTFB (Time to First Byte)
    getTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.updateMetrics();
    });

    // Custom metrics
    this.measureTimeToInteractive();
    this.measureFirstMeaningfulPaint();
    this.measureSpeedIndex();
  }

  /**
   * Detect device capabilities for performance optimization
   */
  private detectDeviceCapabilities(): void {
    if (typeof window === 'undefined') return;

    const navigator = window.navigator as any;
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    this.deviceCapabilities = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ),
      isTablet: /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768,
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ),
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Measure Time to Interactive (TTI)
   */
  private measureTimeToInteractive(): void {
    if (typeof window === 'undefined') return;

    // Simplified TTI calculation
    const startTime = performance.now();

    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        this.metrics.tti = performance.now() - startTime;
        this.updateMetrics();
      } else {
        requestIdleCallback(checkInteractive);
      }
    };

    requestIdleCallback(checkInteractive);
  }

  /**
   * Measure First Meaningful Paint (FMP)
   */
  private measureFirstMeaningfulPaint(): void {
    if (typeof window === 'undefined') return;

    // Use Performance Observer for FMP
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fmpEntry = entries.find((entry) => entry.name === 'first-meaningful-paint');

        if (fmpEntry) {
          this.metrics.fmp = fmpEntry.startTime;
          this.updateMetrics();
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      // console.warn('FMP measurement not supported:', error);
    }
  }

  /**
   * Measure Speed Index
   */
  private measureSpeedIndex(): void {
    if (typeof window === 'undefined') return;

    // Simplified Speed Index calculation
    const visualProgress: number[] = [];
    const startTime = performance.now();

    const measureVisualProgress = () => {
      const currentTime = performance.now() - startTime;
      const elements = document.querySelectorAll('*');
      let visibleElements = 0;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
          visibleElements++;
        }
      });

      visualProgress.push(visibleElements);

      if (document.readyState === 'complete') {
        // Calculate Speed Index
        const totalElements = Math.max(...visualProgress);
        let speedIndex = 0;

        for (let i = 1; i < visualProgress.length; i++) {
          const progress = visualProgress[i] / totalElements;
          speedIndex += (1 - progress) * 100; // 100ms intervals
        }

        this.metrics.si = speedIndex;
        this.updateMetrics();
      } else {
        setTimeout(measureVisualProgress, 100);
      }
    };

    measureVisualProgress();
  }

  /**
   * Update metrics and notify listeners
   */
  private updateMetrics(): void {
    const completeMetrics: WebVitalsMetrics = {
      lcp: this.metrics.lcp || null,
      fid: this.metrics.fid || null,
      cls: this.metrics.cls || null,
      fcp: this.metrics.fcp || null,
      ttfb: this.metrics.ttfb || null,
      tti: this.metrics.tti || null,
      fmp: this.metrics.fmp || null,
      si: this.metrics.si || null,
      performanceScore: this.calculatePerformanceScore(),
      timestamp: Date.now(),
    };

    this.listeners.forEach((listener) => listener(completeMetrics));
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(): number {
    const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, fcp: 0.15, ttfb: 0.1 };
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics[metric as keyof WebVitalsMetrics] as number;
      if (value !== null && value !== undefined) {
        const score = this.getMetricScore(metric as keyof PerformanceThresholds, value);
        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Get score for individual metric (0-100)
   */
  private getMetricScore(metric: keyof PerformanceThresholds, value: number): number {
    const thresholds = PERFORMANCE_THRESHOLDS[metric];

    if (value <= thresholds.good) {
      return 100;
    } else if (value <= thresholds.needsImprovement) {
      const range = thresholds.needsImprovement - thresholds.good;
      const position = value - thresholds.good;
      return Math.max(50, 100 - (position / range) * 50);
    } else {
      return Math.max(
        0,
        50 - ((value - thresholds.needsImprovement) / thresholds.needsImprovement) * 50
      );
    }
  }

  /**
   * Add metric listener
   */
  addListener(listener: (metrics: WebVitalsMetrics) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(): PerformanceOptimization[] {
    const recommendations: PerformanceOptimization[] = [];
    const capabilities = this.deviceCapabilities;

    // LCP optimizations
    if (this.metrics.lcp && this.metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.good) {
      recommendations.push({
        type: 'image',
        priority: 'high',
        description: 'Optimize Largest Contentful Paint',
        impact: `LCP is ${this.metrics.lcp}ms (target: <${PERFORMANCE_THRESHOLDS.lcp.good}ms)`,
        implementation:
          'Optimize hero images, use WebP format, implement lazy loading, preload critical resources',
      });
    }

    // FID optimizations
    if (this.metrics.fid && this.metrics.fid > PERFORMANCE_THRESHOLDS.fid.good) {
      recommendations.push({
        type: 'javascript',
        priority: 'high',
        description: 'Reduce First Input Delay',
        impact: `FID is ${this.metrics.fid}ms (target: <${PERFORMANCE_THRESHOLDS.fid.good}ms)`,
        implementation:
          'Split JavaScript bundles, use code splitting, defer non-critical scripts, optimize event handlers',
      });
    }

    // CLS optimizations
    if (this.metrics.cls && this.metrics.cls > PERFORMANCE_THRESHOLDS.cls.good) {
      recommendations.push({
        type: 'layout',
        priority: 'high',
        description: 'Reduce Cumulative Layout Shift',
        impact: `CLS score is ${this.metrics.cls} (target: <${PERFORMANCE_THRESHOLDS.cls.good})`,
        implementation:
          'Add size attributes to images, reserve space for ads, avoid inserting content above existing content',
      });
    }

    // Mobile-specific optimizations
    if (capabilities?.isMobile) {
      recommendations.push({
        type: 'network',
        priority: 'medium',
        description: 'Mobile Network Optimization',
        impact: 'Optimize for mobile network conditions',
        implementation:
          'Use service workers, implement caching strategies, compress resources, use adaptive loading',
      });
    }

    // Low-end device optimizations
    if (capabilities && capabilities.deviceMemory < 4) {
      recommendations.push({
        type: 'javascript',
        priority: 'medium',
        description: 'Low-Memory Device Optimization',
        impact: 'Optimize for low-memory devices',
        implementation:
          'Reduce JavaScript bundle size, implement progressive enhancement, use lighter frameworks',
      });
    }

    return recommendations;
  }
}

// Performance Budget Manager
export class PerformanceBudgetManager {
  private budgets = {
    javascript: 300, // KB
    css: 100, // KB
    images: 1000, // KB
    fonts: 150, // KB
    total: 1500, // KB
  };

  /**
   * Check resource size against budget
   */
  checkBudget(): Promise<{
    passed: boolean;
    violations: Array<{ type: string; size: number; budget: number }>;
  }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve({ passed: true, violations: [] });
        return;
      }

      const violations: Array<{ type: string; size: number; budget: number }> = [];

      // Use Performance API to check resource sizes
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        const resourceSizes = {
          javascript: 0,
          css: 0,
          images: 0,
          fonts: 0,
          total: 0,
        };

        entries.forEach((entry) => {
          const size = entry.transferSize || 0;
          resourceSizes.total += size;

          if (entry.name.includes('.js')) {
            resourceSizes.javascript += size;
          } else if (entry.name.includes('.css')) {
            resourceSizes.css += size;
          } else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
            resourceSizes.images += size;
          } else if (entry.name.match(/\.(woff|woff2|ttf|otf)$/)) {
            resourceSizes.fonts += size;
          }
        });

        // Check each budget
        Object.entries(this.budgets).forEach(([type, budget]) => {
          const size = resourceSizes[type as keyof typeof resourceSizes] / 1024; // Convert to KB
          if (size > budget) {
            violations.push({ type, size: Math.round(size), budget });
          }
        });

        resolve({
          passed: violations.length === 0,
          violations,
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve({ passed: true, violations: [] });
      }, 5000);
    });
  }

  /**
   * Update performance budgets
   */
  updateBudgets(newBudgets: Partial<typeof this.budgets>): void {
    this.budgets = { ...this.budgets, ...newBudgets };
  }
}

// React hook for Core Web Vitals
export const useWebVitals = () => {
  const [metrics, setMetrics] = React.useState<Partial<WebVitalsMetrics>>({});
  const [monitor] = React.useState(() => new CoreWebVitalsMonitor());

  React.useEffect(() => {
    const unsubscribe = monitor.addListener(setMetrics);
    return unsubscribe;
  }, [monitor]);

  return {
    metrics,
    deviceCapabilities: monitor.getDeviceCapabilities(),
    recommendations: monitor.generateRecommendations(),
  };
};

// React hook for performance budget
export const usePerformanceBudget = () => {
  const [budgetManager] = React.useState(() => new PerformanceBudgetManager());
  const [budgetStatus, setBudgetStatus] = React.useState<{
    passed: boolean;
    violations: Array<{ type: string; size: number; budget: number }>;
  }>({ passed: true, violations: [] });

  React.useEffect(() => {
    budgetManager.checkBudget().then(setBudgetStatus);
  }, [budgetManager]);

  return {
    budgetStatus,
    updateBudgets: budgetManager.updateBudgets.bind(budgetManager),
  };
};

// Performance optimization utilities
export const PerformanceOptimizer = {
  /**
   * Preload critical resources
   */
  preloadCriticalResources(resources: Array<{ href: string; as: string; type?: string }>): void {
    if (typeof document === 'undefined') return;

    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      document.head.appendChild(link);
    });
  },

  /**
   * Implement critical CSS inlining
   */
  inlineCriticalCSS(css: string): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },

  /**
   * Defer non-critical JavaScript
   */
  deferNonCriticalJS(scripts: string[]): void {
    if (typeof document === 'undefined') return;

    const loadScript = (src: string) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      document.body.appendChild(script);
    };

    // Load after main content is ready
    if (document.readyState === 'complete') {
      scripts.forEach(loadScript);
    } else {
      window.addEventListener('load', () => {
        scripts.forEach(loadScript);
      });
    }
  },

  /**
   * Implement image lazy loading with intersection observer
   */
  lazyLoadImages(selector: string = 'img[data-src]'): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const images = document.querySelectorAll(selector);

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  },
};

export default CoreWebVitalsMonitor;

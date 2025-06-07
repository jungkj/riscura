import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

export interface WebVitalsMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

export interface OptimizationConfig {
  lcpTarget: number; // 2.5s
  fidTarget: number; // 100ms
  clsTarget: number; // 0.1
  fcpTarget: number; // 1.8s
  ttfbTarget: number; // 600ms
  enableMonitoring: boolean;
  enableOptimizations: boolean;
  reportingEndpoint?: string;
  imageOptimization: {
    enableWebP: boolean;
    enableAVIF: boolean;
    enableLazyLoading: boolean;
    enableResponsive: boolean;
    compressionQuality: number;
    enableBlurPlaceholder: boolean;
  };
}

export interface ImageOptimizationConfig {
  formats: {
    webp: boolean;
    avif: boolean;
    jpeg: boolean;
    png: boolean;
  };
  quality: {
    high: number;
    medium: number;
    low: number;
  };
  breakpoints: number[];
  lazyLoading: {
    enabled: boolean;
    rootMargin: string;
    threshold: number;
  };
  placeholder: {
    enabled: boolean;
    blurRadius: number;
    quality: number;
  };
}

export interface PerformanceIssue {
  metric: keyof WebVitalsMetrics;
  value: number;
  target: number;
  severity: 'warning' | 'error' | 'critical';
  recommendations: string[];
  timestamp: Date;
}

// Default configuration
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  lcpTarget: 2500, // 2.5s
  fidTarget: 100,  // 100ms
  clsTarget: 0.1,  // 0.1
  fcpTarget: 1800, // 1.8s
  ttfbTarget: 600, // 600ms
  enableMonitoring: true,
  enableOptimizations: true,
  imageOptimization: {
    enableWebP: true,
    enableAVIF: true,
    enableLazyLoading: true,
    enableResponsive: true,
    compressionQuality: 85,
    enableBlurPlaceholder: true
  }
};

export const DEFAULT_IMAGE_CONFIG: ImageOptimizationConfig = {
  formats: {
    webp: true,
    avif: true,
    jpeg: true,
    png: true
  },
  quality: {
    high: 90,
    medium: 75,
    low: 60
  },
  breakpoints: [320, 640, 768, 1024, 1280, 1920],
  lazyLoading: {
    enabled: true,
    rootMargin: '50px',
    threshold: 0.1
  },
  placeholder: {
    enabled: true,
    blurRadius: 10,
    quality: 20
  }
};

export class CoreWebVitalsOptimizer {
  private config: OptimizationConfig;
  private metrics: Partial<WebVitalsMetrics> = {};
  private issues: PerformanceIssue[] = [];
  private observers: PerformanceObserver[] = [];
  private intersectionObserver?: IntersectionObserver;
  private isMonitoring: boolean = false;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.initializeOptimizer();
  }

  /**
   * Initialize Core Web Vitals optimizer
   */
  private initializeOptimizer(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring if enabled
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }

    // Apply optimizations if enabled
    if (this.config.enableOptimizations) {
      this.applyOptimizations();
    }

    // Set up image optimization
    this.initializeImageOptimization();
  }

  /**
   * Start monitoring Core Web Vitals
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor LCP (Largest Contentful Paint)
    getLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.checkMetricThreshold('lcp', metric.value, this.config.lcpTarget);
      this.reportMetric('lcp', metric);
    });

    // Monitor FID (First Input Delay)
    getFID((metric: Metric) => {
      this.metrics.fid = metric.value;
      this.checkMetricThreshold('fid', metric.value, this.config.fidTarget);
      this.reportMetric('fid', metric);
    });

    // Monitor CLS (Cumulative Layout Shift)
    getCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.checkMetricThreshold('cls', metric.value, this.config.clsTarget);
      this.reportMetric('cls', metric);
    });

    // Monitor FCP (First Contentful Paint)
    getFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.checkMetricThreshold('fcp', metric.value, this.config.fcpTarget);
      this.reportMetric('fcp', metric);
    });

    // Monitor TTFB (Time to First Byte)
    getTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.checkMetricThreshold('ttfb', metric.value, this.config.ttfbTarget);
      this.reportMetric('ttfb', metric);
    });

    // Monitor INP (Interaction to Next Paint) using Performance Observer
    this.monitorINP();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor layout shifts in real-time
    this.monitorLayoutShifts();
  }

  /**
   * Monitor Interaction to Next Paint (INP)
   */
  private monitorINP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        
        entries.forEach((entry) => {
          if (entry.processingStart && entry.startTime) {
            const inp = entry.processingStart - entry.startTime;
            this.metrics.inp = Math.max(this.metrics.inp || 0, inp);
            
            // Check INP threshold (target: <200ms)
            if (inp > 200) {
              this.reportIssue({
                metric: 'inp' as keyof WebVitalsMetrics,
                value: inp,
                target: 200,
                severity: inp > 500 ? 'critical' : 'warning',
                recommendations: [
                  'Optimize JavaScript execution',
                  'Reduce main thread blocking',
                  'Use event delegation',
                  'Implement proper debouncing'
                ],
                timestamp: new Date()
              });
            }
          }
        });
      });

      inpObserver.observe({ entryTypes: ['event'] });
      this.observers.push(inpObserver);
    } catch (error) {
      console.warn('INP monitoring not supported:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        
        entries.forEach((entry) => {
          // Check for slow loading resources
          if (entry.duration > 1000) { // 1 second
            console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`);
            
            // Suggest optimizations based on resource type
            if (entry.name.includes('.js')) {
              this.suggestJSOptimization(entry);
            } else if (entry.name.includes('.css')) {
              this.suggestCSSOptimization(entry);
            } else if (this.isImageResource(entry.name)) {
              this.suggestImageOptimization(entry);
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }

  /**
   * Monitor layout shifts in real-time
   */
  private monitorLayoutShifts(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        
        entries.forEach((entry: any) => {
          if (entry.value > 0.1) {
            console.warn('Large layout shift detected:', entry);
            this.identifyLayoutShiftCause(entry);
          }
        });
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      console.warn('Layout shift monitoring not supported:', error);
    }
  }

  /**
   * Apply performance optimizations
   */
  private applyOptimizations(): void {
    // Optimize LCP
    this.optimizeLCP();
    
    // Optimize FID
    this.optimizeFID();
    
    // Optimize CLS
    this.optimizeCLS();
    
    // Optimize resource loading
    this.optimizeResourceLoading();
  }

  /**
   * Optimize Largest Contentful Paint (LCP)
   */
  private optimizeLCP(): void {
    // Preload LCP elements
    this.preloadLCPElements();
    
    // Optimize critical resources
    this.optimizeCriticalResources();
    
    // Remove render-blocking resources
    this.removeRenderBlockingResources();
  }

  /**
   * Preload LCP elements
   */
  private preloadLCPElements(): void {
    // Find potential LCP elements
    const potentialLCPElements = document.querySelectorAll(
      'img[loading="lazy"], img:not([loading]), video, canvas, .hero-image, .banner'
    );

    potentialLCPElements.forEach((element) => {
      if (element instanceof HTMLImageElement) {
        // Remove lazy loading from above-the-fold images
        if (this.isAboveTheFold(element)) {
          element.loading = 'eager';
          
          // Add preload hint
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = element.src || element.dataset.src || '';
          document.head.appendChild(link);
        }
      }
    });
  }

  /**
   * Optimize critical resources
   */
  private optimizeCriticalResources(): void {
    // Preload critical fonts
    const fontLinks = document.querySelectorAll('link[href*="font"]');
    fontLinks.forEach((link: any) => {
      if (link.rel !== 'preload') {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'font';
        preloadLink.href = link.href;
        preloadLink.crossOrigin = 'anonymous';
        document.head.appendChild(preloadLink);
      }
    });

    // Preload critical CSS
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    const criticalCSS = Array.from(cssLinks).slice(0, 2); // First 2 stylesheets
    
    criticalCSS.forEach((link: any) => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'style';
      preloadLink.href = link.href;
      document.head.appendChild(preloadLink);
    });
  }

  /**
   * Remove render-blocking resources
   */
  private removeRenderBlockingResources(): void {
    // Make non-critical CSS non-blocking
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach((link: any, index) => {
      if (index > 1) { // Keep first 2 stylesheets blocking
        link.media = 'print';
        link.onload = () => { link.media = 'all'; };
      }
    });

    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
    scripts.forEach((script: any) => {
      if (!this.isCriticalScript(script.src)) {
        script.defer = true;
      }
    });
  }

  /**
   * Optimize First Input Delay (FID)
   */
  private optimizeFID(): void {
    // Break up long tasks
    this.breakUpLongTasks();
    
    // Optimize event handlers
    this.optimizeEventHandlers();
    
    // Use scheduler API if available
    this.useSchedulerAPI();
  }

  /**
   * Break up long tasks
   */
  private breakUpLongTasks(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Long task threshold
              console.warn(`Long task detected: ${entry.duration}ms`);
              this.suggestTaskOptimization(entry);
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported:', error);
      }
    }
  }

  /**
   * Optimize event handlers
   */
  private optimizeEventHandlers(): void {
    // Add passive event listeners for better performance
    const events = ['touchstart', 'touchmove', 'wheel', 'scroll'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, () => {}, { passive: true });
    });

    // Debounce scroll and resize handlers
    this.debounceScrollHandlers();
  }

  /**
   * Use Scheduler API for better task management
   */
  private useSchedulerAPI(): void {
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use scheduler.postTask for better task prioritization
      (window as any).__SCHEDULER_AVAILABLE__ = true;
    }
  }

  /**
   * Optimize Cumulative Layout Shift (CLS)
   */
  private optimizeCLS(): void {
    // Set size attributes for images and videos
    this.setSizeAttributesForMedia();
    
    // Reserve space for dynamic content
    this.reserveSpaceForDynamicContent();
    
    // Optimize font loading
    this.optimizeFontLoading();
  }

  /**
   * Set size attributes for media elements
   */
  private setSizeAttributesForMedia(): void {
    const mediaElements = document.querySelectorAll('img:not([width]), video:not([width])');
    
    mediaElements.forEach((element: any) => {
      // Set intrinsic size if available
      if (element.naturalWidth && element.naturalHeight) {
        const aspectRatio = element.naturalWidth / element.naturalHeight;
        element.style.aspectRatio = aspectRatio.toString();
      }
      
      // Set minimum dimensions
      if (!element.width && !element.style.width) {
        element.style.width = '100%';
        element.style.height = 'auto';
      }
    });
  }

  /**
   * Reserve space for dynamic content
   */
  private reserveSpaceForDynamicContent(): void {
    // Add placeholder dimensions for lazy-loaded content
    const lazyElements = document.querySelectorAll('[data-lazy], .lazy-load');
    
    lazyElements.forEach((element: any) => {
      if (!element.style.minHeight) {
        element.style.minHeight = '200px'; // Default placeholder height
      }
    });
  }

  /**
   * Optimize font loading to prevent layout shifts
   */
  private optimizeFontLoading(): void {
    // Use font-display: swap for custom fonts
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    // Preload critical fonts
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-regular.woff2'
    ];

    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = fontUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize resource loading
   */
  private optimizeResourceLoading(): void {
    // Implement resource hints
    this.addResourceHints();
    
    // Optimize images
    this.optimizeImages();
    
    // Enable compression
    this.enableCompression();
  }

  /**
   * Add resource hints
   */
  private addResourceHints(): void {
    const hints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) {
        link.crossOrigin = hint.crossorigin;
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Initialize image optimization
   */
  private initializeImageOptimization(): void {
    if (!this.config.imageOptimization.enableLazyLoading) return;

    // Set up intersection observer for lazy loading
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
            this.intersectionObserver?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Apply lazy loading to images
    this.applyLazyLoading();
  }

  /**
   * Apply lazy loading to images
   */
  private applyLazyLoading(): void {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    images.forEach(img => {
      if (!this.isAboveTheFold(img as HTMLImageElement)) {
        this.intersectionObserver?.observe(img);
      }
    });
  }

  /**
   * Load image with optimization
   */
  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src || img.src;
    if (!src) return;

    // Create optimized image URLs
    const optimizedSrc = this.getOptimizedImageUrl(src, {
      width: img.width || 800,
      quality: this.config.imageOptimization.compressionQuality,
      format: 'auto'
    });

    // Load the image
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = optimizedSrc;
      img.classList.add('loaded');
    };
    tempImg.src = optimizedSrc;
  }

  /**
   * Get optimized image URL
   */
  private getOptimizedImageUrl(
    src: string, 
    options: { width: number; quality: number; format: string }
  ): string {
    // This would integrate with your image optimization service
    // For now, return the original src
    return src;
  }

  /**
   * Check if element is above the fold
   */
  private isAboveTheFold(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  /**
   * Check metric against threshold
   */
  private checkMetricThreshold(
    metric: keyof WebVitalsMetrics,
    value: number,
    target: number
  ): void {
    if (value > target) {
      const severity = this.getSeverity(metric, value, target);
      const recommendations = this.getRecommendations(metric, value);
      
      this.reportIssue({
        metric,
        value,
        target,
        severity,
        recommendations,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get severity level
   */
  private getSeverity(
    metric: keyof WebVitalsMetrics,
    value: number,
    target: number
  ): 'warning' | 'error' | 'critical' {
    const ratio = value / target;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'error';
    return 'warning';
  }

  /**
   * Get recommendations for metric
   */
  private getRecommendations(metric: keyof WebVitalsMetrics, value: number): string[] {
    const recommendations: Record<string, string[]> = {
      lcp: [
        'Optimize server response times',
        'Use CDN for static assets',
        'Preload critical resources',
        'Optimize images',
        'Remove render-blocking resources'
      ],
      fid: [
        'Reduce JavaScript execution time',
        'Break up long tasks',
        'Use web workers for heavy computation',
        'Implement code splitting',
        'Optimize third-party scripts'
      ],
      cls: [
        'Set size attributes for images and videos',
        'Reserve space for dynamic content',
        'Avoid inserting content above existing content',
        'Use CSS transforms instead of layout changes',
        'Optimize font loading'
      ],
      fcp: [
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Use efficient cache policy',
        'Preload critical resources',
        'Optimize server response time'
      ],
      ttfb: [
        'Optimize server performance',
        'Use CDN',
        'Implement proper caching',
        'Optimize database queries',
        'Use HTTP/2 or HTTP/3'
      ]
    };

    return recommendations[metric] || [];
  }

  /**
   * Report performance issue
   */
  private reportIssue(issue: PerformanceIssue): void {
    this.issues.push(issue);
    
    // Keep only recent issues
    if (this.issues.length > 100) {
      this.issues = this.issues.slice(-50);
    }

    // Log critical issues
    if (issue.severity === 'critical') {
      console.error(`Critical performance issue: ${issue.metric} = ${issue.value}ms (target: ${issue.target}ms)`);
    }
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, metric: Metric): void {
    if (this.config.reportingEndpoint) {
      // Send to analytics endpoint
      fetch(this.config.reportingEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          name,
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.warn('Failed to report metric:', error);
      });
    }
  }

  /**
   * Utility methods for optimization suggestions
   */
  private suggestJSOptimization(entry: PerformanceResourceTiming): void {
    console.log(`JS Optimization needed for: ${entry.name}`);
  }

  private suggestCSSOptimization(entry: PerformanceResourceTiming): void {
    console.log(`CSS Optimization needed for: ${entry.name}`);
  }

  private suggestImageOptimization(entry: PerformanceResourceTiming): void {
    console.log(`Image Optimization needed for: ${entry.name}`);
  }

  private isImageResource(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url);
  }

  private isCriticalScript(src: string): boolean {
    return /critical|inline|polyfill/.test(src);
  }

  private identifyLayoutShiftCause(entry: any): void {
    console.log('Layout shift cause analysis:', entry);
  }

  private suggestTaskOptimization(entry: PerformanceEntry): void {
    console.log(`Long task optimization needed: ${entry.duration}ms`);
  }

  private debounceScrollHandlers(): void {
    // Implementation for debouncing scroll handlers
  }

  private optimizeImages(): void {
    // Implementation for image optimization
  }

  private enableCompression(): void {
    // Implementation for enabling compression
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance issues
   */
  getIssues(): PerformanceIssue[] {
    return [...this.issues];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    metrics: Partial<WebVitalsMetrics>;
    issues: PerformanceIssue[];
    score: number;
    recommendations: string[];
  } {
    const score = this.calculatePerformanceScore();
    const topRecommendations = this.getTopRecommendations();

    return {
      metrics: this.metrics,
      issues: this.issues,
      score,
      recommendations: topRecommendations
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, fcp: 0.15, ttfb: 0.1 };
    let score = 100;

    Object.entries(this.metrics).forEach(([metric, value]) => {
      if (value && weights[metric as keyof typeof weights]) {
        const target = this.config[`${metric}Target` as keyof OptimizationConfig] as number;
        const ratio = Math.min(value / target, 2); // Cap at 2x target
        const penalty = (ratio - 1) * weights[metric as keyof typeof weights] * 100;
        score -= Math.max(0, penalty);
      }
    });

    return Math.max(0, Math.round(score));
  }

  /**
   * Get top recommendations
   */
  private getTopRecommendations(): string[] {
    const allRecommendations = this.issues
      .flatMap(issue => issue.recommendations)
      .reduce((acc, rec) => {
        acc[rec] = (acc[rec] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(allRecommendations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([rec]) => rec);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.metrics = {};
    this.issues = [];
  }
}

// Global instance
export const coreWebVitalsOptimizer = new CoreWebVitalsOptimizer();

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    (window as any).__CORE_WEB_VITALS_OPTIMIZER__ = coreWebVitalsOptimizer;
  });
}

export default CoreWebVitalsOptimizer; 
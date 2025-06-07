import { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import dynamic from 'next/dynamic';

export interface BundleConfig {
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  preloadCritical: boolean;
  chunkSize: {
    vendors: number;
    main: number;
    async: number;
  };
  compressionLevel: number;
  enableTreeShaking: boolean;
}

export interface LoadingStrategy {
  immediate: string[];
  deferred: string[];
  lazy: string[];
  critical: string[];
}

export interface BundleMetrics {
  initialBundleSize: number;
  totalBundleSize: number;
  loadTime: number;
  resourceCount: number;
  compressionRatio: number;
  cacheHitRate: number;
}

export interface ChunkManifest {
  [key: string]: {
    files: string[];
    size: number;
    dependencies: string[];
    loadPriority: 'high' | 'medium' | 'low';
  };
}

// Default optimization configuration
export const DEFAULT_BUNDLE_CONFIG: BundleConfig = {
  enableCodeSplitting: true,
  enableLazyLoading: true,
  preloadCritical: true,
  chunkSize: {
    vendors: 300000, // 300KB
    main: 500000,    // 500KB
    async: 100000    // 100KB
  },
  compressionLevel: 9,
  enableTreeShaking: true
};

// Loading strategies for different component types
export const LOADING_STRATEGIES: LoadingStrategy = {
  immediate: [
    'Header',
    'Navigation',
    'ErrorBoundary',
    'ThemeProvider',
    'AuthProvider'
  ],
  deferred: [
    'Footer',
    'Analytics',
    'NotificationSystem',
    'HelpWidget'
  ],
  lazy: [
    'Dashboard',
    'ReportsPage',
    'SettingsPage',
    'DocumentsPage',
    'WorkflowsPage'
  ],
  critical: [
    'LoginForm',
    'LoadingSpinner',
    'ErrorFallback'
  ]
};

export class BundleOptimizer {
  private config: BundleConfig;
  private metrics: Partial<BundleMetrics> = {};
  private chunkManifest: ChunkManifest = {};
  private loadedChunks: Set<string> = new Set();
  private preloadQueue: string[] = [];

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = { ...DEFAULT_BUNDLE_CONFIG, ...config };
    this.initializeOptimizer();
  }

  /**
   * Initialize bundle optimizer
   */
  private initializeOptimizer(): void {
    if (typeof window === 'undefined') return;

    // Monitor bundle performance
    this.measureBundleMetrics();
    
    // Set up chunk preloading
    this.setupChunkPreloading();
    
    // Initialize resource hints
    this.addResourceHints();
    
    // Monitor network conditions
    this.monitorNetworkConditions();
  }

  /**
   * Create optimized lazy component with error boundaries
   */
  createLazyComponent<T = {}>(
    importFunction: () => Promise<{ default: ComponentType<T> }>,
    options: {
      fallback?: React.ReactNode;
      errorFallback?: React.ReactNode;
      preload?: boolean;
      chunkName?: string;
      loadPriority?: 'high' | 'medium' | 'low';
    } = {}
  ): LazyExoticComponent<ComponentType<T>> {
    const {
      fallback = <div className="animate-pulse">Loading...</div>,
      errorFallback = <div>Failed to load component</div>,
      preload = false,
      chunkName = 'dynamic-component',
      loadPriority = 'medium'
    } = options;

    // Create lazy component with error handling
    const LazyComponent = lazy(async () => {
      try {
        // Add artificial delay for testing in development
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const module = await importFunction();
        
        // Track successful chunk load
        this.loadedChunks.add(chunkName);
        this.updateChunkManifest(chunkName, { loadPriority });
        
        return module;
      } catch (error) {
        console.error(`Failed to load chunk ${chunkName}:`, error);
        
        // Return error fallback as default component
        return {
          default: () => errorFallback as React.ReactElement
        };
      }
    });

    // Preload if requested
    if (preload) {
      this.preloadChunk(chunkName, importFunction);
    }

    return LazyComponent;
  }

  /**
   * Create dynamic component with Next.js optimization
   */
  createDynamicComponent<T = {}>(
    importFunction: () => Promise<{ default: ComponentType<T> }>,
    options: {
      ssr?: boolean;
      loading?: () => React.ReactNode;
      chunkName?: string;
    } = {}
  ) {
    const {
      ssr = false,
      loading = () => <div className="animate-pulse">Loading...</div>,
      chunkName = 'dynamic-next-component'
    } = options;

    return dynamic(importFunction, {
      ssr,
      loading,
      ...(chunkName && { 
        // @ts-ignore - Next.js dynamic options
        webpackChunkName: chunkName 
      })
    });
  }

  /**
   * Preload critical chunks
   */
  async preloadCriticalChunks(): Promise<void> {
    if (!this.config.preloadCritical) return;

    const criticalChunks = [
      () => import('@/components/auth/LoginForm'),
      () => import('@/components/ui/LoadingSpinner'),
      () => import('@/components/ui/ErrorBoundary')
    ];

    // Preload critical chunks in parallel with priority
    await Promise.allSettled(
      criticalChunks.map((chunk, index) => 
        this.preloadChunk(`critical-${index}`, chunk)
      )
    );
  }

  /**
   * Preload chunk with priority
   */
  private async preloadChunk(
    chunkName: string, 
    importFunction: () => Promise<any>
  ): Promise<void> {
    if (this.loadedChunks.has(chunkName)) return;

    try {
      // Add to preload queue
      this.preloadQueue.push(chunkName);
      
      // Use requestIdleCallback for non-critical preloads
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(async () => {
          await importFunction();
          this.loadedChunks.add(chunkName);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          await importFunction();
          this.loadedChunks.add(chunkName);
        }, 100);
      }
    } catch (error) {
      console.warn(`Failed to preload chunk ${chunkName}:`, error);
    }
  }

  /**
   * Measure bundle performance metrics
   */
  private measureBundleMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Use Performance Observer for detailed metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Track JavaScript bundle sizes
            if (resourceEntry.name.includes('.js')) {
              this.updateBundleMetrics({
                totalBundleSize: (this.metrics.totalBundleSize || 0) + (resourceEntry.transferSize || 0),
                resourceCount: (this.metrics.resourceCount || 0) + 1
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource', 'navigation'] });
    }

    // Measure initial bundle size
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const initialSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0);
      
      this.updateBundleMetrics({
        initialBundleSize: initialSize,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart
      });
    });
  }

  /**
   * Set up intelligent chunk preloading
   */
  private setupChunkPreloading(): void {
    if (typeof window === 'undefined') return;

    // Preload chunks on interaction hints
    const setupInteractionPreloading = () => {
      // Hover preloading for navigation links
      document.addEventListener('mouseover', (event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a[href]') as HTMLAnchorElement;
        
        if (link && link.href.includes('/dashboard')) {
          this.preloadChunk('dashboard', () => import('@/pages/dashboard'));
        } else if (link && link.href.includes('/reports')) {
          this.preloadChunk('reports', () => import('@/pages/reports'));
        }
      });

      // Touch preloading for mobile
      document.addEventListener('touchstart', (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest('button[data-preload]') as HTMLButtonElement;
        
        if (button) {
          const chunkName = button.getAttribute('data-preload');
          if (chunkName) {
            this.preloadChunk(chunkName, () => import(`@/components/${chunkName}`));
          }
        }
      });
    };

    // Set up preloading after initial load
    if (document.readyState === 'complete') {
      setupInteractionPreloading();
    } else {
      window.addEventListener('load', setupInteractionPreloading);
    }
  }

  /**
   * Add resource hints for better loading
   */
  private addResourceHints(): void {
    if (typeof document === 'undefined') return;

    // Add DNS prefetch for external resources
    const dnsPrefetchDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'api.openai.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Add preconnect for critical resources
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor network conditions for adaptive loading
   */
  private monitorNetworkConditions(): void {
    if (typeof navigator === 'undefined') return;

    // Use Network Information API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateLoadingStrategy = () => {
        const effectiveType = connection.effectiveType;
        const saveData = connection.saveData;

        // Adjust loading strategy based on connection
        if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
          // Disable preloading and reduce chunk sizes for slow connections
          this.config.preloadCritical = false;
          this.config.chunkSize.async = 50000; // 50KB
        } else if (effectiveType === '4g') {
          // Enable aggressive preloading for fast connections
          this.config.preloadCritical = true;
          this.preloadCriticalChunks();
        }
      };

      // Monitor connection changes
      connection.addEventListener('change', updateLoadingStrategy);
      updateLoadingStrategy(); // Initial check
    }
  }

  /**
   * Update chunk manifest
   */
  private updateChunkManifest(chunkName: string, info: Partial<ChunkManifest[string]>): void {
    if (!this.chunkManifest[chunkName]) {
      this.chunkManifest[chunkName] = {
        files: [],
        size: 0,
        dependencies: [],
        loadPriority: 'medium'
      };
    }

    this.chunkManifest[chunkName] = {
      ...this.chunkManifest[chunkName],
      ...info
    };
  }

  /**
   * Update bundle metrics
   */
  private updateBundleMetrics(metrics: Partial<BundleMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  /**
   * Generate bundle analysis report
   */
  generateAnalysisReport(): {
    metrics: BundleMetrics;
    chunkManifest: ChunkManifest;
    recommendations: string[];
    loadedChunks: string[];
  } {
    const recommendations: string[] = [];

    // Analyze metrics and provide recommendations
    if (this.metrics.initialBundleSize && this.metrics.initialBundleSize > this.config.chunkSize.main) {
      recommendations.push(`Initial bundle size (${Math.round(this.metrics.initialBundleSize / 1024)}KB) exceeds recommended size (${Math.round(this.config.chunkSize.main / 1024)}KB). Consider more aggressive code splitting.`);
    }

    if (this.metrics.loadTime && this.metrics.loadTime > 3000) {
      recommendations.push(`Bundle load time (${this.metrics.loadTime}ms) is above 3 seconds. Consider preloading critical chunks.`);
    }

    if (this.loadedChunks.size < LOADING_STRATEGIES.critical.length) {
      recommendations.push('Not all critical chunks are loaded. Review critical loading strategy.');
    }

    return {
      metrics: this.metrics as BundleMetrics,
      chunkManifest: this.chunkManifest,
      recommendations,
      loadedChunks: Array.from(this.loadedChunks)
    };
  }

  /**
   * Optimize existing bundles
   */
  async optimizeBundles(): Promise<void> {
    // Clean up unused chunks
    this.cleanupUnusedChunks();
    
    // Preload next likely chunks
    await this.preloadLikelyChunks();
    
    // Update loading priorities
    this.updateLoadingPriorities();
  }

  /**
   * Clean up unused chunks from memory
   */
  private cleanupUnusedChunks(): void {
    // Implementation would involve removing unused dynamic imports
    // This is more of a build-time optimization
    console.log('Cleaning up unused chunks...');
  }

  /**
   * Preload chunks that are likely to be needed
   */
  private async preloadLikelyChunks(): Promise<void> {
    // Based on user behavior patterns, preload likely next chunks
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    const likelyNextChunks: Record<string, () => Promise<any>> = {
      '/dashboard': () => import('@/pages/reports'),
      '/reports': () => import('@/pages/dashboard'),
      '/': () => import('@/pages/dashboard')
    };

    const nextChunk = likelyNextChunks[currentPath];
    if (nextChunk) {
      await this.preloadChunk(`likely-${currentPath.replace('/', '')}`, nextChunk);
    }
  }

  /**
   * Update loading priorities based on usage patterns
   */
  private updateLoadingPriorities(): void {
    // Analyze which chunks are accessed most frequently
    Object.keys(this.chunkManifest).forEach(chunkName => {
      // This would typically be based on analytics data
      // For now, we'll use simple heuristics
      if (this.loadedChunks.has(chunkName)) {
        this.chunkManifest[chunkName].loadPriority = 'high';
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<BundleMetrics> {
    return this.metrics;
  }

  /**
   * Get loaded chunks
   */
  getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }
}

// Create optimized component factories
export const createOptimizedLazyComponent = <T = {}>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  chunkName: string,
  options: {
    preload?: boolean;
    fallback?: React.ReactNode;
    loadPriority?: 'high' | 'medium' | 'low';
  } = {}
) => {
  const optimizer = new BundleOptimizer();
  return optimizer.createLazyComponent(importFunction, { ...options, chunkName });
};

export const createOptimizedDynamicComponent = <T = {}>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  chunkName: string,
  options: {
    ssr?: boolean;
    loading?: () => React.ReactNode;
  } = {}
) => {
  const optimizer = new BundleOptimizer();
  return optimizer.createDynamicComponent(importFunction, { ...options, chunkName });
};

// Global bundle optimizer instance
export const bundleOptimizer = new BundleOptimizer();

// Export for use in Next.js config
export const getWebpackConfig = (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
  if (!dev && !isServer) {
    // Optimize chunk splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 300000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          maxSize: 300000,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          maxSize: 200000,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
        },
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name: 'ui',
          chunks: 'all',
          maxSize: 150000,
        }
      }
    };

    // Add compression
    const CompressionPlugin = require('compression-webpack-plugin');
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      })
    );
  }

  return config;
};

export default BundleOptimizer; 
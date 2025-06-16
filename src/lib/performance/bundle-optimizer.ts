// Bundle optimization utilities
export interface BundleMetrics {
  bundleSize: number;
  chunkCount: number;
  loadTime: number;
  cacheHitRate: number;
  compressionRatio: number;
}

export interface ChunkManifest {
  [chunkName: string]: {
    size: number;
    loadTime: number;
    priority: 'high' | 'medium' | 'low';
    lastAccessed: number;
    dependencies: string[];
  };
}

export interface BundleOptimizerConfig {
  preloadCritical: boolean;
  enableCompression: boolean;
  enableSplitting: boolean;
  chunkSizeLimit: number;
  maxConcurrentChunks: number;
}

export class BundleOptimizer {
  private config: BundleOptimizerConfig;
  private metrics: Partial<BundleMetrics> = {};
  private chunkManifest: ChunkManifest = {};
  private loadedChunks: Set<string> = new Set();
  private preloadQueue: string[] = [];

  constructor(config: Partial<BundleOptimizerConfig> = {}) {
    this.config = {
      preloadCritical: true,
      enableCompression: true,
      enableSplitting: true,
      chunkSizeLimit: 244000, // 244KB
      maxConcurrentChunks: 3,
      ...config
    };

    this.initializeOptimizer();
  }

  private initializeOptimizer(): void {
    if (typeof window === 'undefined') return;

    this.measureBundleMetrics();
    this.setupChunkPreloading();
    this.addResourceHints();
    this.monitorNetworkConditions();
  }

  private measureBundleMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Measure bundle size from performance entries
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      this.updateBundleMetrics({
        loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
      });
    }

    // Measure resource loading
    const resourceEntries = performance.getEntriesByType('resource');
    let totalSize = 0;
    let jsChunkCount = 0;

    resourceEntries.forEach((entry: PerformanceResourceTiming) => {
      if (entry.name.includes('.js') && entry.transferSize) {
        totalSize += entry.transferSize;
        jsChunkCount++;
        
        const chunkName = this.extractChunkName(entry.name);
        this.updateChunkManifest(chunkName, {
          size: entry.transferSize,
          loadTime: entry.responseEnd - entry.requestStart,
          lastAccessed: Date.now(),
        });
      }
    });

    this.updateBundleMetrics({
      bundleSize: totalSize,
      chunkCount: jsChunkCount,
    });
  }

  private extractChunkName(url: string): string {
    const matches = url.match(/\/([^\/]+)\.js$/);
    return matches ? matches[1] : 'unknown';
  }

  private setupChunkPreloading(): void {
    if (typeof window === 'undefined') return;

    // Monitor route changes for chunk preloading
    let currentPath = window.location.pathname;
    
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.preloadLikelyChunks();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Preload on intersection observer for likely navigation
    const links = document.querySelectorAll('a[href]');
    const linkObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const href = (entry.target as HTMLAnchorElement).href;
          this.preloadForRoute(href);
        }
      });
    });

    links.forEach(link => linkObserver.observe(link));
  }

  private addResourceHints(): void {
    if (typeof document === 'undefined') return;

    const head = document.head;
    
    // Add DNS prefetch for common domains
    const domains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      head.appendChild(link);
    });

    // Add preconnect for critical resources
    const preconnectDomains = ['fonts.googleapis.com'];
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });
  }

  private monitorNetworkConditions(): void {
    if (typeof navigator === 'undefined') return;

    // @ts-ignore - Connection API is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateStrategy = () => {
        const effectiveType = connection.effectiveType;
        
        // Adjust strategy based on connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.config.maxConcurrentChunks = 1;
          this.config.preloadCritical = false;
        } else if (effectiveType === '3g') {
          this.config.maxConcurrentChunks = 2;
          this.config.preloadCritical = true;
        } else {
          this.config.maxConcurrentChunks = 3;
          this.config.preloadCritical = true;
        }
      };

      updateStrategy();
      connection.addEventListener('change', updateStrategy);
    }
  }

  private updateChunkManifest(chunkName: string, info: Partial<ChunkManifest[string]>): void {
    if (!this.chunkManifest[chunkName]) {
      this.chunkManifest[chunkName] = {
        size: 0,
        loadTime: 0,
        priority: 'medium',
        lastAccessed: Date.now(),
        dependencies: [],
      };
    }

    this.chunkManifest[chunkName] = {
      ...this.chunkManifest[chunkName],
      ...info,
    };
  }

  private updateBundleMetrics(metrics: Partial<BundleMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
  }

  generateAnalysisReport(): {
    metrics: Partial<BundleMetrics>;
    chunkManifest: ChunkManifest;
    recommendations: string[];
    loadedChunks: string[];
  } {
    const recommendations: string[] = [];

    // Analyze bundle size
    if (this.metrics.bundleSize && this.metrics.bundleSize > 500000) {
      recommendations.push('Bundle size is large. Consider code splitting.');
    }

    // Analyze chunk count
    if (this.metrics.chunkCount && this.metrics.chunkCount > 10) {
      recommendations.push('High number of chunks. Consider consolidating smaller chunks.');
    }

    // Analyze load time
    if (this.metrics.loadTime && this.metrics.loadTime > 3000) {
      recommendations.push('Load time is slow. Consider preloading critical chunks.');
    }

    return {
      metrics: this.metrics,
      chunkManifest: this.chunkManifest,
      recommendations,
      loadedChunks: Array.from(this.loadedChunks),
    };
  }

  async optimizeBundles(): Promise<void> {
    // Clean up unused chunks
    this.cleanupUnusedChunks();

    // Preload likely chunks
    await this.preloadLikelyChunks();

    // Update loading priorities
    this.updateLoadingPriorities();
  }

  private cleanupUnusedChunks(): void {
    // Implementation for cleaning up unused chunks
    // This would typically involve cache management
    console.log('Cleaning up unused chunks...');
  }

  private async preloadLikelyChunks(): Promise<void> {
    // Implementation for preloading likely chunks based on user behavior
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    
    const likelyNextChunks: Record<string, string> = {
      '/dashboard': 'reports',
      '/reports': 'dashboard',
      '/': 'dashboard'
    };

    const nextChunk = likelyNextChunks[currentPath];
    if (nextChunk && !this.loadedChunks.has(nextChunk)) {
      try {
        console.log(`Preloading chunk: ${nextChunk}`);
        // Actual preloading would happen here
      } catch (error) {
        console.warn(`Failed to preload chunk ${nextChunk}:`, error);
      }
    }
  }

  private updateLoadingPriorities(): void {
    // Update chunk priorities based on usage patterns
    Object.keys(this.chunkManifest).forEach(chunkName => {
      const chunk = this.chunkManifest[chunkName];
      const timeSinceAccess = Date.now() - chunk.lastAccessed;
      
      // Demote priority for old chunks
      if (timeSinceAccess > 7 * 24 * 60 * 60 * 1000) { // 7 days
        chunk.priority = 'low';
      }
    });
  }

  private preloadForRoute(href: string): void {
    // Implementation for route-based preloading
    console.log(`Considering preload for route: ${href}`);
  }

  getMetrics(): Partial<BundleMetrics> {
    return this.metrics;
  }

  getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }
}

export default BundleOptimizer; 
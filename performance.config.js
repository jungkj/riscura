// Performance Configuration for Riscura Platform
module.exports = {
  // Performance budgets
  budgets: {
    // Bundle size limits (in KB)
    bundles: {
      main: 250,
      vendor: 300,
      css: 50,
      total: 600,
    },
    
    // Web Vitals thresholds
    vitals: {
      lcp: 2500,      // Largest Contentful Paint (ms)
      fid: 100,       // First Input Delay (ms)
      cls: 0.1,       // Cumulative Layout Shift
      fcp: 1800,      // First Contentful Paint (ms)
      ttfb: 600,      // Time to First Byte (ms)
      inp: 200,       // Interaction to Next Paint (ms)
    },
    
    // Resource limits
    resources: {
      images: 100,    // Max image size (KB)
      fonts: 30,      // Max font size (KB)
      scripts: 50,    // Max individual script size (KB)
      stylesheets: 20, // Max CSS file size (KB)
    },
    
    // Network performance
    network: {
      apiResponseTime: 200,  // Max API response time (ms)
      cacheHitRatio: 85,     // Min cache hit ratio (%)
      compressionRatio: 70,   // Min compression ratio (%)
    },
  },
  
  // Optimization settings
  optimization: {
    // Code splitting
    codeSplitting: {
      enabled: true,
      chunkSizeLimit: 244000, // 244KB
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      minChunkSize: 20000,    // 20KB
    },
    
    // Image optimization
    images: {
      formats: ['avif', 'webp', 'jpeg'],
      quality: {
        avif: 80,
        webp: 85,
        jpeg: 90,
      },
      sizes: [640, 768, 1024, 1280, 1920],
      lazyLoading: true,
      placeholder: 'blur',
    },
    
    // Caching strategy
    caching: {
      redis: {
        enabled: true,
        defaultTTL: 3600,      // 1 hour
        maxMemory: '256mb',
        evictionPolicy: 'allkeys-lru',
      },
      browser: {
        staticAssets: 31536000, // 1 year
        apiResponses: 300,      // 5 minutes
        images: 86400,          // 1 day
      },
      cdn: {
        enabled: true,
        regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      },
    },
    
    // Virtualization
    virtualization: {
      tableRowHeight: 50,
      overscanCount: 5,
      bufferSize: 10,
      maxDataPoints: 1000,
      samplingStrategy: 'lttb',
    },
    
    // Lazy loading
    lazyLoading: {
      enabled: true,
      threshold: 0.1,
      rootMargin: '50px',
      maxConcurrentLoads: 3,
      progressiveLoading: true,
    },
  },
  
  // Monitoring configuration
  monitoring: {
    // Performance metrics collection
    metrics: {
      enabled: true,
      sampleRate: 1.0,        // 100% sampling
      batchSize: 10,
      flushInterval: 30000,   // 30 seconds
      endpoint: '/api/performance',
    },
    
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      trackInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      trackLayoutShifts: true,
    },
    
    // Error tracking
    errors: {
      enabled: true,
      sampleRate: 1.0,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Script error',
      ],
    },
    
    // Alerts
    alerts: {
      lcp: {
        warning: 2000,
        critical: 3000,
      },
      fid: {
        warning: 50,
        critical: 100,
      },
      cls: {
        warning: 0.05,
        critical: 0.1,
      },
      cacheHitRatio: {
        warning: 80,
        critical: 70,
      },
      apiResponseTime: {
        warning: 300,
        critical: 500,
      },
    },
  },
  
  // Development settings
  development: {
    // Bundle analysis
    bundleAnalyzer: {
      enabled: process.env.ANALYZE === 'true',
      openAnalyzer: true,
      analyzerMode: 'server',
    },
    
    // Performance profiling
    profiling: {
      enabled: process.env.NODE_ENV === 'development',
      trackComponents: true,
      trackHooks: true,
      trackRenders: true,
    },
    
    // Debug mode
    debug: {
      enabled: process.env.DEBUG_PERFORMANCE === 'true',
      logLevel: 'info',
      showMetrics: true,
      showCacheStats: true,
    },
  },
  
  // Production settings
  production: {
    // Compression
    compression: {
      enabled: true,
      algorithms: ['gzip', 'brotli'],
      threshold: 1024,        // 1KB
      level: 6,
    },
    
    // Minification
    minification: {
      js: true,
      css: true,
      html: true,
      removeComments: true,
      removeConsole: ['log', 'info', 'debug'],
    },
    
    // Security headers
    security: {
      contentSecurityPolicy: true,
      frameOptions: 'DENY',
      contentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
  },
  
  // Testing configuration
  testing: {
    // Performance tests
    performance: {
      lighthouse: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 90,
      },
      webVitals: {
        lcp: 2000,
        fid: 50,
        cls: 0.05,
      },
    },
    
    // Load testing
    load: {
      concurrent: 100,
      duration: '5m',
      rampUp: '1m',
      endpoints: [
        '/api/dashboard',
        '/api/risks',
        '/api/controls',
      ],
    },
  },
  
  // Feature flags
  features: {
    experimentalOptimizations: false,
    advancedCaching: true,
    imageOptimization: true,
    codeSpitting: true,
    lazyLoading: true,
    virtualization: true,
    serviceWorker: true,
    webAssembly: false,
  },
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = module.exports;
}

if (typeof window !== 'undefined') {
  window.PerformanceConfig = module.exports;
} 
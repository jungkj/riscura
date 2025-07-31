import { z } from 'zod';

// Performance configuration schema
export const performanceConfigSchema = z.object({
  // Database Performance
  database: z.object({
    connectionPool: z.object({
      min: z.number().min(1).default(5),
      max: z.number().min(5).default(50),
      acquireTimeoutMs: z.number().min(1000).default(60000),
      idleTimeoutMs: z.number().min(1000).default(10000),
    }),
    queryTimeoutMs: z.number().min(1000).default(30000),
    enableReadReplicas: z.boolean().default(true),
    readReplicaUrls: z.array(z.string().url()).optional(),
  }),

  // Redis Cache Configuration
  redis: z.object({
    clusterEnabled: z.boolean().default(false),
    clusterNodes: z.array(z.string()).optional(),
    connectionPoolSize: z.number().min(1).default(10),
    cacheTtl: z.object({
      short: z.number().min(60).default(300), // 5 minutes
      medium: z.number().min(300).default(3600), // 1 hour
      long: z.number().min(3600).default(86400), // 24 hours
    }),
  }),

  // Memory Management
  memory: z.object({
    enabled: z.boolean().default(true),
    maxUsageMb: z.number().min(100).default(500),
    gcThresholdMb: z.number().min(50).default(100),
    monitoringIntervalMs: z.number().min(5000).default(30000),
    autoCleanup: z.boolean().default(true),
    leakDetection: z.boolean().default(true),
  }),

  // Core Web Vitals
  webVitals: z.object({
    enabled: z.boolean().default(true),
    samplingRate: z.number().min(0).max(1).default(0.1),
    endpoint: z.string().default('/api/performance/vitals'),
    thresholds: z.object({
      lcpMs: z.number().min(1000).default(2500),
      fidMs: z.number().min(50).default(100),
      cls: z.number().min(0.05).default(0.1),
    }),
  }),

  // Image Optimization
  images: z.object({
    enabled: z.boolean().default(true),
    quality: z.number().min(1).max(100).default(80),
    formats: z.array(z.enum(['webp', 'avif', 'jpeg', 'png'])).default(['webp', 'avif', 'jpeg']),
    lazyLoading: z.boolean().default(true),
    preloadCritical: z.boolean().default(true),
  }),

  // Bundle Optimization
  bundle: z.object({
    analyzerEnabled: z.boolean().default(false),
    sizeLimitMb: z.number().min(0.5).default(1),
    codeSplitting: z.boolean().default(true),
    treeShaking: z.boolean().default(true),
    dynamicImports: z.boolean().default(true),
  }),

  // Background Tasks
  backgroundTasks: z.object({
    enabled: z.boolean().default(true),
    workers: z.number().min(1).default(4),
    queueSize: z.number().min(100).default(1000),
    timeoutMs: z.number().min(30000).default(300000),
    retryAttempts: z.number().min(1).default(3),
  }),

  // WebSocket Optimization
  websocket: z.object({
    enabled: z.boolean().default(true),
    connectionPoolSize: z.number().min(10).default(100),
    heartbeatIntervalMs: z.number().min(10000).default(30000),
    reconnectAttempts: z.number().min(3).default(5),
    messageCompression: z.boolean().default(true),
  }),

  // File Upload Optimization
  fileUpload: z.object({
    chunkSizeMb: z.number().min(1).default(5),
    maxConcurrent: z.number().min(1).default(3),
    resumeEnabled: z.boolean().default(true),
    virusScan: z.boolean().default(true),
    allowedTypes: z
      .array(z.string())
      .default([
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'csv',
        'jpg',
        'png',
        'gif',
      ]),
  }),

  // Performance Monitoring
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsEndpoint: z.string().default('/api/performance/metrics'),
    alertsEnabled: z.boolean().default(true),
    autoOptimization: z.boolean().default(true),
    reportingIntervalMs: z.number().min(30000).default(60000),
  }),

  // Alert Thresholds
  alerts: z.object({
    memoryUsageThreshold: z.number().min(50).max(95).default(85),
    dbConnectionThreshold: z.number().min(50).max(95).default(80),
    lcpThresholdMs: z.number().min(1000).default(2500),
    fidThresholdMs: z.number().min(50).default(100),
    clsThreshold: z.number().min(0.05).default(0.1),
    taskQueueThreshold: z.number().min(50).default(100),
    websocketConnectionThreshold: z.number().min(50).max(95).default(80),
  }),

  // External Services
  external: z.object({
    datadogApiKey: z.string().optional(),
    newRelicLicenseKey: z.string().optional(),
    pingdomApiKey: z.string().optional(),
  }),
});

export type PerformanceConfig = z.infer<typeof performanceConfigSchema>;

// Load and validate performance configuration
function loadPerformanceConfig(): PerformanceConfig {
  const config = {
    database: {
      connectionPool: {
        min: parseInt(process.env.DB_CONNECTION_POOL_MIN || '5'),
        max: parseInt(process.env.DB_CONNECTION_POOL_MAX || '50'),
        acquireTimeoutMs: parseInt(process.env.DB_CONNECTION_POOL_ACQUIRE_TIMEOUT || '60000'),
        idleTimeoutMs: parseInt(process.env.DB_CONNECTION_POOL_IDLE_TIMEOUT || '10000'),
      },
      queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      enableReadReplicas: process.env.DB_ENABLE_READ_REPLICAS === 'true',
      readReplicaUrls: process.env.DB_READ_REPLICA_URLS?.split(',').filter(Boolean),
    },
    redis: {
      clusterEnabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
      clusterNodes: process.env.REDIS_CLUSTER_NODES?.split(',').filter(Boolean),
      connectionPoolSize: parseInt(process.env.REDIS_CONNECTION_POOL_SIZE || '10'),
      cacheTtl: {
        short: parseInt(process.env.REDIS_CACHE_TTL_SHORT || '300'),
        medium: parseInt(process.env.REDIS_CACHE_TTL_MEDIUM || '3600'),
        long: parseInt(process.env.REDIS_CACHE_TTL_LONG || '86400'),
      },
    },
    memory: {
      enabled: process.env.MEMORY_MANAGEMENT_ENABLED !== 'false',
      maxUsageMb: parseInt(process.env.MEMORY_MAX_USAGE_MB || '500'),
      gcThresholdMb: parseInt(process.env.MEMORY_GC_THRESHOLD_MB || '100'),
      monitoringIntervalMs: parseInt(process.env.MEMORY_MONITORING_INTERVAL_MS || '30000'),
      autoCleanup: process.env.MEMORY_AUTO_CLEANUP !== 'false',
      leakDetection: process.env.MEMORY_LEAK_DETECTION !== 'false',
    },
    webVitals: {
      enabled: process.env.CORE_WEB_VITALS_ENABLED !== 'false',
      samplingRate: parseFloat(process.env.CORE_WEB_VITALS_SAMPLING_RATE || '0.1'),
      endpoint: process.env.CORE_WEB_VITALS_ENDPOINT || '/api/performance/vitals',
      thresholds: {
        lcpMs: parseInt(process.env.CORE_WEB_VITALS_LCP_THRESHOLD || '2500'),
        fidMs: parseInt(process.env.CORE_WEB_VITALS_FID_THRESHOLD || '100'),
        cls: parseFloat(process.env.CORE_WEB_VITALS_CLS_THRESHOLD || '0.1'),
      },
    },
    images: {
      enabled: process.env.IMAGE_OPTIMIZATION_ENABLED !== 'false',
      quality: parseInt(process.env.IMAGE_QUALITY || '80'),
      formats: (process.env.IMAGE_FORMATS?.split(',') || ['webp', 'avif', 'jpeg']) as (
        | 'webp'
        | 'avif'
        | 'jpeg'
        | 'png'
      )[],
      lazyLoading: process.env.IMAGE_LAZY_LOADING !== 'false',
      preloadCritical: process.env.IMAGE_PRELOAD_CRITICAL !== 'false',
    },
    bundle: {
      analyzerEnabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true',
      sizeLimitMb: parseFloat(process.env.BUNDLE_SIZE_LIMIT_MB || '1'),
      codeSplitting: process.env.CODE_SPLITTING_ENABLED !== 'false',
      treeShaking: process.env.TREE_SHAKING_ENABLED !== 'false',
      dynamicImports: process.env.DYNAMIC_IMPORTS_ENABLED !== 'false',
    },
    backgroundTasks: {
      enabled: process.env.BACKGROUND_TASKS_ENABLED !== 'false',
      workers: parseInt(process.env.BACKGROUND_TASK_WORKERS || '4'),
      queueSize: parseInt(process.env.BACKGROUND_TASK_QUEUE_SIZE || '1000'),
      timeoutMs: parseInt(process.env.BACKGROUND_TASK_TIMEOUT_MS || '300000'),
      retryAttempts: parseInt(process.env.BACKGROUND_TASK_RETRY_ATTEMPTS || '3'),
    },
    websocket: {
      enabled: process.env.WEBSOCKET_OPTIMIZATION_ENABLED !== 'false',
      connectionPoolSize: parseInt(process.env.WEBSOCKET_CONNECTION_POOL_SIZE || '100'),
      heartbeatIntervalMs: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL_MS || '30000'),
      reconnectAttempts: parseInt(process.env.WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
      messageCompression: process.env.WEBSOCKET_MESSAGE_COMPRESSION !== 'false',
    },
    fileUpload: {
      chunkSizeMb: parseInt(process.env.FILE_UPLOAD_CHUNK_SIZE_MB || '5'),
      maxConcurrent: parseInt(process.env.FILE_UPLOAD_MAX_CONCURRENT || '3'),
      resumeEnabled: process.env.FILE_UPLOAD_RESUME_ENABLED !== 'false',
      virusScan: process.env.FILE_UPLOAD_VIRUS_SCAN !== 'false',
      allowedTypes: process.env.FILE_UPLOAD_ALLOWED_TYPES?.split(',') || [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'csv',
        'jpg',
        'png',
        'gif',
      ],
    },
    monitoring: {
      enabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
      metricsEndpoint: process.env.PERFORMANCE_METRICS_ENDPOINT || '/api/performance/metrics',
      alertsEnabled: process.env.PERFORMANCE_ALERTS_ENABLED !== 'false',
      autoOptimization: process.env.PERFORMANCE_AUTO_OPTIMIZATION !== 'false',
      reportingIntervalMs: parseInt(process.env.PERFORMANCE_REPORTING_INTERVAL_MS || '60000'),
    },
    alerts: {
      memoryUsageThreshold: parseInt(process.env.ALERT_MEMORY_USAGE_THRESHOLD || '85'),
      dbConnectionThreshold: parseInt(process.env.ALERT_DB_CONNECTION_THRESHOLD || '80'),
      lcpThresholdMs: parseInt(process.env.ALERT_LCP_THRESHOLD_MS || '2500'),
      fidThresholdMs: parseInt(process.env.ALERT_FID_THRESHOLD_MS || '100'),
      clsThreshold: parseFloat(process.env.ALERT_CLS_THRESHOLD || '0.1'),
      taskQueueThreshold: parseInt(process.env.ALERT_TASK_QUEUE_THRESHOLD || '100'),
      websocketConnectionThreshold: parseInt(
        process.env.ALERT_WEBSOCKET_CONNECTION_THRESHOLD || '80'
      ),
    },
    external: {
      datadogApiKey: process.env.DATADOG_API_KEY,
      newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      pingdomApiKey: process.env.PINGDOM_API_KEY,
    },
  };

  try {
    return performanceConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid performance configuration:', error);
    throw new Error('Performance configuration validation failed');
  }
}

// Export singleton instance
export const performanceConfig = loadPerformanceConfig();

// Export individual config sections for convenience
export const databaseConfig = performanceConfig.database;
export const redisConfig = performanceConfig.redis;
export const memoryConfig = performanceConfig.memory;
export const webVitalsConfig = performanceConfig.webVitals;
export const imageConfig = performanceConfig.images;
export const bundleConfig = performanceConfig.bundle;
export const backgroundTaskConfig = performanceConfig.backgroundTasks;
export const websocketConfig = performanceConfig.websocket;
export const fileUploadConfig = performanceConfig.fileUpload;
export const monitoringConfig = performanceConfig.monitoring;
export const alertConfig = performanceConfig.alerts;
export const externalConfig = performanceConfig.external;

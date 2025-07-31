import { memoryManager } from './memory-manager';

export interface TaskConfig {
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number;
  retries: number;
  batchSize: number;
  concurrency: number;
  useWebWorkers: boolean;
  enablePersistence: boolean;
  enableProgressTracking: boolean;
}

export interface Task<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  config: TaskConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: R;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  dependencies?: string[];
}

export interface WorkerPool {
  workers: Worker[];
  busyWorkers: Set<Worker>;
  taskQueue: Map<Worker, Task>;
  maxWorkers: number;
  currentTasks: number;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  throughput: number; // tasks per second
  workerUtilization: number;
  queueLength: number;
  memoryUsage: number;
}

export interface TaskProcessor<T = any, R = any> {
  (data: T, onProgress?: (progress: number) => void): Promise<R> | R;
}

export interface SchedulerConfig {
  maxConcurrentTasks: number;
  maxQueueSize: number;
  taskTimeout: number;
  workerPoolSize: number;
  enablePrioritization: boolean;
  enableBatching: boolean;
  persistenceTTL: number; // seconds
}

// Default configurations
export const DEFAULT_TASK_CONFIG: TaskConfig = {
  priority: 'normal',
  timeout: 30000, // 30 seconds
  retries: 3,
  batchSize: 10,
  concurrency: 2,
  useWebWorkers: true,
  enablePersistence: false,
  enableProgressTracking: true,
};

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  maxConcurrentTasks: 10,
  maxQueueSize: 1000,
  taskTimeout: 60000, // 1 minute
  workerPoolSize: navigator.hardwareConcurrency || 4,
  enablePrioritization: true,
  enableBatching: true,
  persistenceTTL: 3600, // 1 hour
};

export class BackgroundTaskOptimizer {
  private config: SchedulerConfig;
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private completedTasks: Map<string, Task> = new Map();
  private processors: Map<string, TaskProcessor> = new Map();
  private workerPools: Map<string, WorkerPool> = new Map();
  private metrics: TaskMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    throughput: 0,
    workerUtilization: 0,
    queueLength: 0,
    memoryUsage: 0,
  };
  private isProcessing: boolean = false;
  private processInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private persistenceStore: Map<string, Task> = new Map();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.initializeOptimizer();
  }

  /**
   * Initialize background task optimizer
   */
  private initializeOptimizer(): void {
    // Start task processing
    this.startProcessing();

    // Start metrics collection
    this.startMetricsCollection();

    // Initialize default worker pools
    this.initializeDefaultWorkerPools();

    // Set up persistence if enabled
    this.initializePersistence();

    // Register cleanup handlers
    this.registerCleanupHandlers();
  }

  /**
   * Initialize default worker pools
   */
  private initializeDefaultWorkerPools(): void {
    const defaultPools = [
      'data-processing',
      'file-upload',
      'image-processing',
      'analytics',
      'notifications',
    ];

    defaultPools.forEach((poolName) => {
      this.createWorkerPool(poolName, {
        maxWorkers: Math.ceil(this.config.workerPoolSize / defaultPools.length),
        taskTypes: [poolName],
      });
    });
  }

  /**
   * Create worker pool for specific task types
   */
  createWorkerPool(
    poolName: string,
    options: {
      maxWorkers: number;
      taskTypes: string[];
      workerScript?: string;
    }
  ): void {
    const { maxWorkers, taskTypes, workerScript } = options;

    const pool: WorkerPool = {
      workers: [],
      busyWorkers: new Set(),
      taskQueue: new Map(),
      maxWorkers,
      currentTasks: 0,
    };

    // Create workers
    for (let i = 0; i < maxWorkers; i++) {
      const worker = this.createWorker(poolName, workerScript);
      if (worker) {
        pool.workers.push(worker);
      }
    }

    this.workerPools.set(poolName, pool);
    console.log(`Created worker pool "${poolName}" with ${pool.workers.length} workers`);
  }

  /**
   * Create individual worker
   */
  private createWorker(poolName: string, customScript?: string): Worker | null {
    const workerScript = customScript || this.getDefaultWorkerScript();

    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      // Set up worker message handling
      worker.onmessage = (event) => {
        this.handleWorkerMessage(worker, event.data);
      };

      worker.onerror = (error) => {
        this.handleWorkerError(worker, error);
      };

      // Register worker cleanup
      memoryManager.registerResource(
        `worker-${poolName}-${Date.now()}`,
        'webWorker',
        'BackgroundTaskOptimizer',
        () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      );

      return worker;
    } catch (error) {
      console.error(`Failed to create worker for pool ${poolName}:`, error);
      return null;
    }
  }

  /**
   * Get default worker script
   */
  private getDefaultWorkerScript(): string {
    return `
      class WorkerTaskProcessor {
        constructor() {
          this.processors = new Map();
          this.setupDefaultProcessors();
        }

        setupDefaultProcessors() {
          // Data processing
          this.processors.set('data-processing', (data, onProgress) => {
            return this.processData(data, onProgress);
          });

          // File upload processing
          this.processors.set('file-upload', (data, onProgress) => {
            return this.processFileUpload(data, onProgress);
          });

          // Image processing
          this.processors.set('image-processing', (data, onProgress) => {
            return this.processImage(data, onProgress);
          });

          // Analytics processing
          this.processors.set('analytics', (data, onProgress) => {
            return this.processAnalytics(data, onProgress);
          });

          // Notification processing
          this.processors.set('notifications', (data, onProgress) => {
            return this.processNotifications(data, onProgress);
          });
        }

        async processData(data, onProgress) {
          const { items, operation } = data;
          const results = [];
          
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 10));
            
            let result;
            switch (operation) {
              case 'transform':
                result = this.transformItem(item);
                break;
              case 'validate':
                result = this.validateItem(item);
                break;
              case 'analyze':
                result = this.analyzeItem(item);
                break;
              default:
                result = item;
            }
            
            results.push(result);
            
            // Report progress
            if (onProgress) {
              onProgress((i + 1) / items.length * 100);
            }
          }
          
          return results;
        }

        async processFileUpload(data, onProgress) {
          const { chunks, uploadUrl } = data;
          const uploadedChunks = [];
          
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Simulate chunk upload
            await new Promise(resolve => setTimeout(resolve, 100));
            
            uploadedChunks.push({
              ...chunk,
              uploaded: true,
              timestamp: Date.now()
            });
            
            if (onProgress) {
              onProgress((i + 1) / chunks.length * 100);
            }
          }
          
          return uploadedChunks;
        }

        async processImage(data, onProgress) {
          const { imageData, operations } = data;
          let processedData = imageData;
          
          for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            
            // Simulate image processing
            await new Promise(resolve => setTimeout(resolve, 200));
            
            switch (operation.type) {
              case 'resize':
                processedData = this.resizeImage(processedData, operation.params);
                break;
              case 'compress':
                processedData = this.compressImage(processedData, operation.params);
                break;
              case 'filter':
                processedData = this.applyFilter(processedData, operation.params);
                break;
            }
            
            if (onProgress) {
              onProgress((i + 1) / operations.length * 100);
            }
          }
          
          return processedData;
        }

        async processAnalytics(data, onProgress) {
          const { events, aggregations } = data;
          const results = {};
          
          for (let i = 0; i < aggregations.length; i++) {
            const aggregation = aggregations[i];
            
            // Simulate analytics processing
            await new Promise(resolve => setTimeout(resolve, 50));
            
            results[aggregation.name] = this.aggregateEvents(events, aggregation);
            
            if (onProgress) {
              onProgress((i + 1) / aggregations.length * 100);
            }
          }
          
          return results;
        }

        async processNotifications(data, onProgress) {
          const { notifications, channels } = data;
          const results = [];
          
          for (let i = 0; i < notifications.length; i++) {
            const notification = notifications[i];
            
            // Simulate notification processing
            await new Promise(resolve => setTimeout(resolve, 30));
            
            const processed = {
              ...notification,
              processed: true,
              sentAt: Date.now(),
              channels: this.selectChannels(notification, channels)
            };
            
            results.push(processed);
            
            if (onProgress) {
              onProgress((i + 1) / notifications.length * 100);
            }
          }
          
          return results;
        }

        // Helper methods
        transformItem(item) {
          return { ...item, transformed: true, timestamp: Date.now() };
        }

        validateItem(item) {
          return { ...item, valid: true, validatedAt: Date.now() };
        }

        analyzeItem(item) {
          return { ...item, analyzed: true, score: Math.random(), analyzedAt: Date.now() };
        }

        resizeImage(imageData, params) {
          return { ...imageData, width: params.width, height: params.height };
        }

        compressImage(imageData, params) {
          return { ...imageData, quality: params.quality, compressed: true };
        }

        applyFilter(imageData, params) {
          return { ...imageData, filter: params.filter, filtered: true };
        }

        aggregateEvents(events, aggregation) {
          switch (aggregation.type) {
            case 'count':
              return events.length;
            case 'sum':
              return events.reduce((sum, event) => sum + (event[aggregation.field] || 0), 0);
            case 'average':
              const values = events.map(event => event[aggregation.field] || 0);
              return values.reduce((sum, val) => sum + val, 0) / values.length;
            default:
              return null;
          }
        }

        selectChannels(notification, channels) {
          return channels.filter(channel => 
            channel.enabled && channel.supports.includes(notification.type)
          );
        }
      }

      const processor = new WorkerTaskProcessor();

      self.addEventListener('message', async function(e) {
        const { type, taskId, taskType, data } = e.data;
        
        if (type === 'EXECUTE_TASK') {
          try {
            const taskProcessor = processor.processors.get(taskType);
            if (!taskProcessor) {
              throw new Error(\`No processor found for task type: \${taskType}\`);
            }

            const onProgress = (progress) => {
              self.postMessage({
                type: 'TASK_PROGRESS',
                taskId,
                progress
              });
            };

            const result = await taskProcessor(data, onProgress);

            self.postMessage({
              type: 'TASK_COMPLETE',
              taskId,
              result
            });
          } catch (error) {
            self.postMessage({
              type: 'TASK_ERROR',
              taskId,
              error: error.message
            });
          }
        }
      });
    `;
  }

  /**
   * Register task processor
   */
  registerProcessor<T, R>(taskType: string, processor: TaskProcessor<T, R>): void {
    this.processors.set(taskType, processor);
  }

  /**
   * Schedule task for execution
   */
  async scheduleTask<T, R>(
    taskType: string,
    data: T,
    config: Partial<TaskConfig> = {}
  ): Promise<string> {
    const taskConfig: TaskConfig = { ...DEFAULT_TASK_CONFIG, ...config };

    const task: Task<T, R> = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      data,
      config: taskConfig,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
    };

    // Check queue size limit
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    // Add to queue
    this.taskQueue.push(task);
    this.metrics.totalTasks++;

    // Sort by priority if enabled
    if (this.config.enablePrioritization) {
      this.sortTasksByPriority();
    }

    // Persist task if enabled
    if (taskConfig.enablePersistence) {
      this.persistTask(task);
    }

    console.log(`Scheduled task ${task.id} of type ${taskType}`);
    return task.id;
  }

  /**
   * Sort tasks by priority
   */
  private sortTasksByPriority(): void {
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };

    this.taskQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.config.priority];
      const bPriority = priorityOrder[b.config.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Same priority, sort by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Start task processing
   */
  private startProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processInterval = setInterval(() => {
      this.processTasks();
    }, 100); // Process every 100ms

    // Register cleanup
    memoryManager.registerResource(
      'task-processor-interval',
      'interval',
      'BackgroundTaskOptimizer',
      () => {
        if (this.processInterval) {
          clearInterval(this.processInterval);
        }
      }
    );
  }

  /**
   * Process pending tasks
   */
  private async processTasks(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    const availableSlots = this.config.maxConcurrentTasks - this.runningTasks.size;
    if (availableSlots <= 0) return;

    const tasksToProcess = this.taskQueue.splice(0, availableSlots);

    for (const task of tasksToProcess) {
      try {
        await this.executeTask(task);
      } catch (error) {
        console.error(`Failed to execute task ${task.id}:`, error);
        this.handleTaskError(task, error as Error);
      }
    }
  }

  /**
   * Execute individual task
   */
  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    task.attempts++;

    this.runningTasks.set(task.id, task);

    try {
      let result: any;

      if (task.config.useWebWorkers) {
        result = await this.executeTaskInWorker(task);
      } else {
        result = await this.executeTaskInMainThread(task);
      }

      // Task completed successfully
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();

      this.runningTasks.delete(task.id);
      this.completedTasks.set(task.id, task);
      this.metrics.completedTasks++;

      console.log(`Task ${task.id} completed successfully`);
    } catch (error) {
      this.handleTaskError(task, error as Error);
    }
  }

  /**
   * Execute task in web worker
   */
  private async executeTaskInWorker(task: Task): Promise<any> {
    // Find appropriate worker pool
    const poolName = this.findWorkerPool(task.type);
    const pool = this.workerPools.get(poolName);

    if (!pool || pool.workers.length === 0) {
      throw new Error(`No workers available for task type: ${task.type}`);
    }

    // Find available worker
    const availableWorker = pool.workers.find((worker) => !pool.busyWorkers.has(worker));

    if (!availableWorker) {
      throw new Error('No available workers in pool');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'));
      }, task.config.timeout);

      const handleMessage = (event: MessageEvent) => {
        const { type, taskId, result, error, progress } = event.data;

        if (taskId !== task.id) return;

        switch (type) {
          case 'TASK_COMPLETE':
            clearTimeout(timeout);
            availableWorker.removeEventListener('message', handleMessage);
            pool.busyWorkers.delete(availableWorker);
            resolve(result);
            break;

          case 'TASK_ERROR':
            clearTimeout(timeout);
            availableWorker.removeEventListener('message', handleMessage);
            pool.busyWorkers.delete(availableWorker);
            reject(new Error(error));
            break;

          case 'TASK_PROGRESS':
            if (task.config.enableProgressTracking) {
              task.progress = progress;
            }
            break;
        }
      };

      availableWorker.addEventListener('message', handleMessage);
      pool.busyWorkers.add(availableWorker);

      // Send task to worker
      availableWorker.postMessage({
        type: 'EXECUTE_TASK',
        taskId: task.id,
        taskType: task.type,
        data: task.data,
      });
    });
  }

  /**
   * Execute task in main thread
   */
  private async executeTaskInMainThread(task: Task): Promise<any> {
    const processor = this.processors.get(task.type);

    if (!processor) {
      throw new Error(`No processor registered for task type: ${task.type}`);
    }

    const onProgress = (progress: number) => {
      if (task.config.enableProgressTracking) {
        task.progress = progress;
      }
    };

    return processor(task.data, onProgress);
  }

  /**
   * Find appropriate worker pool for task type
   */
  private findWorkerPool(taskType: string): string {
    // Simple mapping - can be enhanced with more sophisticated routing
    const typeMap: Record<string, string> = {
      'data-processing': 'data-processing',
      'file-upload': 'file-upload',
      'image-processing': 'image-processing',
      analytics: 'analytics',
      notifications: 'notifications',
    };

    return typeMap[taskType] || 'data-processing'; // Default pool
  }

  /**
   * Handle task error
   */
  private handleTaskError(task: Task, error: Error): void {
    task.error = error;
    this.runningTasks.delete(task.id);

    // Check if we should retry
    if (task.attempts < task.config.retries) {
      // Add back to queue for retry
      task.status = 'pending';
      this.taskQueue.unshift(task); // Add to front for priority
      console.log(`Retrying task ${task.id} (attempt ${task.attempts + 1}/${task.config.retries})`);
    } else {
      // Task failed permanently
      task.status = 'failed';
      task.completedAt = new Date();
      this.completedTasks.set(task.id, task);
      this.metrics.failedTasks++;
      console.error(`Task ${task.id} failed permanently:`, error);
    }
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(worker: Worker, message: any): void {
    // Worker message handling is done in executeTaskInWorker
    // This method can be used for pool-level management
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    console.error('Worker error:', error);

    // Find and restart worker
    for (const [poolName, pool] of this.workerPools.entries()) {
      const workerIndex = pool.workers.indexOf(worker);
      if (workerIndex !== -1) {
        // Remove failed worker
        pool.workers.splice(workerIndex, 1);
        pool.busyWorkers.delete(worker);

        // Create replacement worker
        const newWorker = this.createWorker(poolName);
        if (newWorker) {
          pool.workers.push(newWorker);
        }

        break;
      }
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds

    // Register cleanup
    memoryManager.registerResource(
      'metrics-interval',
      'interval',
      'BackgroundTaskOptimizer',
      () => {
        if (this.metricsInterval) {
          clearInterval(this.metricsInterval);
        }
      }
    );
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Calculate average execution time
    const completedTasks = Array.from(this.completedTasks.values()).filter(
      (task) => task.completedAt && task.startedAt
    );

    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const executionTime = task.completedAt!.getTime() - task.startedAt!.getTime();
        return sum + executionTime;
      }, 0);

      this.metrics.averageExecutionTime = totalTime / completedTasks.length;
    }

    // Calculate throughput (tasks per second)
    const recentTasks = completedTasks.filter(
      (task) => Date.now() - task.completedAt!.getTime() < 60000 // Last minute
    );
    this.metrics.throughput = recentTasks.length / 60;

    // Calculate worker utilization
    const totalWorkers = Array.from(this.workerPools.values()).reduce(
      (sum, pool) => sum + pool.workers.length,
      0
    );
    const busyWorkers = Array.from(this.workerPools.values()).reduce(
      (sum, pool) => sum + pool.busyWorkers.size,
      0
    );

    this.metrics.workerUtilization = totalWorkers > 0 ? (busyWorkers / totalWorkers) * 100 : 0;

    // Update queue length
    this.metrics.queueLength = this.taskQueue.length;

    // Estimate memory usage
    this.metrics.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation based on task count and data size
    const taskMemory = (this.taskQueue.length + this.runningTasks.size) * 1024; // 1KB per task
    const resultMemory = this.completedTasks.size * 2048; // 2KB per completed task
    return taskMemory + resultMemory;
  }

  /**
   * Initialize persistence
   */
  private initializePersistence(): void {
    // Implementation would depend on storage mechanism (IndexedDB, localStorage, etc.)
    // For now, using in-memory Map
  }

  /**
   * Persist task
   */
  private persistTask(task: Task): void {
    this.persistenceStore.set(task.id, { ...task });
  }

  /**
   * Register cleanup handlers
   */
  private registerCleanupHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): Task | null {
    return (
      this.runningTasks.get(taskId) ||
      this.completedTasks.get(taskId) ||
      this.taskQueue.find((task) => task.id === taskId) ||
      null
    );
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    // Remove from queue
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = 'cancelled';
      this.completedTasks.set(taskId, task);
      return true;
    }

    // Cancel running task
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.status = 'cancelled';
      this.runningTasks.delete(taskId);
      this.completedTasks.set(taskId, runningTask);
      return true;
    }

    return false;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): TaskMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      pending: this.taskQueue.length,
      running: this.runningTasks.size,
      completed: this.metrics.completedTasks,
      failed: this.metrics.failedTasks,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Stop processing
    this.isProcessing = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Terminate all workers
    for (const pool of this.workerPools.values()) {
      pool.workers.forEach((worker) => worker.terminate());
    }

    // Clear data structures
    this.taskQueue = [];
    this.runningTasks.clear();
    this.completedTasks.clear();
    this.workerPools.clear();
    this.persistenceStore.clear();

    console.log('Background task optimizer cleaned up');
  }
}

// Global instance
export const backgroundTaskOptimizer = new BackgroundTaskOptimizer();

// Initialize on load
if (typeof window !== 'undefined') {
  (window as any).__BACKGROUND_TASK_OPTIMIZER__ = backgroundTaskOptimizer;
}

export default BackgroundTaskOptimizer;

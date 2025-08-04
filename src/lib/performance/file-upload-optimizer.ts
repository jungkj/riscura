import { memoryManager } from './memory-manager';

export interface UploadConfig {
  chunkSize: number; // bytes
  maxFileSize: number; // bytes
  maxConcurrentChunks: number;
  retryAttempts: number;
  timeoutMs: number;
  enableCompression: boolean;
  supportedFormats: string[];
  enableProgressReporting: boolean;
  enableResumableUpload: boolean;
}

export interface UploadProgress {
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  totalChunks: number;
  uploadedChunks: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  hash: string;
  uploadId: string;
  attempts: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface UploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  chunks: ChunkInfo[];
  uploadedChunks: Set<number>;
  startTime: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
}

export interface DatasetConfig {
  virtualScrolling: {
    enabled: boolean;
    rowHeight: number;
    bufferSize: number;
    overscan: number;
  };
  pagination: {
    pageSize: number;
    prefetchPages: number;
    maxCachedPages: number;
  };
  processing: {
    batchSize: number;
    maxWorkers: number;
    useWebWorkers: boolean;
    streamProcessing: boolean;
  };
  memory: {
    maxCacheSize: number; // MB
    gcThreshold: number; // MB
    enableCompression: boolean;
  };
}

// Default configurations
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  chunkSize: 1024 * 1024, // 1MB chunks
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxConcurrentChunks: 3,
  retryAttempts: 3,
  timeoutMs: 30000,
  enableCompression: true,
  supportedFormats: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.json'],
  enableProgressReporting: true,
  enableResumableUpload: true,
};

export const DEFAULT_DATASET_CONFIG: DatasetConfig = {
  virtualScrolling: {
    enabled: true,
    rowHeight: 50,
    bufferSize: 20,
    overscan: 5,
  },
  pagination: {
    pageSize: 100,
    prefetchPages: 2,
    maxCachedPages: 10,
  },
  processing: {
    batchSize: 1000,
    maxWorkers: navigator.hardwareConcurrency || 4,
    useWebWorkers: true,
    streamProcessing: true,
  },
  memory: {
    maxCacheSize: 50, // 50MB
    gcThreshold: 30, // 30MB
    enableCompression: true,
  },
};

export class FileUploadOptimizer {
  private config: UploadConfig;
  private sessions: Map<string, UploadSession> = new Map();
  private activeUploads: Map<string, AbortController> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();
  private workers: Worker[] = [];

  constructor(_config: Partial<UploadConfig> = {}) {
    this.config = { ...DEFAULT_UPLOAD_CONFIG, ...config };
    this.initializeWorkers();
  }

  /**
   * Initialize web workers for file processing
   */
  private initializeWorkers(): void {
    if (typeof Worker === 'undefined') return;

    // Create file processing worker
    const workerCode = `
      self.addEventListener('message', function(e) {
        const { type, data } = e.data
        
        switch (type) {
          case 'HASH_CHUNK':
            hashChunk(data);
            break;
          case 'COMPRESS_CHUNK':
            compressChunk(data);
            break;
          case 'VALIDATE_FILE':
            validateFile(data);
            break;
        }
      });
      
      async function hashChunk({ chunk, chunkIndex }) {
        try {
          const buffer = await chunk.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          self.postMessage({
            type: 'HASH_COMPLETE',
            chunkIndex,
            hash
          });
        } catch (error) {
          self.postMessage({
            type: 'HASH_ERROR',
            chunkIndex,
            error: error.message
          });
        }
      }
      
      async function compressChunk({ chunk, chunkIndex }) {
        try {
          const stream = new CompressionStream('gzip');
          const compressed = await new Response(chunk.stream().pipeThrough(stream)).blob();
          
          self.postMessage({
            type: 'COMPRESS_COMPLETE',
            chunkIndex,
            compressed
          });
        } catch (error) {
          self.postMessage({
            type: 'COMPRESS_ERROR',
            chunkIndex,
            error: error.message
          });
        }
      }
      
      const validateFile = ({ file, supportedFormats }) {
        const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
        const isValidFormat = supportedFormats.some(format => 
          file.name.toLowerCase().endsWith(format.toLowerCase())
        );
        
        self.postMessage({
          type: 'VALIDATE_COMPLETE',
          isValid: isValidSize && isValidFormat,
          errors: [
            ...(!isValidSize ? ['File size exceeds maximum limit'] : []),
            ...(!isValidFormat ? ['File format not supported'] : [])
          ]
        });
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    try {
      const worker = new Worker(workerUrl);
      this.workers.push(worker);

      // Register worker cleanup
      memoryManager.registerResource(
        `file-worker-${Date.now()}`,
        'webWorker',
        'FileUploadOptimizer',
        () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      );
    } catch (error) {
      // console.warn('Failed to create web worker:', error)
    }
  }

  /**
   * Upload file with chunking and progress tracking
   */
  async uploadFile(
    _file: File,
    uploadUrl: string,
    options: {
      onProgress?: (progress: UploadProgress) => void;
      onComplete?: (result: any) => void;
      onError?: (__error: Error) => void;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const { onProgress, onComplete, onError, metadata = {} } = options;

    // Validate file
    const validationResult = await this.validateFile(file);
    if (!validationResult.isValid) {
      const error = new Error(`File validation failed: ${validationResult.errors.join(', ')}`);
      onError?.(error);
      throw error;
    }

    // Create upload session
    const sessionId = this.createUploadSession(file, metadata);
    const session = this.sessions.get(sessionId)!;

    // Register progress callback
    if (onProgress) {
      this.progressCallbacks.set(sessionId, onProgress);
    }

    // Create abort controller
    const abortController = new AbortController();
    this.activeUploads.set(sessionId, abortController);

    try {
      // Prepare chunks
      await this.prepareChunks(session);

      // Update progress
      this.updateProgress(sessionId, { status: 'uploading' });

      // Upload chunks concurrently
      await this.uploadChunks(session, uploadUrl, abortController.signal);

      // Complete upload
      const _result = await this.completeUpload(session, uploadUrl);

      // Update progress
      this.updateProgress(sessionId, { status: 'completed' });

      onComplete?.(result);
      return sessionId;
    } catch (error) {
      this.updateProgress(sessionId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      // Cleanup
      this.activeUploads.delete(sessionId);
      this.progressCallbacks.delete(sessionId);
    }
  }

  /**
   * Validate file before upload
   */
  private async validateFile(_file: File): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit (${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`
      );
    }

    // Check file format
    const isValidFormat = this.config.supportedFormats.some((format) =>
      file.name.toLowerCase().endsWith(format.toLowerCase())
    );

    if (!isValidFormat) {
      errors.push(
        `File format not supported. Supported formats: ${this.config.supportedFormats.join(', ')}`
      );
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create upload session
   */
  private createUploadSession(_file: File, metadata: Record<string, any>): string {
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / this.config.chunkSize);

    const chunks: ChunkInfo[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, file.size);

      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        hash: '',
        uploadId: '',
        attempts: 0,
        status: 'pending',
      });
    }

    const session: UploadSession = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      chunks,
      uploadedChunks: new Set(),
      startTime: new Date(),
      lastActivity: new Date(),
      metadata: { ...metadata, file },
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Prepare chunks (hash and optionally compress)
   */
  private async prepareChunks(session: UploadSession): Promise<void> {
    const file = session.metadata.file as File;
    const worker = this.workers[0];

    if (!worker) {
      // Fallback to main thread processing
      await this.prepareChunksMainThread(session, file);
      return;
    }

    return new Promise((resolve, reject) => {
      let completedChunks = 0;
      const totalChunks = session.chunks.length;

      const handleMessage = (event: MessageEvent) => {
        const { type, chunkIndex, hash, error } = event.data;

        if (type === 'HASH_COMPLETE') {
          session.chunks[chunkIndex].hash = hash;
          completedChunks++;

          if (completedChunks === totalChunks) {
            worker.removeEventListener('message', handleMessage);
            resolve();
          }
        } else if (type === 'HASH_ERROR') {
          worker.removeEventListener('message', handleMessage);
          reject(new Error(`Chunk hashing failed: ${error}`));
        }
      };

      worker.addEventListener('message', handleMessage);

      // Send chunks to worker for hashing
      session.chunks.forEach((chunk, index) => {
        const chunkBlob = file.slice(chunk.start, chunk.end);
        worker.postMessage({
          type: 'HASH_CHUNK',
          data: { chunk: chunkBlob, chunkIndex: index },
        });
      });
    });
  }

  /**
   * Prepare chunks in main thread (fallback)
   */
  private async prepareChunksMainThread(session: UploadSession, file: File): Promise<void> {
    for (let i = 0; i < session.chunks.length; i++) {
      const chunk = session.chunks[i];
      const chunkBlob = file.slice(chunk.start, chunk.end);

      // Calculate hash
      const buffer = await chunkBlob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      chunk.hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  }

  /**
   * Upload chunks concurrently
   */
  private async uploadChunks(
    session: UploadSession,
    uploadUrl: string,
    signal: AbortSignal
  ): Promise<void> {
    const { maxConcurrentChunks } = this.config;
    const pendingChunks = session.chunks.filter((chunk) => chunk.status === 'pending');

    // Upload chunks in batches
    for (let i = 0; i < pendingChunks.length; i += maxConcurrentChunks) {
      const batch = pendingChunks.slice(i, i + maxConcurrentChunks);

      await Promise.all(batch.map((chunk) => this.uploadChunk(session, chunk, uploadUrl, signal)));

      // Update progress after each batch
      this.updateProgress(session.id);
    }
  }

  /**
   * Upload single chunk
   */
  private async uploadChunk(
    session: UploadSession,
    chunk: ChunkInfo,
    uploadUrl: string,
    signal: AbortSignal
  ): Promise<void> {
    const file = session.metadata.file as File;
    const chunkBlob = file.slice(chunk.start, chunk.end);

    chunk.status = 'uploading';

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        chunk.attempts = attempt + 1;

        const formData = new FormData();
        formData.append('chunk', chunkBlob);
        formData.append('chunkIndex', chunk.index.toString());
        formData.append('chunkHash', chunk.hash);
        formData.append('sessionId', session.id);
        formData.append('fileName', session.fileName);
        formData.append('totalChunks', session.chunks.length.toString());

        const response = await fetch(`${uploadUrl}/chunk`, {
          method: 'POST',
          body: formData,
          signal,
          headers: {
            'X-Session-Id': session.id,
            'X-Chunk-Index': chunk.index.toString(),
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const _result = await response.json();
        chunk.uploadId = result.uploadId || '';
        chunk.status = 'completed';
        session.uploadedChunks.add(chunk.index);
        session.lastActivity = new Date();

        return;
      } catch (error) {
        if (signal.aborted) {
          chunk.status = 'pending';
          throw new Error('Upload cancelled');
        }

        if (attempt === this.config.retryAttempts - 1) {
          chunk.status = 'error';
          throw error;
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Complete upload by merging chunks
   */
  private async completeUpload(session: UploadSession, uploadUrl: string): Promise<any> {
    const response = await fetch(`${uploadUrl}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: session.id,
        fileName: session.fileName,
        fileSize: session.fileSize,
        chunks: session.chunks.map((chunk) => ({
          index: chunk.index,
          hash: chunk.hash,
          uploadId: chunk.uploadId,
        })),
        metadata: session.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Upload completion failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update upload progress
   */
  private updateProgress(sessionId: string, updates: Partial<UploadProgress> = {}): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const callback = this.progressCallbacks.get(sessionId);
    if (!callback) return;

    const uploadedBytes = session.uploadedChunks.size * this.config.chunkSize;
    const percentage = (session.uploadedChunks.size / session.chunks.length) * 100;
    const elapsedTime = (Date.now() - session.startTime.getTime()) / 1000;
    const speed = uploadedBytes / elapsedTime;
    const remainingBytes = session.fileSize - uploadedBytes;
    const remainingTime = speed > 0 ? remainingBytes / speed : 0;

    const progress: UploadProgress = {
      fileName: session.fileName,
      fileSize: session.fileSize,
      uploadedBytes: Math.min(uploadedBytes, session.fileSize),
      totalChunks: session.chunks.length,
      uploadedChunks: session.uploadedChunks.size,
      percentage: Math.min(percentage, 100),
      speed,
      remainingTime,
      status: 'uploading',
      ...updates,
    };

    callback(progress);
  }

  /**
   * Pause upload
   */
  pauseUpload(sessionId: string): void {
    const abortController = this.activeUploads.get(sessionId);
    if (abortController) {
      abortController.abort();
      this.updateProgress(sessionId, { status: 'paused' });
    }
  }

  /**
   * Resume upload
   */
  async resumeUpload(sessionId: string, uploadUrl: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    // Create new abort controller
    const abortController = new AbortController();
    this.activeUploads.set(sessionId, abortController);

    try {
      this.updateProgress(sessionId, { status: 'uploading' });
      await this.uploadChunks(session, uploadUrl, abortController.signal);
      await this.completeUpload(session, uploadUrl);
      this.updateProgress(sessionId, { status: 'completed' });
    } catch (error) {
      this.updateProgress(sessionId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cancel upload
   */
  cancelUpload(sessionId: string): void {
    const abortController = this.activeUploads.get(sessionId);
    if (abortController) {
      abortController.abort();
    }

    this.updateProgress(sessionId, { status: 'cancelled' });
    this.sessions.delete(sessionId);
    this.activeUploads.delete(sessionId);
    this.progressCallbacks.delete(sessionId);
  }

  /**
   * Get upload progress
   */
  getUploadProgress(sessionId: string): UploadProgress | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const uploadedBytes = session.uploadedChunks.size * this.config.chunkSize;
    const percentage = (session.uploadedChunks.size / session.chunks.length) * 100;

    return {
      fileName: session.fileName,
      fileSize: session.fileSize,
      uploadedBytes: Math.min(uploadedBytes, session.fileSize),
      totalChunks: session.chunks.length,
      uploadedChunks: session.uploadedChunks.size,
      percentage: Math.min(percentage, 100),
      speed: 0,
      remainingTime: 0,
      status: session.uploadedChunks.size === session.chunks.length ? 'completed' : 'uploading',
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Cancel all active uploads
    for (const [sessionId, abortController] of this.activeUploads) {
      abortController.abort();
    }

    // Clear all data
    this.sessions.clear();
    this.activeUploads.clear();
    this.progressCallbacks.clear();

    // Terminate workers
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}

// Large dataset processing optimizer
export class LargeDatasetProcessor {
  private config: DatasetConfig;
  private cache: Map<string, any> = new Map();
  private workers: Worker[] = [];
  private currentCacheSize: number = 0;

  constructor(_config: Partial<DatasetConfig> = {}) {
    this.config = { ...DEFAULT_DATASET_CONFIG, ...config };
    this.initializeWorkers();
  }

  /**
   * Initialize processing workers
   */
  private initializeWorkers(): void {
    if (!this.config.processing.useWebWorkers || typeof Worker === 'undefined') {
      return;
    }

    const workerCount = Math.min(
      this.config.processing.maxWorkers,
      navigator.hardwareConcurrency || 4
    );

    for (let i = 0; i < workerCount; i++) {
      const worker = this.createProcessingWorker();
      if (worker) {
        this.workers.push(worker);
      }
    }
  }

  /**
   * Create processing worker
   */
  private createProcessingWorker(): Worker | null {
    const workerCode = `
      self.addEventListener('message', function(e) {
        const { type, data, id } = e.data;
        
        switch (type) {
          case 'PROCESS_BATCH':
            processBatch(data, id);
            break;
          case 'AGGREGATE_DATA':
            aggregateData(data, id);
            break;
          case 'FILTER_DATA':
            filterData(data, id);
            break;
        }
      });
      
      const processBatch = (data, id) {
        try {
          // Process data batch
          const processed = data.map(item => {
            // Example processing logic
            return {
              ...item,
              processed: true,
              timestamp: Date.now()
            }
          });
          
          self.postMessage({
            type: 'BATCH_COMPLETE',
            id,
            result: processed
          });
        } catch (error) {
          self.postMessage({
            type: 'BATCH_ERROR',
            id,
            error: error.message
          });
        }
      }
      
      const aggregateData = (data, id) {
        try {
          const aggregated = data.reduce((acc, item) => {
            // Example aggregation logic
            acc.count = (acc.count || 0) + 1
            acc.sum = (acc.sum || 0) + (item.value || 0);
            return acc;
          }, {});
          
          self.postMessage({
            type: 'AGGREGATE_COMPLETE',
            id,
            result: aggregated
          });
        } catch (error) {
          self.postMessage({
            type: 'AGGREGATE_ERROR',
            id,
            error: error.message
          });
        }
      }
      
      const filterData = (data, id) {
        try {
          const { filters } = data;
          const filtered = data.items.filter(item => {
            return filters.every(filter => {
              const value = item[filter.field];
              switch (filter.operator) {
                case 'equals':
                  return value === filter.value;
                case 'contains':
                  return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                case 'gt':
                  return Number(value) > Number(filter.value);
                case 'lt':
                  return Number(value) < Number(filter.value);
                default:
                  return true;
              }
            });
          });
          
          self.postMessage({
            type: 'FILTER_COMPLETE',
            id,
            result: filtered
          });
        } catch (error) {
          self.postMessage({
            type: 'FILTER_ERROR',
            id,
            error: error.message
          });
        }
      }
    `;

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      // Register cleanup
      memoryManager.registerResource(
        `dataset-worker-${Date.now()}`,
        'webWorker',
        'LargeDatasetProcessor',
        () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      );

      return worker;
    } catch (error) {
      // console.warn('Failed to create processing worker:', error)
      return null;
    }
  }

  /**
   * Process large dataset in batches
   */
  async processDataset<T>(
    _data: T[],
    processor: (batch: T[]) => Promise<T[]> | T[],
    options: {
      onProgress?: (processed: number, total: number) => void;
      onBatchComplete?: (batch: T[], batchIndex: number) => void;
    } = {}
  ): Promise<T[]> {
    const { batchSize } = this.config.processing;
    const { onProgress, onBatchComplete } = options;

    const results: T[] = [];
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize);

      try {
        const processedBatch = await processor(batch);
        results.push(...processedBatch);

        onBatchComplete?.(processedBatch, batchIndex);
        onProgress?.(results.length, data.length);

        // Memory management
        if (this.shouldTriggerGC()) {
          await this.performGC();
        }

        // Yield control to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 0));
      } catch (error) {
        // console.error(`Error processing batch ${batchIndex}:`, error)
        throw error;
      }
    }

    return results;
  }

  /**
   * Process using web workers
   */
  async processWithWorkers<T>(
    _data: T[],
    processingType: 'PROCESS_BATCH' | 'AGGREGATE_DATA' | 'FILTER_DATA',
    options: any = {}
  ): Promise<any> {
    if (this.workers.length === 0) {
      throw new Error('No workers available for processing');
    }

    const { batchSize } = this.config.processing;
    const batches = [];

    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    const results = await Promise.all(
      batches.map((batch, index) => {
        const worker = this.workers[index % this.workers.length];
        return this.processWithWorker(worker, processingType, batch, options);
      })
    );

    return processingType === 'AGGREGATE_DATA'
      ? this.mergeAggregatedResults(results)
      : results.flat();
  }

  /**
   * Process single batch with worker
   */
  private async processWithWorker(
    worker: Worker,
    type: string,
    data: any,
    options: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `task-${Date.now()}-${Math.random()}`;

      const handleMessage = (event: MessageEvent) => {
        const { type: responseType, id: responseId, result, error } = event.data;

        if (responseId !== id) return;

        worker.removeEventListener('message', handleMessage);

        if (responseType.endsWith('_COMPLETE')) {
          resolve(result);
        } else if (responseType.endsWith('_ERROR')) {
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ type, data: { ...data, ...options }, id });

      // Timeout handling
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        reject(new Error('Worker processing timeout'));
      }, 30000);
    });
  }

  /**
   * Merge aggregated results
   */
  private mergeAggregatedResults(_results: any[]): any {
    return results.reduce((merged, result) => {
      Object.keys(result).forEach((key) => {
        if (typeof result[key] === 'number') {
          merged[key] = (merged[key] || 0) + result[key];
        } else if (Array.isArray(result[key])) {
          merged[key] = [...(merged[key] || []), ...result[key]];
        } else {
          merged[key] = result[key];
        }
      });
      return merged;
    }, {});
  }

  /**
   * Cache dataset page
   */
  cachePage(key: string, data: any): void {
    const size = this.estimateDataSize(data);

    // Check cache size limit
    if (this.currentCacheSize + size > this.config.memory.maxCacheSize * 1024 * 1024) {
      this.evictOldestEntries(size);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
      accessCount: 0,
    });

    this.currentCacheSize += size;
  }

  /**
   * Get cached page
   */
  getCachedPage(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
      return entry.data;
    }
    return null;
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(_data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // Assume UTF-16
    }

    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }

    return 8; // Rough estimate for primitives
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldestEntries(neededSize: number): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.timestamp - b.timestamp);

    let freedSize = 0;

    for (const entry of entries) {
      this.cache.delete(entry.key);
      this.currentCacheSize -= entry.size;
      freedSize += entry.size;

      if (freedSize >= neededSize) {
        break;
      }
    }
  }

  /**
   * Check if GC should be triggered
   */
  private shouldTriggerGC(): boolean {
    return this.currentCacheSize > this.config.memory.gcThreshold * 1024 * 1024;
  }

  /**
   * Perform garbage collection
   */
  private async performGC(): Promise<void> {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Clear half of the cache
    const entries = Array.from(this.cache.entries());
    const entriesToRemove = entries
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
      .slice(0, Math.floor(entries.length / 2));

    entriesToRemove.forEach(([key, value]) => {
      this.cache.delete(key);
      this.currentCacheSize -= value.size;
    });
  }

  /**
   * Get processing metrics
   */
  getMetrics() {
    return {
      cacheSize: this.currentCacheSize,
      cacheEntries: this.cache.size,
      workersActive: this.workers.length,
      memoryUsage: (this.currentCacheSize / (this.config.memory.maxCacheSize * 1024 * 1024)) * 100,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Terminate workers
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];

    // Clear cache
    this.cache.clear();
    this.currentCacheSize = 0;
  }
}

// Global instances
export const fileUploadOptimizer = new FileUploadOptimizer();
export const datasetProcessor = new LargeDatasetProcessor();

export default {
  FileUploadOptimizer,
  LargeDatasetProcessor,
  fileUploadOptimizer,
  datasetProcessor,
};

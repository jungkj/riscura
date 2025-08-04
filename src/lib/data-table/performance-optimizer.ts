import { useMemo, useCallback, useRef, useEffect } from 'react';

export interface FilterState {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between' | 'in';
  value: any;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface VirtualizationConfig {
  rowHeight: number;
  overscan: number;
  enableDynamicRowHeight: boolean;
  estimatedRowHeight: number;
  bufferSize: number;
}

export interface BulkOperationConfig {
  batchSize: number;
  maxConcurrent: number;
  retryAttempts: number;
  timeout: number;
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  streaming: boolean;
  chunkSize: number;
  includeHeaders: boolean;
  compression: boolean;
}

export interface PerformanceMetrics {
  renderTime: number;
  filterTime: number;
  sortTime: number;
  exportTime?: number;
  memoryUsage: number;
  rowsProcessed: number;
  cacheHitRate: number;
}

export class DataTablePerformanceOptimizer<T = any> {
  private cache = new Map<string, any>();
  private filterCache = new Map<string, T[]>();
  private sortCache = new Map<string, T[]>();
  private indexedFields = new Map<string, Map<any, T[]>>();
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    filterTime: 0,
    sortTime: 0,
    memoryUsage: 0,
    rowsProcessed: 0,
    cacheHitRate: 0,
  }

  constructor(
    private data: T[],
    private virtualizationConfig: VirtualizationConfig,
    private bulkConfig: BulkOperationConfig
  ) {
    this.buildIndexes();
  }

  /**
   * Build indexes for commonly filtered/sorted fields
   */
  private buildIndexes(indexFields: string[] = []): void {
    const startTime = performance.now();

    indexFields.forEach((field) => {
      const index = new Map<any, T[]>();

      this.data.forEach((item) => {
        const value = this.getNestedValue(item, field);
        if (!index.has(value)) {
          index.set(value, []);
        }
        index.get(value)!.push(item);
      });

      this.indexedFields.set(field, index);
    });

    // console.log(
      `Built indexes for ${indexFields.length} fields in ${performance.now() - startTime}ms`
    )
  }

  /**
   * Optimized filtering with caching and indexing
   */
  filterData(_filters: FilterState[]): T[] {
    const startTime = performance.now();
    const cacheKey = this.generateFilterCacheKey(filters);

    // Check cache first
    if (this.filterCache.has(cacheKey)) {
      this.metrics.cacheHitRate++
      this.metrics.filterTime = performance.now() - startTime;
      return this.filterCache.get(cacheKey)!;
    }

    let filteredData = this.data;

    // Apply filters in order of selectivity (most selective first)
    const sortedFilters = this.sortFiltersBySelectivity(filters)

    for (const filter of sortedFilters) {
      filteredData = this.applyFilter(filteredData, filter);

      // Early exit if no data remains
      if (filteredData.length === 0) break
    }

    // Cache result
    this.filterCache.set(cacheKey, filteredData)
    this.metrics.filterTime = performance.now() - startTime;
    this.metrics.rowsProcessed = filteredData.length;

    return filteredData;
  }

  /**
   * Optimized sorting with caching
   */
  sortData(_data: T[], sorts: SortState[]): T[] {
    const startTime = performance.now();
    const cacheKey = this.generateSortCacheKey(data, sorts);

    // Check cache first
    if (this.sortCache.has(cacheKey)) {
      this.metrics.cacheHitRate++
      this.metrics.sortTime = performance.now() - startTime;
      return this.sortCache.get(cacheKey)!;
    }

    const sortedData = [...data].sort((a, b) => {
      for (const sort of sorts) {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);

        const comparison = this.compareValues(aValue, bValue);
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    // Cache result
    this.sortCache.set(cacheKey, sortedData)
    this.metrics.sortTime = performance.now() - startTime;

    return sortedData;
  }

  /**
   * Virtual scrolling for large datasets
   */
  getVirtualizedData(_data: T[],
    startIndex: number,
    endIndex: number
  ): {
    items: T[];
    totalHeight: number;
    offsetY: number;
  } {
    const startTime = performance.now();

    const items = data.slice(startIndex, endIndex + 1);
    const totalHeight = data.length * this.virtualizationConfig.rowHeight;
    const offsetY = startIndex * this.virtualizationConfig.rowHeight;

    this.metrics.renderTime = performance.now() - startTime;

    return {
      items,
      totalHeight,
      offsetY,
    }
  }

  /**
   * Bulk operations with batching and progress tracking
   */
  async performBulkOperation<R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const batches = this.createBatches(items, this.bulkConfig.batchSize);
    let completed = 0;

    // Process batches with controlled concurrency
    const semaphore = new Semaphore(this.bulkConfig.maxConcurrent)

    const batchPromises = batches.map(async (batch, index) => {
      await semaphore.acquire();

      try {
        const batchResults = await this.retryOperation(
          () => operation(batch),
          this.bulkConfig.retryAttempts
        );

        results.push(...batchResults);
        completed += batch.length;

        if (onProgress) {
          onProgress(completed, items.length);
        }

        return batchResults;
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(batchPromises);
    return results;
  }

  /**
   * Streaming export for large datasets
   */
  async *streamExport(_data: T[],
    config: ExportConfig,
    columns: { field: string; header: string; formatter?: (_value: any) => string }[]
  ): AsyncGenerator<string, void, unknown> {
    const startTime = performance.now();

    if (config.format === 'csv') {
      // Yield headers
      if (config.includeHeaders) {
        yield columns.map((col) => this.escapeCsvValue(col.header)).join(',') + '\n'
      }

      // Stream data in chunks
      for (let i = 0; i < data.length; i += config.chunkSize) {
        const chunk = data.slice(i, i + config.chunkSize);
        const csvChunk =
          chunk
            .map((row) =>
              columns
                .map((col) => {
                  const value = this.getNestedValue(row, col.field);
                  const formatted = col.formatter ? col.formatter(value) : String(value || '');
                  return this.escapeCsvValue(formatted);
                })
                .join(',')
            )
            .join('\n') + '\n';

        yield csvChunk;
      }
    } else if (config.format === 'excel') {
      // For Excel, we'd use a library like exceljs with streaming
      yield* this.streamExcelExport(data, columns, config)
    }

    this.metrics.exportTime = performance.now() - startTime;
  }

  /**
   * Advanced search with full-text indexing
   */
  searchData(_query: string, searchFields: string[]): T[] {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) return this.data;

    const searchTerms = normalizedQuery.split(/\s+/);

    return this.data.filter((item) => {
      return searchFields.some((field) => {
        const value = String(this.getNestedValue(item, field) || '').toLowerCase();
        return searchTerms.every((term) => value.includes(term));
      });
    });
  }

  /**
   * Memory-efficient aggregations
   */
  computeAggregations(_data: T[],
    aggregations: {
      field: string;
      operations: ('sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct')[];
    }[]
  ): Record<string, Record<string, any>> {
    const results: Record<string, Record<string, any>> = {}

    aggregations.forEach(({ field, operations }) => {
      const values = data.map((item) => this.getNestedValue(item, field)).filter((v) => v != null);
      const numericValues = values.filter((v) => typeof v === 'number');

      results[field] = {}

      operations.forEach((op) => {
        switch (op) {
          case 'sum':
            results[field][op] = numericValues.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            results[field][op] =
              numericValues.length > 0
                ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
                : 0;
            break;
          case 'min':
            results[field][op] = Math.min(...numericValues);
            break;
          case 'max':
            results[field][op] = Math.max(...numericValues);
            break;
          case 'count':
            results[field][op] = values.length;
            break;
          case 'distinct':
            results[field][op] = new Set(values).size;
            break;
        }
      });
    });

    return results;
  }

  // Helper methods
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private applyFilter(_data: T[], filter: FilterState): T[] {
    // Use index if available
    if (filter.operator === 'equals' && this.indexedFields.has(filter.field)) {
      const index = this.indexedFields.get(filter.field)!
      return index.get(filter.value) || [];
    }

    return data.filter((item) => {
      const value = this.getNestedValue(item, filter.field);
      return this.evaluateFilter(value, filter);
    });
  }

  private evaluateFilter(_value: any, filter: FilterState): boolean {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
      case 'gt':
        return value > filter.value;
      case 'lt':
        return value < filter.value;
      case 'between':
        return value >= filter.value[0] && value <= filter.value[1];
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      default:
        return false;
    }
  }

  private compareValues(a: any, b: any): number {
    if (a === b) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    return a < b ? -1 : 1;
  }

  private sortFiltersBySelectivity(_filters: FilterState[]): FilterState[] {
    // In a real implementation, we'd analyze field cardinality
    // For now, prioritize equality filters and indexed fields
    return filters.sort((a, b) => {
      const aSelectivity = this.getFilterSelectivity(a)
      const bSelectivity = this.getFilterSelectivity(b);
      return bSelectivity - aSelectivity;
    });
  }

  private getFilterSelectivity(filter: FilterState): number {
    if (filter.operator === 'equals' && this.indexedFields.has(filter.field)) {
      return 100;
    }
    if (filter.operator === 'equals') return 80;
    if (filter.operator === 'in') return 60;
    if (filter.operator === 'between') return 40;
    return 20;
  }

  private generateFilterCacheKey(_filters: FilterState[]): string {
    return JSON.stringify(
      filters.map((f) => ({ field: f.field, operator: f.operator, value: f.value }))
    );
  }

  private generateSortCacheKey(_data: T[], sorts: SortState[]): string {
    const dataHash = this.hashArray(data.slice(0, 100)); // Sample for performance
    const sortKey = JSON.stringify(sorts);
    return `${dataHash}-${sortKey}`;
  }

  private hashArray(arr: any[]): string {
    return String(arr.length) + JSON.stringify(arr[0]) + JSON.stringify(arr[arr.length - 1]);
  }

  private createBatches<U>(items: U[], batchSize: number): U[][] {
    const batches: U[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async retryOperation<R>(operation: () => Promise<R>, maxRetries: number): Promise<R> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private escapeCsvValue(_value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private async *streamExcelExport(_data: T[],
    columns: { field: string; header: string; formatter?: (_value: any) => string }[],
    config: ExportConfig
  ): AsyncGenerator<string, void, unknown> {
    // Placeholder for Excel streaming implementation
    // Would use libraries like exceljs or xlsx-stream-reader
    yield 'Excel streaming not implemented yet'
  }

  /**
   * Clear all caches to free memory
   */
  clearCaches(): void {
    this.cache.clear();
    this.filterCache.clear();
    this.sortCache.clear();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Optimize memory usage by clearing old cache entries
   */
  optimizeMemory(): void {
    const maxCacheSize = 100;

    if (this.filterCache.size > maxCacheSize) {
      const keysToDelete = Array.from(this.filterCache.keys()).slice(
        0,
        this.filterCache.size - maxCacheSize
      );
      keysToDelete.forEach((key) => this.filterCache.delete(key));
    }

    if (this.sortCache.size > maxCacheSize) {
      const keysToDelete = Array.from(this.sortCache.keys()).slice(
        0,
        this.sortCache.size - maxCacheSize
      );
      keysToDelete.forEach((key) => this.sortCache.delete(key));
    }
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

/**
 * React hook for using the performance optimizer
 */
export const useDataTableOptimizer = <T>(_data: T[],
  virtualizationConfig: VirtualizationConfig,
  bulkConfig: BulkOperationConfig
) => {
  const optimizer = useMemo(
    () => new DataTablePerformanceOptimizer(data, virtualizationConfig, bulkConfig),
    [data, virtualizationConfig, bulkConfig]
  );

  useEffect(() => {
    return () => {
      optimizer.clearCaches();
    }
  }, [optimizer]);

  const filterData = useCallback(
    (_filters: FilterState[]) => optimizer.filterData(filters),
    [optimizer]
  );

  const sortData = useCallback(
    (_data: T[], sorts: SortState[]) => optimizer.sortData(data, sorts),
    [optimizer]
  );

  const getVirtualizedData = useCallback(
    (_data: T[], startIndex: number, endIndex: number) =>
      optimizer.getVirtualizedData(data, startIndex, endIndex),
    [optimizer]
  );

  const performBulkOperation = useCallback(
    <R>(
      items: T[],
      operation: (batch: T[]) => Promise<R[]>,
      onProgress?: (completed: number, total: number) => void
    ) => optimizer.performBulkOperation(items, operation, onProgress),
    [optimizer]
  );

  const streamExport = useCallback(
    (_data: T[],
      config: ExportConfig,
      columns: { field: string; header: string; formatter?: (_value: any) => string }[]
    ) => optimizer.streamExport(data, config, columns),
    [optimizer]
  );

  const searchData = useCallback(
    (_query: string, searchFields: string[]) => optimizer.searchData(query, searchFields),
    [optimizer]
  );

  const computeAggregations = useCallback(
    (_data: T[],
      aggregations: {
        field: string;
        operations: ('sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct')[];
      }[]
    ) => optimizer.computeAggregations(data, aggregations),
    [optimizer]
  );

  return {
    filterData,
    sortData,
    getVirtualizedData,
    performBulkOperation,
    streamExport,
    searchData,
    computeAggregations,
    getMetrics: () => optimizer.getMetrics(),
    clearCaches: () => optimizer.clearCaches(),
    optimizeMemory: () => optimizer.optimizeMemory(),
  }
}

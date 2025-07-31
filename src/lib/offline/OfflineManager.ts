import { localStorageService } from '../storage/LocalStorageService';
import { autoSaveService } from '../data/AutoSaveService';

export interface OfflineConfig {
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  maxOfflineStorage: number; // in MB
}

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  endpoint: string;
  data: any;
  timestamp: string;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  syncedOperations: number;
  failedOperations: number;
  errors: Array<{
    operationId: string;
    error: string;
  }>;
  nextSyncTime?: Date;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private config: OfflineConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private operationQueue: Map<string, QueuedOperation> = new Map();
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;

  private constructor(config?: Partial<OfflineConfig>) {
    this.config = {
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      enableBackgroundSync: true,
      enablePushNotifications: false,
      maxOfflineStorage: 50, // 50MB
      ...config,
    };

    this.initializeEventListeners();
    this.loadQueuedOperations();
    this.startSyncTimer();
  }

  public static getInstance(config?: Partial<OfflineConfig>): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager(config);
    }
    return OfflineManager.instance;
  }

  private initializeEventListeners(): void {
    // Online/offline event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingOperations();
      }
    });

    // Page unload to save pending operations
    window.addEventListener('beforeunload', () => {
      this.saveQueuedOperations();
    });
  }

  private handleOnline = (): void => {
    console.log('Connection restored');
    this.isOnline = true;
    this.notifyListeners(true);

    // Start immediate sync when coming back online
    setTimeout(() => {
      this.syncPendingOperations();
    }, 1000);
  };

  private handleOffline = (): void => {
    console.log('Connection lost');
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private startSyncTimer(): void {
    if (!this.config.enableBackgroundSync) return;

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    }, this.config.syncInterval);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Queue operations for later sync
  public queueOperation(
    operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>
  ): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queuedOp: QueuedOperation = {
      id,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      ...operation,
    };

    this.operationQueue.set(id, queuedOp);

    // Save to local storage
    localStorageService.addToOfflineQueue({
      id,
      type: operation.type,
      endpoint: operation.endpoint,
      data: operation.data,
      timestamp: queuedOp.timestamp,
    });

    console.log(`Queued operation: ${operation.type} ${operation.resource}`);

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncPendingOperations(), 100);
    }

    return id;
  }

  // Remove operation from queue
  public removeOperation(operationId: string): boolean {
    const removed = this.operationQueue.delete(operationId);
    if (removed) {
      localStorageService.removeFromOfflineQueue(operationId);
    }
    return removed;
  }

  // Get queued operations
  public getQueuedOperations(): QueuedOperation[] {
    return Array.from(this.operationQueue.values());
  }

  // Get operations by type or resource
  public getOperationsByType(type: QueuedOperation['type']): QueuedOperation[] {
    return this.getQueuedOperations().filter((op) => op.type === type);
  }

  public getOperationsByResource(resource: string): QueuedOperation[] {
    return this.getQueuedOperations().filter((op) => op.resource === resource);
  }

  // Sync pending operations
  public async syncPendingOperations(): Promise<SyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: [],
      };
    }

    this.isSyncing = true;
    console.log('Starting sync of pending operations...');

    const operations = this.getSortedOperations();
    const errors: Array<{ operationId: string; error: string }> = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      for (const operation of operations) {
        try {
          const success = await this.executeOperation(operation);

          if (success) {
            this.removeOperation(operation.id);
            syncedCount++;
            console.log(`Synced operation: ${operation.id}`);
          } else {
            operation.retryCount++;

            if (operation.retryCount >= this.config.maxRetries) {
              errors.push({
                operationId: operation.id,
                error: 'Max retries exceeded',
              });
              this.removeOperation(operation.id);
              failedCount++;
            } else {
              // Update retry count in storage
              this.operationQueue.set(operation.id, operation);
            }
          }
        } catch (error) {
          operation.retryCount++;
          errors.push({
            operationId: operation.id,
            error: error instanceof Error ? error.message : String(error),
          });

          if (operation.retryCount >= this.config.maxRetries) {
            this.removeOperation(operation.id);
            failedCount++;
          } else {
            this.operationQueue.set(operation.id, operation);
          }
        }

        // Break if we've gone offline during sync
        if (!this.isOnline) {
          break;
        }
      }

      this.lastSyncTime = new Date();
      this.saveQueuedOperations();

      const result: SyncResult = {
        success: errors.length === 0,
        syncedOperations: syncedCount,
        failedOperations: failedCount,
        errors,
        nextSyncTime: new Date(Date.now() + this.config.syncInterval),
      };

      console.log('Sync completed:', result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  private getSortedOperations(): QueuedOperation[] {
    const operations = this.getQueuedOperations();

    // Sort by priority and timestamp
    return operations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); // Older first
    });
  }

  private async executeOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      const response = await fetch(operation.endpoint, {
        method: this.getHttpMethod(operation.type),
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Sync': 'true',
          'X-Operation-Id': operation.id,
        },
        body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined,
      });

      if (!response.ok) {
        console.error(`Operation failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const result = await response.json();

      // Handle any response metadata
      if (operation.metadata?.updateLocalData && result.data) {
        // Update local storage with server response
        autoSaveService.autoSave(operation.data.id, operation.resource as any, result.data, {
          immediate: true,
        });
      }

      return true;
    } catch (error) {
      console.error('Operation execution failed:', error);
      return false;
    }
  }

  private getHttpMethod(type: QueuedOperation['type']): string {
    switch (type) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  // Save/load operations to/from local storage
  private saveQueuedOperations(): void {
    const operations = Array.from(this.operationQueue.values());
    localStorageService.setCachedData('offline_operations', operations);
  }

  private loadQueuedOperations(): void {
    const operations =
      localStorageService.getCachedData<QueuedOperation[]>('offline_operations') || [];

    this.operationQueue.clear();
    operations.forEach((op) => {
      this.operationQueue.set(op.id, op);
    });

    console.log(`Loaded ${operations.length} queued operations`);
  }

  // Network status methods
  public isOnlineMode(): boolean {
    return this.isOnline;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  // Event listeners
  public addOnlineListener(callback: (isOnline: boolean) => void): void {
    this.listeners.add(callback);
  }

  public removeOnlineListener(callback: (isOnline: boolean) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((callback) => callback(isOnline));
  }

  // Storage management
  public async getStorageUsage(): Promise<{
    used: number;
    available: number;
    quota: number;
    percentage: number;
  }> {
    const storageInfo = localStorageService.getStorageInfo();
    const usedMB = storageInfo.used / (1024 * 1024);
    const quotaMB = this.config.maxOfflineStorage;

    return {
      used: usedMB,
      available: quotaMB - usedMB,
      quota: quotaMB,
      percentage: (usedMB / quotaMB) * 100,
    };
  }

  public async clearOfflineData(): Promise<boolean> {
    try {
      this.operationQueue.clear();
      localStorageService.clearOfflineQueue();
      localStorageService.setCachedData('offline_operations', []);
      console.log('Offline data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      return false;
    }
  }

  // Configuration management
  public updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart sync timer if interval changed
    if (newConfig.syncInterval !== undefined || newConfig.enableBackgroundSync !== undefined) {
      this.stopSyncTimer();
      this.startSyncTimer();
    }

    // Save config to local storage
    localStorageService.saveUserPreference('offlineConfig', this.config);
  }

  public getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Utility methods
  public canStoreOffline(): boolean {
    return localStorageService.getStorageInfo().available > 1024 * 1024; // At least 1MB available
  }

  public getPendingOperationsCount(): number {
    return this.operationQueue.size;
  }

  public getOperationsPendingByPriority(): Record<string, number> {
    const operations = this.getQueuedOperations();

    return {
      critical: operations.filter((op) => op.priority === 'critical').length,
      high: operations.filter((op) => op.priority === 'high').length,
      medium: operations.filter((op) => op.priority === 'medium').length,
      low: operations.filter((op) => op.priority === 'low').length,
    };
  }

  public async forceSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: [{ operationId: 'none', error: 'Device is offline' }],
      };
    }

    return this.syncPendingOperations();
  }

  // Cleanup
  public destroy(): void {
    this.stopSyncTimer();
    this.listeners.clear();
    this.saveQueuedOperations();

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// Hook for React components
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(offlineManager.isOnlineMode());
  const [pendingCount, setPendingCount] = React.useState(
    offlineManager.getPendingOperationsCount()
  );
  const [lastSync, setLastSync] = React.useState(offlineManager.getLastSyncTime());

  React.useEffect(() => {
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online);
      setPendingCount(offlineManager.getPendingOperationsCount());
      setLastSync(offlineManager.getLastSyncTime());
    };

    offlineManager.addOnlineListener(handleStatusChange);

    // Update pending count periodically
    const interval = setInterval(() => {
      setPendingCount(offlineManager.getPendingOperationsCount());
      setLastSync(offlineManager.getLastSyncTime());
    }, 5000);

    return () => {
      offlineManager.removeOnlineListener(handleStatusChange);
      clearInterval(interval);
    };
  }, []);

  const queueOperation = (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    return offlineManager.queueOperation(operation);
  };

  const forceSync = () => {
    return offlineManager.forceSync();
  };

  return {
    isOnline,
    pendingCount,
    lastSync,
    queueOperation,
    forceSync,
    isSyncing: offlineManager.isSyncInProgress(),
  };
}

import React from 'react';

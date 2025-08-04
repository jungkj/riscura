import React from 'react';
import { designTokens } from '@/lib/design-system/tokens';

// Offline storage types and interfaces
interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata?: Record<string, any>;
}

interface OfflineData {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt?: Date;
  version: number;
  checksum?: string;
}

interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  conflicts: number;
  errors: Array<{ actionId: string; error: string }>;
}

interface OfflineConfig {
  maxStorageSize: number; // MB
  maxRetries: number;
  retryDelay: number; // milliseconds
  syncInterval: number; // milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  criticalActions: string[];
}

class OfflineHandler {
  private config: OfflineConfig;
  private actionQueue: OfflineAction[] = [];
  private offlineData: Map<string, OfflineData> = new Map();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(_config: Partial<OfflineConfig> = {}) {
    this.config = {
      maxStorageSize: 50, // 50MB default
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      syncInterval: 30000, // 30 seconds
      enableCompression: true,
      enableEncryption: false,
      criticalActions: ['risk-assessment', 'compliance-update', 'incident-report'],
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return;

    // Load persisted data from localStorage
    this.loadPersistedData();

    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Set up periodic sync when online
    if (this.isOnline) {
      this.startPeriodicSync();
    }

    // Set up storage cleanup
    this.setupStorageCleanup();
  }

  // Online/Offline event handlers
  private handleOnline(): void {
    this.isOnline = true;
    this.emit('online');
    this.startPeriodicSync();
    this.syncPendingActions();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emit('offline');
    this.stopPeriodicSync();
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Action queue management
  public queueAction(
    type: string,
    data: any,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      maxRetries?: number;
      userId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const action: OfflineAction = {
      id: this.generateId(),
      type,
      data: this.compressData(data),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
      priority: options.priority || 'medium',
      userId: options.userId,
      metadata: options.metadata,
    };

    // Insert action based on priority
    this.insertActionByPriority(action);

    // Persist to localStorage
    this.persistActionQueue();

    // Emit event
    this.emit('actionQueued', action);

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncPendingActions();
    }

    return action.id;
  }

  private insertActionByPriority(action: OfflineAction): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const actionPriority = priorityOrder[action.priority];

    let insertIndex = this.actionQueue.length;
    for (let i = 0; i < this.actionQueue.length; i++) {
      const queuePriority = priorityOrder[this.actionQueue[i].priority];
      if (actionPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.actionQueue.splice(insertIndex, 0, action);
  }

  // Data caching
  public cacheData(key: string, data: any, expiresIn?: number): void {
    const offlineData: OfflineData = {
      key,
      data: this.compressData(data),
      timestamp: new Date(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
      version: 1,
      checksum: this.generateChecksum(data),
    };

    this.offlineData.set(key, offlineData);
    this.persistOfflineData();
    this.emit('dataCached', { key, data });
  }

  public getCachedData(key: string): any | null {
    const cachedData = this.offlineData.get(key);

    if (!cachedData) {
      return null;
    }

    // Check if data has expired
    if (cachedData.expiresAt && cachedData.expiresAt < new Date()) {
      this.offlineData.delete(key);
      this.persistOfflineData();
      return null;
    }

    return this.decompressData(cachedData.data);
  }

  public removeCachedData(key: string): void {
    this.offlineData.delete(key);
    this.persistOfflineData();
    this.emit('dataRemoved', { key });
  }

  // Sync operations
  public async syncPendingActions(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        conflicts: 0,
        errors: [],
      };
    }

    this.syncInProgress = true;
    this.emit('syncStarted');

    const result: SyncResult = {
      success: true,
      syncedActions: 0,
      failedActions: 0,
      conflicts: 0,
      errors: [],
    };

    const actionsToSync = [...this.actionQueue];

    for (const action of actionsToSync) {
      try {
        const syncSuccess = await this.syncAction(action);

        if (syncSuccess) {
          result.syncedActions++;
          this.removeActionFromQueue(action.id);
        } else {
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            result.failedActions++;
            this.removeActionFromQueue(action.id);
            result.errors.push({
              actionId: action.id,
              error: 'Max retries exceeded',
            });
          }
        }
      } catch (error) {
        result.failedActions++;
        result.errors.push({
          actionId: action.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        action.retryCount++;
        if (action.retryCount >= action.maxRetries) {
          this.removeActionFromQueue(action.id);
        }
      }
    }

    this.persistActionQueue();
    this.syncInProgress = false;
    this.emit('syncCompleted', result);

    return result;
  }

  private async syncAction(action: OfflineAction): Promise<boolean> {
    try {
      // Simulate API call - replace with actual API integration
      const response = await this.makeAPICall(action);

      if (response.success) {
        this.emit('actionSynced', action);
        return true;
      } else if (response.conflict) {
        this.handleSyncConflict(action, response.serverData);
        return false;
      } else {
        return false;
      }
    } catch (error) {
      // console.error('Sync action failed:', error);
      return false;
    }
  }

  private async makeAPICall(action: OfflineAction): Promise<any> {
    // This would be replaced with actual API calls
    // For now, simulate different responses
    return new Promise((resolve) => {
      setTimeout(() => {
        const random = Math.random();
        if (random > 0.9) {
          resolve({ success: false, conflict: true, serverData: {} });
        } else if (random > 0.1) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Network error' });
        }
      }, 100);
    });
  }

  private handleSyncConflict(action: OfflineAction, serverData: any): void {
    this.emit('syncConflict', {
      action,
      serverData,
      resolve: (resolution: 'local' | 'server' | 'merge', mergedData?: any) => {
        this.resolveSyncConflict(action, resolution, mergedData);
      },
    });
  }

  private resolveSyncConflict(
    action: OfflineAction,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): void {
    switch (resolution) {
      case 'local':
        // Keep local version, retry sync
        action.retryCount = 0;
        break;
      case 'server':
        // Accept server version, remove from queue
        this.removeActionFromQueue(action.id);
        break;
      case 'merge':
        // Use merged data, update action and retry
        action.data = mergedData;
        action.retryCount = 0;
        break;
    }

    this.persistActionQueue();
  }

  // Utility methods
  private removeActionFromQueue(actionId: string): void {
    this.actionQueue = this.actionQueue.filter((action) => action.id !== actionId);
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChecksum(_data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private compressData(_data: any): any {
    if (!this.config.enableCompression) {
      return data;
    }

    // Simple compression - in production, use a proper compression library
    try {
      const jsonString = JSON.stringify(data);
      // For now, just return the original data
      // In production, implement actual compression
      return data;
    } catch (error) {
      return data;
    }
  }

  private decompressData(_data: any): any {
    if (!this.config.enableCompression) {
      return data;
    }

    // Simple decompression - in production, use a proper compression library
    return data;
  }

  // Persistence methods
  private persistActionQueue(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const serialized = JSON.stringify(
        this.actionQueue.map((action) => ({
          ...action,
          timestamp: action.timestamp.toISOString(),
        }))
      );
      localStorage.setItem('riscura_offline_actions', serialized);
    } catch (error) {
      // console.error('Failed to persist action queue:', error);
    }
  }

  private persistOfflineData(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const dataArray = Array.from(this.offlineData.entries()).map(([key, data]) => ({
        ...data,
        key,
        timestamp: data.timestamp.toISOString(),
        expiresAt: data.expiresAt?.toISOString(),
      }));
      localStorage.setItem('riscura_offline_data', JSON.stringify(dataArray));
    } catch (error) {
      // console.error('Failed to persist offline data:', error);
    }
  }

  private loadPersistedData(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      // Load action queue
      const actionsData = localStorage.getItem('riscura_offline_actions');
      if (actionsData) {
        const actions = JSON.parse(actionsData);
        this.actionQueue = actions.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }

      // Load offline data
      const offlineData = localStorage.getItem('riscura_offline_data');
      if (offlineData) {
        const dataArray = JSON.parse(offlineData);
        this.offlineData = new Map(
          dataArray.map((item: any) => [
            item.key,
            {
              ...item,
              timestamp: new Date(item.timestamp),
              expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
            },
          ])
        );
      }
    } catch (error) {
      // console.error('Failed to load persisted data:', error);
    }
  }

  // Periodic sync
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.actionQueue.length > 0) {
        this.syncPendingActions();
      }
    }, this.config.syncInterval);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Storage cleanup
  private setupStorageCleanup(): void {
    // Clean up expired data every hour
    setInterval(() => {
      this.cleanupExpiredData();
    }, 3600000); // 1 hour
  }

  private cleanupExpiredData(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, data] of this.offlineData.entries()) {
      if (data.expiresAt && data.expiresAt < now) {
        this.offlineData.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.persistOfflineData();
      this.emit('dataCleanup', { cleaned });
    }
  }

  // Public API methods
  public getStatus(): {
    isOnline: boolean;
    queuedActions: number;
    cachedDataItems: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queuedActions: this.actionQueue.length,
      cachedDataItems: this.offlineData.size,
      syncInProgress: this.syncInProgress,
    };
  }

  public clearAllData(): void {
    this.actionQueue = [];
    this.offlineData.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('riscura_offline_actions');
      localStorage.removeItem('riscura_offline_data');
    }
    this.emit('dataCleared');
  }

  public getQueuedActions(): OfflineAction[] {
    return [...this.actionQueue];
  }

  public getCachedDataKeys(): string[] {
    return Array.from(this.offlineData.keys());
  }

  // Critical function handlers
  public async saveRiskAssessment(_data: any): Promise<string> {
    return this.queueAction('risk-assessment', data, {
      priority: 'critical',
      metadata: { type: 'risk-assessment' },
    });
  }

  public async updateCompliance(_data: any): Promise<string> {
    return this.queueAction('compliance-update', data, {
      priority: 'high',
      metadata: { type: 'compliance-update' },
    });
  }

  public async reportIncident(_data: any): Promise<string> {
    return this.queueAction('incident-report', data, {
      priority: 'critical',
      metadata: { type: 'incident-report' },
    });
  }

  public async saveFormData(formId: string, data: any): Promise<string> {
    // Cache form data for offline editing
    this.cacheData(`form_${formId}`, data, 24 * 60 * 60 * 1000); // 24 hours

    return this.queueAction(
      'form-save',
      { formId, data },
      {
        priority: 'medium',
        metadata: { type: 'form-save', formId },
      }
    );
  }

  public getFormData(formId: string): any | null {
    return this.getCachedData(`form_${formId}`);
  }

  // Cleanup
  public destroy(): void {
    this.stopPeriodicSync();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    this.eventListeners.clear();
  }
}

// Singleton instance
let offlineHandlerInstance: OfflineHandler | null = null;

export const getOfflineHandler = (config?: Partial<OfflineConfig>): OfflineHandler => {
  if (!offlineHandlerInstance) {
    offlineHandlerInstance = new OfflineHandler(config);
  }
  return offlineHandlerInstance;
};

// React hook for offline functionality
export const useOffline = () => {
  const offlineHandler = getOfflineHandler();
  const [status, setStatus] = React.useState(offlineHandler.getStatus());

  React.useEffect(() => {
    const updateStatus = () => setStatus(offlineHandler.getStatus());

    offlineHandler.on('online', updateStatus);
    offlineHandler.on('offline', updateStatus);
    offlineHandler.on('actionQueued', updateStatus);
    offlineHandler.on('syncCompleted', updateStatus);

    return () => {
      offlineHandler.off('online', updateStatus);
      offlineHandler.off('offline', updateStatus);
      offlineHandler.off('actionQueued', updateStatus);
      offlineHandler.off('syncCompleted', updateStatus);
    };
  }, [offlineHandler]);

  return {
    ...status,
    queueAction: offlineHandler.queueAction.bind(offlineHandler),
    cacheData: offlineHandler.cacheData.bind(offlineHandler),
    getCachedData: offlineHandler.getCachedData.bind(offlineHandler),
    syncPendingActions: offlineHandler.syncPendingActions.bind(offlineHandler),
    saveRiskAssessment: offlineHandler.saveRiskAssessment.bind(offlineHandler),
    updateCompliance: offlineHandler.updateCompliance.bind(offlineHandler),
    reportIncident: offlineHandler.reportIncident.bind(offlineHandler),
    saveFormData: offlineHandler.saveFormData.bind(offlineHandler),
    getFormData: offlineHandler.getFormData.bind(offlineHandler),
  };
};

export default OfflineHandler;

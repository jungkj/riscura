import { localStorageService } from '../storage/LocalStorageService';

export interface AutoSaveConfig {
  interval: number; // milliseconds
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  debounceTime: number;
  syncToServer: boolean;
  backupLocally: boolean;
}

export interface AutoSaveData {
  id: string;
  type: 'questionnaire' | 'risk' | 'control' | 'document' | 'form';
  data: any;
  lastModified: string;
  version: number;
  isDirty: boolean;
  isOnline: boolean;
  syncStatus: 'pending' | 'synced' | 'error' | 'conflict';
  retryCount: number;
  errorMessage?: string;
}

export class AutoSaveService {
  private static instance: AutoSaveService;
  private saveQueue: Map<string, AutoSaveData> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isOnline: boolean = navigator.onLine;
  private config: AutoSaveConfig;
  private listeners: Set<(data: AutoSaveData) => void> = new Set();

  private constructor(config?: Partial<AutoSaveConfig>) {
    this.config = {
      interval: 30000, // 30 seconds
      enabled: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      debounceTime: 2000, // 2 seconds
      syncToServer: true,
      backupLocally: true,
      ...config,
    };

    this.initializeEventListeners();
    this.startPeriodicSync();
  }

  public static getInstance(config?: Partial<AutoSaveConfig>): AutoSaveService {
    if (!AutoSaveService.instance) {
      AutoSaveService.instance = new AutoSaveService(config);
    }
    return AutoSaveService.instance;
  }

  private initializeEventListeners(): void {
    // Online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page unload listener to save any pending changes
    window.addEventListener('beforeunload', (event) => {
      if (this.hasPendingChanges()) {
        this.forceSaveAll();
        // Note: Modern browsers ignore custom messages in beforeunload
        event.preventDefault();
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    });

    // Visibility change listener for mobile/tab switching
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.forceSaveAll();
      }
    });
  }

  private startPeriodicSync(): void {
    if (!this.config.enabled) return;

    setInterval(() => {
      this.syncPendingChanges();
    }, this.config.interval);
  }

  // Main auto-save method
  public autoSave(
    id: string,
    type: AutoSaveData['type'],
    data: any,
    options?: {
      immediate?: boolean;
      skipValidation?: boolean;
      customDebounce?: number;
    }
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return Promise.resolve(false);
    }

    const existingData = this.saveQueue.get(id);
    const version = existingData ? existingData.version + 1 : 1;

    const saveData: AutoSaveData = {
      id,
      type,
      data: { ...data },
      lastModified: new Date().toISOString(),
      version,
      isDirty: true,
      isOnline: this.isOnline,
      syncStatus: 'pending',
      retryCount: 0,
    };

    this.saveQueue.set(id, saveData);

    // Clear existing timer for this item
    const existingTimer = this.timers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Notify listeners
    this.notifyListeners(saveData);

    if (options?.immediate) {
      return this.performSave(id);
    } else {
      // Debounced save
      const debounceTime = options?.customDebounce || this.config.debounceTime;
      const timer = setTimeout(() => {
        this.performSave(id);
      }, debounceTime);

      this.timers.set(id, timer);
      return Promise.resolve(true);
    }
  }

  private async performSave(id: string): Promise<boolean> {
    const saveData = this.saveQueue.get(id);
    if (!saveData) return false;

    try {
      // Always save to local storage first
      if (this.config.backupLocally) {
        const success = localStorageService.saveDraft(saveData.type, saveData.id, {
          ...saveData.data,
          autoSaveVersion: saveData.version,
          lastAutoSave: saveData.lastModified,
        });

        if (!success) {
          throw new Error('Failed to save to local storage');
        }
      }

      // Try to sync to server if online
      if (this.config.syncToServer && this.isOnline) {
        const syncSuccess = await this.syncToServer(saveData);
        if (syncSuccess) {
          saveData.syncStatus = 'synced';
          saveData.isDirty = false;
          saveData.retryCount = 0;
          delete saveData.errorMessage;
        } else {
          throw new Error('Server sync failed');
        }
      } else {
        // Queue for later sync when online
        saveData.syncStatus = 'pending';
      }

      this.saveQueue.set(id, saveData);
      this.notifyListeners(saveData);

      return true;
    } catch (error) {
      saveData.syncStatus = 'error';
      saveData.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      saveData.retryCount++;

      this.saveQueue.set(id, saveData);
      this.notifyListeners(saveData);

      // Schedule retry if under max retry limit
      if (saveData.retryCount < this.config.maxRetries) {
        setTimeout(() => {
          this.performSave(id);
        }, this.config.retryDelay * saveData.retryCount);
      }

      console.error('Auto-save failed:', error);
      return false;
    }
  }

  private async syncToServer(saveData: AutoSaveData): Promise<boolean> {
    try {
      // This would be replaced with actual API calls
      const endpoint = this.getEndpointForType(saveData.type);
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: saveData.id,
          data: saveData.data,
          version: saveData.version,
          lastModified: saveData.lastModified,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle version conflicts
      if (result.conflict) {
        saveData.syncStatus = 'conflict';
        saveData.errorMessage = 'Version conflict detected';
        return false;
      }

      return true;
    } catch (error) {
      console.error('Server sync error:', error);
      return false;
    }
  }

  private getEndpointForType(type: AutoSaveData['type']): string {
    const baseUrl = '/api';
    switch (type) {
      case 'questionnaire':
        return `${baseUrl}/questionnaires`;
      case 'risk':
        return `${baseUrl}/risks`;
      case 'control':
        return `${baseUrl}/controls`;
      case 'document':
        return `${baseUrl}/documents`;
      case 'form':
        return `${baseUrl}/forms`;
      default:
        return `${baseUrl}/data`;
    }
  }

  // Sync all pending changes
  public async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || !this.config.syncToServer) return;

    const pendingItems = Array.from(this.saveQueue.values()).filter(
      (item) => item.syncStatus === 'pending' || item.syncStatus === 'error'
    );

    const syncPromises = pendingItems.map((item) => this.performSave(item.id));
    await Promise.all(syncPromises);
  }

  // Force save all items immediately
  public forceSaveAll(): void {
    const allTimers = Array.from(this.timers.values());
    allTimers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    const savePromises = Array.from(this.saveQueue.keys()).map((id) => this.performSave(id));

    // Use Promise.allSettled to ensure all saves are attempted
    Promise.allSettled(savePromises);
  }

  // Get save status for an item
  public getSaveStatus(id: string): AutoSaveData | null {
    return this.saveQueue.get(id) || null;
  }

  // Get all save statuses
  public getAllSaveStatuses(): AutoSaveData[] {
    return Array.from(this.saveQueue.values());
  }

  // Check if there are any pending changes
  public hasPendingChanges(): boolean {
    return Array.from(this.saveQueue.values()).some(
      (item) => item.isDirty || item.syncStatus === 'pending'
    );
  }

  // Get pending changes count
  public getPendingChangesCount(): number {
    return Array.from(this.saveQueue.values()).filter(
      (item) => item.isDirty || item.syncStatus === 'pending'
    ).length;
  }

  // Clear save data for an item
  public clearSaveData(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.saveQueue.delete(id);
  }

  // Clear all save data
  public clearAllSaveData(): void {
    Array.from(this.timers.values()).forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.saveQueue.clear();
  }

  // Load draft from local storage
  public loadDraft(type: string, id: string): any | null {
    return localStorageService.getDraft(type, id);
  }

  // Check if draft exists
  public hasDraft(type: string, id: string): boolean {
    return localStorageService.getDraft(type, id) !== null;
  }

  // Delete draft
  public deleteDraft(type: string, id: string): boolean {
    this.clearSaveData(id);
    return localStorageService.deleteDraft(type, id);
  }

  // Configuration management
  public updateConfig(newConfig: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Save config to local storage
    localStorageService.saveUserPreference('autoSaveConfig', this.config);
  }

  public getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  // Event listeners for UI updates
  public addListener(callback: (data: AutoSaveData) => void): void {
    this.listeners.add(callback);
  }

  public removeListener(callback: (data: AutoSaveData) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(data: AutoSaveData): void {
    this.listeners.forEach((callback) => callback(data));
  }

  // Utility methods
  public isOnlineMode(): boolean {
    return this.isOnline;
  }

  public getLastSaveTime(id: string): Date | null {
    const saveData = this.saveQueue.get(id);
    return saveData ? new Date(saveData.lastModified) : null;
  }

  public getVersion(id: string): number {
    const saveData = this.saveQueue.get(id);
    return saveData ? saveData.version : 0;
  }

  // Conflict resolution
  public resolveConflict(
    id: string,
    resolution: 'keep_local' | 'keep_server' | 'merge',
    mergedData?: any
  ): boolean {
    const saveData = this.saveQueue.get(id);
    if (!saveData || saveData.syncStatus !== 'conflict') {
      return false;
    }

    switch (resolution) {
      case 'keep_local':
        saveData.syncStatus = 'pending';
        saveData.retryCount = 0;
        delete saveData.errorMessage;
        this.performSave(id);
        break;

      case 'keep_server':
        this.clearSaveData(id);
        localStorageService.deleteDraft(saveData.type, saveData.id);
        break;

      case 'merge':
        if (mergedData) {
          saveData.data = mergedData;
          saveData.syncStatus = 'pending';
          saveData.retryCount = 0;
          delete saveData.errorMessage;
          this.performSave(id);
        }
        break;
    }

    return true;
  }

  // Statistics
  public getStatistics(): {
    totalItems: number;
    pendingSync: number;
    errors: number;
    conflicts: number;
    lastSyncTime: Date | null;
  } {
    const items = Array.from(this.saveQueue.values());

    return {
      totalItems: items.length,
      pendingSync: items.filter((item) => item.syncStatus === 'pending').length,
      errors: items.filter((item) => item.syncStatus === 'error').length,
      conflicts: items.filter((item) => item.syncStatus === 'conflict').length,
      lastSyncTime:
        items.length > 0
          ? new Date(Math.max(...items.map((item) => new Date(item.lastModified).getTime())))
          : null,
    };
  }
}

// Export singleton instance
export const autoSaveService = AutoSaveService.getInstance();

// Export configuration helper
export const getAutoSaveConfig = (): AutoSaveConfig => {
  const savedConfig = localStorageService.getUserPreference<AutoSaveConfig>('autoSaveConfig');
  return (
    savedConfig || {
      interval: 30000,
      enabled: true,
      maxRetries: 3,
      retryDelay: 5000,
      debounceTime: 2000,
      syncToServer: true,
      backupLocally: true,
    }
  );
};

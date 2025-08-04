// Local Storage Service for managing client-side data persistence
export class LocalStorageService {
  private static instance: LocalStorageService;
  private storageKeys = {
    DRAFTS: 'riscura_drafts',
    USER_PREFERENCES: 'riscura_user_preferences',
    OFFLINE_QUEUE: 'riscura_offline_queue',
    CACHED_DATA: 'riscura_cached_data',
    SESSION_DATA: 'riscura_session_data',
    FORM_BACKUP: 'riscura_form_backup',
    SEARCH_HISTORY: 'riscura_search_history',
    COLLABORATION_STATE: 'riscura_collaboration_state',
  } as const;

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  private initializeStorage(): void {
    // Initialize storage with default values if not present
    Object.values(this.storageKeys).forEach((key) => {
      if (!this.getItem(key)) {
        this.setItem(key, {});
      }
    });
  }

  // Generic storage methods
  private setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      // console.error('LocalStorage setItem error:', error)
      return false;
    }
  }

  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      // console.error('LocalStorage getItem error:', error)
      return null;
    }
  }

  private removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      // console.error('LocalStorage removeItem error:', error)
      return false;
    }
  }

  // Draft Management
  public saveDraft(
    _type: 'questionnaire' | 'risk' | 'control' | 'document' | 'form',
    id: string,
    data: any
  ): boolean {
    const drafts = this.getItem<Record<string, any>>(this.storageKeys.DRAFTS) || {};
    const draftKey = `${type}_${id}`;

    drafts[draftKey] = {
      ...data,
      lastModified: new Date().toISOString(),
      type,
      id,
      autoSaved: true,
    };

    return this.setItem(this.storageKeys.DRAFTS, drafts);
  }

  public getDraft(_type: string, id: string): any | null {
    const drafts = this.getItem<Record<string, any>>(this.storageKeys.DRAFTS) || {};
    const draftKey = `${type}_${id}`;
    return drafts[draftKey] || null;
  }

  public getAllDrafts(): Record<string, any> {
    return this.getItem<Record<string, any>>(this.storageKeys.DRAFTS) || {};
  }

  public deleteDraft(_type: string, id: string): boolean {
    const drafts = this.getItem<Record<string, any>>(this.storageKeys.DRAFTS) || {};
    const draftKey = `${type}_${id}`;

    if (drafts[draftKey]) {
      delete drafts[draftKey];
      return this.setItem(this.storageKeys.DRAFTS, drafts);
    }
    return true;
  }

  public clearExpiredDrafts(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    // Clear drafts older than maxAge (default 7 days)
    const drafts = this.getItem<Record<string, any>>(this.storageKeys.DRAFTS) || {};
    const now = new Date().getTime();

    Object.keys(drafts).forEach((key) => {
      const draft = drafts[key];
      if (draft.lastModified) {
        const draftTime = new Date(draft.lastModified).getTime();
        if (now - draftTime > maxAge) {
          delete drafts[key];
        }
      }
    });

    this.setItem(this.storageKeys.DRAFTS, drafts);
  }

  // User Preferences
  public saveUserPreference(key: string, value: any): boolean {
    const preferences = this.getItem<Record<string, any>>(this.storageKeys.USER_PREFERENCES) || {};
    preferences[key] = value;
    return this.setItem(this.storageKeys.USER_PREFERENCES, preferences);
  }

  public getUserPreference<T>(key: string, defaultValue?: T): T | null {
    const preferences = this.getItem<Record<string, any>>(this.storageKeys.USER_PREFERENCES) || {};
    return preferences[key] !== undefined ? preferences[key] : defaultValue || null;
  }

  public getAllUserPreferences(): Record<string, any> {
    return this.getItem<Record<string, any>>(this.storageKeys.USER_PREFERENCES) || {};
  }

  // Offline Queue Management
  public addToOfflineQueue(operation: {
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data: any;
    timestamp: string;
    retryCount?: number;
  }): boolean {
    const queue = this.getItem<any[]>(this.storageKeys.OFFLINE_QUEUE) || [];
    queue.push(operation);
    return this.setItem(this.storageKeys.OFFLINE_QUEUE, queue);
  }

  public getOfflineQueue(): any[] {
    return this.getItem<any[]>(this.storageKeys.OFFLINE_QUEUE) || [];
  }

  public removeFromOfflineQueue(operationId: string): boolean {
    const queue = this.getItem<any[]>(this.storageKeys.OFFLINE_QUEUE) || [];
    const updatedQueue = queue.filter((op) => op.id !== operationId);
    return this.setItem(this.storageKeys.OFFLINE_QUEUE, updatedQueue);
  }

  public clearOfflineQueue(): boolean {
    return this.setItem(this.storageKeys.OFFLINE_QUEUE, []);
  }

  // Cache Management
  public setCachedData(key: string, data: any, ttl?: number): boolean {
    const cache = this.getItem<Record<string, any>>(this.storageKeys.CACHED_DATA) || {};
    cache[key] = {
      data,
      timestamp: new Date().toISOString(),
      ttl: ttl || 3600000, // Default 1 hour
    };
    return this.setItem(this.storageKeys.CACHED_DATA, cache);
  }

  public getCachedData<T>(key: string): T | null {
    const cache = this.getItem<Record<string, any>>(this.storageKeys.CACHED_DATA) || {};
    const _cached = cache[key];

    if (!cached) return null;

    const now = new Date().getTime();
    const cachedTime = new Date(cached.timestamp).getTime();

    if (now - cachedTime > cached.ttl) {
      // Cache expired
      delete cache[key];
      this.setItem(this.storageKeys.CACHED_DATA, cache);
      return null;
    }

    return cached.data;
  }

  public clearExpiredCache(): void {
    const cache = this.getItem<Record<string, any>>(this.storageKeys.CACHED_DATA) || {};
    const now = new Date().getTime();

    Object.keys(cache).forEach((key) => {
      const _cached = cache[key];
      if (cached.timestamp) {
        const cachedTime = new Date(cached.timestamp).getTime();
        if (now - cachedTime > cached.ttl) {
          delete cache[key];
        }
      }
    });

    this.setItem(this.storageKeys.CACHED_DATA, cache);
  }

  // Form Backup
  public backupFormData(formId: string, data: any): boolean {
    const backups = this.getItem<Record<string, any>>(this.storageKeys.FORM_BACKUP) || {};
    backups[formId] = {
      data,
      timestamp: new Date().toISOString(),
    };
    return this.setItem(this.storageKeys.FORM_BACKUP, backups);
  }

  public getFormBackup(formId: string): any | null {
    const backups = this.getItem<Record<string, any>>(this.storageKeys.FORM_BACKUP) || {};
    return backups[formId]?.data || null;
  }

  public clearFormBackup(formId: string): boolean {
    const backups = this.getItem<Record<string, any>>(this.storageKeys.FORM_BACKUP) || {};
    if (backups[formId]) {
      delete backups[formId];
      return this.setItem(this.storageKeys.FORM_BACKUP, backups);
    }
    return true;
  }

  // Search History
  public addSearchHistory(_query: string, filters?: any): boolean {
    const history = this.getItem<any[]>(this.storageKeys.SEARCH_HISTORY) || [];
    const searchEntry = {
      query,
      filters,
      timestamp: new Date().toISOString(),
    };

    // Remove duplicate queries
    const filtered = history.filter((h) => h.query !== query);
    filtered.unshift(searchEntry);

    // Keep only last 20 searches
    const limited = filtered.slice(0, 20);

    return this.setItem(this.storageKeys.SEARCH_HISTORY, limited);
  }

  public getSearchHistory(): any[] {
    return this.getItem<any[]>(this.storageKeys.SEARCH_HISTORY) || [];
  }

  public clearSearchHistory(): boolean {
    return this.setItem(this.storageKeys.SEARCH_HISTORY, []);
  }

  // Collaboration State
  public saveCollaborationState(documentId: string, state: any): boolean {
    const collabState =
      this.getItem<Record<string, any>>(this.storageKeys.COLLABORATION_STATE) || {};
    collabState[documentId] = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    return this.setItem(this.storageKeys.COLLABORATION_STATE, collabState);
  }

  public getCollaborationState(documentId: string): any | null {
    const collabState =
      this.getItem<Record<string, any>>(this.storageKeys.COLLABORATION_STATE) || {};
    return collabState[documentId] || null;
  }

  // Storage Management
  public getStorageInfo(): {
    used: number;
    available: number;
    quota: number;
  } {
    let used = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      // console.error('Error calculating storage usage:', error)
    }

    const quota = 5 * 1024 * 1024; // Assume 5MB quota
    return {
      used,
      available: quota - used,
      quota,
    };
  }

  public clearAllStorage(): boolean {
    try {
      Object.values(this.storageKeys).forEach((key) => {
        localStorage.removeItem(key);
      });
      this.initializeStorage();
      return true;
    } catch (error) {
      // console.error('Error clearing storage:', error)
      return false;
    }
  }

  // Export/Import
  public exportData(): string {
    const data: Record<string, any> = {};
    Object.values(this.storageKeys).forEach((key) => {
      data[key] = this.getItem(key);
    });
    return JSON.stringify(data, null, 2);
  }

  public importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(this.storageKeys).includes(key as any)) {
          this.setItem(key, value);
        }
      });
      return true;
    } catch (error) {
      // console.error('Error importing data:', error)
      return false;
    }
  }
}

// Export singleton instance
export const localStorageService = LocalStorageService.getInstance();

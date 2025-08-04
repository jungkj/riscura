'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface StorageOptions {
  key: string;
  defaultValue?: any;
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  syncToServer?: boolean;
  syncEndpoint?: string;
  syncInterval?: number;
  compress?: boolean;
  encrypt?: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingSync: boolean;
  syncError: string | null;
}

// IndexedDB wrapper for complex data storage
class IndexedDBStorage {
  private dbName = 'RiscuraOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const _result = request.result;
        resolve(result ? result.value : null);
      };
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addToSyncQueue(_data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.add({
        data,
        timestamp: Date.now(),
        attempts: 0,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const indexedDBStorage = new IndexedDBStorage();

export function useOfflineStorage<T>(_options: StorageOptions) {
  const {
    key,
    defaultValue,
    storage = 'localStorage',
    syncToServer = false,
    syncEndpoint,
    syncInterval = 30000,
    compress = false,
    encrypt = false,
  } = options;

  const [data, setData] = useState<T>(defaultValue);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTime: null,
    pendingSync: false,
    syncError: null,
  });

  const syncTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Storage operations
  const getFromStorage = useCallback(
    async (storageKey: string): Promise<T | null> => {
      try {
        switch (storage) {
          case 'localStorage':
            if (typeof window === 'undefined') return null;
            const localItem = localStorage.getItem(storageKey);
            return localItem ? JSON.parse(localItem) : null;

          case 'sessionStorage':
            if (typeof window === 'undefined') return null;
            const sessionItem = sessionStorage.getItem(storageKey);
            return sessionItem ? JSON.parse(sessionItem) : null;

          case 'indexedDB':
            return await indexedDBStorage.get(storageKey);

          default:
            return null;
        }
      } catch (error) {
        // console.error('Error reading from storage:', error)
        return null;
      }
    },
    [storage]
  );

  const saveToStorage = useCallback(
    async (storageKey: string, value: T): Promise<void> => {
      try {
        const serializedValue = JSON.stringify(value);

        switch (storage) {
          case 'localStorage':
            if (typeof window !== 'undefined') {
              localStorage.setItem(storageKey, serializedValue);
            }
            break;

          case 'sessionStorage':
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(storageKey, serializedValue);
            }
            break;

          case 'indexedDB':
            await indexedDBStorage.set(storageKey, value);
            break;
        }
      } catch (error) {
        // console.error('Error saving to storage:', error)
      }
    },
    [storage]
  );

  const removeFromStorage = useCallback(
    async (storageKey: string): Promise<void> => {
      try {
        switch (storage) {
          case 'localStorage':
            if (typeof window !== 'undefined') {
              localStorage.removeItem(storageKey);
            }
            break;

          case 'sessionStorage':
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(storageKey);
            }
            break;

          case 'indexedDB':
            await indexedDBStorage.remove(storageKey);
            break;
        }
      } catch (error) {
        // console.error('Error removing from storage:', error)
      }
    },
    [storage]
  );

  // Sync operations
  const syncToServerFunc = useCallback(
    async (_value: T): Promise<boolean> => {
      if (!syncToServer || !syncEndpoint || !syncStatus.isOnline) {
        return false;
      }

      setSyncStatus((prev) => ({ ...prev, pendingSync: true, syncError: null }));

      try {
        const response = await fetch(syncEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            data: value,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        setSyncStatus((prev) => ({
          ...prev,
          pendingSync: false,
          lastSyncTime: new Date(),
          syncError: null,
        }));

        return true;
      } catch (error) {
        // console.error('Sync to server failed:', error)

        // Add to sync queue for later retry
        if (storage === 'indexedDB') {
          await indexedDBStorage.addToSyncQueue({ key, data: value });
        }

        setSyncStatus((prev) => ({
          ...prev,
          pendingSync: false,
          syncError: error instanceof Error ? error.message : 'Sync failed',
        }));

        return false;
      }
    },
    [syncToServer, syncEndpoint, syncStatus.isOnline, key, storage]
  );

  const syncFromServer = useCallback(async (): Promise<T | null> => {
    if (!syncToServer || !syncEndpoint || !syncStatus.isOnline) {
      return null;
    }

    try {
      const response = await fetch(`${syncEndpoint}/${key}`);

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`);
      }

      const serverData = await response.json();
      return serverData.data;
    } catch (error) {
      // console.error('Sync from server failed:', error)
      return null;
    }
  }, [syncToServer, syncEndpoint, syncStatus.isOnline, key]);

  // Process sync queue when coming back online
  const processSyncQueue = useCallback(async () => {
    if (storage !== 'indexedDB' || !syncStatus.isOnline) return;

    try {
      const queueItems = await indexedDBStorage.getSyncQueue();

      for (const item of queueItems) {
        const success = await syncToServerFunc(item.data.data);
        if (success) {
          // Remove from queue on successful sync
          // In a real implementation, you'd remove individual items
        }
      }

      if (queueItems.length > 0) {
        await indexedDBStorage.clearSyncQueue();
      }
    } catch (error) {
      // console.error('Error processing sync queue:', error)
    }
  }, [storage, syncStatus.isOnline, syncToServerFunc]);

  // Update data and sync
  const updateData = useCallback(
    async (_newData: T | ((prev: T) => T)) => {
      const updatedData =
        typeof newData === 'function' ? (newData as (prev: T) => T)(data) : newData;

      setData(updatedData);
      await saveToStorage(key, updatedData);

      // Sync to server if enabled
      if (syncToServer && syncStatus.isOnline) {
        await syncToServerFunc(updatedData);
      }
    },
    [data, key, saveToStorage, syncToServer, syncStatus.isOnline, syncToServerFunc]
  );

  // Clear data
  const clearData = useCallback(async () => {
    setData(defaultValue);
    await removeFromStorage(key);
  }, [defaultValue, key, removeFromStorage]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!syncStatus.isOnline) return false;

    // Sync current data to server
    const syncSuccess = await syncToServerFunc(data);

    // Try to get updated data from server
    const serverData = await syncFromServer();
    if (serverData) {
      setData(serverData);
      await saveToStorage(key, serverData);
    }

    return syncSuccess;
  }, [syncStatus.isOnline, syncToServerFunc, data, syncFromServer, key, saveToStorage]);

  // Initialize data from storage
  useEffect(() => {
    if (isInitialized.current) return;

    const initializeData = async () => {
      const storedData = await getFromStorage(key);

      if (storedData !== null) {
        setData(storedData);
      } else if (defaultValue !== undefined) {
        setData(defaultValue);
        await saveToStorage(key, defaultValue);
      }

      // Try to sync from server on initialization
      if (syncToServer && syncStatus.isOnline) {
        const serverData = await syncFromServer();
        if (serverData) {
          setData(serverData);
          await saveToStorage(key, serverData);
        }
      }

      isInitialized.current = true;
    };

    initializeData();
  }, [
    key,
    defaultValue,
    getFromStorage,
    saveToStorage,
    syncToServer,
    syncStatus.isOnline,
    syncFromServer,
  ]);

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      processSyncQueue();
    };

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processSyncQueue]);

  // Auto-sync interval
  useEffect(() => {
    if (!syncToServer || !syncInterval) return;

    syncTimer.current = setInterval(() => {
      if (syncStatus.isOnline) {
        forceSync();
      }
    }, syncInterval);

    return () => {
      if (syncTimer.current) {
        clearInterval(syncTimer.current);
      }
    };
  }, [syncToServer, syncInterval, syncStatus.isOnline, forceSync]);

  return {
    data,
    updateData,
    clearData,
    forceSync,
    syncStatus,
    isLoading: !isInitialized.current,
  };
}

// Hook for managing offline form data
export function useOfflineForm<T extends Record<string, any>>(
  formId: string,
  initialData: T,
  options: Omit<StorageOptions, 'key' | 'defaultValue'> = {}
) {
  const {
    data: formData,
    updateData: updateFormData,
    clearData: clearFormData,
    syncStatus,
    isLoading,
  } = useOfflineStorage<T>({
    key: `form-${formId}`,
    defaultValue: initialData,
    ...options,
  });

  const updateField = useCallback(
    (fieldName: keyof T, value: any) => {
      updateFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    [updateFormData]
  );

  const resetForm = useCallback(() => {
    updateFormData(initialData);
  }, [updateFormData, initialData]);

  const isDirty = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  return {
    formData,
    updateField,
    updateFormData,
    resetForm,
    clearFormData,
    isDirty: isDirty(),
    syncStatus,
    isLoading,
  };
}

// Hook for offline data synchronization
export function useOfflineSync() {
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = useCallback(async (_data: any) => {
    await indexedDBStorage.addToSyncQueue(data);
    const queue = await indexedDBStorage.getSyncQueue();
    setSyncQueue(queue);
  }, []);

  const processQueue = useCallback(
    async (syncEndpoint: string) => {
      if (isSyncing || !navigator.onLine) return;

      setIsSyncing(true);

      try {
        const queue = await indexedDBStorage.getSyncQueue();

        for (const item of queue) {
          try {
            const response = await fetch(syncEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });

            if (!response.ok) {
              throw new Error(`Sync failed: ${response.statusText}`);
            }
          } catch (error) {
            // console.error('Failed to sync item:', error)
            // In a real implementation, you might want to increment attempt count
            // and remove items that have failed too many times
          }
        }

        await indexedDBStorage.clearSyncQueue();
        setSyncQueue([]);
      } catch (error) {
        // console.error('Error processing sync queue:', error)
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing]
  );

  useEffect(() => {
    const loadQueue = async () => {
      const queue = await indexedDBStorage.getSyncQueue();
      setSyncQueue(queue);
    };

    loadQueue();
  }, []);

  return {
    syncQueue,
    queueCount: syncQueue.length,
    isSyncing,
    addToQueue,
    processQueue,
  };
}

export default useOfflineStorage;

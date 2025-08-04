'use client';

import { useState, useEffect, useCallback } from 'react';

// Service Worker utilities for PWA functionality
export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly';
  maxEntries?: number;
  maxAgeSeconds?: number;
}

export interface ServiceWorkerConfig {
  swPath?: string;
  cacheStrategies?: CacheStrategy[];
  enableBackgroundSync?: boolean;
  enablePushNotifications?: boolean;
  enableOfflineAnalytics?: boolean;
  updateCheckInterval?: number;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: Required<ServiceWorkerConfig>;
  private updateAvailable = false;
  private isOnline = navigator.onLine;
  private syncQueue: any[] = [];

  constructor(_config: ServiceWorkerConfig = {}) {
    this.config = {
      swPath: '/sw.js',
      cacheStrategies: [],
      enableBackgroundSync: true,
      enablePushNotifications: false,
      enableOfflineAnalytics: true,
      updateCheckInterval: 60000, // 1 minute
      ...config,
    };

    this.init();
  }

  private async init(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      // console.warn('Service Worker not supported')
      return;
    }

    try {
      await this.register();
      this.setupEventListeners();
      this.startUpdateCheck();
    } catch (error) {
      // console.error('Service Worker initialization failed:', error)
    }
  }

  // Register service worker
  private async register(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register(this.config.swPath);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // console.log('Service Worker registered successfully')
    } catch (error) {
      throw new Error(`Service Worker registration failed: ${error}`);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Handle controlled event
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        // console.log('Cache updated:', payload)
        break;
      case 'OFFLINE_FALLBACK':
        this.handleOfflineFallback(payload);
        break;
      case 'BACKGROUND_SYNC':
        this.handleBackgroundSync(payload);
        break;
      case 'PUSH_RECEIVED':
        this.handlePushReceived(payload);
        break;
      default:
      // console.log('Unknown service worker message:', type, payload)
    }
  }

  // Handle offline fallback
  private handleOfflineFallback(payload: any): void {
    // Show offline notification or fallback UI
    document.dispatchEvent(new CustomEvent('offline-fallback', { detail: payload }));
  }

  // Handle background sync
  private handleBackgroundSync(payload: any): void {
    if (this.config.enableBackgroundSync) {
      document.dispatchEvent(new CustomEvent('background-sync-complete', { detail: payload }));
    }
  }

  // Handle push notification received
  private handlePushReceived(payload: any): void {
    if (this.config.enablePushNotifications) {
      document.dispatchEvent(new CustomEvent('push-notification-received', { detail: payload }));
    }
  }

  // Check for updates
  private startUpdateCheck(): void {
    setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateCheckInterval);
  }

  // Check for service worker updates
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      // console.error('Update check failed:', error)
      return false;
    }
  }

  // Apply update
  public async applyUpdate(): Promise<void> {
    if (!this.registration || !this.updateAvailable) return;

    const newWorker = this.registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Notify about available update
  private notifyUpdateAvailable(): void {
    document.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  // Cache management
  public async clearCache(cacheName?: string): Promise<void> {
    if (!this.registration) return;

    this.postMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheName },
    });
  }

  // Get cache size
  public async getCacheSize(): Promise<number> {
    if (!this.registration) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      this.postMessage(
        {
          type: 'GET_CACHE_SIZE',
        },
        [messageChannel.port2]
      );
    });
  }

  // Background sync
  public async addToSyncQueue(_data: any, tag = 'default'): Promise<void> {
    if (!this.config.enableBackgroundSync) return;

    this.syncQueue.push({ data, tag, timestamp: Date.now() });

    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      // Register background sync
      if (this.registration && 'sync' in this.registration) {
        try {
          await (this.registration as any).sync.register(tag);
        } catch (error) {
          // console.error('Background sync registration failed:', error)
        }
      }
    }
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        await this.processSync(item);
      } catch (error) {
        // console.error('Sync failed:', error)
        // Re-add to queue for retry
        this.syncQueue.push(item);
      }
    }
  }

  // Process individual sync item
  private async processSync(item: any): Promise<void> {
    // Override this method or handle via events
    document.dispatchEvent(new CustomEvent('process-sync-item', { detail: item }));
  }

  // Send message to service worker
  public postMessage(message: any, transfer?: Transferable[]): void {
    if (!this.registration?.active) return;

    if (transfer) {
      this.registration.active.postMessage(message, { transfer });
    } else {
      this.registration.active.postMessage(message);
    }
  }

  // Get registration
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Check if update is available
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  // Check online status
  public isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get sync queue length
  public getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  // Unregister service worker
  public async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const _result = await this.registration.unregister();
      this.registration = null;
      return result;
    } catch (error) {
      // console.error('Service worker unregistration failed:', error)
      return false;
    }
  }
}

// Hook for service worker management
export function useServiceWorker(_config: ServiceWorkerConfig = {}) {
  const [swManager] = useState(() => new ServiceWorkerManager(config));
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueLength, setSyncQueueLength] = useState(0);

  useEffect(() => {
    // Check if service worker is registered
    if (swManager.getRegistration()) {
      setIsRegistered(true);
    }

    // Listen for service worker events
    const handleUpdateAvailable = () => setUpdateAvailable(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    document.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update sync queue length periodically
    const updateSyncQueue = () => {
      setSyncQueueLength(swManager.getSyncQueueLength());
    };

    const interval = setInterval(updateSyncQueue, 1000);

    return () => {
      document.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [swManager]);

  const applyUpdate = useCallback(async () => {
    await swManager.applyUpdate();
    setUpdateAvailable(false);
  }, [swManager]);

  const checkForUpdates = useCallback(async () => {
    const hasUpdate = await swManager.checkForUpdates();
    setUpdateAvailable(hasUpdate);
    return hasUpdate;
  }, [swManager]);

  const clearCache = useCallback(
    async (cacheName?: string) => {
      await swManager.clearCache(cacheName);
    },
    [swManager]
  );

  const getCacheSize = useCallback(async () => {
    return await swManager.getCacheSize();
  }, [swManager]);

  const addToSyncQueue = useCallback(
    async (_data: any, tag?: string) => {
      await swManager.addToSyncQueue(data, tag);
      setSyncQueueLength(swManager.getSyncQueueLength());
    },
    [swManager]
  );

  return {
    isRegistered,
    updateAvailable,
    isOnline,
    syncQueueLength,
    applyUpdate,
    checkForUpdates,
    clearCache,
    getCacheSize,
    addToSyncQueue,
    postMessage: swManager.postMessage.bind(swManager),
    getRegistration: swManager.getRegistration.bind(swManager),
  };
}

// Hook for offline storage with service worker sync
export function useOfflineSync() {
  const { addToSyncQueue, isOnline } = useServiceWorker();
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  const addItem = useCallback(
    async (item: any, syncTag = 'data-sync') => {
      if (isOnline) {
        // Try to sync immediately
        try {
          await syncItem(item);
          return true;
        } catch (error) {
          // Fall back to queue
          await addToSyncQueue(item, syncTag);
          setPendingItems((prev) => [...prev, item]);
          return false;
        }
      } else {
        // Add to sync queue
        await addToSyncQueue(item, syncTag);
        setPendingItems((prev) => [...prev, item]);
        return false;
      }
    },
    [isOnline, addToSyncQueue]
  );

  const syncItem = async (item: any): Promise<void> => {
    // Override this function with actual sync logic
    throw new Error('syncItem function must be implemented');
  };

  // Listen for sync events
  useEffect(() => {
    const handleSyncComplete = (event: CustomEvent) => {
      const { data } = event.detail;
      setPendingItems((prev) => prev.filter((item) => item.id !== data.id));
    };

    document.addEventListener('background-sync-complete', handleSyncComplete as EventListener);

    return () => {
      document.removeEventListener('background-sync-complete', handleSyncComplete as EventListener);
    };
  }, []);

  return {
    addItem,
    pendingItems,
    pendingCount: pendingItems.length,
    isOnline,
  };
}

// Utility functions
export const serviceWorkerUtils = {
  // Check if service worker is supported
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator;
  },

  // Check if background sync is supported
  isBackgroundSyncSupported: (): boolean => {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  },

  // Check if push notifications are supported
  isPushSupported: (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Get current service worker state
  getServiceWorkerState: async (): Promise<string | null> => {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return 'unregistered';

    if (registration.installing) return 'installing';
    if (registration.waiting) return 'waiting';
    if (registration.active) return 'active';

    return 'unknown';
  },

  // Create cache key
  createCacheKey: (url: string, version = '1'): string => {
    return `${url}?v=${version}`;
  },

  // Check if request should be cached
  shouldCache: (_request: Request, strategies: CacheStrategy[]): CacheStrategy | null => {
    for (const strategy of strategies) {
      if (strategy.pattern.test(request.url)) {
        return strategy;
      }
    }
    return null;
  },
};

export default ServiceWorkerManager;

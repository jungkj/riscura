'use client';

import { useState, useEffect, useCallback } from 'react';

// Notification service for PWA
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  requireInteraction?: boolean;
  renotify?: boolean;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
}

export interface PushSubscriptionConfig {
  vapidKey: string;
  endpoint?: string;
  userAgent?: string;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  subscribed: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class NotificationService {
  private vapidKey: string;
  private endpoint?: string;
  private subscription: PushSubscription | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  constructor(_config: PushSubscriptionConfig) {
    this.vapidKey = config.vapidKey;
    this.endpoint = config.endpoint;
    this.init();
  }

  private async init(): Promise<void> {
    if (!this.isSupported()) {
      // console.warn('Push notifications not supported');
      return;
    }

    try {
      await this.getServiceWorkerRegistration();
      await this.checkExistingSubscription();
    } catch (error) {
      // console.error('Notification service initialization failed:', error);
    }
  }

  // Check if notifications are supported
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Get service worker registration
  private async getServiceWorkerRegistration(): Promise<void> {
    this.registration = await navigator.serviceWorker.ready;
  }

  // Check for existing subscription
  private async checkExistingSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
    } catch (error) {
      // console.error('Failed to check existing subscription:', error);
    }
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      // console.error('Permission request failed:', error);
      return 'denied';
    }
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported() || !this.registration) {
      return null;
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Check if already subscribed
      if (this.subscription) {
        return this.subscription;
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
      });

      // Send subscription to server
      if (this.endpoint) {
        await this.sendSubscriptionToServer(this.subscription);
      }

      return this.subscription;
    } catch (error) {
      // console.error('Subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();

      if (success) {
        // Remove subscription from server
        if (this.endpoint) {
          await this.removeSubscriptionFromServer(this.subscription);
        }

        this.subscription = null;
      }

      return success;
    } catch (error) {
      // console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  // Show local notification
  public async showNotification(_options: NotificationOptions): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      throw new Error('Notifications not permitted');
    }

    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/images/logo/icon-192x192.png',
        badge: options.badge || '/images/logo/icon-72x72.png',
        image: options.image,
        tag: options.tag,
        data: options.data,
        actions: options.actions,
        silent: options.silent,
        vibrate: options.vibrate,
        timestamp: options.timestamp || Date.now(),
        requireInteraction: options.requireInteraction,
        renotify: options.renotify,
        dir: options.dir,
        lang: options.lang,
      };

      await this.registration.showNotification(options.title, notificationOptions);
    } catch (error) {
      // console.error('Failed to show notification:', error);
      throw error;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    if (!this.endpoint) return;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      // console.error('Failed to send subscription to server:', error);
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    if (!this.endpoint) return;

    try {
      await fetch(this.endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });
    } catch (error) {
      // console.error('Failed to remove subscription from server:', error);
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get current subscription
  public getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Get permission state
  public getPermissionState(): NotificationPermissionState {
    return {
      permission: Notification.permission,
      supported: this.isSupported(),
      subscribed: !!this.subscription,
    };
  }

  // Clear notifications
  public async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications(tag ? { tag } : undefined);
      notifications.forEach((notification) => notification.close());
    } catch (error) {
      // console.error('Failed to clear notifications:', error);
    }
  }

  // Get active notifications
  public async getActiveNotifications(tag?: string): Promise<Notification[]> {
    if (!this.registration) return [];

    try {
      return await this.registration.getNotifications(tag ? { tag } : undefined);
    } catch (error) {
      // console.error('Failed to get active notifications:', error);
      return [];
    }
  }
}

// Hook for notification management
export function useNotifications(_config: PushSubscriptionConfig) {
  const [service] = useState(() => new NotificationService(config));
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    supported: false,
    subscribed: false,
  });
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Update permission state
  const updatePermissionState = useCallback(() => {
    setPermissionState(service.getPermissionState());
  }, [service]);

  useEffect(() => {
    updatePermissionState();

    // Listen for permission changes
    const checkPermission = () => updatePermissionState();
    document.addEventListener('visibilitychange', checkPermission);

    return () => {
      document.removeEventListener('visibilitychange', checkPermission);
    };
  }, [updatePermissionState]);

  // Request permission
  const requestPermission = useCallback(async () => {
    const permission = await service.requestPermission();
    updatePermissionState();
    return permission;
  }, [service, updatePermissionState]);

  // Subscribe to notifications
  const subscribe = useCallback(async () => {
    setIsSubscribing(true);
    try {
      const subscription = await service.subscribe();
      updatePermissionState();
      return subscription;
    } finally {
      setIsSubscribing(false);
    }
  }, [service, updatePermissionState]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async () => {
    const success = await service.unsubscribe();
    updatePermissionState();
    return success;
  }, [service, updatePermissionState]);

  // Show notification
  const showNotification = useCallback(
    async (_options: NotificationOptions) => {
      await service.showNotification(options);
    },
    [service]
  );

  // Clear notifications
  const clearNotifications = useCallback(
    async (tag?: string) => {
      await service.clearNotifications(tag);
    },
    [service]
  );

  // Get active notifications
  const getActiveNotifications = useCallback(
    async (tag?: string) => {
      return await service.getActiveNotifications(tag);
    },
    [service]
  );

  return {
    permissionState,
    isSubscribing,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    clearNotifications,
    getActiveNotifications,
    isSupported: service.isSupported(),
    getSubscription: () => service.getSubscription(),
  };
}

// Hook for notification templates
export function useNotificationTemplates() {
  const createRiskAlert = useCallback(
    (riskName: string, severity: 'low' | 'medium' | 'high'): NotificationOptions => ({
      title: 'Risk Alert',
      body: `New ${severity} severity risk identified: ${riskName}`,
      icon: '/images/icons/risk-alert.png',
      badge: '/images/icons/badge.png',
      tag: 'risk-alert',
      data: { type: 'risk', severity, riskName },
      vibrate: severity === 'high' ? [200, 100, 200] : [100],
      requireInteraction: severity === 'high',
      actions: [
        {
          action: 'view',
          title: 'View Risk',
          icon: '/images/icons/view.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/icons/dismiss.png',
        },
      ],
    }),
    []
  );

  const createComplianceReminder = useCallback(
    (framework: string, dueDate: string): NotificationOptions => ({
      title: 'Compliance Reminder',
      body: `${framework} compliance review due on ${dueDate}`,
      icon: '/images/icons/compliance.png',
      badge: '/images/icons/badge.png',
      tag: 'compliance-reminder',
      data: { type: 'compliance', framework, dueDate },
      actions: [
        {
          action: 'review',
          title: 'Review Now',
          icon: '/images/icons/review.png',
        },
        {
          action: 'snooze',
          title: 'Remind Later',
          icon: '/images/icons/snooze.png',
        },
      ],
    }),
    []
  );

  const createSystemUpdate = useCallback(
    (message: string): NotificationOptions => ({
      title: 'System Update',
      body: message,
      icon: '/images/icons/system.png',
      badge: '/images/icons/badge.png',
      tag: 'system-update',
      data: { type: 'system', message },
      silent: true,
    }),
    []
  );

  const createWorkflowNotification = useCallback(
    (workflowName: string, action: string): NotificationOptions => ({
      title: 'Workflow Update',
      body: `${workflowName}: ${action}`,
      icon: '/images/icons/workflow.png',
      badge: '/images/icons/badge.png',
      tag: 'workflow-update',
      data: { type: 'workflow', workflowName, action },
      actions: [
        {
          action: 'view',
          title: 'View Workflow',
          icon: '/images/icons/view.png',
        },
      ],
    }),
    []
  );

  return {
    createRiskAlert,
    createComplianceReminder,
    createSystemUpdate,
    createWorkflowNotification,
  };
}

// Utility functions
export const notificationUtils = {
  // Check if permission is granted
  isPermissionGranted: (): boolean => {
    return Notification.permission === 'granted';
  },

  // Check if notifications are supported
  isSupported: (): boolean => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Format notification data for display
  formatNotificationData: (notification: Notification): any => {
    return {
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      tag: notification.tag,
      data: notification.data,
      timestamp: notification.timestamp,
    };
  },

  // Create notification sound
  playNotificationSound: (soundUrl = '/sounds/notification.mp3'): void => {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        // console.warn('Failed to play notification sound:', error);
      });
    } catch (error) {
      // console.warn('Notification sound not available:', error);
    }
  },

  // Vibrate device (if supported)
  vibrate: (pattern: number[] = [200]): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },
};

export default NotificationService;

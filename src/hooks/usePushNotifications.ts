'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  renotify?: boolean;
  image?: string;
}

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  }
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  canRequestPermission: boolean;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  icon?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

// Predefined notification templates for Riscura
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  RISK_ALERT: {
    id: 'risk-alert',
    title: 'Risk Alert',
    body: 'A high-priority risk requires your attention',
    icon: '/images/icons/risk-alert.png',
    actions: [
      { action: 'view', title: 'View Risk', icon: '/images/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/images/icons/dismiss.png' },
    ],
    data: { type: 'risk', priority: 'high' },
  },
  COMPLIANCE_REMINDER: {
    id: 'compliance-reminder',
    title: 'Compliance Reminder',
    body: 'You have pending compliance tasks due soon',
    icon: '/images/icons/compliance.png',
    actions: [
      { action: 'view-tasks', title: 'View Tasks', icon: '/images/icons/tasks.png' },
      { action: 'snooze', title: 'Snooze', icon: '/images/icons/snooze.png' },
    ],
    data: { type: 'compliance', category: 'reminder' },
  },
  AUDIT_SCHEDULED: {
    id: 'audit-scheduled',
    title: 'Audit Scheduled',
    body: 'A new audit has been scheduled for your review',
    icon: '/images/icons/audit.png',
    actions: [
      { action: 'view-audit', title: 'View Details', icon: '/images/icons/view.png' },
      { action: 'calendar', title: 'Add to Calendar', icon: '/images/icons/calendar.png' },
    ],
    data: { type: 'audit', status: 'scheduled' },
  },
  DOCUMENT_APPROVAL: {
    id: 'document-approval',
    title: 'Document Approval Required',
    body: 'A document is waiting for your approval',
    icon: '/images/icons/document.png',
    actions: [
      { action: 'approve', title: 'Approve', icon: '/images/icons/approve.png' },
      { action: 'review', title: 'Review', icon: '/images/icons/review.png' },
    ],
    data: { type: 'document', action: 'approval' },
  },
  SYSTEM_UPDATE: {
    id: 'system-update',
    title: 'System Update Available',
    body: 'A new version of Riscura is available with important updates',
    icon: '/images/icons/update.png',
    actions: [
      { action: 'update', title: 'Update Now', icon: '/images/icons/download.png' },
      { action: 'later', title: 'Later', icon: '/images/icons/later.png' },
    ],
    data: { type: 'system', category: 'update' },
  },
}

export const usePushNotifications = (vapidPublicKey?: string) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);
  const notificationQueueRef = useRef<NotificationConfig[]>([]);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    }

    checkSupport();
  }, []);

  // Get service worker registration
  const getServiceWorkerRegistration =
    useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
      if (serviceWorkerRef.current) {
        return serviceWorkerRef.current
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          serviceWorkerRef.current = registration;
          return registration;
        } catch (error) {
          // console.error('Failed to get service worker registration:', error)
          setLastError('Service worker not available');
          return null;
        }
      }

      return null;
    }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported')
    }

    try {
      const _result = await Notification.requestPermission();
      setPermission(result);
      setLastError(null);
      return result;
    } catch (error) {
      const errorMessage = 'Failed to request notification permission';
      setLastError(errorMessage);
      // console.error('Failed to request notification permission:', error)
      throw new Error(errorMessage);
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !vapidPublicKey) {
      throw new Error('Push notifications not supported or VAPID key missing')
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    setIsSubscribing(true);
    setLastError(null);

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Service worker not available');
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        setSubscription(existingSubscription);
        processNotificationQueue();
        return existingSubscription;
      }

      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      setSubscription(newSubscription);
      processNotificationQueue();
      return newSubscription;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe to push notifications';
      setLastError(errorMessage);
      // console.error('Failed to subscribe to push notifications:', error)
      throw new Error(errorMessage);
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, vapidPublicKey, permission, requestPermission, getServiceWorkerRegistration]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) {
      return
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      // console.error('Failed to unsubscribe from push notifications:', error)
      throw error;
    }
  }, [subscription]);

  // Get subscription info for server
  const getSubscriptionInfo = useCallback((): PushSubscriptionInfo | null => {
    if (!subscription) {
      return null
    }

    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) {
      return null;
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(key),
        auth: arrayBufferToBase64(auth),
      },
    }
  }, [subscription]);

  // Show local notification
  const showNotification = useCallback(
    async (_config: NotificationConfig): Promise<Notification | null> => {
      if (!isSupported) {
        throw new Error('Notifications not supported')
      }

      if (permission !== 'granted') {
        // Queue notification if permission not granted
        notificationQueueRef.current.push(config)
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      try {
        const registration = await getServiceWorkerRegistration();

        if (registration) {
          // Show notification through service worker with proper type handling
          await registration.showNotification(config.title, {
            body: config.body,
            icon: config.icon || '/images/logo/riscura.png',
            badge: config.badge || '/images/logo/riscura.png',
            tag: config.tag,
            data: config.data,
            requireInteraction: config.requireInteraction,
            silent: config.silent,
            timestamp: config.timestamp || Date.now(),
            dir: config.dir,
            lang: config.lang,
            renotify: config.renotify,
            image: config.image,
            // Actions and vibrate are supported in service worker context
            ...(config.actions && { actions: config.actions }),
            ...(config.vibrate && { vibrate: config.vibrate }),
          } as any); // Type assertion needed for extended notification options

          setLastError(null);
          return null; // Service worker notifications don't return Notification objects
        } else {
          // Fallback to regular notification (limited options)
          const notification = new Notification(config.title, {
            body: config.body,
            icon: config.icon || '/images/logo/riscura.png',
            tag: config.tag,
            data: config.data,
            requireInteraction: config.requireInteraction,
            silent: config.silent,
            dir: config.dir,
            lang: config.lang,
            // Note: actions, vibrate, and renotify are not supported in regular Notification constructor
          })

          setNotifications((prev) => [...prev, notification]);

          // Auto-close after 5 seconds if not requiring interaction
          if (!config.requireInteraction) {
            setTimeout(() => {
              notification.close()
              setNotifications((prev) => prev.filter((n) => n !== notification));
            }, 5000);
          }

          setLastError(null);
          return notification;
        }
      } catch (error) {
        const errorMessage = 'Failed to show notification';
        setLastError(errorMessage);
        // console.error('Failed to show notification:', error)
        throw new Error(errorMessage);
      }
    },
    [isSupported, permission, getServiceWorkerRegistration, requestPermission]
  );

  // Process queued notifications
  const processNotificationQueue = useCallback(async () => {
    if (notificationQueueRef.current.length === 0 || permission !== 'granted') {
      return
    }

    const queue = [...notificationQueueRef.current];
    notificationQueueRef.current = [];

    for (const config of queue) {
      try {
        await showNotification(config);
      } catch (error) {
        // console.error('Failed to show queued notification:', error)
        // Re-queue failed notifications
        notificationQueueRef.current.push(config)
      }
    }
  }, [permission, showNotification]);

  // Show notification from template
  const showTemplateNotification = useCallback(
    async (
      templateId: keyof typeof NOTIFICATION_TEMPLATES,
      customData?: Partial<NotificationConfig>
    ): Promise<Notification | null> => {
      const template = NOTIFICATION_TEMPLATES[templateId]
      if (!template) {
        throw new Error(`Notification template '${templateId}' not found`);
      }

      const config: NotificationConfig = {
        ...template,
        ...customData,
        data: { ...template.data, ...customData?.data },
      }

      return showNotification(config);
    },
    [showNotification]
  );

  // Register with server
  const registerWithServer = useCallback(
    async (endpoint: string): Promise<void> => {
      const subscriptionInfo = getSubscriptionInfo()
      if (!subscriptionInfo) {
        throw new Error('No subscription data available');
      }

      setIsRegistering(true);
      setLastError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscriptionInfo,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const _result = await response.json();
        // console.log('Successfully registered with server:', result)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to register with server';
        setLastError(errorMessage);
        // console.error('Failed to register push subscription with server:', error)
        throw new Error(errorMessage);
      } finally {
        setIsRegistering(false);
      }
    },
    [getSubscriptionInfo]
  );

  // Test notification
  const testNotification = useCallback(async (): Promise<void> => {
    await showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Riscura',
      icon: '/images/logo/riscura.png',
      tag: 'test',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'ok', title: 'OK' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  }, [showNotification]);

  // Get notification statistics
  const getNotificationStats = useCallback(() => {
    return {
      isSupported,
      permission,
      isSubscribed: !!subscription,
      activeNotifications: notifications.length,
      queuedNotifications: notificationQueueRef.current.length,
      subscriptionEndpoint: subscription?.endpoint || null,
      lastError,
    }
  }, [isSupported, permission, subscription, notifications.length, lastError]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async (): Promise<void> => {
    try {
      const registration = await getServiceWorkerRegistration()

      if (registration) {
        const _notifications = await registration.getNotifications();
        notifications.forEach((notification) => notification.close());
      }

      // Clear local notifications
      notifications.forEach((notification) => notification.close())
      setNotifications([]);
    } catch (error) {
      // console.error('Failed to clear notifications:', error)
    }
  }, [getServiceWorkerRegistration, notifications]);

  // Get active notifications
  const getActiveNotifications = useCallback(async (): Promise<Notification[]> => {
    try {
      const registration = await getServiceWorkerRegistration()

      if (registration) {
        return await registration.getNotifications();
      }

      return notifications;
    } catch (error) {
      // console.error('Failed to get active notifications:', error)
      return [];
    }
  }, [getServiceWorkerRegistration, notifications]);

  // Set up message listener for service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        // Handle notification click
        // console.log('Notification clicked:', event.data)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Check existing subscription on mount
  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!isSupported) return

      try {
        const registration = await getServiceWorkerRegistration();
        if (registration) {
          const existingSubscription = await registration.pushManager.getSubscription();
          setSubscription(existingSubscription);
        }
      } catch (error) {
        // console.error('Failed to check existing subscription:', error)
      }
    }

    checkExistingSubscription();
  }, [isSupported, getServiceWorkerRegistration]);

  return {
    // State
    permission,
    isSupported,
    subscription,
    isSubscribing,
    notifications,
    lastError,
    isRegistering,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    clearAllNotifications,
    getActiveNotifications,
    getSubscriptionInfo,

    // Computed
    isSubscribed: !!subscription,
    canSubscribe: isSupported && permission === 'granted',

    // New actions
    processNotificationQueue,
    showTemplateNotification,
    registerWithServer,
    testNotification,
    getNotificationStats,
  }
}

// Utility functions
const urlBase64ToUint8Array = (base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Predefined notification templates
export const NotificationTemplates = {
  riskAlert: (riskName: string, severity: string): NotificationConfig => ({
    title: 'Risk Alert',
    body: `High-priority risk detected: ${riskName}`,
    icon: '/images/icons/risk-alert.png',
    tag: 'risk-alert',
    requireInteraction: true,
    vibrate: [200, 100, 200],
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
    data: { type: 'risk', severity },
  }),

  complianceReminder: (_framework: string, dueDate: string): NotificationConfig => ({
    title: 'Compliance Reminder',
    body: `${framework} assessment due ${dueDate}`,
    icon: '/images/icons/compliance.png',
    tag: 'compliance-reminder',
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'start',
        title: 'Start Assessment',
        icon: '/images/icons/start.png',
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: '/images/icons/snooze.png',
      },
    ],
    data: { type: 'compliance', framework },
  }),

  systemUpdate: (message: string): NotificationConfig => ({
    title: 'System Update',
    body: message,
    icon: '/images/icons/system.png',
    tag: 'system-update',
    silent: true,
    data: { type: 'system' },
  }),
}

// Default export for backward compatibility
export default usePushNotifications

// Template utilities for easy access
export const useNotificationTemplates = () => {
  return {
    createRiskAlert: (riskData: any) => ({
      ...NOTIFICATION_TEMPLATES.RISK_ALERT,
      body: `Risk "${riskData.title}" requires attention`,
      data: { ...NOTIFICATION_TEMPLATES.RISK_ALERT.data, ...riskData },
    }),
    createSystemUpdate: (updateData: any) => ({
      ...NOTIFICATION_TEMPLATES.SYSTEM_UPDATE,
      body: updateData.message || NOTIFICATION_TEMPLATES.SYSTEM_UPDATE.body,
      data: { ...NOTIFICATION_TEMPLATES.SYSTEM_UPDATE.data, ...updateData },
    }),
    createComplianceReminder: (reminderData: any) => ({
      ...NOTIFICATION_TEMPLATES.COMPLIANCE_REMINDER,
      body: reminderData.message || NOTIFICATION_TEMPLATES.COMPLIANCE_REMINDER.body,
      data: { ...NOTIFICATION_TEMPLATES.COMPLIANCE_REMINDER.data, ...reminderData },
    }),
  }
}

export const useNotificationScheduler = () => {
  return {
    scheduleNotification: (notification: NotificationConfig, delay: number) => {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, notification);
        }
      }, delay);
    },
    scheduleRecurring: (notification: NotificationConfig, interval: number) => {
      return setInterval(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, notification);
        }
      }, interval);
    },
  }
}

import { db } from '@/lib/db';
const prisma = db.client;
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationMessageType,
  DigestFrequency,
  NotificationPreference,
  PushSubscription,
  Prisma,
} from '@prisma/client';
// import { redis } from '@/lib/cache/memory-cache'
import webpush from 'web-push';
import { sendEmail } from '@/lib/email';
// import { add, isAfter, isBefore, parseISO, format } from 'date-fns'

// Configure web push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  type?: NotificationMessageType;
  data?: Record<string, any>;
  actionUrl?: string;
  iconUrl?: string;
  riskId?: string;
  reportId?: string;
}

interface NotificationFilters {
  userId?: string;
  organizationId?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface BulkNotificationInput {
  userIds: string[];
  organizationId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  type?: NotificationMessageType;
  data?: Record<string, any>;
  actionUrl?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly cacheKeyPrefix = 'notifications:';
  private readonly cacheTTL = 300; // 5 minutes

  private constructor() {}

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  // Create a single notification
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        title: input.title,
        message: input.message,
        category: input.category,
        priority: input.priority || NotificationPriority.MEDIUM,
        type: input.type || NotificationMessageType.INFO,
        data: input.data || Prisma.JsonNull,
        actionUrl: input.actionUrl,
        iconUrl: input.iconUrl,
        riskId: input.riskId,
        reportId: input.reportId,
      },
      include: {
        user: true,
        risk: true,
        report: true,
      },
    });

    // Clear user's notification cache
    await this.clearUserNotificationCache(input.userId);

    // Send real-time notification if preferences allow
    await this.sendRealtimeNotification(notification);

    return notification;
  }

  // Create bulk notifications
  async createBulkNotifications(input: BulkNotificationInput): Promise<Notification[]> {
    const _notifications = await prisma.notification.createMany({
      data: input.userIds.map((userId) => ({
        userId,
        organizationId: input.organizationId,
        title: input.title,
        message: input.message,
        category: input.category,
        priority: input.priority || NotificationPriority.MEDIUM,
        type: input.type || NotificationMessageType.INFO,
        data: input.data || Prisma.JsonNull,
        actionUrl: input.actionUrl,
      })),
    });

    // Clear cache for all users
    await Promise.all(input.userIds.map((userId) => this.clearUserNotificationCache(userId)));

    return prisma.notification.findMany({
      where: {
        userId: { in: input.userIds },
        organizationId: input.organizationId,
        title: input.title,
        createdAt: {
          gte: new Date(Date.now() - 5000), // Last 5 seconds
        },
      },
    });
  }

  // Get user notifications with filters
  async getUserNotifications(
    _userId: string,
    filters: NotificationFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ notifications: Notification[]; total: number }> {
    const cacheKey = `${this.cacheKeyPrefix}user:${userId}:${JSON.stringify(filters)}:${page}:${limit}`;
    const _cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...filters,
      ...(filters.startDate && filters.endDate
        ? {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }
        : {}),
    };

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        include: {
          risk: true,
          report: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const _result = { notifications, total };
    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));

    return result;
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    await this.clearUserNotificationCache(userId);
    return notification;
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<number> {
    const _result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    await this.clearUserNotificationCache(userId);
    return result.count;
  }

  // Dismiss notification
  async dismissNotification(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
      },
    });

    await this.clearUserNotificationCache(userId);
    return notification;
  }

  // Get unread count
  async getUnreadCount(_userId: string): Promise<number> {
    const cacheKey = `${this.cacheKeyPrefix}unread:${userId}`;
    const _cached = await redis.get(cacheKey);

    if (cached !== null) {
      return parseInt(cached as string);
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
        dismissed: false,
      },
    });

    await redis.setex(cacheKey, 60, count.toString()); // Cache for 1 minute
    return count;
  }

  // Get or create user preferences
  async getUserPreferences(_userId: string): Promise<NotificationPreference> {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          categories: {
            risks: true,
            compliance: true,
            reports: true,
            chat: true,
            billing: true,
            system: true,
            security: true,
            team: true,
          },
        },
      });
    }

    return preferences;
  }

  // Update user preferences
  async updateUserPreferences(
    _userId: string,
    updates: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...updates,
      },
    });

    return preferences;
  }

  // Subscribe to push notifications
  async subscribeToPush(
    _userId: string,
    subscription: PushSubscriptionJSON,
    deviceInfo?: Record<string, any>
  ): Promise<PushSubscription> {
    return prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint!,
        auth: subscription.keys!.auth,
        p256dh: subscription.keys!.p256dh,
        deviceInfo: deviceInfo || Prisma.JsonNull,
      },
    });
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(endpoint: string): Promise<void> {
    await prisma.pushSubscription.update({
      where: { endpoint },
      data: { active: false },
    });
  }

  // Send real-time notification
  private async sendRealtimeNotification(
    notification: Notification & { user: any }
  ): Promise<void> {
    const preferences = await this.getUserPreferences(notification.userId);

    // Check if within quiet hours
    if (preferences.quietHours && this.isWithinQuietHours(preferences.quietHours)) {
      return;
    }

    // Check category preferences
    const categoryPrefs = preferences.categories as Record<string, boolean>;
    const categoryKey = notification.category.toLowerCase();
    if (categoryPrefs[categoryKey] === false) {
      return;
    }

    // Send based on preferences
    const promises: Promise<any>[] = [];

    if (preferences.email && notification.priority !== NotificationPriority.LOW) {
      promises.push(this.sendEmailNotification(notification));
    }

    if (preferences.push) {
      promises.push(this.sendPushNotification(notification));
    }

    await Promise.allSettled(promises);
  }

  // Send email notification
  private async sendEmailNotification(notification: Notification & { user: any }): Promise<void> {
    try {
      await sendEmail({
        to: notification.user.email,
        subject: notification.title,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<p><a href="${notification.actionUrl}">View Details</a></p>` : ''}
        `,
      });

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    } catch (error) {
      // console.error('Failed to send email notification:', error)
    }
  }

  // Send push notification
  private async sendPushNotification(notification: Notification): Promise<void> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: notification.userId,
        active: true,
      },
    });

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: notification.iconUrl || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
      },
    });

    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          },
          payload
        );

        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (__error: any) {
        // Handle expired subscriptions
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    });

    await Promise.allSettled(promises);

    if (subscriptions.length > 0) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          pushSent: true,
          pushSentAt: new Date(),
        },
      });
    }
  }

  // Process notification digests
  async processDigests(): Promise<void> {
    const now = new Date();

    const digestsToProcess = await prisma.notificationDigest.findMany({
      where: {
        nextSendAt: { lte: now },
      },
      include: {
        user: true,
      },
    });

    for (const digest of digestsToProcess) {
      await this.sendDigest(digest);
    }
  }

  // Send digest email
  private async sendDigest(digest: any): Promise<void> {
    const _notifications = await prisma.notification.findMany({
      where: {
        userId: digest.userId,
        organizationId: digest.organizationId,
        createdAt: {
          gte: digest.lastSentAt || new Date(0),
        },
        emailSent: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) {
      // Update next send time
      await this.updateDigestSchedule(digest);
      return;
    }

    // Group notifications by category
    const grouped = notifications.reduce(
      (acc, notif) => {
        if (!acc[notif.category]) {
          acc[notif.category] = [];
        }
        acc[notif.category].push(notif);
        return acc;
      },
      {} as Record<string, Notification[]>
    );

    // Build email content
    let htmlContent = `<h2>Your ${digest.frequency.toLowerCase()} notification digest</h2>`;

    for (const [category, notifs] of Object.entries(grouped)) {
      htmlContent += `<h3>${category}</h3><ul>`;
      for (const notif of notifs) {
        htmlContent += `<li><strong>${notif.title}:</strong> ${notif.message}`;
        if (notif.actionUrl) {
          htmlContent += ` <a href="${notif.actionUrl}">View</a>`;
        }
        htmlContent += '</li>';
      }
      htmlContent += '</ul>';
    }

    try {
      await sendEmail({
        to: digest.user.email,
        subject: `Your ${digest.frequency.toLowerCase()} Riscura digest`,
        html: htmlContent,
      });

      // Mark notifications as sent
      await prisma.notification.updateMany({
        where: {
          id: { in: notifications.map((n) => n.id) },
        },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      // Update digest
      await this.updateDigestSchedule(digest);
    } catch (error) {
      // console.error('Failed to send digest:', error)
    }
  }

  // Update digest schedule
  private async updateDigestSchedule(digest: any): Promise<void> {
    let nextSendAt: Date;

    switch (digest.frequency) {
      case DigestFrequency.HOURLY:
        nextSendAt = add(new Date(), { hours: 1 });
        break;
      case DigestFrequency.DAILY:
        nextSendAt = add(new Date(), { days: 1 });
        break;
      case DigestFrequency.WEEKLY:
        nextSendAt = add(new Date(), { weeks: 1 });
        break;
      case DigestFrequency.MONTHLY:
        nextSendAt = add(new Date(), { months: 1 });
        break;
      default:
        nextSendAt = add(new Date(), { days: 1 });
    }

    await prisma.notificationDigest.update({
      where: { id: digest.id },
      data: {
        lastSentAt: new Date(),
        nextSendAt,
        notifications: [],
      },
    });
  }

  // Check if within quiet hours
  private isWithinQuietHours(quietHours: any): boolean {
    if (!quietHours || typeof quietHours !== 'object') {
      return false;
    }

    const { start, end, timezone = 'UTC' } = quietHours;
    if (!start || !end) {
      return false;
    }

    // Simple implementation - can be enhanced with proper timezone handling
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Clear user notification cache
  private async clearUserNotificationCache(_userId: string): Promise<void> {
    const _pattern = `${this.cacheKeyPrefix}user:${userId}:*`;
    const unreadKey = `${this.cacheKeyPrefix}unread:${userId}`;

    // In a real Redis implementation, you'd use SCAN to find and delete matching keys
    // For now, just clear the unread count
    await redis.del(unreadKey);
  }

  // Create system notifications
  async createSystemNotification(
    title: string,
    message: string,
    userIds?: string[],
    organizationId?: string
  ): Promise<void> {
    const where: Prisma.UserWhereInput = {};

    if (userIds) {
      where.id = { in: userIds };
    }
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, organizationId: true },
    });

    // Determine organizationId with proper validation
    const resolvedOrgId = organizationId || users[0]?.organizationId;

    if (!resolvedOrgId) {
      // console.error('Failed to create system notification: No organizationId available')
      throw new Error('Organization ID is required to create notifications');
    }

    await this.createBulkNotifications({
      userIds: users.map((u) => u.id),
      organizationId: resolvedOrgId,
      title,
      message,
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.HIGH,
      type: NotificationMessageType.INFO,
    });
  }
}

export const notificationService = NotificationService.getInstance();

// Default export for compatibility
export default NotificationService;

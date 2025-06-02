import { db } from '@/lib/db';
import { collaborationServer } from '@/lib/websocket/server';

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly' | 'never';
    types: string[];
  };
  push: {
    enabled: boolean;
    types: string[];
  };
  sms: {
    enabled: boolean;
    types: string[];
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel?: string;
    types: string[];
  };
  inApp: {
    enabled: boolean;
    playSound: boolean;
    showDesktop: boolean;
    types: string[];
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
}

export interface NotificationTemplate {
  type: string;
  channel: 'email' | 'push' | 'sms' | 'slack' | 'in_app';
  subject: string;
  template: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationQueue {
  id: string;
  recipientId: string;
  type: string;
  channel: 'email' | 'push' | 'sms' | 'slack' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: Record<string, any>;
  scheduledAt: Date;
  sentAt?: Date;
  failureReason?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

export interface NotificationDigest {
  userId: string;
  frequency: 'daily' | 'weekly';
  notifications: any[];
  generatedAt: Date;
  sentAt?: Date;
}

export class NotificationManager {

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences = await db.client.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Return default preferences
      return this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const updated = await db.client.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        ...await this.createDefaultPreferences(userId),
        ...preferences,
      },
    });

    // Get organization ID from user
    const user = await db.client.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    // Log preference change
    // NOTE: Activity logging for user events is temporarily disabled
    // since USER is not a valid EntityType in the schema
    console.log('Notification Preferences Updated:', {
      type: 'NOTIFICATION_PREFERENCES_UPDATED',
      entityType: 'USER',
      entityId: userId,
      description: 'Notification preferences updated',
      userId: userId,
      organizationId: user?.organizationId || '',
      metadata: {
        changedFields: Object.keys(preferences),
      },
      timestamp: new Date(),
    });

    return updated;
  }

  // Send notification through multiple channels
  async sendNotification(notification: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    senderId?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    data?: Record<string, any>;
    channels?: ('email' | 'push' | 'sms' | 'slack' | 'in_app')[];
    scheduleAt?: Date;
  }): Promise<void> {
    
    const recipient = await db.client.user.findUnique({
      where: { id: notification.recipientId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Get user preferences
    const preferences = await this.getUserPreferences(notification.recipientId);

    // Determine which channels to use
    const channels = notification.channels || this.determineChannels(notification.type, notification.urgency || 'medium', preferences);

    // Create notification record
    const dbNotification = await db.client.notification.create({
      data: {
        type: notification.type,
        recipientId: notification.recipientId,
        senderId: notification.senderId || 'system',
        entityType: notification.entityType || 'SYSTEM',
        entityId: notification.entityId || 'system',
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: new Date(),
      },
    });

    // Check quiet hours
    if (this.isQuietHours(preferences) && notification.urgency !== 'urgent') {
      // Schedule for after quiet hours
      const scheduleAt = this.calculateAfterQuietHours(preferences);
      channels.forEach(channel => {
        this.queueNotification({
          recipientId: notification.recipientId,
          type: notification.type,
          channel,
          priority: notification.urgency || 'medium',
          data: {
            notificationId: dbNotification.id,
            title: notification.title,
            message: notification.message,
            entityType: notification.entityType,
            entityId: notification.entityId,
            ...notification.data,
          },
          scheduledAt: scheduleAt,
        });
      });
      return;
    }

    // Send through each channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'in_app':
            await this.sendInAppNotification(dbNotification, preferences);
            break;
          case 'email':
            await this.sendEmailNotification(dbNotification, preferences);
            break;
          case 'push':
            // The rest of the push notification code won't execute since pushSubscription is always null
            // This is intentional until the pushSubscription model is implemented
            break;
          case 'sms':
            await this.sendSMSNotification(dbNotification, preferences);
            break;
          case 'slack':
            await this.sendSlackNotification(dbNotification, preferences);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        
        // Queue for retry if critical
        if (notification.urgency === 'urgent' || notification.urgency === 'high') {
          this.queueNotification({
            recipientId: notification.recipientId,
            type: notification.type,
            channel,
            priority: notification.urgency,
            data: {
              notificationId: dbNotification.id,
              title: notification.title,
              message: notification.message,
              entityType: notification.entityType,
              entityId: notification.entityId,
              ...notification.data,
            },
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
          });
        }
      }
    }
  }

  // Send in-app notification
  private async sendInAppNotification(notification: any, preferences: NotificationPreferences): Promise<void> {
    if (!preferences.inApp.enabled || !preferences.inApp.types.includes(notification.type)) {
      return;
    }

    // Send real-time notification via WebSocket
    if (collaborationServer) {
      collaborationServer.sendToUser(notification.recipientId, {
        type: 'notification:received',
        payload: { 
          notification: {
            ...notification,
            playSound: preferences.inApp.playSound,
            showDesktop: preferences.inApp.showDesktop,
          }
        },
        timestamp: new Date(),
        userId: notification.senderId,
      });
    }

    // Update notification as delivered
    await db.client.notification.update({
      where: { id: notification.id },
      data: { deliveredAt: new Date() },
    });
  }

  // Send email notification
  private async sendEmailNotification(notification: any, preferences: NotificationPreferences): Promise<void> {
    if (!preferences.email.enabled || !preferences.email.types.includes(notification.type)) {
      return;
    }

    // Check frequency settings
    if (preferences.email.frequency !== 'instant' && preferences.email.frequency !== 'never') {
      // Add to digest queue
      await this.addToDigest(notification.recipientId, notification, preferences.email.frequency);
      return;
    }

    if (preferences.email.frequency === 'never') {
      return;
    }

    // Get email template
    const template = await this.getNotificationTemplate(notification.type, 'email');
    if (!template) {
      console.warn(`No email template found for notification type: ${notification.type}`);
      return;
    }

    // Render email content
    const emailContent = this.renderTemplate(template, {
      recipientName: notification.recipient?.firstName || 'User',
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId,
      timestamp: notification.createdAt,
    });

    // Queue email for sending
    await this.queueNotification({
      recipientId: notification.recipientId,
      type: notification.type,
      channel: 'email',
      priority: 'medium',
      data: {
        to: notification.recipient?.email,
        subject: emailContent.subject,
        html: emailContent.content,
        notificationId: notification.id,
      },
      scheduledAt: new Date(),
    });
  }

  // Send push notification
  private async sendPushNotification(notification: any, preferences: NotificationPreferences): Promise<void> {
    // The rest of the push notification code won't execute since pushSubscription is always null
    // This is intentional until the pushSubscription model is implemented
    
    // Queue push notification
    // await this.queueNotification({
    //   recipientId: notification.recipientId,
    //   type: notification.type,
    //   channel: 'push',
    //   priority: 'medium',
    //   data: {
    //     subscription: pushSubscription.subscription,
    //     title: notification.title,
    //     body: notification.message,
    //     icon: '/icons/notification-icon.png',
    //     badge: '/icons/badge-icon.png',
    //     tag: notification.type,
    //     data: {
    //       notificationId: notification.id,
    //       entityType: notification.entityType,
    //       entityId: notification.entityId,
    //     },
    //   },
    //   scheduledAt: new Date(),
    // });
  }

  // Send SMS notification
  private async sendSMSNotification(notification: any, preferences: NotificationPreferences): Promise<void> {
    if (!preferences.sms.enabled || !preferences.sms.types.includes(notification.type)) {
      return;
    }

    const user = await db.client.user.findUnique({
      where: { id: notification.recipientId },
    });

    if (!user?.phoneNumber) {
      return;
    }

    // Format SMS message
    const smsMessage = `${notification.title}: ${notification.message}`;

    // Queue SMS
    await this.queueNotification({
      recipientId: notification.recipientId,
      type: notification.type,
      channel: 'sms',
      priority: 'high',
      data: {
        to: user.phoneNumber,
        message: smsMessage.substring(0, 160), // SMS length limit
        notificationId: notification.id,
      },
      scheduledAt: new Date(),
    });
  }

  // Send Slack notification
  private async sendSlackNotification(notification: any, preferences: NotificationPreferences): Promise<void> {
    if (!preferences.slack.enabled || !preferences.slack.types.includes(notification.type) || !preferences.slack.webhookUrl) {
      return;
    }

    // Format Slack message
    const slackMessage = {
      channel: preferences.slack.channel || '#general',
      username: 'Riscura RCSA',
      icon_emoji: ':bell:',
      attachments: [
        {
          color: this.getSlackColor(notification.type),
          title: notification.title,
          text: notification.message,
          fields: [
            {
              title: 'Type',
              value: notification.entityType,
              short: true,
            },
            {
              title: 'Time',
              value: new Date(notification.createdAt).toLocaleString(),
              short: true,
            },
          ],
          footer: 'Riscura RCSA',
          ts: Math.floor(new Date(notification.createdAt).getTime() / 1000),
        },
      ],
    };

    // Queue Slack notification
    await this.queueNotification({
      recipientId: notification.recipientId,
      type: notification.type,
      channel: 'slack',
      priority: 'medium',
      data: {
        webhookUrl: preferences.slack.webhookUrl,
        message: slackMessage,
        notificationId: notification.id,
      },
      scheduledAt: new Date(),
    });
  }

  // Queue notification for later delivery
  private async queueNotification(queueItem: {
    recipientId: string;
    type: string;
    channel: 'email' | 'push' | 'sms' | 'slack' | 'in_app';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    data: Record<string, any>;
    scheduledAt: Date;
  }): Promise<NotificationQueue> {
    
    // TODO: Implement notificationQueue model in Prisma schema
    // return await db.client.notificationQueue.create({
    //   data: {
    //     ...queueItem,
    //     status: 'pending',
    //     attempts: 0,
    //     maxAttempts: queueItem.priority === 'urgent' ? 5 : 3,
    //     createdAt: new Date(),
    //   },
    // });

    // Return mock queue item for now
    return {
      id: 'mock-queue-' + Date.now(),
      ...queueItem,
      status: 'pending',
      attempts: 0,
      maxAttempts: queueItem.priority === 'urgent' ? 5 : 3,
      createdAt: new Date(),
    };
  }

  // Process notification queue
  async processQueue(): Promise<void> {
    // TODO: Implement notificationQueue model in Prisma schema
    // const pendingNotifications = await db.client.notificationQueue.findMany({
    //   where: {
    //     status: 'pending',
    //     scheduledAt: { lte: new Date() },
    //     attempts: { lt: db.client.notificationQueue.fields.maxAttempts },
    //   },
    //   orderBy: [
    //     { priority: 'desc' },
    //     { scheduledAt: 'asc' },
    //   ],
    //   take: 100, // Process in batches
    // });

    // Mock empty pending notifications for now
    const pendingNotifications: any[] = [];

    for (const notification of pendingNotifications) {
      try {
        await this.deliverQueuedNotification(notification);
        
        // await db.client.notificationQueue.update({
        //   where: { id: notification.id },
        //   data: {
        //     status: 'sent',
        //     sentAt: new Date(),
        //   },
        // });
      } catch (error) {
        console.error(`Failed to deliver queued notification ${notification.id}:`, error);
        
        const newAttempts = notification.attempts + 1;
        if (newAttempts >= notification.maxAttempts) {
          // await db.client.notificationQueue.update({
          //   where: { id: notification.id },
          //   data: {
          //     status: 'failed',
          //     attempts: newAttempts,
          //     failureReason: error instanceof Error ? error.message : 'Unknown error',
          //   },
          // });
        } else {
          // Exponential backoff for retry
          const retryDelay = Math.pow(2, newAttempts) * 60 * 1000; // 2^n minutes
          // await db.client.notificationQueue.update({
          //   where: { id: notification.id },
          //   data: {
          //     attempts: newAttempts,
          //     scheduledAt: new Date(Date.now() + retryDelay),
          //     failureReason: error instanceof Error ? error.message : 'Unknown error',
          //   },
          // });
        }
      }
    }
  }

  // Deliver individual queued notification
  private async deliverQueuedNotification(notification: NotificationQueue): Promise<void> {
    switch (notification.channel) {
      case 'email':
        await this.deliverEmail(notification.data);
        break;
      case 'push':
        await this.deliverPush(notification.data);
        break;
      case 'sms':
        await this.deliverSMS(notification.data);
        break;
      case 'slack':
        await this.deliverSlack(notification.data);
        break;
      case 'in_app':
        // In-app notifications don't need queued delivery as they're sent immediately
        break;
    }
  }

  // Deliver email
  private async deliverEmail(data: any): Promise<void> {
    // Implementation would use email service like SendGrid, AWS SES, etc.
    console.log('Sending email:', {
      to: data.to,
      subject: data.subject,
      html: data.html,
    });
    
    // Simulated email delivery
    // In real implementation:
    // await emailService.send({
    //   to: data.to,
    //   subject: data.subject,
    //   html: data.html,
    // });
  }

  // Deliver push notification
  private async deliverPush(data: any): Promise<void> {
    // Implementation would use Web Push API
    console.log('Sending push notification:', {
      subscription: data.subscription,
      payload: {
        title: data.title,
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
      },
    });
    
    // In real implementation:
    // await webpush.sendNotification(data.subscription, JSON.stringify({
    //   title: data.title,
    //   body: data.body,
    //   icon: data.icon,
    //   badge: data.badge,
    //   tag: data.tag,
    //   data: data.data,
    // }));
  }

  // Deliver SMS
  private async deliverSMS(data: any): Promise<void> {
    // Implementation would use SMS service like Twilio, AWS SNS, etc.
    console.log('Sending SMS:', {
      to: data.to,
      message: data.message,
    });
    
    // In real implementation:
    // await smsService.send({
    //   to: data.to,
    //   message: data.message,
    // });
  }

  // Deliver Slack notification
  private async deliverSlack(data: any): Promise<void> {
    // Implementation would use Slack webhook
    console.log('Sending Slack notification:', {
      webhookUrl: data.webhookUrl,
      message: data.message,
    });
    
    // In real implementation:
    // await fetch(data.webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data.message),
    // });
  }

  // Generate notification digests
  async generateDigests(frequency: 'daily' | 'weekly'): Promise<void> {
    const users = await db.client.user.findMany({
      where: {
        isActive: true,
        notificationPreferences: {
          email: {
            path: ['frequency'],
            equals: frequency,
          },
        },
      },
      include: {
        notificationPreferences: true,
      },
    });

    for (const user of users) {
      await this.generateUserDigest(user.id, frequency);
    }
  }

  // Generate digest for specific user
  private async generateUserDigest(userId: string, frequency: 'daily' | 'weekly'): Promise<void> {
    const since = frequency === 'daily' 
      ? new Date(Date.now() - 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const notifications = await db.client.notification.findMany({
      where: {
        recipientId: userId,
        createdAt: { gte: since },
        isRead: false,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) {
      return; // No notifications to digest
    }

    // Group notifications by type
    const groupedNotifications = notifications.reduce((acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate digest content
    const digestContent = this.generateDigestContent(groupedNotifications, frequency);

    // Send digest email
    await this.queueNotification({
      recipientId: userId,
      type: 'NOTIFICATION_DIGEST',
      channel: 'email',
      priority: 'low',
      data: {
        subject: `Your ${frequency} notification digest`,
        html: digestContent,
        notificationCount: notifications.length,
      },
      scheduledAt: new Date(),
    });

    // Mark notifications as included in digest
    await db.client.notification.updateMany({
      where: {
        id: { in: notifications.map(n => n.id) },
      },
      data: {
        includeInDigest: true,
        digestSentAt: new Date(),
      },
    });
  }

  // Create default preferences for new user
  private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    return {
      userId,
      email: {
        enabled: true,
        frequency: 'instant',
        types: ['TASK_ASSIGNED', 'APPROVAL_REQUIRED', 'MENTION', 'DOCUMENT_SHARED'],
      },
      push: {
        enabled: true,
        types: ['TASK_ASSIGNED', 'APPROVAL_REQUIRED', 'MENTION'],
      },
      sms: {
        enabled: false,
        types: ['APPROVAL_REQUIRED'],
      },
      slack: {
        enabled: false,
        types: [],
      },
      inApp: {
        enabled: true,
        playSound: true,
        showDesktop: true,
        types: ['TASK_ASSIGNED', 'APPROVAL_REQUIRED', 'MENTION', 'COMMENT_CREATED'],
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
      },
    };
  }

  // Determine appropriate channels based on type and urgency
  private determineChannels(type: string, urgency: string, preferences: NotificationPreferences): ('email' | 'push' | 'sms' | 'slack' | 'in_app')[] {
    const channels: ('email' | 'push' | 'sms' | 'slack' | 'in_app')[] = [];

    // Always try in-app first
    if (preferences.inApp.enabled && preferences.inApp.types.includes(type)) {
      channels.push('in_app');
    }

    // Add other channels based on urgency and preferences
    if (urgency === 'urgent') {
      if (preferences.sms.enabled && preferences.sms.types.includes(type)) {
        channels.push('sms');
      }
      if (preferences.push.enabled && preferences.push.types.includes(type)) {
        channels.push('push');
      }
    }

    if (urgency === 'high' || urgency === 'urgent') {
      if (preferences.push.enabled && preferences.push.types.includes(type)) {
        channels.push('push');
      }
      if (preferences.slack.enabled && preferences.slack.types.includes(type)) {
        channels.push('slack');
      }
    }

    if (preferences.email.enabled && preferences.email.types.includes(type)) {
      channels.push('email');
    }

    return [...new Set(channels)]; // Remove duplicates
  }

  // Check if current time is within quiet hours
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const startTime = this.parseTime(preferences.quietHours.startTime);
    const endTime = this.parseTime(preferences.quietHours.endTime);
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Calculate when quiet hours end
  private calculateAfterQuietHours(preferences: NotificationPreferences): Date {
    const now = new Date();
    const endTime = this.parseTime(preferences.quietHours.endTime);
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let scheduleTime = new Date(now);
    
    if (currentTime > endTime) {
      // Schedule for next day
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    scheduleTime.setHours(Math.floor(endTime / 60));
    scheduleTime.setMinutes(endTime % 60);
    scheduleTime.setSeconds(0);
    scheduleTime.setMilliseconds(0);

    return scheduleTime;
  }

  // Parse time string (HH:mm) to minutes since midnight
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Get notification template
  private async getNotificationTemplate(type: string, channel: string): Promise<NotificationTemplate | null> {
    // TODO: Implement notificationTemplate model in Prisma schema
    // return await db.client.notificationTemplate.findFirst({
    //   where: {
    //     type,
    //     channel,
    //     isActive: true,
    //   },
    // });
    
    // Return null for now
    return null;
  }

  // Render template with variables
  private renderTemplate(template: NotificationTemplate, variables: Record<string, any>): { subject: string; content: string } {
    let subject = template.subject;
    let content = template.template;

    // Replace variables in subject and content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      content = content.replace(regex, String(value));
    }

    return { subject, content };
  }

  // Add notification to digest queue
  private async addToDigest(userId: string, notification: any, frequency: 'daily' | 'weekly'): Promise<void> {
    // Mark notification as pending digest
    await db.client.notification.update({
      where: { id: notification.id },
      data: { 
        pendingDigest: true,
        digestFrequency: frequency,
      },
    });
  }

  // Generate digest content HTML
  private generateDigestContent(groupedNotifications: Record<string, any[]>, frequency: string): string {
    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .section { margin-bottom: 30px; }
            .notification { background-color: #f8f9fa; padding: 15px; margin-bottom: 10px; border-left: 4px solid #2563eb; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Your ${frequency} notification digest</h1>
            <p>Here's what happened in your workspace</p>
          </div>
          <div class="content">
    `;

    for (const [type, notifications] of Object.entries(groupedNotifications)) {
      html += `
        <div class="section">
          <h2>${this.getTypeDisplayName(type)} (${notifications.length})</h2>
      `;

      for (const notification of notifications.slice(0, 10)) { // Limit to 10 per type
        html += `
          <div class="notification">
            <strong>${notification.title}</strong><br>
            ${notification.message}<br>
            <small>${new Date(notification.createdAt).toLocaleString()}</small>
          </div>
        `;
      }

      if (notifications.length > 10) {
        html += `<p>...and ${notifications.length - 10} more</p>`;
      }

      html += '</div>';
    }

    html += `
          </div>
          <div class="footer">
            <p>You received this digest because you have email notifications set to ${frequency}.</p>
            <p>You can change your notification preferences in your account settings.</p>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  // Get display name for notification type
  private getTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      'TASK_ASSIGNED': 'Task Assignments',
      'APPROVAL_REQUIRED': 'Approval Requests',
      'MENTION': 'Mentions',
      'COMMENT_CREATED': 'Comments',
      'DOCUMENT_SHARED': 'Shared Documents',
      'RISK_UPDATED': 'Risk Updates',
      'CONTROL_UPDATED': 'Control Updates',
    };

    return displayNames[type] || type.replace(/_/g, ' ').toLowerCase();
  }

  // Get Slack message color based on notification type
  private getSlackColor(type: string): string {
    const colors: Record<string, string> = {
      'TASK_ASSIGNED': '#36a64f',
      'APPROVAL_REQUIRED': '#ff9900',
      'MENTION': '#2196f3',
      'COMMENT_CREATED': '#9c27b0',
      'DOCUMENT_SHARED': '#607d8b',
      'RISK_UPDATED': '#f44336',
      'CONTROL_UPDATED': '#4caf50',
    };

    return colors[type] || '#757575';
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await db.client.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await db.client.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update
    if (collaborationServer) {
      collaborationServer.sendToUser(userId, {
        type: 'notification:read',
        payload: { notificationId },
        timestamp: new Date(),
        userId,
      });
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    await db.client.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Send real-time update
    if (collaborationServer) {
      collaborationServer.sendToUser(userId, {
        type: 'notification:all_read',
        payload: {},
        timestamp: new Date(),
        userId,
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    return await db.client.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  // Get user notifications with pagination
  async getUserNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    types?: string[];
  } = {}): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    
    const where: any = {
      recipientId: userId,
    };

    if (options.unreadOnly) {
      where.isRead = false;
    }

    if (options.types && options.types.length > 0) {
      where.type = { in: options.types };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.client.notification.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      db.client.notification.count({ where }),
      db.client.notification.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      }),
    ]);

    return { notifications, total, unreadCount };
  }
}

export const notificationManager = new NotificationManager();

// Queue processor (would typically run as a separate service or cron job)
export function startNotificationProcessor(): void {
  // Process queue every minute
  setInterval(async () => {
    try {
      await notificationManager.processQueue();
    } catch (error) {
      console.error('Error processing notification queue:', error);
    }
  }, 60 * 1000);

  // Generate daily digests at 8 AM
  const dailyDigestTime = new Date();
  dailyDigestTime.setHours(8, 0, 0, 0);
  const msUntilDailyDigest = dailyDigestTime.getTime() - Date.now();
  const dailyDigestDelay = msUntilDailyDigest > 0 ? msUntilDailyDigest : 24 * 60 * 60 * 1000 - Math.abs(msUntilDailyDigest);

  setTimeout(() => {
    notificationManager.generateDigests('daily');
    setInterval(() => {
      notificationManager.generateDigests('daily');
    }, 24 * 60 * 60 * 1000);
  }, dailyDigestDelay);

  // Generate weekly digests on Monday at 8 AM
  const weeklyDigestTime = new Date();
  weeklyDigestTime.setDate(weeklyDigestTime.getDate() + (1 - weeklyDigestTime.getDay() + 7) % 7); // Next Monday
  weeklyDigestTime.setHours(8, 0, 0, 0);
  const msUntilWeeklyDigest = weeklyDigestTime.getTime() - Date.now();

  setTimeout(() => {
    notificationManager.generateDigests('weekly');
    setInterval(() => {
      notificationManager.generateDigests('weekly');
    }, 7 * 24 * 60 * 60 * 1000);
  }, msUntilWeeklyDigest);
} 
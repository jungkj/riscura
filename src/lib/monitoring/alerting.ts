/**
 * Alerting System
 * Manages automated alerts, escalation procedures, and notifications
 */

import * as Sentry from '@sentry/nextjs';

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Alert categories
export enum AlertCategory {
  PERFORMANCE = 'performance',
  ERROR_RATE = 'error_rate',
  AVAILABILITY = 'availability',
  SECURITY = 'security',
  BUSINESS_METRIC = 'business_metric',
  INFRASTRUCTURE = 'infrastructure',
  USER_EXPERIENCE = 'user_experience',
}

// Notification channels
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  PAGERDUTY = 'pagerduty',
  DISCORD = 'discord',
}

// Alert rule configuration
interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow: number; // minutes
    minSamples: number;
  };
  channels: NotificationChannel[];
  escalation?: {
    timeToEscalate: number; // minutes
    escalationChannels: NotificationChannel[];
  };
  enabled: boolean;
  cooldown: number; // minutes between notifications
}

// Alert instance
interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  value: number;
  threshold: number;
  timestamp: number;
  context: Record<string, any>;
  acknowledged: boolean;
  resolved: boolean;
  escalated: boolean;
}

// Notification payload
interface Notification {
  alert: Alert;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  timestamp: number;
}

class AlertingSystem {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private notificationHistory: Notification[] = [];
  private lastNotificationTime: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Critical Performance Alerts
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Application error rate exceeds 5%',
        category: AlertCategory.ERROR_RATE,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5, // 5%
          timeWindow: 5, // 5 minutes
          minSamples: 10,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL, NotificationChannel.PAGERDUTY],
        escalation: {
          timeToEscalate: 15, // 15 minutes
          escalationChannels: [NotificationChannel.SMS, NotificationChannel.PAGERDUTY],
        },
        enabled: true,
        cooldown: 30, // 30 minutes
      },
      {
        id: 'slow-api-response',
        name: 'Slow API Response Time',
        description: 'API response time exceeds 2 seconds',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'api_response_time_p95',
          operator: 'gt',
          threshold: 2000, // 2 seconds
          timeWindow: 10, // 10 minutes
          minSamples: 20,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        escalation: {
          timeToEscalate: 30, // 30 minutes
          escalationChannels: [NotificationChannel.PAGERDUTY],
        },
        enabled: true,
        cooldown: 45,
      },
      
      // Warning Level Alerts
      {
        id: 'elevated-error-rate',
        name: 'Elevated Error Rate',
        description: 'Application error rate exceeds 2%',
        category: AlertCategory.ERROR_RATE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 2, // 2%
          timeWindow: 15, // 15 minutes
          minSamples: 20,
        },
        channels: [NotificationChannel.SLACK],
        enabled: true,
        cooldown: 60,
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 80%',
        category: AlertCategory.INFRASTRUCTURE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'memory_usage_percentage',
          operator: 'gt',
          threshold: 80, // 80%
          timeWindow: 10, // 10 minutes
          minSamples: 10,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        enabled: true,
        cooldown: 30,
      },
      
      // Security Alerts
      {
        id: 'failed-login-attempts',
        name: 'High Failed Login Attempts',
        description: 'Unusual number of failed login attempts',
        category: AlertCategory.SECURITY,
        severity: AlertSeverity.ERROR,
        condition: {
          metric: 'failed_login_attempts',
          operator: 'gt',
          threshold: 50, // 50 failed attempts
          timeWindow: 5, // 5 minutes
          minSamples: 1,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        escalation: {
          timeToEscalate: 10, // 10 minutes
          escalationChannels: [NotificationChannel.PAGERDUTY],
        },
        enabled: true,
        cooldown: 15,
      },
      
      // Business Metric Alerts
      {
        id: 'low-document-processing-success',
        name: 'Low Document Processing Success Rate',
        description: 'Document processing success rate below 90%',
        category: AlertCategory.BUSINESS_METRIC,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'document_processing_success_rate',
          operator: 'lt',
          threshold: 90, // 90%
          timeWindow: 30, // 30 minutes
          minSamples: 10,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        enabled: true,
        cooldown: 60,
      },
      {
        id: 'high-support-ticket-volume',
        name: 'High Support Ticket Volume',
        description: 'Support ticket creation rate is unusually high',
        category: AlertCategory.USER_EXPERIENCE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'support_tickets_per_hour',
          operator: 'gt',
          threshold: 10, // 10 tickets per hour
          timeWindow: 60, // 60 minutes
          minSamples: 1,
        },
        channels: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
        enabled: true,
        cooldown: 120,
      },
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Start monitoring and alert checking
   */
  private startMonitoring(): void {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60000);

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);
  }

  /**
   * Evaluate a metric against all applicable rules
   */
  evaluateMetric(metric: string, value: number, context: Record<string, any> = {}): void {
    for (const rule of this.rules.values()) {
      if (rule.condition.metric === metric && rule.enabled) {
        this.evaluateRule(rule, value, context);
      }
    }
  }

  /**
   * Evaluate a specific rule
   */
  private evaluateRule(rule: AlertRule, value: number, context: Record<string, any>): void {
    const conditionMet = this.checkCondition(rule.condition, value);
    
    if (conditionMet) {
      this.triggerAlert(rule, value, context);
    } else {
      // Check if we should resolve an existing alert
      this.checkAlertResolution(rule.id, value);
    }
  }

  /**
   * Check if condition is met
   */
  private checkCondition(condition: any, value: number): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, value: number, context: Record<string, any>): void {
    const alertId = `${rule.id}-${Date.now()}`;
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && !alert.resolved);

    // Check cooldown period
    const lastNotification = this.lastNotificationTime.get(rule.id);
    const cooldownPeriod = rule.cooldown * 60 * 1000; // Convert to milliseconds
    
    if (lastNotification && (Date.now() - lastNotification) < cooldownPeriod) {
      return; // Still in cooldown period
    }

    // Create new alert if none exists
    if (!existingAlert) {
      const alert: Alert = {
        id: alertId,
        ruleId: rule.id,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        value,
        threshold: rule.condition.threshold,
        timestamp: Date.now(),
        context,
        acknowledged: false,
        resolved: false,
        escalated: false,
      };

      this.activeAlerts.set(alertId, alert);
      this.alertHistory.push(alert);

      // Send notifications
      this.sendNotifications(alert, rule);

      // Set up escalation timer
      if (rule.escalation) {
        setTimeout(() => {
          this.escalateAlert(alert, rule);
        }, rule.escalation.timeToEscalate * 60 * 1000);
      }

      // Log to Sentry
      Sentry.captureMessage(`Alert triggered: ${rule.name}`, {
        level: this.mapSeverityToSentryLevel(rule.severity),
        tags: {
          alert_id: alertId,
          alert_rule: rule.id,
          alert_category: rule.category,
        },
        extra: {
          value,
          threshold: rule.condition.threshold,
          context,
        },
      });

      this.lastNotificationTime.set(rule.id, Date.now());
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.channels) {
      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
        
        // Log notification failure
        Sentry.captureException(error, {
          tags: {
            alert_id: alert.id,
            notification_channel: channel,
          },
        });
      }
    }
  }

  /**
   * Send notification via specific channel
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const message = this.formatAlertMessage(alert);
    
    switch (channel) {
      case NotificationChannel.SLACK:
        await this.sendSlackNotification(alert, message);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(alert, message);
        break;
      case NotificationChannel.SMS:
        await this.sendSMSNotification(alert, message);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookNotification(alert, message);
        break;
      case NotificationChannel.PAGERDUTY:
        await this.sendPagerDutyNotification(alert, message);
        break;
      case NotificationChannel.DISCORD:
        await this.sendDiscordNotification(alert, message);
        break;
    }

    // Record notification
    const notification: Notification = {
      alert,
      channel,
      recipient: this.getRecipientForChannel(channel),
      message,
      timestamp: Date.now(),
    };

    this.notificationHistory.push(notification);
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: Alert): string {
    const severity = alert.severity.toUpperCase();
    const timestamp = new Date(alert.timestamp).toISOString();
    
    return `🚨 ${severity} ALERT: ${alert.name}

Description: ${alert.description}
Value: ${alert.value}
Threshold: ${alert.threshold}
Time: ${timestamp}
Category: ${alert.category}

Context:
${Object.entries(alert.context)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join('\n')}

Alert ID: ${alert.id}`;
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, message: string): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      text: `Alert: ${alert.name}`,
      attachments: [{
        color,
        title: `${alert.severity.toUpperCase()}: ${alert.name}`,
        text: message,
        footer: 'RISCURA Monitoring',
        ts: Math.floor(alert.timestamp / 1000),
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, message: string): Promise<void> {
    const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [];
    
    const payload = {
      to: recipients,
      subject: `${alert.severity.toUpperCase()} Alert: ${alert.name}`,
      body: message,
      html: this.formatEmailHTML(alert, message),
    };

    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Email notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, message: string): Promise<void> {
    const phoneNumbers = process.env.ALERT_PHONE_NUMBERS?.split(',') || [];
    
    const shortMessage = `${alert.severity.toUpperCase()}: ${alert.name} - Value: ${alert.value}, Threshold: ${alert.threshold}`;
    
    const payload = {
      to: phoneNumbers,
      message: shortMessage,
    };

    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`SMS notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, message: string): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Alert webhook URL not configured');
    }

    const payload = {
      alert,
      message,
      timestamp: Date.now(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert, message: string): Promise<void> {
    const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
    if (!routingKey) {
      throw new Error('PagerDuty routing key not configured');
    }

    const payload = {
      routing_key: routingKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: `${alert.name}: ${alert.value}`,
        severity: alert.severity,
        source: 'RISCURA Monitoring',
        component: alert.category,
        group: 'alerts',
        class: alert.category,
        custom_details: {
          alert_id: alert.id,
          threshold: alert.threshold,
          context: alert.context,
        },
      },
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`PagerDuty notification failed: ${response.statusText}`);
    }
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(alert: Alert, message: string): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const color = parseInt(this.getSeverityColor(alert.severity).replace('#', ''), 16);
    
    const payload = {
      embeds: [{
        title: `${alert.severity.toUpperCase()}: ${alert.name}`,
        description: message,
        color,
        timestamp: new Date(alert.timestamp).toISOString(),
        footer: {
          text: 'RISCURA Monitoring',
        },
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord notification failed: ${response.statusText}`);
    }
  }

  /**
   * Escalate an alert
   */
  private async escalateAlert(alert: Alert, rule: AlertRule): Promise<void> {
    if (alert.resolved || alert.acknowledged || alert.escalated) {
      return; // Don't escalate if already handled
    }

    alert.escalated = true;
    
    if (rule.escalation) {
      for (const channel of rule.escalation.escalationChannels) {
        try {
          await this.sendNotification(alert, channel);
        } catch (error) {
          console.error(`Failed to escalate via ${channel}:`, error);
        }
      }
    }

    // Log escalation
    Sentry.captureMessage(`Alert escalated: ${alert.name}`, {
      level: 'warning',
      tags: {
        alert_id: alert.id,
        alert_rule: rule.id,
      },
    });
  }

  /**
   * Check for alert resolution
   */
  private checkAlertResolution(ruleId: string, currentValue: number): void {
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === ruleId && !alert.resolved);

    if (activeAlert) {
      const rule = this.rules.get(ruleId);
      if (rule && !this.checkCondition(rule.condition, currentValue)) {
        this.resolveAlert(activeAlert.id);
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      
      // Send resolution notification
      const message = `✅ RESOLVED: ${alert.name}\n\nAlert has been automatically resolved.\nAlert ID: ${alertId}`;
      
      // Send to Slack only for resolution notifications
      this.sendSlackNotification(alert, message).catch(console.error);

      // Log resolution
      Sentry.addBreadcrumb({
        category: 'alert-resolution',
        message: `Alert resolved: ${alert.name}`,
        level: 'info',
        data: {
          alert_id: alertId,
          duration: Date.now() - alert.timestamp,
        },
      });
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      
      // Log acknowledgment
      Sentry.addBreadcrumb({
        category: 'alert-acknowledgment',
        message: `Alert acknowledged: ${alert.name}`,
        level: 'info',
        data: {
          alert_id: alertId,
          acknowledged_by: acknowledgedBy,
        },
      });
    }
  }

  /**
   * Check all active alerts
   */
  private checkAlerts(): void {
    // This method would typically fetch current metrics and evaluate them
    // For now, it's a placeholder for the monitoring loop
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Remove old resolved alerts
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.resolved && alert.timestamp < sevenDaysAgo) {
        this.activeAlerts.delete(id);
      }
    }

    // Trim alert history
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > sevenDaysAgo);
    
    // Trim notification history
    this.notificationHistory = this.notificationHistory.filter(
      notification => notification.timestamp > sevenDaysAgo
    );
  }

  /**
   * Utility functions
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return '#36a64f';
      case AlertSeverity.WARNING: return '#ffcc00';
      case AlertSeverity.ERROR: return '#ff6600';
      case AlertSeverity.CRITICAL: return '#ff0000';
      default: return '#808080';
    }
  }

  private mapSeverityToSentryLevel(severity: AlertSeverity): 'info' | 'warning' | 'error' | 'fatal' {
    switch (severity) {
      case AlertSeverity.INFO: return 'info';
      case AlertSeverity.WARNING: return 'warning';
      case AlertSeverity.ERROR: return 'error';
      case AlertSeverity.CRITICAL: return 'fatal';
      default: return 'info';
    }
  }

  private getRecipientForChannel(channel: NotificationChannel): string {
    const recipients = {
      [NotificationChannel.EMAIL]: process.env.ALERT_EMAIL_RECIPIENTS || '',
      [NotificationChannel.SLACK]: 'Slack Channel',
      [NotificationChannel.SMS]: process.env.ALERT_PHONE_NUMBERS || '',
      [NotificationChannel.WEBHOOK]: 'Webhook Endpoint',
      [NotificationChannel.PAGERDUTY]: 'PagerDuty Service',
      [NotificationChannel.DISCORD]: 'Discord Channel',
    };
    
    return recipients[channel] || 'Unknown';
  }

  private formatEmailHTML(alert: Alert, message: string): string {
    const color = this.getSeverityColor(alert.severity);
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
          <h1>${alert.severity.toUpperCase()} ALERT</h1>
          <h2>${alert.name}</h2>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <pre style="white-space: pre-wrap; font-family: monospace;">${message}</pre>
        </div>
        <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
          RISCURA Monitoring System
        </div>
      </div>
    `;
  }

  /**
   * Public API methods
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  getNotificationHistory(limit: number = 100): Notification[] {
    return this.notificationHistory.slice(-limit);
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<DaisyAlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
}

// Singleton instance
let alertingSystem: AlertingSystem | null = null;

export const getAlertingSystem = (): AlertingSystem => {
  if (!alertingSystem) {
    alertingSystem = new AlertingSystem();
  }
  return alertingSystem;
};

// Convenience functions
export const evaluateMetric = (metric: string, value: number, context?: Record<string, any>) => {
  getAlertingSystem().evaluateMetric(metric, value, context);
};

export const resolveAlert = (alertId: string) => {
  getAlertingSystem().resolveAlert(alertId);
};

export const acknowledgeAlert = (alertId: string, acknowledgedBy: string) => {
  getAlertingSystem().acknowledgeAlert(alertId, acknowledgedBy);
};

export const getActiveAlerts = () => {
  return getAlertingSystem().getActiveAlerts();
};

export { type AlertRule, type Alert, type Notification }; 
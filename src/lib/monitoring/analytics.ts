/**
 * Business Analytics Service
 * Tracks user engagement, feature usage, conversion metrics, and business KPIs
 */

import * as Sentry from '@sentry/nextjs';

// User engagement events
interface UserEvent {
  userId?: string;
  organizationId?: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  page: string;
}

// Business KPIs
interface BusinessKPIs {
  // User metrics
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  newUserRegistrations: number;
  userRetentionRate: number;

  // Feature usage
  rcsaAssessmentsCreated: number;
  documentsProcessed: number;
  reportsGenerated: number;
  controlsCreated: number;
  risksIdentified: number;

  // Business metrics
  averageTimeToFirstRCSA: number;
  averageAssessmentCompletionTime: number;
  documentProcessingSuccessRate: number;

  // Support metrics
  supportTicketsCreated: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
}

// Feature usage tracking
interface FeatureUsage {
  feature: string;
  userId: string;
  organizationId: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

class BusinessAnalytics {
  private eventQueue: UserEvent[] = [];
  private kpis: Partial<BusinessKPIs> = {};
  private sessionStartTime: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSession();
      this.setupEventListeners();
      this.startPeriodicReporting();
    }
  }

  /**
   * Initialize analytics session
   */
  private initializeSession(): void {
    const sessionId = this.getSessionId();

    this.track('session_start', {
      session_id: sessionId,
      timestamp: this.sessionStartTime,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    });
  }

  /**
   * Setup automatic event listeners
   */
  private setupEventListeners(): void {
    // Track page views
    this.trackPageView();

    // Track form interactions
    this.setupFormTracking();

    // Track button clicks
    this.setupButtonTracking();

    // Track errors
    this.setupErrorTracking();

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        session_duration: Date.now() - this.sessionStartTime,
        timestamp: Date.now(),
      });
      this.flushEvents();
    });
  }

  /**
   * Track page views
   */
  trackPageView(page?: string): void {
    const currentPage = page || (typeof window !== 'undefined' ? window.location.pathname : '');

    this.track('page_view', {
      page: currentPage,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
    });
  }

  /**
   * Track user events
   */
  track(event: string, properties: Record<string, any> = {}): void {
    const userEvent: UserEvent = {
      userId: this.getCurrentUserId(),
      organizationId: this.getCurrentOrganizationId(),
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
    };

    this.eventQueue.push(userEvent);

    // Send to external analytics immediately for critical events
    if (this.isCriticalEvent(event)) {
      this.sendToExternalAnalytics(userEvent);
    }

    // Update KPIs based on event
    this.updateKPIs(event, properties);

    // Flush queue if it gets too large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(
    feature: string,
    startTime: number,
    success: boolean,
    errorMessage?: string
  ): void {
    const duration = Date.now() - startTime;
    const userId = this.getCurrentUserId();
    const organizationId = this.getCurrentOrganizationId();

    if (!userId || !organizationId) return;

    const usage: FeatureUsage = {
      feature,
      userId,
      organizationId,
      duration,
      success,
      errorMessage,
    };

    this.track('feature_usage', usage);

    // Track performance metrics
    if (duration > 10000) {
      // 10 seconds
      Sentry.addBreadcrumb({
        category: 'feature-performance',
        message: `Slow feature usage: ${feature}`,
        level: 'warning',
        data: usage,
      });
    }
  }

  /**
   * Track conversion events
   */
  trackConversion(event: string, value?: number, currency?: string): void {
    this.track('conversion', {
      conversion_event: event,
      value,
      currency,
      timestamp: Date.now(),
    });

    // Send to external analytics for revenue tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: Math.random().toString(36).substring(2, 15),
        value,
        currency,
        items: [
          {
            item_id: event,
            item_name: event,
            category: 'subscription',
            quantity: 1,
            price: value,
          },
        ],
      });
    }
  }

  /**
   * Track user retention
   */
  trackRetention(_userId: string, lastActiveDate: Date, currentDate: Date = new Date()): void {
    const daysSinceLastActive = Math.floor(
      (currentDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    this.track('user_retention', {
      user_id: userId,
      days_since_last_active: daysSinceLastActive,
      is_retained: daysSinceLastActive <= 30, // 30-day retention window
      retention_period: this.getRetentionPeriod(daysSinceLastActive),
    });
  }

  /**
   * Track business-specific events
   */
  trackBusinessEvent(event: string, data: Record<string, any>): void {
    const businessEvents = {
      rcsa_created: () => {
        this.kpis.rcsaAssessmentsCreated = (this.kpis.rcsaAssessmentsCreated || 0) + 1;
      },
      document_processed: () => {
        this.kpis.documentsProcessed = (this.kpis.documentsProcessed || 0) + 1;
      },
      report_generated: () => {
        this.kpis.reportsGenerated = (this.kpis.reportsGenerated || 0) + 1;
      },
      control_created: () => {
        this.kpis.controlsCreated = (this.kpis.controlsCreated || 0) + 1;
      },
      risk_identified: () => {
        this.kpis.risksIdentified = (this.kpis.risksIdentified || 0) + 1;
      },
    };

    // Update KPIs
    const handler = businessEvents[event as keyof typeof businessEvents];
    if (handler) {
      handler();
    }

    this.track(event, {
      ...data,
      category: 'business',
      timestamp: Date.now(),
    });
  }

  /**
   * Setup form tracking
   */
  private setupFormTracking(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.getAttribute('data-form-name') || form.id || 'unknown';

      this.track('form_submit', {
        form_name: formName,
        form_action: form.action,
        form_method: form.method,
      });
    });

    // Track form field interactions
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        const fieldName = target.getAttribute('name') || target.getAttribute('id') || 'unknown';

        this.track('form_field_focus', {
          field_name: fieldName,
          field_type: target.getAttribute('type') || target.tagName.toLowerCase(),
        });
      }
    });
  }

  /**
   * Setup button click tracking
   */
  private setupButtonTracking(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
        const buttonText = target.textContent?.trim() || 'unknown';
        const buttonId = target.id || target.getAttribute('data-testid') || 'unknown';

        this.track('button_click', {
          button_text: buttonText,
          button_id: buttonId,
          button_class: target.className,
        });
      }
    });
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
      });
    });
  }

  /**
   * Update KPIs based on events
   */
  private updateKPIs(event: string, properties: Record<string, any>): void {
    switch (event) {
      case 'user_registration':
        this.kpis.newUserRegistrations = (this.kpis.newUserRegistrations || 0) + 1;
        break;
      case 'rcsa_created':
        this.kpis.rcsaAssessmentsCreated = (this.kpis.rcsaAssessmentsCreated || 0) + 1;
        break;
      case 'document_processed':
        this.kpis.documentsProcessed = (this.kpis.documentsProcessed || 0) + 1;
        if (properties.success) {
          this.updateDocumentProcessingSuccessRate(true);
        } else {
          this.updateDocumentProcessingSuccessRate(false);
        }
        break;
      case 'report_generated':
        this.kpis.reportsGenerated = (this.kpis.reportsGenerated || 0) + 1;
        break;
      case 'support_ticket_created':
        this.kpis.supportTicketsCreated = (this.kpis.supportTicketsCreated || 0) + 1;
        break;
    }
  }

  /**
   * Update document processing success rate
   */
  private updateDocumentProcessingSuccessRate(success: boolean): void {
    const currentRate = this.kpis.documentProcessingSuccessRate || 100;
    const currentCount = this.kpis.documentsProcessed || 1;

    // Calculate new success rate
    const successCount = Math.round((currentRate / 100) * (currentCount - 1));
    const newSuccessCount = successCount + (success ? 1 : 0);
    this.kpis.documentProcessingSuccessRate = (newSuccessCount / currentCount) * 100;
  }

  /**
   * Get retention period classification
   */
  private getRetentionPeriod(daysSinceLastActive: number): string {
    if (daysSinceLastActive <= 1) return '1-day';
    if (daysSinceLastActive <= 7) return '7-day';
    if (daysSinceLastActive <= 30) return '30-day';
    if (daysSinceLastActive <= 90) return '90-day';
    return 'churned';
  }

  /**
   * Check if event is critical and needs immediate sending
   */
  private isCriticalEvent(event: string): boolean {
    const criticalEvents = [
      'javascript_error',
      'promise_rejection',
      'payment_failed',
      'security_violation',
      'data_breach',
      'system_outage',
    ];
    return criticalEvents.includes(event);
  }

  /**
   * Send events to external analytics services
   */
  private sendToExternalAnalytics(event: UserEvent): void {
    // Send to Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.event, {
        ...event.properties,
        userId: event.userId,
        organizationId: event.organizationId,
        sessionId: event.sessionId,
        page: event.page,
      });
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, {
        ...event.properties,
        custom_parameter_user_id: event.userId,
        custom_parameter_org_id: event.organizationId,
      });
    }
  }

  /**
   * Flush event queue to server
   */
  flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send to server endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      }).catch(() => {
        // Silently fail - re-add events to queue for retry
        this.eventQueue.unshift(...events);
      });
    }
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Flush events every 30 seconds
    setInterval(() => {
      this.flushEvents();
    }, 30000);

    // Send KPI snapshot every 5 minutes
    setInterval(() => {
      this.sendKPISnapshot();
    }, 300000);
  }

  /**
   * Send KPI snapshot
   */
  private sendKPISnapshot(): void {
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kpis: this.kpis,
          timestamp: Date.now(),
          session_id: this.getSessionId(),
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    // Try to get from various sources
    const sources = [
      () => (window as any).currentUser?.id,
      () => localStorage.getItem('userId'),
      () => sessionStorage.getItem('userId'),
      () => document.cookie.match(/userId=([^;]+)/)?.[1],
    ];

    for (const source of sources) {
      try {
        const userId = source();
        if (userId) return userId;
      } catch {
        // Continue to next source
      }
    }

    return undefined;
  }

  /**
   * Get current organization ID
   */
  private getCurrentOrganizationId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    const sources = [
      () => (window as any).currentUser?.organizationId,
      () => localStorage.getItem('organizationId'),
      () => sessionStorage.getItem('organizationId'),
    ];

    for (const source of sources) {
      try {
        const orgId = source();
        if (orgId) return orgId;
      } catch {
        // Continue to next source
      }
    }

    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get current KPIs
   */
  getKPIs(): Partial<BusinessKPIs> {
    return { ...this.kpis };
  }

  /**
   * Clean up analytics
   */
  cleanup(): void {
    this.flushEvents();
  }
}

// Singleton instance
let analytics: BusinessAnalytics | null = null;

export const getAnalytics = (): BusinessAnalytics => {
  if (!analytics) {
    analytics = new BusinessAnalytics();
  }
  return analytics;
};

// Convenience functions
export const track = (event: string, properties?: Record<string, any>) => {
  getAnalytics().track(event, properties);
};

export const trackFeatureUsage = (
  feature: string,
  startTime: number,
  success: boolean,
  errorMessage?: string
) => {
  getAnalytics().trackFeatureUsage(feature, startTime, success, errorMessage);
};

export const trackConversion = (event: string, value?: number, currency?: string) => {
  getAnalytics().trackConversion(event, value, currency);
};

export const trackBusinessEvent = (event: string, data: Record<string, any>) => {
  getAnalytics().trackBusinessEvent(event, data);
};

export const getKPIs = () => {
  return getAnalytics().getKPIs();
};

export { type BusinessKPIs, type FeatureUsage, type UserEvent };

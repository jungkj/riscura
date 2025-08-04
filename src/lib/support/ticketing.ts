/**
 * Support Ticketing System
 * Manages customer support tickets, escalation, and knowledge base integration
 */

import * as Sentry from '@sentry/nextjs';
import { getAnalytics } from '@/lib/monitoring/analytics';

// Ticket priority levels
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

// Ticket status
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  WAITING_FOR_INTERNAL = 'waiting_for_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// Ticket categories
export enum TicketCategory {
  TECHNICAL_ISSUE = 'technical_issue',
  FEATURE_REQUEST = 'feature_request',
  BILLING = 'billing',
  ACCOUNT = 'account',
  DATA_IMPORT = 'data_import',
  REPORTING = 'reporting',
  INTEGRATION = 'integration',
  TRAINING = 'training',
  BUG_REPORT = 'bug_report',
  OTHER = 'other',
}

// Support ticket interface
interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;

  // Customer information
  customerId: string;
  customerEmail: string;
  customerName: string;
  organizationId: string;
  organizationName: string;

  // Assignment and tracking
  assignedTo?: string;
  assignedTeam?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
  firstResponseAt?: number;
  resolvedAt?: number;
  closedAt?: number;

  // SLA tracking
  slaTarget: number; // Response time target in minutes
  slaBreached: boolean;

  // Metadata
  tags: string[];
  attachments: string[];
  relatedTickets: string[];

  // Internal notes and customer communication
  notes: TicketNote[];
  responses: TicketResponse[];

  // Analytics
  viewCount: number;
  escalationCount: number;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
}

// Ticket note (internal)
interface TicketNote {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: number;
}

// Ticket response (customer communication)
interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isFromCustomer: boolean;
  createdAt: number;
  attachments: string[];
}

// Knowledge base article
interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  tags: string[];
  popularity: number;
  helpfulness: number;
  lastUpdated: number;
  isPublic: boolean;
}

// SLA configuration
interface SLAConfig {
  [TicketPriority.LOW]: {
    firstResponseTime: number; // minutes
    resolutionTime: number; // minutes
  };
  [TicketPriority.MEDIUM]: {
    firstResponseTime: number; // minutes
    resolutionTime: number; // minutes
  };
  [TicketPriority.HIGH]: {
    firstResponseTime: number; // minutes
    resolutionTime: number; // minutes
  };
  [TicketPriority.URGENT]: {
    firstResponseTime: number; // minutes
    resolutionTime: number; // minutes
  };
  [TicketPriority.CRITICAL]: {
    firstResponseTime: number; // minutes
    resolutionTime: number; // minutes
  };
}

// Escalation rules
interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    priority: TicketPriority[];
    category: TicketCategory[];
    ageInMinutes: number;
    slaBreached: boolean;
  };
  actions: {
    assignToTeam?: string;
    assignToUser?: string;
    increasePriority?: boolean;
    notifyManagement?: boolean;
    addTags?: string[];
  };
  enabled: boolean;
}

class SupportTicketingSystem {
  private tickets: Map<string, SupportTicket> = new Map();
  private knowledgeBase: Map<string, KnowledgeBaseArticle> = new Map();
  private escalationRules: EscalationRule[] = [];

  private slaConfig: SLAConfig = {
    [TicketPriority.LOW]: { firstResponseTime: 480, resolutionTime: 2880 }, // 8h, 48h
    [TicketPriority.MEDIUM]: { firstResponseTime: 240, resolutionTime: 1440 }, // 4h, 24h
    [TicketPriority.HIGH]: { firstResponseTime: 120, resolutionTime: 480 }, // 2h, 8h
    [TicketPriority.URGENT]: { firstResponseTime: 60, resolutionTime: 240 }, // 1h, 4h
    [TicketPriority.CRITICAL]: { firstResponseTime: 15, resolutionTime: 60 }, // 15m, 1h
  };

  constructor() {
    this.initializeEscalationRules();
    this.initializeKnowledgeBase();
    this.startEscalationMonitoring();
  }

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticketId = this.generateTicketId();
    const now = Date.now();

    // Auto-classify the ticket
    const classification = await this.classifyTicket(
      ticketData.title || '',
      ticketData.description || ''
    );

    const ticket: SupportTicket = {
      id: ticketId,
      title: ticketData.title || 'Untitled Ticket',
      description: ticketData.description || '',
      category: classification.category || TicketCategory.OTHER,
      priority: classification.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,

      customerId: ticketData.customerId || '',
      customerEmail: ticketData.customerEmail || '',
      customerName: ticketData.customerName || '',
      organizationId: ticketData.organizationId || '',
      organizationName: ticketData.organizationName || '',

      createdAt: now,
      updatedAt: now,

      slaTarget: this.slaConfig[classification.priority || TicketPriority.MEDIUM].firstResponseTime,
      slaBreached: false,

      tags: classification.suggestedTags || [],
      attachments: ticketData.attachments || [],
      relatedTickets: [],

      notes: [],
      responses: [],

      viewCount: 0,
      escalationCount: 0,
    };

    this.tickets.set(ticketId, ticket);

    // Auto-assign based on category and workload
    await this.autoAssignTicket(ticket);

    // Send notifications
    await this.sendTicketNotifications(ticket, 'created');

    // Track analytics
    getAnalytics().trackBusinessEvent('support_ticket_created', {
      ticket_id: ticketId,
      category: ticket.category,
      priority: ticket.priority,
      customer_id: ticket.customerId,
      organization_id: ticket.organizationId,
    });

    // Log to Sentry
    Sentry.addBreadcrumb({
      category: 'support-ticket',
      message: `New ticket created: ${ticket.title}`,
      level: 'info',
      data: {
        ticket_id: ticketId,
        category: ticket.category,
        priority: ticket.priority,
      },
    });

    return ticket;
  }

  /**
   * Add response to ticket
   */
  async addResponse(ticketId: string, responseData: Partial<TicketResponse>): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const responseId = this.generateResponseId();
    const response: TicketResponse = {
      id: responseId,
      ticketId,
      authorId: responseData.authorId || '',
      authorName: responseData.authorName || '',
      authorEmail: responseData.authorEmail || '',
      content: responseData.content || '',
      isFromCustomer: responseData.isFromCustomer || false,
      createdAt: Date.now(),
      attachments: responseData.attachments || [],
    };

    ticket.responses.push(response);
    ticket.updatedAt = Date.now();

    // Set first response time if this is the first staff response
    if (!response.isFromCustomer && !ticket.firstResponseAt) {
      ticket.firstResponseAt = Date.now();

      // Check SLA compliance
      const responseTime = ticket.firstResponseAt - ticket.createdAt;
      const slaTarget = this.slaConfig[ticket.priority].firstResponseTime * 60 * 1000; // Convert to ms

      if (responseTime > slaTarget) {
        ticket.slaBreached = true;

        // Log SLA breach
        Sentry.captureMessage('SLA breach - First response time exceeded', {
          level: 'warning',
          tags: {
            ticket_id: ticketId,
            priority: ticket.priority,
          },
          extra: {
            responseTime: responseTime / 1000 / 60, // in minutes
            slaTarget: this.slaConfig[ticket.priority].firstResponseTime,
          },
        });
      }
    }

    // Update status if customer responded
    if (response.isFromCustomer && ticket.status === TicketStatus.WAITING_FOR_CUSTOMER) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    // Send notifications
    await this.sendResponseNotifications(ticket, response);

    // Track analytics
    getAnalytics().trackBusinessEvent('support_response_added', {
      ticket_id: ticketId,
      is_from_customer: response.isFromCustomer,
      response_time_minutes: ticket.firstResponseAt
        ? (ticket.firstResponseAt - ticket.createdAt) / 1000 / 60
        : null,
    });
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    updatedBy: string
  ): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const oldStatus = ticket.status;
    ticket.status = newStatus;
    ticket.updatedAt = Date.now();

    // Set resolution/closure timestamps
    if (newStatus === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      ticket.resolvedAt = Date.now();

      // Check resolution SLA
      const resolutionTime = ticket.resolvedAt - ticket.createdAt;
      const slaTarget = this.slaConfig[ticket.priority].resolutionTime * 60 * 1000;

      if (resolutionTime > slaTarget && !ticket.slaBreached) {
        ticket.slaBreached = true;
      }
    }

    if (newStatus === TicketStatus.CLOSED && !ticket.closedAt) {
      ticket.closedAt = Date.now();
    }

    // Add internal note about status change
    await this.addNote(ticketId, {
      authorId: updatedBy,
      authorName: 'System',
      content: `Status changed from ${oldStatus} to ${newStatus}`,
      isInternal: true,
    });

    // Send notifications
    await this.sendTicketNotifications(ticket, 'status_updated');

    // Track analytics
    getAnalytics().trackBusinessEvent('support_ticket_status_updated', {
      ticket_id: ticketId,
      old_status: oldStatus,
      new_status: newStatus,
      updated_by: updatedBy,
    });
  }

  /**
   * Add internal note to ticket
   */
  async addNote(ticketId: string, noteData: Partial<TicketNote>): Promise<void> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const noteId = this.generateNoteId();
    const note: TicketNote = {
      id: noteId,
      ticketId,
      authorId: noteData.authorId || '',
      authorName: noteData.authorName || '',
      content: noteData.content || '',
      isInternal: noteData.isInternal || true,
      createdAt: Date.now(),
    };

    ticket.notes.push(note);
    ticket.updatedAt = Date.now();
  }

  /**
   * Auto-classify ticket using keywords and patterns
   */
  private async classifyTicket(
    title: string,
    description: string
  ): Promise<{
    category: TicketCategory;
    priority: TicketPriority;
    suggestedTags: string[];
  }> {
    const text = `${title} ${description}`.toLowerCase();

    // Category classification
    let category = TicketCategory.OTHER;

    if (text.includes('bug') || text.includes('error') || text.includes('crash')) {
      category = TicketCategory.BUG_REPORT;
    } else if (text.includes('billing') || text.includes('payment') || text.includes('invoice')) {
      category = TicketCategory.BILLING;
    } else if (text.includes('import') || text.includes('upload') || text.includes('data')) {
      category = TicketCategory.DATA_IMPORT;
    } else if (text.includes('report') || text.includes('export') || text.includes('pdf')) {
      category = TicketCategory.REPORTING;
    } else if (text.includes('api') || text.includes('integration') || text.includes('webhook')) {
      category = TicketCategory.INTEGRATION;
    } else if (text.includes('training') || text.includes('help') || text.includes('how to')) {
      category = TicketCategory.TRAINING;
    } else if (
      text.includes('feature') ||
      text.includes('enhancement') ||
      text.includes('request')
    ) {
      category = TicketCategory.FEATURE_REQUEST;
    } else if (text.includes('account') || text.includes('login') || text.includes('password')) {
      category = TicketCategory.ACCOUNT;
    }

    // Priority classification
    let priority = TicketPriority.MEDIUM;

    if (
      text.includes('urgent') ||
      text.includes('critical') ||
      text.includes('down') ||
      text.includes('outage')
    ) {
      priority = TicketPriority.CRITICAL;
    } else if (text.includes('asap') || text.includes('immediately') || text.includes('broken')) {
      priority = TicketPriority.URGENT;
    } else if (text.includes('important') || text.includes('soon') || text.includes('issue')) {
      priority = TicketPriority.HIGH;
    } else if (text.includes('when possible') || text.includes('suggestion')) {
      priority = TicketPriority.LOW;
    }

    // Generate suggested tags
    const suggestedTags: string[] = [];

    if (text.includes('rcsa')) suggestedTags.push('rcsa');
    if (text.includes('assessment')) suggestedTags.push('assessment');
    if (text.includes('document')) suggestedTags.push('document');
    if (text.includes('ai') || text.includes('analysis')) suggestedTags.push('ai');
    if (text.includes('compliance')) suggestedTags.push('compliance');
    if (text.includes('control')) suggestedTags.push('control');
    if (text.includes('risk')) suggestedTags.push('risk');

    return { category, priority, suggestedTags };
  }

  /**
   * Auto-assign ticket based on category and team workload
   */
  private async autoAssignTicket(ticket: SupportTicket): Promise<void> {
    const assignmentRules = {
      [TicketCategory.TECHNICAL_ISSUE]: 'tech-support',
      [TicketCategory.BUG_REPORT]: 'tech-support',
      [TicketCategory.INTEGRATION]: 'tech-support',
      [TicketCategory.BILLING]: 'billing',
      [TicketCategory.ACCOUNT]: 'customer-success',
      [TicketCategory.TRAINING]: 'customer-success',
      [TicketCategory.FEATURE_REQUEST]: 'product',
      [TicketCategory.DATA_IMPORT]: 'tech-support',
      [TicketCategory.REPORTING]: 'tech-support',
      [TicketCategory.OTHER]: 'general-support',
    };

    ticket.assignedTeam = assignmentRules[ticket.category];

    // In a real system, you'd also consider:
    // - Team member availability
    // - Current workload
    // - Expertise matching
    // - Round-robin assignment
  }

  /**
   * Initialize escalation rules
   */
  private initializeEscalationRules(): void {
    this.escalationRules = [
      {
        id: 'critical-priority-escalation',
        name: 'Critical Priority Escalation',
        conditions: {
          priority: [TicketPriority.CRITICAL],
          category: Object.values(TicketCategory),
          ageInMinutes: 30,
          slaBreached: false,
        },
        actions: {
          assignToTeam: 'escalation-team',
          notifyManagement: true,
          addTags: ['escalated', 'critical-review'],
        },
        enabled: true,
      },
      {
        id: 'sla-breach-escalation',
        name: 'SLA Breach Escalation',
        conditions: {
          priority: Object.values(TicketPriority),
          category: Object.values(TicketCategory),
          ageInMinutes: 60,
          slaBreached: true,
        },
        actions: {
          assignToTeam: 'escalation-team',
          notifyManagement: true,
          addTags: ['sla-breach', 'escalated'],
        },
        enabled: true,
      },
      {
        id: 'urgent-aging-escalation',
        name: 'Urgent Ticket Aging Escalation',
        conditions: {
          priority: [TicketPriority.URGENT],
          category: Object.values(TicketCategory),
          ageInMinutes: 120,
          slaBreached: false,
        },
        actions: {
          increasePriority: true,
          notifyManagement: true,
          addTags: ['aged-urgent', 'escalated'],
        },
        enabled: true,
      },
    ];
  }

  /**
   * Initialize knowledge base with common articles
   */
  private initializeKnowledgeBase(): void {
    const articles: KnowledgeBaseArticle[] = [
      {
        id: 'rcsa-getting-started',
        title: 'Getting Started with RCSA Assessments',
        content: `# Getting Started with RCSA Assessments

## What is an RCSA?
Risk and Control Self-Assessment (RCSA) is a process where business units assess their own risks and the effectiveness of controls.

## Creating Your First Assessment
1. Navigate to the Dashboard
2. Click "New RCSA Assessment"
3. Fill in assessment details
4. Define scope and timeline
5. Begin risk identification

## Best Practices
- Involve key stakeholders
- Regular review and updates
- Document all decisions
- Link controls to risks

For more detailed guidance, contact our support team.`,
        category: TicketCategory.TRAINING,
        tags: ['rcsa', 'getting-started', 'assessment'],
        popularity: 95,
        helpfulness: 4.8,
        lastUpdated: Date.now(),
        isPublic: true,
      },
      {
        id: 'document-upload-issues',
        title: 'Troubleshooting Document Upload Issues',
        content: `# Document Upload Troubleshooting

## Common Issues and Solutions

### File Size Too Large
- Maximum file size: 50MB
- Compress large files before uploading
- Split large documents if necessary

### Unsupported File Format
- Supported formats: PDF, DOCX, XLSX
- Convert files to supported formats
- Contact support for additional format needs

### Upload Timeout
- Check internet connection
- Try uploading during off-peak hours
- Break large uploads into smaller batches

### AI Analysis Not Working
- Ensure document text is readable
- Check for password-protected files
- Verify document language is supported

Contact support if issues persist.`,
        category: TicketCategory.DATA_IMPORT,
        tags: ['upload', 'document', 'troubleshooting'],
        popularity: 78,
        helpfulness: 4.5,
        lastUpdated: Date.now(),
        isPublic: true,
      },
    ];

    articles.forEach((article) => this.knowledgeBase.set(article.id, article));
  }

  /**
   * Start escalation monitoring
   */
  private startEscalationMonitoring(): void {
    // Check for escalations every 5 minutes
    setInterval(
      () => {
        this.checkEscalations();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check for tickets that need escalation
   */
  private checkEscalations(): void {
    const now = Date.now();

    for (const ticket of this.tickets.values()) {
      if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED) {
        continue;
      }

      const ticketAgeMinutes = (now - ticket.createdAt) / 1000 / 60;

      for (const rule of this.escalationRules) {
        if (!rule.enabled) continue;

        // Check if ticket matches escalation conditions
        const matchesPriority = rule.conditions.priority.includes(ticket.priority);
        const matchesCategory = rule.conditions.category.includes(ticket.category);
        const exceededAge = ticketAgeMinutes >= rule.conditions.ageInMinutes;
        const slaConditionMet = !rule.conditions.slaBreached || ticket.slaBreached;

        if (matchesPriority && matchesCategory && exceededAge && slaConditionMet) {
          this.executeEscalation(ticket, rule);
        }
      }
    }
  }

  /**
   * Execute escalation actions
   */
  private async executeEscalation(ticket: SupportTicket, rule: EscalationRule): Promise<void> {
    ticket.escalationCount++;

    // Apply escalation actions
    if (rule.actions.assignToTeam) {
      ticket.assignedTeam = rule.actions.assignToTeam;
    }

    if (rule.actions.assignToUser) {
      ticket.assignedTo = rule.actions.assignToUser;
    }

    if (rule.actions.increasePriority && ticket.priority !== TicketPriority.CRITICAL) {
      const priorities = [
        TicketPriority.LOW,
        TicketPriority.MEDIUM,
        TicketPriority.HIGH,
        TicketPriority.URGENT,
        TicketPriority.CRITICAL,
      ];
      const currentIndex = priorities.indexOf(ticket.priority);
      if (currentIndex < priorities.length - 1) {
        ticket.priority = priorities[currentIndex + 1];
      }
    }

    if (rule.actions.addTags) {
      ticket.tags.push(...rule.actions.addTags);
    }

    ticket.updatedAt = Date.now();

    // Add escalation note
    await this.addNote(ticket.id, {
      authorId: 'system',
      authorName: 'System',
      content: `Ticket escalated due to rule: ${rule.name}`,
      isInternal: true,
    });

    // Send notifications
    if (rule.actions.notifyManagement) {
      await this.sendEscalationNotification(ticket, rule);
    }

    // Log escalation
    Sentry.captureMessage('Ticket escalated', {
      level: 'warning',
      tags: {
        ticket_id: ticket.id,
        escalation_rule: rule.id,
      },
      extra: {
        ticket_age_minutes: (Date.now() - ticket.createdAt) / 1000 / 60,
        escalation_count: ticket.escalationCount,
      },
    });

    // Track analytics
    getAnalytics().trackBusinessEvent('support_ticket_escalated', {
      ticket_id: ticket.id,
      escalation_rule: rule.id,
      escalation_count: ticket.escalationCount,
      ticket_age_minutes: (Date.now() - ticket.createdAt) / 1000 / 60,
    });
  }

  /**
   * Send ticket notifications
   */
  private async sendTicketNotifications(ticket: SupportTicket, event: string): Promise<void> {
    // Implementation would send emails, Slack messages, etc.
    // console.log(`Sending ${event} notification for ticket ${ticket.id}`)
  }

  /**
   * Send response notifications
   */
  private async sendResponseNotifications(
    ticket: SupportTicket,
    response: TicketResponse
  ): Promise<void> {
    // Implementation would notify appropriate parties
    // console.log(`Sending response notification for ticket ${ticket.id}`)
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(
    ticket: SupportTicket,
    rule: EscalationRule
  ): Promise<void> {
    // Implementation would notify management
    // console.log(`Sending escalation notification for ticket ${ticket.id} (rule: ${rule.name})`)
  }

  /**
   * Utility functions
   */
  private generateTicketId(): string {
    return `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  private generateResponseId(): string {
    return `RESP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateNoteId(): string {
    return `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Public API methods
   */
  getTicket(ticketId: string): SupportTicket | undefined {
    return this.tickets.get(ticketId);
  }

  searchTickets(_query: {
    status?: TicketStatus[];
    priority?: TicketPriority[];
    category?: TicketCategory[];
    assignedTo?: string;
    customerId?: string;
    organizationId?: string;
  }): SupportTicket[] {
    return Array.from(this.tickets.values()).filter((ticket) => {
      if (query.status && !query.status.includes(ticket.status)) return false;
      if (query.priority && !query.priority.includes(ticket.priority)) return false;
      if (query.category && !query.category.includes(ticket.category)) return false;
      if (query.assignedTo && ticket.assignedTo !== query.assignedTo) return false;
      if (query.customerId && ticket.customerId !== query.customerId) return false;
      if (query.organizationId && ticket.organizationId !== query.organizationId) return false;
      return true;
    });
  }

  getTicketMetrics(): {
    totalTickets: number;
    openTickets: number;
    avgFirstResponseTime: number;
    avgResolutionTime: number;
    slaBreaches: number;
    satisfactionScore: number;
  } {
    const tickets = Array.from(this.tickets.values());
    const openTickets = tickets.filter(
      (t) => t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED
    );

    const ticketsWithFirstResponse = tickets.filter((t) => t.firstResponseAt);
    const avgFirstResponseTime =
      ticketsWithFirstResponse.length > 0
        ? ticketsWithFirstResponse.reduce((sum, t) => sum + (t.firstResponseAt! - t.createdAt), 0) /
          ticketsWithFirstResponse.length /
          1000 /
          60
        : 0;

    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt! - t.createdAt), 0) /
          resolvedTickets.length /
          1000 /
          60
        : 0;

    const slaBreaches = tickets.filter((t) => t.slaBreached).length;

    const ticketsWithRating = tickets.filter((t) => t.satisfactionRating);
    const satisfactionScore =
      ticketsWithRating.length > 0
        ? ticketsWithRating.reduce((sum, t) => sum + t.satisfactionRating!, 0) /
          ticketsWithRating.length
        : 0;

    return {
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      avgFirstResponseTime,
      avgResolutionTime,
      slaBreaches,
      satisfactionScore,
    };
  }

  searchKnowledgeBase(_query: string): KnowledgeBaseArticle[] {
    const searchTerms = query.toLowerCase().split(' ');

    return Array.from(this.knowledgeBase.values())
      .filter((article) => {
        const content =
          `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
        return searchTerms.some((term) => content.includes(term));
      })
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);
  }
}

// Singleton instance
let supportSystem: SupportTicketingSystem | null = null;

export const getSupportSystem = (): SupportTicketingSystem => {
  if (!supportSystem) {
    supportSystem = new SupportTicketingSystem();
  }
  return supportSystem;
};

// Export types and enums
export {
  type SupportTicket,
  type TicketNote,
  type TicketResponse,
  type KnowledgeBaseArticle,
  type EscalationRule,
};

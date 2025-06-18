import { NextRequest } from 'next/server';
import { withAPI, withValidation, createAPIResponse, parsePagination, parseSorting, parseSearch, createPaginationMeta, NotFoundError, ForbiddenError } from '@/lib/api/middleware';
import { getAuthenticatedUser, type AuthenticatedRequest } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Notification schemas
const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'error', 'risk_alert', 'task_assigned', 'workflow_update']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  recipientId: z.string().uuid().optional(),
  entityType: z.enum(['risk', 'control', 'document', 'workflow', 'task', 'assessment']).optional(),
  entityId: z.string().uuid().optional(),
  actionUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const notificationQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  isRead: z.enum(['true', 'false']).optional(),
  entityType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(['mark_read', 'mark_unread', 'delete']),
});

// GET /api/notifications - List user's notifications
export const GET = withAPI(
  withValidation(notificationQuerySchema)(async (req: NextRequest, query) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(searchParams, { maxLimit: 100 });

    // Parse sorting
    const orderBy = parseSorting(searchParams, {
      defaultSort: 'createdAt',
      defaultOrder: 'desc',
      allowedFields: ['createdAt', 'title', 'type', 'priority', 'isRead'],
    });

    // Parse search
    const search = parseSearch(searchParams);

    // Build where clause with user isolation
    const where: any = {
      OR: [
        { recipientId: user.id },
        { 
          AND: [
            { recipientId: null }, // Global notifications
            { organizationId: user.organizationId }
          ]
        }
      ],
    };

    // Add search functionality
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Add filters
    if (query.type) {
      where.type = query.type;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.isRead) {
      where.isRead = query.isRead === 'true';
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    // Date range filtering
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    // Exclude expired notifications
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    try {
      // Execute queries in parallel
      const [notifications, total, unreadCount] = await Promise.all([
        db.client.notification.findMany({
          where,
          skip,
          take,
          orderBy,
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
        }),
        db.client.notification.count({ where }),
        db.client.notification.count({
          where: {
            ...where,
            isRead: false,
          },
        }),
      ]);

      const paginationMeta = createPaginationMeta({
        page,
        limit,
        total,
        itemCount: notifications.length,
      });

      return createAPIResponse({
        data: notifications,
        meta: {
          pagination: paginationMeta,
          total,
          unreadCount,
          filters: {
            type: query.type,
            priority: query.priority,
            isRead: query.isRead,
            entityType: query.entityType,
            search,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  })
);

// POST /api/notifications - Create new notification
export const POST = withAPI(
  withValidation(createNotificationSchema)(async (req: NextRequest, data) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    try {
      // If no recipient specified, create for current user
      const recipientId = data.recipientId || user.id;

      // Verify recipient exists and belongs to same organization
      if (data.recipientId) {
        const recipient = await db.client.user.findUnique({
          where: { id: data.recipientId },
        });

        if (!recipient || recipient.organizationId !== user.organizationId) {
          throw new ForbiddenError('Invalid recipient');
        }
      }

      const notification = await db.client.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          recipientId,
          senderId: user.id,
          organizationId: user.organizationId,
          entityType: data.entityType,
          entityId: data.entityId,
          actionUrl: data.actionUrl,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          metadata: data.metadata || {},
          isRead: false,
        },
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
      });

      // TODO: Send real-time notification via WebSocket
      // await broadcastNotification(recipientId, notification);

      return createAPIResponse({
        data: notification,
        message: 'Notification created successfully',
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  })
);

// PUT /api/notifications - Bulk update notifications
export const PUT = withAPI(
  withValidation(bulkUpdateSchema)(async (req: NextRequest, data) => {
    const authReq = req as AuthenticatedRequest;
    const user = getAuthenticatedUser(authReq);

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    try {
      // Verify user has access to all notifications
      const existingNotifications = await db.client.notification.findMany({
        where: {
          id: { in: data.ids },
          OR: [
            { recipientId: user.id },
            { 
              AND: [
                { recipientId: null },
                { organizationId: user.organizationId }
              ]
            }
          ],
        },
      });

      if (existingNotifications.length !== data.ids.length) {
        throw new ForbiddenError('Access denied to some notifications');
      }

      let result;

      switch (data.action) {
        case 'mark_read':
          result = await db.client.notification.updateMany({
            where: {
              id: { in: data.ids },
            },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });
          break;

        case 'mark_unread':
          result = await db.client.notification.updateMany({
            where: {
              id: { in: data.ids },
            },
            data: {
              isRead: false,
              readAt: null,
            },
          });
          break;

        case 'delete':
          result = await db.client.notification.deleteMany({
            where: {
              id: { in: data.ids },
            },
          });
          break;

        default:
          throw new Error('Invalid action');
      }

      return createAPIResponse({
        data: { updated: result.count },
        message: `${result.count} notifications ${data.action === 'delete' ? 'deleted' : 'updated'} successfully`,
      });
    } catch (error) {
      console.error('Error bulk updating notifications:', error);
      throw new Error('Failed to update notifications');
    }
  })
);

// DELETE /api/notifications - Delete all read notifications
export const DELETE = withAPI(async (req: NextRequest) => {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const url = new URL(req.url);
    const deleteAll = url.searchParams.get('all') === 'true';

    const whereClause: any = {
      OR: [
        { recipientId: user.id },
        { 
          AND: [
            { recipientId: null },
            { organizationId: user.organizationId }
          ]
        }
      ],
    };

    if (!deleteAll) {
      whereClause.isRead = true;
    }

    const result = await db.client.notification.deleteMany({
      where: whereClause,
    });

    return createAPIResponse({
      data: { deleted: result.count },
      message: `${result.count} notifications deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw new Error('Failed to delete notifications');
  }
});

// GET /api/notifications/stats - Get notification statistics
export async function getNotificationStats(req: NextRequest) {
  const authReq = req as AuthenticatedRequest;
  const user = getAuthenticatedUser(authReq);

  if (!user) {
    throw new ForbiddenError('Authentication required');
  }

  try {
    const baseWhere = {
      OR: [
        { recipientId: user.id },
        { 
          AND: [
            { recipientId: null },
            { organizationId: user.organizationId }
          ]
        }
      ],
    };

    const [
      totalCount,
      unreadCount,
      priorityStats,
      typeStats,
    ] = await Promise.all([
      db.client.notification.count({ where: baseWhere }),
      db.client.notification.count({ 
        where: { ...baseWhere, isRead: false } 
      }),
      db.client.notification.groupBy({
        by: ['priority'],
        where: { ...baseWhere, isRead: false },
        _count: true,
      }),
      db.client.notification.groupBy({
        by: ['type'],
        where: { ...baseWhere, isRead: false },
        _count: true,
      }),
    ]);

    return createAPIResponse({
      data: {
        total: totalCount,
        unread: unreadCount,
        read: totalCount - unreadCount,
        byPriority: priorityStats.reduce((acc, stat) => {
          acc[stat.priority] = stat._count;
          return acc;
        }, {} as Record<string, number>),
        byType: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new Error('Failed to get notification statistics');
  }
}

// Helper functions for creating common notifications
export async function createRiskAlert(
  organizationId: string,
  recipientId: string,
  risk: {
    id: string;
    title: string;
    riskLevel: string;
    category: string;
  },
  senderId?: string
) {
  try {
    return await db.client.notification.create({
      data: {
        title: `High Risk Alert: ${risk.title}`,
        message: `A ${risk.riskLevel} risk has been identified in ${risk.category} that requires immediate attention.`,
        type: 'risk_alert',
        priority: risk.riskLevel === 'CRITICAL' ? 'critical' : 'high',
        recipientId,
        senderId,
        organizationId,
        entityType: 'risk',
        entityId: risk.id,
        actionUrl: `/dashboard/risks/${risk.id}`,
        metadata: {
          riskLevel: risk.riskLevel,
          category: risk.category,
        },
      },
    });
  } catch (error) {
    console.error('Error creating risk alert:', error);
    throw error;
  }
}

export async function createTaskNotification(
  organizationId: string,
  recipientId: string,
  task: {
    id: string;
    title: string;
    dueDate?: Date;
  },
  senderId?: string
) {
  try {
    const isOverdue = task.dueDate && task.dueDate < new Date();
    
    return await db.client.notification.create({
      data: {
        title: isOverdue ? `Overdue Task: ${task.title}` : `Task Assigned: ${task.title}`,
        message: isOverdue 
          ? `Task "${task.title}" is overdue and requires immediate attention.`
          : `You have been assigned a new task: "${task.title}".`,
        type: 'task_assigned',
        priority: isOverdue ? 'high' : 'medium',
        recipientId,
        senderId,
        organizationId,
        entityType: 'task',
        entityId: task.id,
        actionUrl: `/dashboard/tasks/${task.id}`,
        metadata: {
          dueDate: task.dueDate?.toISOString(),
          isOverdue,
        },
      },
    });
  } catch (error) {
    console.error('Error creating task notification:', error);
    throw error;
  }
}

export async function createWorkflowNotification(
  organizationId: string,
  recipientId: string,
  workflow: {
    id: string;
    name: string;
    status: string;
  },
  action: string,
  senderId?: string
) {
  try {
    return await db.client.notification.create({
      data: {
        title: `Workflow ${action}: ${workflow.name}`,
        message: `Workflow "${workflow.name}" has been ${action.toLowerCase()}.`,
        type: 'workflow_update',
        priority: 'medium',
        recipientId,
        senderId,
        organizationId,
        entityType: 'workflow',
        entityId: workflow.id,
        actionUrl: `/dashboard/workflows/${workflow.id}`,
        metadata: {
          action,
          status: workflow.status,
        },
      },
    });
  } catch (error) {
    console.error('Error creating workflow notification:', error);
    throw error;
  }
} 
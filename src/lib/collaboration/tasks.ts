import { db } from '@/lib/db';
import { collaborationServer } from '@/lib/websocket/server';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'review' | 'approval' | 'action' | 'information' | 'escalation';
  assigneeId: string;
  creatorId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  dueDate?: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
  dependencies: string[];
  attachments: string[];
  tags: string[];
  watchers: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskUpdate {
  taskId: string;
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  entityType: string;
  organizationId: string;
  steps: ApprovalStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  id: string;
  order: number;
  name: string;
  type: 'individual' | 'group' | 'majority' | 'unanimous';
  approvers: string[];
  requiredApprovals: number;
  autoAssign: boolean;
  timeoutHours?: number;
  escalationUserId?: string;
  conditions?: ApprovalCondition[];
}

export interface ApprovalCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  requesterId: string;
  organizationId: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
  approvals: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  stepId: string;
  approverId: string;
  action: 'approve' | 'reject' | 'delegate';
  comment?: string;
  delegatedTo?: string;
  timestamp: Date;
}

export class TaskManager {
  
  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const createdTask = await db.client.task.create({
      data: {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        watchers: {
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

    // Create activity log
    await db.client.activity.create({
      data: {
        type: 'TASK_CREATED',
        entityType: task.entityType.toUpperCase(),
        entityId: task.entityId,
        description: `Task created: ${task.title}`,
        userId: task.creatorId,
        organizationId: task.organizationId,
        metadata: {
          taskId: createdTask.id,
          assigneeId: task.assigneeId,
          priority: task.priority,
          dueDate: task.dueDate,
        },
        isPublic: true,
      },
    });

    // Send real-time notification to assignee
    if (collaborationServer) {
      collaborationServer.sendToUser(task.assigneeId, {
        type: 'task:assigned',
        payload: { task: createdTask },
        timestamp: new Date(),
        userId: task.creatorId,
      });
    }

    // Send notifications to watchers
    for (const watcherId of task.watchers) {
      await this.createTaskNotification({
        type: 'TASK_CREATED',
        recipientId: watcherId,
        senderId: task.creatorId,
        taskId: createdTask.id,
        title: 'New Task Created',
        message: `${createdTask.creator.firstName} ${createdTask.creator.lastName} created a new task: ${task.title}`,
      });
    }

    return createdTask;
  }

  // Update task status and fields
  async updateTask(taskId: string, updates: Partial<Task>, updatedBy: string): Promise<Task> {
    const existingTask = await db.client.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Track changes for audit
    const changes: TaskUpdate[] = [];
    for (const [field, newValue] of Object.entries(updates)) {
      if (field in existingTask && (existingTask as any)[field] !== newValue) {
        changes.push({
          taskId,
          field,
          oldValue: (existingTask as any)[field],
          newValue,
          updatedBy,
          updatedAt: new Date(),
        });
      }
    }

    // Update task
    const updatedTask = await db.client.task.update({
      where: { id: taskId },
      data: {
        ...updates,
        updatedAt: new Date(),
        completedAt: updates.status === 'completed' ? new Date() : existingTask.completedAt,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        watchers: {
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

    // Log changes
    for (const change of changes) {
      await db.client.taskUpdate.create({
        data: change,
      });
    }

    // Create activity log
    await db.client.activity.create({
      data: {
        type: 'TASK_UPDATED',
        entityType: existingTask.entityType.toUpperCase(),
        entityId: existingTask.entityId,
        description: `Task updated: ${existingTask.title}`,
        userId: updatedBy,
        organizationId: existingTask.organizationId,
        metadata: {
          taskId,
          changes: changes.map(c => ({ field: c.field, from: c.oldValue, to: c.newValue })),
        },
        isPublic: true,
      },
    });

    // Send real-time updates
    if (collaborationServer) {
      const roomId = `task:${taskId}`;
      collaborationServer.broadcastToRoom(roomId, {
        type: 'task:updated',
        payload: { task: updatedTask, changes },
        timestamp: new Date(),
        userId: updatedBy,
      });
    }

    // Send notifications for status changes
    if (updates.status && updates.status !== existingTask.status) {
      await this.handleStatusChangeNotifications(updatedTask, existingTask.status, updates.status, updatedBy);
    }

    // Send notifications for assignee changes
    if (updates.assigneeId && updates.assigneeId !== existingTask.assigneeId) {
      await this.createTaskNotification({
        type: 'TASK_REASSIGNED',
        recipientId: updates.assigneeId,
        senderId: updatedBy,
        taskId,
        title: 'Task Assigned to You',
        message: `You have been assigned to task: ${existingTask.title}`,
      });

      // Notify previous assignee
      if (existingTask.assigneeId) {
        await this.createTaskNotification({
          type: 'TASK_REASSIGNED',
          recipientId: existingTask.assigneeId,
          senderId: updatedBy,
          taskId,
          title: 'Task Reassigned',
          message: `Task "${existingTask.title}" has been reassigned`,
        });
      }
    }

    return updatedTask;
  }

  // Add comment to task
  async addTaskComment(taskId: string, content: string, authorId: string, mentions: string[] = []): Promise<TaskComment> {
    const comment = await db.client.taskComment.create({
      data: {
        taskId,
        content,
        authorId,
        mentions,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        author: {
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

    // Get task info for notifications
    const task = await db.client.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true,
        watchers: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Send real-time update
    if (collaborationServer) {
      const roomId = `task:${taskId}`;
      collaborationServer.broadcastToRoom(roomId, {
        type: 'task:comment_added',
        payload: { comment },
        timestamp: new Date(),
        userId: authorId,
      });
    }

    // Handle mentions
    for (const mentionedUserId of mentions) {
      await this.createTaskNotification({
        type: 'TASK_MENTION',
        recipientId: mentionedUserId,
        senderId: authorId,
        taskId,
        title: 'You were mentioned in a task',
        message: `${comment.author.firstName} ${comment.author.lastName} mentioned you in task: ${task.title}`,
      });
    }

    // Notify task participants (excluding comment author)
    const participantIds = new Set([
      task.assigneeId,
      task.creatorId,
      ...task.watchers.map(w => w.id),
    ]);
    participantIds.delete(authorId);

    for (const participantId of participantIds) {
      await this.createTaskNotification({
        type: 'TASK_COMMENT',
        recipientId: participantId,
        senderId: authorId,
        taskId,
        title: 'New Task Comment',
        message: `${comment.author.firstName} ${comment.author.lastName} commented on task: ${task.title}`,
      });
    }

    return comment;
  }

  // Get tasks for user with filtering
  async getUserTasks(userId: string, organizationId: string, filters: {
    status?: string[];
    priority?: string[];
    type?: string[];
    assigned?: boolean;
    created?: boolean;
    watching?: boolean;
    entityType?: string;
    entityId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    completedFrom?: Date;
    completedTo?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tasks: Task[]; total: number }> {
    
    const where: any = {
      organizationId,
      OR: [],
    };

    if (filters.assigned) {
      where.OR.push({ assigneeId: userId });
    }
    
    if (filters.created) {
      where.OR.push({ creatorId: userId });
    }
    
    if (filters.watching) {
      where.OR.push({ watchers: { some: { id: userId } } });
    }

    // If no role specified, default to assigned tasks
    if (where.OR.length === 0) {
      where.OR.push({ assigneeId: userId });
    }

    // Add filters
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = filters.dueDateFrom;
      if (filters.dueDateTo) where.dueDate.lte = filters.dueDateTo;
    }

    if (filters.completedFrom || filters.completedTo) {
      where.completedAt = {};
      if (filters.completedFrom) where.completedAt.gte = filters.completedFrom;
      if (filters.completedTo) where.completedAt.lte = filters.completedTo;
    }

    const [tasks, total] = await Promise.all([
      db.client.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          watchers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          comments: {
            include: {
              author: {
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
            take: 3,
          },
          _count: {
            select: {
              comments: true,
              watchers: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      db.client.task.count({ where }),
    ]);

    return { tasks, total };
  }

  // Handle status change notifications
  private async handleStatusChangeNotifications(task: Task, oldStatus: string, newStatus: string, updatedBy: string): Promise<void> {
    const statusMessages = {
      'todo': 'Task is ready to start',
      'in_progress': 'Task is now in progress',
      'review': 'Task is ready for review',
      'completed': 'Task has been completed',
      'cancelled': 'Task has been cancelled',
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Task status updated';

    // Notify assignee if different from updater
    if (task.assigneeId && task.assigneeId !== updatedBy) {
      await this.createTaskNotification({
        type: 'TASK_STATUS_CHANGED',
        recipientId: task.assigneeId,
        senderId: updatedBy,
        taskId: task.id,
        title: 'Task Status Updated',
        message: `${message}: ${task.title}`,
      });
    }

    // Notify creator if different from updater and assignee
    if (task.creatorId && task.creatorId !== updatedBy && task.creatorId !== task.assigneeId) {
      await this.createTaskNotification({
        type: 'TASK_STATUS_CHANGED',
        recipientId: task.creatorId,
        senderId: updatedBy,
        taskId: task.id,
        title: 'Task Status Updated',
        message: `${message}: ${task.title}`,
      });
    }

    // Special handling for completion
    if (newStatus === 'completed') {
      await this.handleTaskCompletion(task, updatedBy);
    }
  }

  // Handle task completion logic
  private async handleTaskCompletion(task: Task, completedBy: string): Promise<void> {
    // Check for dependent tasks
    const dependentTasks = await db.client.task.findMany({
      where: {
        dependencies: { has: task.id },
        organizationId: task.organizationId,
        status: { not: 'completed' },
      },
    });

    // Notify owners of dependent tasks
    for (const dependentTask of dependentTasks) {
      await this.createTaskNotification({
        type: 'TASK_DEPENDENCY_COMPLETED',
        recipientId: dependentTask.assigneeId,
        senderId: completedBy,
        taskId: dependentTask.id,
        title: 'Dependency Completed',
        message: `Task dependency "${task.title}" has been completed. You can now proceed with "${dependentTask.title}".`,
      });
    }

    // Check if this completes any workflows or milestones
    await this.checkWorkflowCompletion(task);
  }

  // Check if task completion triggers workflow completion
  private async checkWorkflowCompletion(task: Task): Promise<void> {
    // Get all tasks for the same entity
    const entityTasks = await db.client.task.findMany({
      where: {
        entityType: task.entityType,
        entityId: task.entityId,
        organizationId: task.organizationId,
      },
    });

    const totalTasks = entityTasks.length;
    const completedTasks = entityTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = entityTasks.filter(t => t.status === 'in_progress').length;

    // Log workflow progress
    await db.client.activity.create({
      data: {
        type: 'WORKFLOW_PROGRESS',
        entityType: task.entityType.toUpperCase(),
        entityId: task.entityId,
        description: `Workflow progress: ${completedTasks}/${totalTasks} tasks completed`,
        userId: 'system',
        organizationId: task.organizationId,
        metadata: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          completionPercentage: Math.round((completedTasks / totalTasks) * 100),
        },
        isPublic: true,
      },
    });

    // Check for milestone completion (e.g., 50%, 75%, 100%)
    const completionPercentage = (completedTasks / totalTasks) * 100;
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (completionPercentage >= milestone) {
        // Check if this milestone was already reached
        const existingMilestone = await db.client.activity.findFirst({
          where: {
            entityType: task.entityType.toUpperCase(),
            entityId: task.entityId,
            type: 'MILESTONE_REACHED',
            metadata: {
              path: ['milestone'],
              equals: milestone,
            },
          },
        });

        if (!existingMilestone) {
          await db.client.activity.create({
            data: {
              type: 'MILESTONE_REACHED',
              entityType: task.entityType.toUpperCase(),
              entityId: task.entityId,
              description: `${milestone}% milestone reached`,
              userId: 'system',
              organizationId: task.organizationId,
              metadata: {
                milestone,
                completedTasks,
                totalTasks,
              },
              isPublic: true,
            },
          });
        }
      }
    }
  }

  // Create task notification
  private async createTaskNotification(notification: {
    type: string;
    recipientId: string;
    senderId: string;
    taskId: string;
    title: string;
    message: string;
  }): Promise<void> {
    try {
      const dbNotification = await db.client.notification.create({
        data: {
          type: notification.type,
          recipientId: notification.recipientId,
          senderId: notification.senderId,
          entityType: 'TASK',
          entityId: notification.taskId,
          title: notification.title,
          message: notification.message,
          isRead: false,
          createdAt: new Date(),
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

      // Send real-time notification
      if (collaborationServer) {
        collaborationServer.sendToUser(notification.recipientId, {
          type: 'notification:received',
          payload: { notification: dbNotification },
          timestamp: new Date(),
          userId: notification.senderId,
        });
      }

    } catch (error) {
      console.error('Failed to create task notification:', error);
    }
  }

  // Delete task
  async deleteTask(taskId: string, deletedBy: string): Promise<void> {
    const task = await db.client.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        creator: true,
        watchers: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user has permission to delete
    if (task.creatorId !== deletedBy && task.assigneeId !== deletedBy) {
      // Check if user has admin permissions
      const user = await db.client.user.findUnique({
        where: { id: deletedBy },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      const hasDeletePermission = user?.userRoles.some(ur =>
        ur.role.permissions.some(p => p.name === 'TASKS_DELETE')
      );

      if (!hasDeletePermission) {
        throw new Error('Insufficient permissions to delete task');
      }
    }

    // Delete task and related data
    await db.client.$transaction([
      db.client.taskComment.deleteMany({ where: { taskId } }),
      db.client.taskUpdate.deleteMany({ where: { taskId } }),
      db.client.notification.deleteMany({ where: { entityType: 'TASK', entityId: taskId } }),
      db.client.task.delete({ where: { id: taskId } }),
    ]);

    // Log activity
    await db.client.activity.create({
      data: {
        type: 'TASK_DELETED',
        entityType: task.entityType.toUpperCase(),
        entityId: task.entityId,
        description: `Task deleted: ${task.title}`,
        userId: deletedBy,
        organizationId: task.organizationId,
        metadata: {
          taskId,
          taskTitle: task.title,
          assigneeId: task.assigneeId,
        },
        isPublic: true,
      },
    });

    // Notify participants
    const participantIds = new Set([
      task.assigneeId,
      task.creatorId,
      ...task.watchers.map(w => w.id),
    ]);
    participantIds.delete(deletedBy);

    for (const participantId of participantIds) {
      await this.createTaskNotification({
        type: 'TASK_DELETED',
        recipientId: participantId,
        senderId: deletedBy,
        taskId,
        title: 'Task Deleted',
        message: `Task "${task.title}" has been deleted`,
      });
    }

    // Send real-time update
    if (collaborationServer) {
      const roomId = `task:${taskId}`;
      collaborationServer.broadcastToRoom(roomId, {
        type: 'task:deleted',
        payload: { taskId },
        timestamp: new Date(),
        userId: deletedBy,
      });
    }
  }
}

export const taskManager = new TaskManager(); 
import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';
import { getDemoData } from '@/lib/demo-data';

const GetTasksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTo: z.string().optional(),
});

export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    // Check if this is a demo user
    if (shouldServeDemoData(user.id, user.organizationId)) {
      const { searchParams } = new URL(req.url);
      const query = GetTasksQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Generate demo tasks based on risks and controls
      const demoTasks = [
        {
          id: 'task-1',
          title: 'Review high-risk credit portfolio controls',
          description: 'Quarterly review of credit risk controls effectiveness',
          status: 'OPEN',
          priority: 'HIGH',
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          dueDate: new Date('2025-02-15'),
          entityType: 'RISK',
          entityId: 'R001',
          entityTitle: 'Credit portfolio monitoring gaps',
          createdAt: new Date('2024-12-01'),
          updatedAt: new Date('2024-12-01'),
          organizationId: user.organizationId
        },
        {
          id: 'task-2',
          title: 'Update encryption implementation plan',
          description: 'Address data encryption gaps in core banking systems',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          dueDate: new Date('2025-01-30'),
          entityType: 'RISK',
          entityId: 'R003',
          entityTitle: 'Data encryption gaps in core banking systems',
          createdAt: new Date('2024-11-15'),
          updatedAt: new Date('2024-12-15'),
          organizationId: user.organizationId
        },
        {
          id: 'task-3',
          title: 'Control testing for MFA system',
          description: 'Quarterly effectiveness testing of multi-factor authentication',
          status: 'OPEN',
          priority: 'MEDIUM',
          assignedTo: user.id,
          assignedToName: `${user.firstName} ${user.lastName}`,
          dueDate: new Date('2025-01-20'),
          entityType: 'CONTROL',
          entityId: 'C001',
          entityTitle: 'Operational Safeguard #1',
          createdAt: new Date('2024-12-01'),
          updatedAt: new Date('2024-12-01'),
          organizationId: user.organizationId
        },
      ];

      const filtered = demoTasks.filter(task => {
        if (query.status && task.status !== query.status) return false;
        if (query.priority && task.priority !== query.priority) return false;
        if (query.assignedTo && task.assignedTo !== query.assignedTo) return false;
        return true;
      });

      const startIndex = (query.page - 1) * query.limit;
      const paginatedTasks = filtered.slice(startIndex, startIndex + query.limit);

      return NextResponse.json({
        success: true,
        data: paginatedTasks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / query.limit)
        },
        demoMode: true
      });
    }

    try {
      const { searchParams } = new URL(req.url);
      const query = GetTasksQuerySchema.parse(Object.fromEntries(searchParams));
      
      const whereClause: any = {
        organizationId: user.organizationId
      };

      if (query.status) {
        whereClause.status = query.status;
      }
      
      if (query.priority) {
        whereClause.priority = query.priority;
      }
      
      if (query.assignedTo) {
        whereClause.assignedTo = query.assignedTo;
      }

      const [tasks, totalCount] = await Promise.all([
        db.client.task?.findMany({
          where: whereClause,
          include: {
            assignedUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }) || [],
        db.client.task?.count({
          where: whereClause
        }) || 0
      ]);

      return NextResponse.json({
        success: true,
        data: tasks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / query.limit)
        }
      });
    } catch (error) {
      console.error('Tasks API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tasks',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
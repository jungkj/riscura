import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';

const GetTeamQuerySchema = z.object({
  includeWorkload: z.coerce.boolean().default(true),
  includeTasks: z.coerce.boolean().default(true),
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
      const query = GetTeamQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Demo team data
      const demoData = {
        teamMembers: [
          {
            id: 'user-1',
            name: 'Sarah Chen',
            email: 'sarah.chen@company.com',
            role: 'manager',
            department: 'Security',
            status: 'active',
            workload: 75,
            completedTasks: 23,
            assignedTasks: 8,
            expertise: ['SOC 2', 'Risk Management', 'Access Controls'],
            avatar: null
          },
          {
            id: 'user-2',
            name: 'Michael Rodriguez',
            email: 'michael.rodriguez@company.com',
            role: 'analyst',
            department: 'Compliance',
            status: 'active',
            workload: 60,
            completedTasks: 18,
            assignedTasks: 5,
            expertise: ['GDPR', 'Data Protection', 'Privacy'],
            avatar: null
          },
          {
            id: 'user-3',
            name: 'Emma Johnson',
            email: 'emma.johnson@company.com',
            role: 'auditor',
            department: 'Internal Audit',
            status: 'busy',
            workload: 90,
            completedTasks: 31,
            assignedTasks: 12,
            expertise: ['ISO 27001', 'Control Testing', 'Documentation'],
            avatar: null
          },
          {
            id: 'user-4',
            name: 'David Kim',
            email: 'david.kim@company.com',
            role: 'analyst',
            department: 'IT Security',
            status: 'active',
            workload: 45,
            completedTasks: 15,
            assignedTasks: 3,
            expertise: ['Network Security', 'Vulnerability Management', 'NIST'],
            avatar: null
          },
        ],
        delegatedTasks: [
          {
            id: 'TASK-001',
            title: 'SOC 2 Access Control Review',
            description: 'Review and test access control implementations for SOC 2 Type II audit preparation',
            type: 'control_testing',
            priority: 'critical',
            status: 'in_progress',
            assignee: 'user-1',
            assignedBy: 'admin',
            dueDate: new Date('2024-02-15').toISOString(),
            createdDate: new Date('2024-01-20').toISOString(),
            estimatedHours: 16,
            actualHours: 8,
            progress: 50,
            framework: 'SOC 2',
            tags: ['access-control', 'soc2', 'audit'],
            attachments: 3,
            comments: 7,
          },
          {
            id: 'TASK-002',
            title: 'GDPR Data Processing Assessment',
            description: 'Conduct comprehensive assessment of data processing activities for GDPR compliance',
            type: 'compliance_review',
            priority: 'high',
            status: 'pending',
            assignee: 'user-2',
            assignedBy: 'admin',
            dueDate: new Date('2024-02-28').toISOString(),
            createdDate: new Date('2024-01-25').toISOString(),
            estimatedHours: 24,
            progress: 0,
            framework: 'GDPR',
            tags: ['gdpr', 'data-protection', 'assessment'],
            attachments: 1,
            comments: 2,
          },
          {
            id: 'TASK-003',
            title: 'Risk Register Update',
            description: 'Update quarterly risk register with new identified risks and control assessments',
            type: 'risk_assessment',
            priority: 'medium',
            status: 'review',
            assignee: 'user-3',
            assignedBy: 'admin',
            dueDate: new Date('2024-02-10').toISOString(),
            createdDate: new Date('2024-01-15').toISOString(),
            estimatedHours: 12,
            actualHours: 14,
            progress: 95,
            tags: ['risk-management', 'quarterly-review'],
            attachments: 5,
            comments: 12,
          },
          {
            id: 'TASK-004',
            title: 'Network Vulnerability Assessment',
            description: 'Perform comprehensive network vulnerability assessment and penetration testing',
            type: 'risk_assessment',
            priority: 'high',
            status: 'in_progress',
            assignee: 'user-4',
            assignedBy: 'admin',
            dueDate: new Date('2024-03-01').toISOString(),
            createdDate: new Date('2024-02-01').toISOString(),
            estimatedHours: 20,
            actualHours: 6,
            progress: 25,
            framework: 'NIST',
            tags: ['vulnerability', 'network-security', 'penetration-testing'],
            attachments: 2,
            comments: 4,
          },
          {
            id: 'TASK-005',
            title: 'ISO 27001 Documentation Review',
            description: 'Review and update ISO 27001 policies and procedures for annual certification',
            type: 'documentation',
            priority: 'medium',
            status: 'pending',
            assignee: 'user-3',
            assignedBy: 'admin',
            dueDate: new Date('2024-03-15').toISOString(),
            createdDate: new Date('2024-02-05').toISOString(),
            estimatedHours: 18,
            progress: 0,
            framework: 'ISO 27001',
            tags: ['iso27001', 'documentation', 'policies'],
            attachments: 0,
            comments: 1,
          },
        ],
        summary: {
          totalMembers: 4,
          activeMembers: 3,
          busyMembers: 1,
          totalTasks: 5,
          pendingTasks: 2,
          inProgressTasks: 2,
          completedTasks: 0,
          overdueTasks: 1,
          averageWorkload: 67.5
        }
      };

      return NextResponse.json({
        success: true,
        data: demoData,
        demoMode: true
      });
    }

    try {
      const { searchParams } = new URL(req.url);
      const query = GetTeamQuerySchema.parse(Object.fromEntries(searchParams));
      
      // Get team members (users in the same organization)
      const teamMembers = await db.client.user.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          department: true,
          status: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Get tasks if requested
      let delegatedTasks: any[] = [];
      if (query.includeTasks) {
        delegatedTasks = await db.client.task?.findMany({
          where: { organizationId: user.organizationId },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            priority: true,
            status: true,
            assigneeId: true,
            createdBy: true,
            dueDate: true,
            createdAt: true,
            estimatedHours: true,
            actualHours: true,
            progress: true,
            tags: true,
            _count: {
              select: {
                attachments: true,
                comments: true
              }
            }
          }
        }) || [];
      }

      // Calculate workload and task statistics for each member
      const processedMembers = teamMembers.map((member: any) => {
        const memberTasks = delegatedTasks.filter(task => task.assigneeId === member.id);
        const completedTasks = memberTasks.filter(task => task.status === 'COMPLETED').length;
        const assignedTasks = memberTasks.filter(task => task.status !== 'COMPLETED').length;
        
        // Calculate workload based on assigned tasks and estimated hours
        const totalEstimatedHours = memberTasks
          .filter(task => task.status !== 'COMPLETED')
          .reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
        
        // Assume 40 hours per week capacity, calculate workload percentage
        const workload = Math.min(Math.round((totalEstimatedHours / 40) * 100), 100);

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          email: member.email,
          role: member.role?.toLowerCase() || 'viewer',
          department: member.department || 'General',
          status: member.status?.toLowerCase() || 'active',
          workload,
          completedTasks,
          assignedTasks,
          expertise: [], // Would need to be stored in user profile
          avatar: member.profileImage
        };
      });

      // Process delegated tasks
      const processedTasks = delegatedTasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type?.toLowerCase() || 'risk_assessment',
        priority: task.priority?.toLowerCase() || 'medium',
        status: task.status?.toLowerCase() || 'pending',
        assignee: task.assigneeId,
        assignedBy: task.createdBy,
        dueDate: task.dueDate?.toISOString(),
        createdDate: task.createdAt?.toISOString(),
        estimatedHours: task.estimatedHours || 8,
        actualHours: task.actualHours || 0,
        progress: task.progress || 0,
        framework: null, // Would need to be stored in task
        tags: task.tags || [],
        attachments: task._count?.attachments || 0,
        comments: task._count?.comments || 0,
      }));

      // Calculate summary statistics
      const summary = {
        totalMembers: processedMembers.length,
        activeMembers: processedMembers.filter(m => m.status === 'active').length,
        busyMembers: processedMembers.filter(m => m.workload > 80).length,
        totalTasks: processedTasks.length,
        pendingTasks: processedTasks.filter(t => t.status === 'pending').length,
        inProgressTasks: processedTasks.filter(t => t.status === 'in_progress').length,
        completedTasks: processedTasks.filter(t => t.status === 'completed').length,
        overdueTasks: processedTasks.filter(t => new Date(t.dueDate || '') < new Date() && t.status !== 'completed').length,
        averageWorkload: processedMembers.length > 0 
          ? Math.round(processedMembers.reduce((sum, m) => sum + m.workload, 0) / processedMembers.length)
          : 0
      };

      const data = {
        teamMembers: processedMembers,
        delegatedTasks: processedTasks,
        summary
      };

      return NextResponse.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Team API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch team data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';
import { createAPIResponse } from '@/lib/api/middleware';
import { db } from '@/lib/db';

// Helper function to get user from either NextAuth session or Bearer token
async function getAuthenticatedUser(req: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authOptions) as any;
  if (session?.user) {
    return session.user;
  }

  // Try Bearer token authentication
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // For demo/development, accept the demo token
    if (token.includes('dev-jwt-access-secret') || token.includes('demo')) {
      return {
        id: 'demo-admin-id',
        email: 'admin@riscura.com',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'ADMIN',
        organizationId: 'demo-org-id',
        permissions: ['*'],
      };
    }
  }

  return null;
}

// GET /api/dashboard - Get dashboard metrics and data
export async function GET(req: NextRequest) {
  try {
    // Check authentication using both methods
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userObj = user as any;
    
    if (!userObj.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch dashboard data in parallel
    const [
      totalRisks,
      totalControls,
      totalDocuments,
      risksByLevel,
      risksByCategory,
      controlsByStatus,
      recentRisks,
      recentControls,
      recentActivities
    ] = await Promise.all([
      // Total counts
      db.client.risk.count({
        where: { organizationId: userObj.organizationId }
      }),
      db.client.control.count({
        where: { organizationId: userObj.organizationId }
      }),
      db.client.document.count({
        where: { organizationId: userObj.organizationId }
      }),

      // Risk breakdown by level
      db.client.risk.groupBy({
        by: ['riskLevel'],
        where: { 
          organizationId: userObj.organizationId,
          NOT: { riskLevel: null }
        },
        _count: { id: true }
      }),

      // Risk breakdown by category
      db.client.risk.groupBy({
        by: ['category'],
        where: { organizationId: userObj.organizationId },
        _count: { id: true }
      }),

      // Control breakdown by status
      db.client.control.groupBy({
        by: ['status'],
        where: { organizationId: userObj.organizationId },
        _count: { id: true }
      }),

      // Recent risks (last 5)
      db.client.risk.findMany({
        where: { organizationId: userObj.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),

      // Recent controls (last 5)
      db.client.control.findMany({
        where: { organizationId: userObj.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),

      // Recent activities (last 10)
      db.client.activity.findMany({
        where: { organizationId: userObj.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    // Calculate risk summary
    const riskSummary = {
      total: totalRisks,
      critical: risksByLevel.find(r => r.riskLevel === 'CRITICAL')?._count.id || 0,
      high: risksByLevel.find(r => r.riskLevel === 'HIGH')?._count.id || 0,
      medium: risksByLevel.find(r => r.riskLevel === 'MEDIUM')?._count.id || 0,
      low: risksByLevel.find(r => r.riskLevel === 'LOW')?._count.id || 0,
      breakdown: risksByLevel.map(r => ({
        level: r.riskLevel,
        count: r._count.id
      })),
      byCategory: risksByCategory.map(r => ({
        category: r.category,
        count: r._count.id
      }))
    };

    // Calculate control summary
    const controlSummary = {
      total: totalControls,
      operational: controlsByStatus.find(c => c.status === 'OPERATIONAL')?._count.id || 0,
      planned: controlsByStatus.find(c => c.status === 'PLANNED')?._count.id || 0,
      testing: controlsByStatus.find(c => c.status === 'TESTING')?._count.id || 0,
      breakdown: controlsByStatus.map(c => ({
        status: c.status,
        count: c._count.id
      }))
    };

    // Return dashboard data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          risks: riskSummary,
          controls: controlSummary,
          documents: totalDocuments,
          timeRange
        },
        recent: {
          risks: recentRisks.map(risk => ({
            id: risk.id,
            title: risk.title,
            riskLevel: risk.riskLevel,
            category: risk.category,
            status: risk.status,
            createdAt: risk.createdAt,
            creator: risk.creator,
            assignedUser: risk.assignedUser
          })),
          controls: recentControls.map(control => ({
            id: control.id,
            name: control.title,
            status: control.status,
            category: control.category,
            createdAt: control.createdAt,
            creator: control.creator,
            assignedUser: control.assignedUser
          })),
          activities: recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            createdAt: activity.createdAt,
            user: activity.user
          }))
        }
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 
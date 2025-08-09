import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api/middleware';
import { db } from '@/lib/db';
import { shouldServeDemoData } from '@/lib/demo/demo-mode';

// GET /api/analytics - Get various analytics data
export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    // Get user from request (added by middleware)
    const user = (req as any).user;
    
    if (!user || !user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization context required' },
        { status: 403 }
      );
    }

    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') || 'overview';
      const timeRange = searchParams.get('timeRange') || '30d';
      
      // Check if this is a demo user
      if (shouldServeDemoData(user.id, user.organizationId)) {
        return NextResponse.json({
          success: true,
          data: getDemoAnalyticsData(type, timeRange),
          meta: {
            type,
            timeRange,
            generatedAt: new Date().toISOString(),
            demoMode: true
          }
        });
      }
      
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      let analyticsData = {};

      switch (type) {
        case 'overview':
        case 'dashboard':
          analyticsData = await getDashboardAnalytics(user.organizationId, startDate);
          break;
        
        case 'risks':
          analyticsData = await getRiskAnalytics(user.organizationId, startDate);
          break;
        
        case 'controls':
          analyticsData = await getControlAnalytics(user.organizationId, startDate);
          break;
        
        case 'compliance':
          analyticsData = await getComplianceAnalytics(user.organizationId, startDate);
          break;
        
        default:
          analyticsData = await getDashboardAnalytics(user.organizationId, startDate);
      }

      return NextResponse.json({
        success: true,
        data: analyticsData,
        meta: {
          type,
          timeRange,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch analytics data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

async function getDashboardAnalytics(organizationId: string, startDate: Date) {
  const [
    totalCounts,
    riskTrends,
    controlEffectiveness,
    recentActivity,
    complianceStatus
  ] = await Promise.all([
    // Total counts
    Promise.all([
      db.client.risk.count({ where: { organizationId } }),
      db.client.control.count({ where: { organizationId } }),
      db.client.document.count({ where: { organizationId } }),
      db.client.questionnaire.count({ where: { organizationId } })
    ]),

    // Risk trends over time
    db.client.risk.groupBy({
      by: ['createdAt'],
      where: { 
        organizationId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    }),

    // Control effectiveness
    db.client.control.aggregate({
      where: { 
        organizationId, 
        effectiveness: { gt: 0 }
      },
      _avg: { effectiveness: true },
      _count: { id: true }
    }),

    // Recent activity
    db.client.activity.findMany({
      where: { 
        organizationId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    }),

    // Compliance framework status
    db.client.risk.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { id: true }
    })
  ]);

  const [risks, controls, documents, questionnaires] = totalCounts;

  return {
    totals: {
      risks,
      controls,
      documents,
      questionnaires
    },
    trends: {
      risks: riskTrends.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count.id
      })),
      controlEffectiveness: {
        average: controlEffectiveness._avg.effectiveness || 0,
        total: controlEffectiveness._count || 0
      }
    },
    recentActivity: recentActivity.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
      timestamp: activity.createdAt.toISOString()
    })),
    compliance: {
      byCategory: complianceStatus.map(item => ({
        category: item.category,
        count: item._count.id
      }))
    }
  };
}

async function getRiskAnalytics(organizationId: string, startDate: Date) {
  const [
    risksByLevel,
    risksByCategory,
    risksByStatus,
    riskTrends
  ] = await Promise.all([
    db.client.risk.groupBy({
      by: ['riskLevel'],
      where: { organizationId },
      _count: { id: true }
    }),

    db.client.risk.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { id: true }
    }),

    db.client.risk.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true }
    }),

    db.client.risk.findMany({
      where: { 
        organizationId,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        riskLevel: true,
        riskScore: true
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  return {
    distribution: {
      byLevel: risksByLevel.map(item => ({
        level: item.riskLevel,
        count: item._count.id
      })),
      byCategory: risksByCategory.map(item => ({
        category: item.category,
        count: item._count.id
      })),
      byStatus: risksByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      }))
    },
    trends: riskTrends.map(risk => ({
      date: risk.createdAt.toISOString().split('T')[0],
      level: risk.riskLevel,
      score: risk.riskScore
    }))
  };
}

async function getControlAnalytics(organizationId: string, startDate: Date) {
  const [
    controlsByStatus,
    controlsByType,
    effectivenessStats
  ] = await Promise.all([
    db.client.control.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true }
    }),

    db.client.control.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: { id: true }
    }),

    db.client.control.aggregate({
      where: { 
        organizationId,
        effectiveness: { gt: 0 }
      },
      _avg: { effectiveness: true },
      _min: { effectiveness: true },
      _max: { effectiveness: true },
      _count: { id: true }
    })
  ]);

  return {
    distribution: {
      byStatus: controlsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      byType: controlsByType.map(item => ({
        type: item.type,
        count: item._count.id
      }))
    },
    effectiveness: {
      average: effectivenessStats._avg?.effectiveness || 0,
      min: effectivenessStats._min?.effectiveness || 0,
      max: effectivenessStats._max?.effectiveness || 0,
      total: effectivenessStats._count || 0
    }
  };
}

async function getComplianceAnalytics(organizationId: string, startDate: Date) {
  const [
    riskCategories,
    controlsByFramework,
    documentsByCategory
  ] = await Promise.all([
    db.client.risk.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { id: true },
      _avg: { riskScore: true }
    }),

    // This would need framework data - for now just return control types
    db.client.control.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: { id: true }
    }),

    (async () => {
      const documents = await db.client.document.findMany({
        where: { organizationId },
        select: { type: true }
      });
      return documents.reduce((acc, doc) => {
        const type = doc.type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    })()
  ]);

  return {
    frameworks: {
      risks: riskCategories.map(item => ({
        framework: item.category,
        riskCount: item._count.id,
        averageRiskScore: item._avg.riskScore || 0
      })),
      controls: controlsByFramework.map(item => ({
        type: item.type,
        count: item._count.id
      }))
    },
    documentation: Object.entries(documentsByCategory).map(([type, count]) => ({
      category: type,
      count: count
    }))
  };
}

function getDemoAnalyticsData(type: string, timeRange: string) {
  const baseData = {
    totals: {
      risks: 77,
      controls: 100,
      documents: 45,
      questionnaires: 8
    },
    changes: {
      risks: -8,
      controls: 12,
      documents: 5,
      questionnaires: 2
    },
    trends: {
      risks: [
        { date: '2024-01-01', count: 85 },
        { date: '2024-01-08', count: 82 },
        { date: '2024-01-15', count: 80 },
        { date: '2024-01-22', count: 79 },
        { date: '2024-01-29', count: 77 },
        { date: '2024-02-05', count: 76 },
        { date: '2024-02-12', count: 77 },
      ],
      controlEffectiveness: {
        average: 82.5,
        total: 100
      }
    },
    recentActivity: [
      {
        id: '1',
        type: 'risk_assessment',
        description: 'Completed quarterly risk assessment for Technology domain',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'control_update',
        description: 'Updated access control policy for privileged accounts',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'document_upload',
        description: 'Uploaded new incident response procedure document',
        user: 'Michael Chen',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'compliance_check',
        description: 'Completed SOC 2 control testing for Q4',
        user: 'Emily Rodriguez',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        type: 'risk_mitigation',
        description: 'Implemented mitigation controls for critical vendor risk',
        user: 'David Wilson',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ],
    compliance: {
      byCategory: [
        { category: 'Technology', count: 23 },
        { category: 'Operational', count: 18 },
        { category: 'Financial', count: 12 },
        { category: 'Compliance', count: 10 },
        { category: 'Strategic', count: 8 },
        { category: 'Reputational', count: 6 }
      ]
    }
  };

  switch (type) {
    case 'risks':
      return {
        distribution: {
          byLevel: [
            { level: 'CRITICAL', count: 4 },
            { level: 'HIGH', count: 12 },
            { level: 'MEDIUM', count: 23 },
            { level: 'LOW', count: 38 }
          ],
          byCategory: baseData.compliance.byCategory,
          byStatus: [
            { status: 'IDENTIFIED', count: 25 },
            { status: 'ASSESSED', count: 30 },
            { status: 'MITIGATED', count: 18 },
            { status: 'CLOSED', count: 4 }
          ]
        },
        trends: [
          { date: '2024-01-01', level: 'HIGH', score: 15.2 },
          { date: '2024-01-08', level: 'MEDIUM', score: 12.8 },
          { date: '2024-01-15', level: 'LOW', score: 8.5 },
          { date: '2024-01-22', level: 'CRITICAL', score: 20.1 },
          { date: '2024-01-29', level: 'MEDIUM', score: 11.3 }
        ]
      };

    case 'controls':
      return {
        distribution: {
          byStatus: [
            { status: 'ACTIVE', count: 82 },
            { status: 'INACTIVE', count: 8 },
            { status: 'DRAFT', count: 10 }
          ],
          byType: [
            { type: 'PREVENTIVE', count: 45 },
            { type: 'DETECTIVE', count: 32 },
            { type: 'CORRECTIVE', count: 18 },
            { type: 'COMPENSATING', count: 5 }
          ]
        },
        effectiveness: {
          average: 82.5,
          min: 45.0,
          max: 98.5,
          total: 100
        }
      };

    case 'compliance':
      return {
        frameworks: {
          risks: [
            { framework: 'Technology', riskCount: 23, averageRiskScore: 12.5 },
            { framework: 'Operational', riskCount: 18, averageRiskScore: 14.2 },
            { framework: 'Financial', riskCount: 12, averageRiskScore: 16.8 },
            { framework: 'Compliance', riskCount: 10, averageRiskScore: 11.3 }
          ],
          controls: [
            { type: 'PREVENTIVE', count: 45 },
            { type: 'DETECTIVE', count: 32 },
            { type: 'CORRECTIVE', count: 18 },
            { type: 'COMPENSATING', count: 5 }
          ]
        },
        documentation: [
          { category: 'Policy', count: 15 },
          { category: 'Procedure', count: 18 },
          { category: 'Evidence', count: 8 },
          { category: 'Other', count: 4 }
        ]
      };

    default:
      return baseData;
  }
} 
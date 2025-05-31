import { NextRequest, NextResponse } from 'next/server';
import { dashboardIntelligenceService } from '@/services/DashboardIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-user';
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Mock dashboard configuration
    const config = {
      userId,
      organizationId: 'org-001',
      preferences: {
        insightTypes: ['critical_alert', 'trend_prediction', 'optimization', 'compliance_warning'],
        refreshRate: 30000,
        notificationLevel: 'standard' as const,
        showPredictions: true,
        enableInteractiveHelp: true
      },
      context: {
        currentView: 'dashboard',
        activeFilters: {},
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        selectedEntities: []
      }
    };

    // Mock risks and controls data
    const mockRisks = [
      {
        id: '1',
        title: 'Data Breach Risk',
        description: 'Risk of unauthorized access to sensitive data',
        likelihood: 3,
        impact: 5,
        riskScore: 15,
        status: 'identified' as const,
        category: 'technology' as const,
        owner: 'IT Security Team',
        controls: ['1'],
        evidence: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const mockControls = [
      {
        id: '1',
        title: 'Access Control Policy',
        description: 'Comprehensive access control procedures',
        type: 'preventive' as const,
        effectiveness: 'high' as const,
        status: 'active' as const,
        owner: 'Security Team',
        frequency: 'monthly',
        evidence: [],
        linkedRisks: ['1'],
        lastTested: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    const insights = await dashboardIntelligenceService.generateDashboardInsights(
      config,
      mockRisks,
      mockControls
    );

    return NextResponse.json({
      insights,
      timestamp: new Date().toISOString(),
      config: {
        userId,
        timeRange,
        insightCount: insights.length
      }
    });
  } catch (error) {
    console.error('Dashboard Insights API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate dashboard insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences, context } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Update user preferences for dashboard insights
    const updatedConfig = {
      userId,
      organizationId: 'org-001',
      preferences: {
        insightTypes: preferences?.insightTypes || ['critical_alert', 'trend_prediction'],
        refreshRate: preferences?.refreshRate || 30000,
        notificationLevel: preferences?.notificationLevel || 'standard',
        showPredictions: preferences?.showPredictions ?? true,
        enableInteractiveHelp: preferences?.enableInteractiveHelp ?? true
      },
      context: context || {
        currentView: 'dashboard',
        activeFilters: {},
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        selectedEntities: []
      }
    };

    return NextResponse.json({
      message: 'Dashboard preferences updated successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Dashboard Preferences Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard preferences' },
      { status: 500 }
    );
  }
} 
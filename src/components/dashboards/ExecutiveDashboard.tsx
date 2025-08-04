'use client';

import React from 'react';
import MainContentArea from '@/components/layout/MainContentArea';
import { ContentSection, ContentCard } from '@/components/layout/MainContentArea';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { RiskRegisterTable } from '@/components/risk-register-table';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  PieChart,
  Download,
  Plus,
  Share,
  BookmarkPlus,
} from 'lucide-react';

// ========== SAMPLE DATA ==========
const executiveKPIs = [
  {
    id: 'total-risks',
    label: 'Total Risks',
    value: 127,
    previousValue: 134,
    trend: 'down' as const,
    trendPercentage: 5.2,
    target: 100,
    format: 'number' as const,
    icon: Shield,
    color: 'default' as const,
  },
  {
    id: 'critical-risks',
    label: 'Critical Risks',
    value: 8,
    previousValue: 12,
    trend: 'down' as const,
    trendPercentage: 33.3,
    target: 5,
    format: 'number' as const,
    icon: AlertTriangle,
    color: 'error' as const,
  },
  {
    id: 'compliance-score',
    label: 'Compliance Score',
    value: 94.2,
    previousValue: 91.8,
    trend: 'up' as const,
    trendPercentage: 2.6,
    target: 95,
    format: 'percentage' as const,
    icon: CheckCircle,
    color: 'success' as const,
  },
  {
    id: 'overdue-actions',
    label: 'Overdue Actions',
    value: 15,
    previousValue: 18,
    trend: 'down' as const,
    trendPercentage: 16.7,
    target: 0,
    format: 'number' as const,
    icon: Clock,
    color: 'warning' as const,
  },
];

const riskTrendsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Critical Risks',
      data: [12, 15, 11, 9, 10, 8],
      color: '#EF4444',
      backgroundColor: '#FEF2F2',
      trend: 'down' as const,
    },
    {
      label: 'High Risks',
      data: [25, 28, 22, 20, 24, 19],
      color: '#F59E0B',
      backgroundColor: '#FFFBEB',
      trend: 'down' as const,
    },
  ],
};

const complianceData = {
  labels: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS'],
  datasets: [
    {
      label: 'Compliance Status',
      data: [95, 92, 98, 88, 90],
      color: '#10B981',
      backgroundColor: '#ECFDF5',
      trend: 'up' as const,
    },
  ],
};

const riskCategoryData = {
  labels: ['Cybersecurity', 'Operational', 'Financial', 'Regulatory', 'Strategic'],
  datasets: [
    {
      label: 'Risk Distribution',
      data: [35, 25, 15, 15, 10],
      color: '#6366F1',
      backgroundColor: '#EEF2FF',
      trend: 'neutral' as const,
    },
  ],
};

const dashboardWidgets = [
  {
    id: 'kpi-overview',
    title: 'Key Performance Indicators',
    type: 'kpi-cards' as const,
    size: 'xl' as const,
    data: executiveKPIs,
    realTime: true,
    exportable: true,
  },
  {
    id: 'risk-trends',
    title: 'Risk Trends',
    type: 'line-chart' as const,
    size: 'lg' as const,
    data: riskTrendsData,
    realTime: true,
    drillDown: '/dashboard/risks',
    exportable: true,
  },
  {
    id: 'compliance-progress',
    title: 'Compliance Progress',
    type: 'progress-rings' as const,
    size: 'md' as const,
    data: complianceData,
    realTime: false,
    drillDown: '/dashboard/compliance',
    exportable: true,
  },
  {
    id: 'risk-distribution',
    title: 'Risk Distribution by Category',
    type: 'pie-chart' as const,
    size: 'md' as const,
    data: riskCategoryData,
    realTime: false,
    drillDown: '/dashboard/risks/categories',
    exportable: true,
  },
  {
    id: 'risk-heatmap',
    title: 'Risk Heat Map',
    type: 'heatmap' as const,
    size: 'lg' as const,
    data: {
      matrix: [
        [
          { value: 2, label: 'Low/Low' },
          { value: 4, label: 'Low/Med' },
          { value: 6, label: 'Low/High' },
        ],
        [
          { value: 4, label: 'Med/Low' },
          { value: 8, label: 'Med/Med' },
          { value: 12, label: 'Med/High' },
        ],
        [
          { value: 6, label: 'High/Low' },
          { value: 12, label: 'High/Med' },
          { value: 18, label: 'High/High' },
        ],
      ],
    },
    realTime: false,
    drillDown: '/dashboard/risks/heatmap',
    exportable: true,
  },
];

// ========== MAIN COMPONENT ==========
export const ExecutiveDashboard: React.FC = () => {
  const handleWidgetClick = (widget: any) => {
    console.log('Widget clicked:', widget.id);
    if (widget.drillDown) {
      window.location.href = widget.drillDown;
    }
  };

  const handleExport = (widget: any, format: string) => {
    console.log('Exporting widget:', widget.id, 'as', format);
    // Implement export logic
  };

  const handleCreateRisk = () => {
    console.log('Creating new risk...');
    // Navigate to risk creation form
  };

  const handleExportDashboard = () => {
    console.log('Exporting dashboard...');
    // Implement dashboard export
  };

  const handleShareDashboard = () => {
    console.log('Sharing dashboard...');
    // Implement dashboard sharing
  };

  const handleBookmarkDashboard = () => {
    console.log('Bookmarking dashboard...');
    // Implement bookmarking
  };

  return (
    <MainContentArea
      title="Executive Dashboard"
      subtitle="Comprehensive overview of organizational risk posture and compliance status"
      breadcrumbs={[
        { label: 'Dashboards', href: '/dashboard' },
        { label: 'Executive Overview', current: true },
      ]}
      primaryAction={{
        label: 'Create Risk',
        onClick: handleCreateRisk,
        icon: Plus,
        shortcut: '⌘ N',
      }}
      secondaryActions={[
        {
          label: 'Export',
          onClick: handleExportDashboard,
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Share',
          onClick: handleShareDashboard,
          icon: Share,
          variant: 'outline',
        },
        {
          label: 'Bookmark',
          onClick: handleBookmarkDashboard,
          icon: BookmarkPlus,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'risks',
          value: 127,
          trend: 'down',
          trendValue: '5.2%',
          variant: 'default',
        },
        {
          label: 'critical',
          value: 8,
          trend: 'down',
          trendValue: '33%',
          variant: 'destructive',
        },
        {
          label: 'compliance',
          value: '94.2%',
          trend: 'up',
          trendValue: '2.6%',
          variant: 'success',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Analytics Dashboard */}
      <ContentSection
        title="Performance Overview"
        subtitle="Real-time analytics and key performance indicators"
        spacing="normal"
      >
        <AnalyticsDashboard
          title=""
          widgets={dashboardWidgets}
          layout="grid"
          realTimeEnabled={true}
          onWidgetClick={handleWidgetClick}
          onExport={handleExport}
        />
      </ContentSection>

      {/* Recent Risk Activity */}
      <ContentSection
        title="Recent Risk Activity"
        subtitle="Latest updates and changes to the risk register"
        action={{
          label: 'View All Risks',
          onClick: () => (window.location.href = '/dashboard/risks'),
          icon: BarChart3,
          variant: 'outline',
        }}
        spacing="normal"
      >
        <ContentCard hover className="shadow-notion-sm">
          <RiskRegisterTable />
        </ContentCard>
      </ContentSection>

      {/* Compliance Status Cards */}
      <ContentSection
        title="Compliance Frameworks"
        subtitle="Current compliance status across key frameworks"
        spacing="normal"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-6">
          <ContentCard
            title="SOC 2 Type II"
            subtitle="Security & Availability"
            hover
            className="shadow-notion-sm"
            footer={(
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-tertiary">Last audit: Dec 2023</span>
                <div className="flex items-center space-x-enterprise-1">
                  <CheckCircle className="h-4 w-4 text-semantic-success" />
                  <span className="text-body-sm font-medium text-semantic-success">
                    95% Complete
                  </span>
                </div>
              </div>
            )}
          >
            <div className="space-y-enterprise-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Controls Tested</span>
                <span className="text-body-sm font-semibold text-text-primary">47/50</span>
              </div>

              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div className="bg-semantic-success h-2 rounded-full w-[94%]" />
              </div>

              <div className="flex items-center space-x-enterprise-2">
                <TrendingUp className="h-4 w-4 text-semantic-success" />
                <span className="text-caption text-semantic-success">+3% from last quarter</span>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title="ISO 27001"
            subtitle="Information Security"
            hover
            className="shadow-notion-sm"
            footer={(
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-tertiary">Certification: Valid</span>
                <div className="flex items-center space-x-enterprise-1">
                  <CheckCircle className="h-4 w-4 text-semantic-success" />
                  <span className="text-body-sm font-medium text-semantic-success">
                    92% Complete
                  </span>
                </div>
              </div>
            )}
          >
            <div className="space-y-enterprise-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Controls Implemented</span>
                <span className="text-body-sm font-semibold text-text-primary">115/125</span>
              </div>

              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div className="bg-semantic-success h-2 rounded-full w-[92%]" />
              </div>

              <div className="flex items-center space-x-enterprise-2">
                <TrendingUp className="h-4 w-4 text-semantic-success" />
                <span className="text-caption text-semantic-success">+1.5% from last month</span>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title="GDPR"
            subtitle="Data Protection"
            hover
            className="shadow-notion-sm"
            footer={(
              <div className="flex items-center justify-between">
                <span className="text-caption text-text-tertiary">Last review: Jan 2024</span>
                <div className="flex items-center space-x-enterprise-1">
                  <CheckCircle className="h-4 w-4 text-semantic-success" />
                  <span className="text-body-sm font-medium text-semantic-success">
                    98% Complete
                  </span>
                </div>
              </div>
            )}
          >
            <div className="space-y-enterprise-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-text-secondary">Requirements Met</span>
                <span className="text-body-sm font-semibold text-text-primary">49/50</span>
              </div>

              <div className="w-full bg-surface-secondary rounded-full h-2">
                <div className="bg-semantic-success h-2 rounded-full w-[98%]" />
              </div>

              <div className="flex items-center space-x-enterprise-2">
                <TrendingUp className="h-4 w-4 text-semantic-success" />
                <span className="text-caption text-semantic-success">Maintained 98%</span>
              </div>
            </div>
          </ContentCard>
        </div>
      </ContentSection>

      {/* Quick Actions */}
      <ContentSection
        title="Quick Actions"
        subtitle="Frequently used tools and shortcuts"
        spacing="tight"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-enterprise-4">
          <ContentCard
            hover
            padding="sm"
            className="text-center cursor-pointer shadow-notion-sm hover:shadow-notion-md transition-shadow"
          >
            <div className="space-y-enterprise-2">
              <div className="w-12 h-12 bg-interactive-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-interactive-primary" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Add Risk</p>
                <p className="text-caption text-text-tertiary">Create new risk entry</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            hover
            padding="sm"
            className="text-center cursor-pointer shadow-notion-sm hover:shadow-notion-md transition-shadow"
          >
            <div className="space-y-enterprise-2">
              <div className="w-12 h-12 bg-interactive-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-interactive-primary" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Run Assessment</p>
                <p className="text-caption text-text-tertiary">Start new assessment</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            hover
            padding="sm"
            className="text-center cursor-pointer shadow-notion-sm hover:shadow-notion-md transition-shadow"
          >
            <div className="space-y-enterprise-2">
              <div className="w-12 h-12 bg-interactive-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6 text-interactive-primary" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Generate Report</p>
                <p className="text-caption text-text-tertiary">Create compliance report</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            hover
            padding="sm"
            className="text-center cursor-pointer shadow-notion-sm hover:shadow-notion-md transition-shadow"
          >
            <div className="space-y-enterprise-2">
              <div className="w-12 h-12 bg-interactive-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-interactive-primary" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">Assign Task</p>
                <p className="text-caption text-text-tertiary">Delegate responsibility</p>
              </div>
            </div>
          </ContentCard>
        </div>
      </ContentSection>
    </MainContentArea>
  );
};

export default ExecutiveDashboard;

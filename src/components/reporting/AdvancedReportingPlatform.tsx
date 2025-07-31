'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MainContentArea, ContentSection, ContentCard } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import {
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Settings,
  Play,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Shield,
  Activity,
  Target,
  Lightbulb,
  Brain,
  Zap,
  PieChart,
} from 'lucide-react';

// Types
interface ReportTemplate {
  id: string;
  name: string;
  category: 'regulatory' | 'executive' | 'operational';
  description: string;
  frequency: string;
  automation: boolean;
  compliance: string[];
  status: 'active' | 'draft' | 'generating';
  recipients: number;
  icon: React.ElementType;
}

interface ReportInsight {
  id: string;
  title: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'benchmark';
  priority: 'high' | 'medium' | 'low';
  description: string;
  metric: string;
  value: string;
  change: string;
  actionable: boolean;
}

// Sample Data
const reportTemplates: ReportTemplate[] = [
  {
    id: 'soc2-type2',
    name: 'SOC 2 Type II Report',
    category: 'regulatory',
    description: 'Comprehensive SOC 2 Type II compliance report with automated evidence collection',
    frequency: 'quarterly',
    automation: true,
    compliance: ['SOC 2', 'Trust Services'],
    status: 'active',
    recipients: 8,
    icon: Shield,
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    category: 'executive',
    description: 'Enterprise risk assessment with heat maps and mitigation strategies',
    frequency: 'monthly',
    automation: true,
    compliance: ['ISO 27001', 'NIST'],
    status: 'active',
    recipients: 12,
    icon: AlertCircle,
  },
  {
    id: 'compliance-dashboard',
    name: 'Compliance Status Dashboard',
    category: 'executive',
    description: 'Real-time compliance status across all frameworks',
    frequency: 'on-demand',
    automation: false,
    compliance: ['All Frameworks'],
    status: 'active',
    recipients: 6,
    icon: CheckCircle,
  },
];

const automatedInsights: ReportInsight[] = [
  {
    id: 'insight-001',
    title: 'Security Score Improvement Trend',
    type: 'trend',
    priority: 'high',
    description: 'Security score has improved by 8% over the last quarter due to enhanced access controls',
    metric: 'Security Score',
    value: '94',
    change: '+8%',
    actionable: false,
  },
  {
    id: 'insight-002',
    title: 'Control Testing Anomaly Detected',
    type: 'anomaly',
    priority: 'high',
    description: 'Unusual pattern in control testing failures for Network Security controls',
    metric: 'Control Effectiveness',
    value: '78%',
    change: '-12%',
    actionable: true,
  },
];

// Report Templates Grid Component
const ReportTemplatesGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      'active': 'default',
      'draft': 'secondary',
      'generating': 'outline',
    };

    return (
      <DaisyBadge variant={variants[status]} className="text-caption">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </DaisyBadge>
    );
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(template => template.category === selectedCategory);

  return (
    <div className="space-y-enterprise-4">
      {/* Category Filter */}
      <div className="flex items-center space-x-enterprise-2">
        <DaisyButton
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Reports
        </DaisyButton>
        <DaisyButton
          variant={selectedCategory === 'regulatory' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('regulatory')}
        >
          <Shield className="h-3 w-3 mr-enterprise-1" />
          Regulatory
        </DaisyButton>
        <DaisyButton
          variant={selectedCategory === 'executive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('executive')}
        >
          <BarChart3 className="h-3 w-3 mr-enterprise-1" />
          Executive
        </DaisyButton>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
        {filteredTemplates.map((template) => {
          const IconComponent = template.icon;

          return (
            <div
              key={template.id}
              className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-enterprise-3">
                <div className="flex items-center space-x-enterprise-2">
                  <div className="p-enterprise-2 bg-surface-secondary rounded-lg">
                    <IconComponent className="h-4 w-4 text-text-primary" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-semibold text-text-primary">
                      {template.name}
                    </h4>
                    <span className="text-caption text-text-secondary capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>
                <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </DaisyButton>
              </div>

              {/* Description */}
              <p className="text-caption text-text-secondary mb-enterprise-3">
                {template.description}
              </p>

              {/* Status and Frequency */}
              <div className="flex items-center justify-between mb-enterprise-3">
                {getStatusBadge(template.status)}
                <span className="text-caption text-text-tertiary capitalize">
                  {template.frequency}
                </span>
              </div>

              {/* Compliance Tags */}
              <div className="flex flex-wrap gap-enterprise-1 mb-enterprise-3">
                {template.compliance.slice(0, 2).map((framework) => (
                  <DaisyBadge key={framework} variant="outline" className="text-caption">
                    {framework}
                  </DaisyBadge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-enterprise-1">
                  <Users className="h-3 w-3 text-text-tertiary" />
                  <span className="text-caption text-text-secondary">
                    {template.recipients} recipients
                  </span>
                </div>
                <div className="flex items-center space-x-enterprise-1">
                  <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Eye className="h-3 w-3" />
                  </DaisyButton>
                  <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Play className="h-3 w-3" />
                  </DaisyButton>
                  <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </DaisyButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Automated Insights Panel Component
const AutomatedInsightsPanel: React.FC = () => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'anomaly': return AlertCircle;
      case 'recommendation': return Lightbulb;
      case 'benchmark': return Target;
      default: return Brain;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-semantic-error border-semantic-error/20 bg-semantic-error/5';
      case 'medium': return 'text-semantic-warning border-semantic-warning/20 bg-semantic-warning/5';
      case 'low': return 'text-text-secondary border-border bg-surface-secondary/30';
      default: return 'text-text-secondary border-border bg-surface-secondary/30';
    }
  };

  return (
    <ContentCard 
      title="AI-Powered Insights" 
      subtitle="Automated analysis and recommendations"
      className="shadow-notion-sm"
    >
      <div className="space-y-enterprise-3">
        {automatedInsights.map((insight) => {
          const IconComponent = getInsightIcon(insight.type);

          return (
            <div
              key={insight.id}
              className={cn(
                "p-enterprise-4 border rounded-lg transition-all duration-200",
                getPriorityColor(insight.priority)
              )}
            >
              <div className="flex items-start justify-between mb-enterprise-2">
                <div className="flex items-start space-x-enterprise-2">
                  <div className="p-enterprise-1 bg-white/50 rounded">
                    <IconComponent className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-body-sm font-semibold mb-enterprise-1">
                      {insight.title}
                    </h4>
                    <p className="text-caption text-current/80 mb-enterprise-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center space-x-enterprise-3 text-caption">
                      <span><strong>{insight.metric}:</strong> {insight.value}</span>
                      <span className={insight.change.startsWith('+') ? 'text-semantic-success' : 'text-semantic-error'}>
                        {insight.change}
                      </span>
                    </div>
                  </div>
                </div>
                {insight.actionable && (
                  <DaisyButton variant="ghost" size="sm" className="text-current">
                    <Zap className="h-3 w-3 mr-enterprise-1" />
                    Action
                  </DaisyButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ContentCard>
  );
};

// Report Builder Interface Component
const ReportBuilderInterface: React.FC = () => {
  return (
    <div className="space-y-enterprise-6">
      {/* Builder Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-sm font-semibold text-text-primary">
            Report Builder
          </h3>
          <p className="text-body-sm text-text-secondary">
            Drag and drop widgets to create custom reports
          </p>
        </div>
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline" size="sm">
            <Eye className="h-3 w-3 mr-enterprise-1" />
            Preview
          </DaisyButton>
          <DaisyButton size="sm">
            <Download className="h-3 w-3 mr-enterprise-1" />
            Generate
          </DaisyButton>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-enterprise-8 min-h-64">
        <div className="text-center">
          <Plus className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
          <h4 className="text-body-sm font-medium text-text-primary mb-enterprise-1">
            Drop widgets here to build your report
          </h4>
          <p className="text-caption text-text-secondary">
            Drag widgets from the library to create your custom report layout
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Advanced Reporting Platform Component
export const AdvancedReportingPlatform: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <MainContentArea
      title="Advanced Reporting & BI"
      subtitle="Enterprise reporting platform with self-service business intelligence"
      breadcrumbs={[
        { label: 'Reporting', current: true },
      ]}
      primaryAction={{
        label: 'Create Report',
        onClick: () => console.log('Create report'),
        icon: Plus,
      }}
      secondaryActions={[
        {
          label: 'Import Template',
          onClick: () => console.log('Import'),
          icon: Download,
          variant: 'outline',
        },
        {
          label: 'Settings',
          onClick: () => console.log('Settings'),
          icon: Settings,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'active reports',
          value: 24,
          trend: 'up',
          trendValue: '12%',
          variant: 'default',
        },
        {
          label: 'automated insights',
          value: 156,
          trend: 'up',
          trendValue: '8%',
          variant: 'success',
        },
        {
          label: 'compliance score',
          value: '96.2%',
          trend: 'up',
          trendValue: '1.5%',
          variant: 'success',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6">
        <DaisyTabsList>
          <DaisyTabsTrigger value="templates">Report Templates</DaisyTabsTrigger>
          <DaisyTabsTrigger value="builder">Report Builder</DaisyTabsTrigger>
          <DaisyTabsTrigger value="insights">AI Insights</DaisyTabsTrigger>
          <DaisyTabsTrigger value="distribution">Distribution</DaisyTabsTrigger>
        </DaisyTabsList>
      </DaisyTabs>

      <DaisyTabsContent value="templates" className="space-y-enterprise-6">
        <ReportTemplatesGrid />
      </DaisyTabsContent>

      <DaisyTabsContent value="builder" className="space-y-enterprise-6">
        <ReportBuilderInterface />
      </DaisyTabsContent>

      <DaisyTabsContent value="insights" className="space-y-enterprise-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-6">
          <AutomatedInsightsPanel />
          <ContentCard title="Predictive Analytics" className="shadow-notion-sm">
            <div className="text-center py-enterprise-8">
              <Brain className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
              <p className="text-body-sm text-text-secondary">
                AI-powered forecasting and trend analysis
              </p>
            </div>
          </ContentCard>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="distribution" className="space-y-enterprise-6">
        <ContentCard title="Scheduling & Distribution" className="shadow-notion-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-enterprise-6">
            <div className="space-y-enterprise-3">
              <h4 className="text-body-sm font-semibold text-text-primary">Schedule</h4>
              <DaisySelect>
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Select frequency" />
                </DaisySelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="daily">Daily</SelectItem>
                  <DaisySelectItem value="weekly">Weekly</SelectItem>
                  <DaisySelectItem value="monthly">Monthly</SelectItem>
                  <DaisySelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </DaisySelect>
            </div>
            <div className="space-y-enterprise-3">
              <h4 className="text-body-sm font-semibold text-text-primary">Distribution</h4>
              <DaisySelect>
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Select delivery method" />
                </DaisySelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="email">Email</SelectItem>
                  <DaisySelectItem value="slack">Slack</SelectItem>
                  <DaisySelectItem value="portal">Portal Only</SelectItem>
                </SelectContent>
              </DaisySelect>
            </div>
          </div>
        </ContentCard>
      </DaisyTabsContent>
    </MainContentArea>
  );
};

export default AdvancedReportingPlatform; 
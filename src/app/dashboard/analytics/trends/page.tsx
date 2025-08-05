'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import {
  DaisyCard,
  DaisyCardBody,
  DaisyCardTitle,
  DaisyCardDescription,
} from '@/components/ui/daisy-components';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
// Date range picker would be imported here if available
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert, DaisyAlertDescription } from '@/components/ui/DaisyAlert';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Settings,
} from 'lucide-react';

// Types
interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercent: number;
}

interface MetricTrend {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  category: 'risk' | 'compliance' | 'security' | 'performance';
  data: TrendData[];
  unit: string;
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  recommendation: string;
  category: string;
}

// Sample data
const sampleMetrics: MetricTrend[] = [
  {
    id: 'compliance-score',
    name: 'Overall Compliance Score',
    description: 'Aggregate compliance score across all frameworks',
    currentValue: 85,
    previousValue: 78,
    change: 7,
    changePercent: 8.97,
    trend: 'up',
    category: 'compliance',
    unit: '%',
    target: 95,
    status: 'good',
    data: [
      { period: '2024-01', value: 72, change: 0, changePercent: 0 },
      { period: '2024-02', value: 75, change: 3, changePercent: 4.17 },
      { period: '2024-03', value: 78, change: 3, changePercent: 4.0 },
      { period: '2024-04', value: 82, change: 4, changePercent: 5.13 },
      { period: '2024-05', value: 85, change: 3, changePercent: 3.66 },
    ],
  },
  {
    id: 'risk-score',
    name: 'Average Risk Score',
    description: 'Mean risk score across all identified risks',
    currentValue: 6.2,
    previousValue: 7.1,
    change: -0.9,
    changePercent: -12.68,
    trend: 'down',
    category: 'risk',
    unit: '/10',
    target: 5.0,
    status: 'warning',
    data: [
      { period: '2024-01', value: 7.8, change: 0, changePercent: 0 },
      { period: '2024-02', value: 7.5, change: -0.3, changePercent: -3.85 },
      { period: '2024-03', value: 7.1, change: -0.4, changePercent: -5.33 },
      { period: '2024-04', value: 6.8, change: -0.3, changePercent: -4.23 },
      { period: '2024-05', value: 6.2, change: -0.6, changePercent: -8.82 },
    ],
  },
];

const sampleInsights: PredictiveInsight[] = [
  {
    id: 'insight-1',
    title: 'SOC 2 Compliance Target Achievement',
    description:
      'Based on current trends, you are likely to achieve 95% SOC 2 compliance by Q3 2024.',
    confidence: 87,
    impact: 'high',
    timeframe: '3 months',
    recommendation: 'Focus on access control improvements to accelerate progress.',
    category: 'Compliance',
  },
];

const getCategoryConfig = (category: string) => {
  const configs = {
    risk: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
    compliance: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield },
    security: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Shield },
    performance: { color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
  };
  return configs[category as keyof typeof configs] || configs.performance;
};

const getTrendIcon = (_trend: string) => {
  const icons = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    stable: Minus,
  };
  return icons[_trend as keyof typeof icons] || Minus;
};

const getStatusConfig = (status: string) => {
  const configs = {
    good: { color: 'text-green-600', bg: 'bg-green-50', label: 'Good' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Warning' },
    critical: { color: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
  };
  return configs[status as keyof typeof configs] || configs.good;
};

const getImpactConfig = (impact: string) => {
  const configs = {
    high: { color: 'text-red-600', bg: 'bg-red-50', label: 'High Impact' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium Impact' },
    low: { color: 'text-green-600', bg: 'bg-green-50', label: 'Low Impact' },
  };
  return configs[impact as keyof typeof configs] || configs.medium;
};

export default function AnalyticsTrendsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('3months');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricTrend[]>([]);

  const filteredMetrics = sampleMetrics.filter(
    (metric) => selectedCategory === 'all' || metric.category === selectedCategory
  );

  const handleRefreshData = () => {
    toast.success('Data refreshed successfully');
  };

  const handleExportData = () => {
    toast.success('Analytics data exported successfully');
  };

  const handleCustomDashboard = () => {
    toast.success('Opening custom dashboard builder...');
  };

  const handleDrillDown = (metricId: string) => {
    const metric = sampleMetrics.find((m) => m.id === metricId);
    if (metric) {
      toast.success(`Drilling down into ${metric.name} details...`);
    }
  };

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Analytics & Trends"
        subtitle="Advanced analytics, predictive insights, and trend analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Trends', current: true },
        ]}
        primaryAction={{
          label: 'Custom Dashboard',
          onClick: handleCustomDashboard,
          icon: BarChart3,
        }}
        secondaryActions={[
          {
            label: 'Export Report',
            onClick: handleExportData,
            icon: Download,
            variant: 'outline',
          },
          {
            label: 'Refresh Data',
            onClick: handleRefreshData,
            icon: RefreshCw,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'metrics tracked',
            value: sampleMetrics.length,
            variant: 'default',
          },
          {
            label: 'improving trends',
            value: sampleMetrics.filter((m) => m.trend === 'up').length,
            variant: 'default',
          },
          {
            label: 'critical alerts',
            value: sampleMetrics.filter((m) => m.status === 'critical').length,
            variant: 'destructive',
          },
          {
            label: 'predictions',
            value: sampleInsights.length,
            variant: 'default',
          },
        ]}
        maxWidth="2xl"
      >
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <DaisySelect
            className="w-40"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </DaisySelect>

          <DaisySelect
            className="w-40"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="risk">Risk</option>
            <option value="compliance">Compliance</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
          </DaisySelect>

          <div className="text-sm text-gray-600 ml-auto">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <DaisyTabsList>
            <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
            <DaisyTabsTrigger value="metrics">Metric Details</DaisyTabsTrigger>
            <DaisyTabsTrigger value="predictions">Predictive Insights</DaisyTabsTrigger>
            <DaisyTabsTrigger value="comparisons">Comparisons</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>

        <DaisyTabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.slice(0, 6).map((metric) => {
              const categoryConfig = getCategoryConfig(metric.category);
              const TrendIcon = getTrendIcon(metric.trend);
              const statusConfig = getStatusConfig(metric.status);
              const CategoryIcon = categoryConfig.icon;

              return (
                <DaisyCard
                  key={metric.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDrillDown(metric.id)}
                >
                  <DaisyCardBody className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn('p-1.5 rounded-full', categoryConfig.bg)}>
                          <CategoryIcon className={cn('h-4 w-4', categoryConfig.color)} />
                        </div>
                        <DaisyBadge variant="outline" className={cn('text-xs', statusConfig.color)}>
                          {statusConfig.label}
                        </DaisyBadge>
                      </div>
                      <TrendIcon
                        className={cn(
                          'h-4 w-4',
                          metric.trend === 'up'
                            ? 'text-green-600'
                            : metric.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        )}
                      />
                    </div>
                    <DaisyCardTitle className="text-sm font-medium">{metric.name}</DaisyCardTitle>
                  </DaisyCardBody>
                  <DaisyCardBody>
                    <div className="space-y-3">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold">
                          {metric.currentValue}
                          {metric.unit}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium',
                            metric.changePercent > 0
                              ? 'text-green-600'
                              : metric.changePercent < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          )}
                        >
                          {metric.changePercent > 0 ? '+' : ''}
                          {metric.changePercent.toFixed(1)}%
                        </span>
                      </div>

                      {metric.target && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress to Target</span>
                            <span>{Math.round((metric.currentValue / metric.target) * 100)}%</span>
                          </div>
                          <DaisyProgress
                            value={(metric.currentValue / metric.target) * 100}
                            className="h-2"
                          />
                        </div>
                      )}

                      <div className="text-xs text-gray-500">{metric.description}</div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>

          {/* Trend Summary */}
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Trend Summary</span>
              </DaisyCardTitle>
              <DaisyCardDescription>
                Overall performance trends across all categories
              </DaisyCardDescription>
            </DaisyCardBody>
            <DaisyCardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Improving</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {sampleMetrics.filter((m) => m.trend === 'up').length}
                  </div>
                  <div className="text-sm text-green-700">metrics trending up</div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Declining</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {
                      sampleMetrics.filter((m) => m.trend === 'down' && m.category !== 'risk')
                        .length
                    }
                  </div>
                  <div className="text-sm text-red-700">metrics trending down</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Minus className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Stable</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {sampleMetrics.filter((m) => m.trend === 'stable').length}
                  </div>
                  <div className="text-sm text-gray-600">metrics stable</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">On Target</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {
                      sampleMetrics.filter((m) => m.target && m.currentValue >= m.target * 0.9)
                        .length
                    }
                  </div>
                  <div className="text-sm text-yellow-700">near target goals</div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="metrics" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Metric Details</h3>
            <p className="text-gray-600 mb-4">Detailed metric analysis coming soon</p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="predictions" className="space-y-6">
          <DaisyAlert>
            <Zap className="h-4 w-4" />
            <DaisyAlertDescription>
              Predictive insights are generated using AI analysis of historical trends and patterns.
              Confidence levels indicate the reliability of each prediction.
            </DaisyAlertDescription>
          </DaisyAlert>

          <div className="space-y-4">
            {sampleInsights.map((insight) => {
              const impactConfig = getImpactConfig(insight.impact);

              return (
                <DaisyCard key={insight.id}>
                  <DaisyCardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge
                            variant="outline"
                            className={cn('text-xs', impactConfig.color)}
                          >
                            {impactConfig.label}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs">
                            {insight.category}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs">
                            {insight.timeframe}
                          </DaisyBadge>
                        </div>
                        <DaisyCardTitle className="text-lg">{insight.title}</DaisyCardTitle>
                        <DaisyCardDescription className="mt-1">
                          {insight.description}
                        </DaisyCardDescription>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {insight.confidence}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    </div>
                  </DaisyCardBody>
                  <DaisyCardBody>
                    <div className="space-y-4">
                      <DaisyProgress value={insight.confidence} className="h-2" />
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm text-blue-900 mb-1">
                          Recommended Action
                        </h4>
                        <p className="text-sm text-blue-800">{insight.recommendation}</p>
                      </div>

                      <div className="flex space-x-2">
                        <DaisyButton variant="outline" size="sm">
                          <Target className="h-4 w-4 mr-1" />
                          Create Action Plan
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Set Reminder
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          View Details
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="comparisons">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparative Analysis</h3>
            <p className="text-gray-600 mb-4">
              Compare metrics across time periods, categories, and benchmarks
            </p>
            <DaisyButton>
              <PieChart className="h-4 w-4 mr-2" />
              Create Comparison
            </DaisyButton>
          </div>
        </DaisyTabsContent>
      </MainContentArea>
    </ProtectedRoute>
  );
}

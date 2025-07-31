'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
// Date range picker would be imported here if available
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
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
      { period: '2024-03', value: 78, change: 3, changePercent: 4.00 },
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
  {
    id: 'security-incidents',
    name: 'Security Incidents',
    description: 'Number of security incidents per month',
    currentValue: 3,
    previousValue: 7,
    change: -4,
    changePercent: -57.14,
    trend: 'down',
    category: 'security',
    unit: 'incidents',
    target: 0,
    status: 'good',
    data: [
      { period: '2024-01', value: 12, change: 0, changePercent: 0 },
      { period: '2024-02', value: 9, change: -3, changePercent: -25.00 },
      { period: '2024-03', value: 7, change: -2, changePercent: -22.22 },
      { period: '2024-04', value: 5, change: -2, changePercent: -28.57 },
      { period: '2024-05', value: 3, change: -2, changePercent: -40.00 },
    ],
  },
  {
    id: 'control-effectiveness',
    name: 'Control Effectiveness',
    description: 'Percentage of controls operating effectively',
    currentValue: 92,
    previousValue: 89,
    change: 3,
    changePercent: 3.37,
    trend: 'up',
    category: 'compliance',
    unit: '%',
    target: 98,
    status: 'good',
    data: [
      { period: '2024-01', value: 85, change: 0, changePercent: 0 },
      { period: '2024-02', value: 87, change: 2, changePercent: 2.35 },
      { period: '2024-03', value: 89, change: 2, changePercent: 2.30 },
      { period: '2024-04', value: 91, change: 2, changePercent: 2.25 },
      { period: '2024-05', value: 92, change: 1, changePercent: 1.10 },
    ],
  },
  {
    id: 'audit-readiness',
    name: 'Audit Readiness Score',
    description: 'Readiness score for upcoming audits',
    currentValue: 78,
    previousValue: 65,
    change: 13,
    changePercent: 20.00,
    trend: 'up',
    category: 'compliance',
    unit: '%',
    target: 90,
    status: 'warning',
    data: [
      { period: '2024-01', value: 55, change: 0, changePercent: 0 },
      { period: '2024-02', value: 60, change: 5, changePercent: 9.09 },
      { period: '2024-03', value: 65, change: 5, changePercent: 8.33 },
      { period: '2024-04', value: 72, change: 7, changePercent: 10.77 },
      { period: '2024-05', value: 78, change: 6, changePercent: 8.33 },
    ],
  },
  {
    id: 'team-productivity',
    name: 'Team Productivity Index',
    description: 'Composite score of team task completion and efficiency',
    currentValue: 87,
    previousValue: 82,
    change: 5,
    changePercent: 6.10,
    trend: 'up',
    category: 'performance',
    unit: '/100',
    target: 95,
    status: 'good',
    data: [
      { period: '2024-01', value: 76, change: 0, changePercent: 0 },
      { period: '2024-02', value: 79, change: 3, changePercent: 3.95 },
      { period: '2024-03', value: 82, change: 3, changePercent: 3.80 },
      { period: '2024-04', value: 85, change: 3, changePercent: 3.66 },
      { period: '2024-05', value: 87, change: 2, changePercent: 2.35 },
    ],
  },
];

const sampleInsights: PredictiveInsight[] = [
  {
    id: 'insight-1',
    title: 'SOC 2 Compliance Target Achievement',
    description: 'Based on current trends, you are likely to achieve 95% SOC 2 compliance by Q3 2024.',
    confidence: 87,
    impact: 'high',
    timeframe: '3 months',
    recommendation: 'Focus on access control improvements to accelerate progress.',
    category: 'Compliance',
  },
  {
    id: 'insight-2',
    title: 'Security Incident Reduction',
    description: 'Current security measures are effectively reducing incident rates. Trend suggests zero incidents possible by Q4.',
    confidence: 78,
    impact: 'high',
    timeframe: '6 months',
    recommendation: 'Continue current security training and monitoring programs.',
    category: 'Security',
  },
  {
    id: 'insight-3',
    title: 'Risk Score Optimization',
    description: 'Risk mitigation efforts are showing positive results. Target risk score of 5.0 achievable with focused effort.',
    confidence: 82,
    impact: 'medium',
    timeframe: '4 months',
    recommendation: 'Prioritize high-impact risk mitigation controls.',
    category: 'Risk Management',
  },
  {
    id: 'insight-4',
    title: 'Team Productivity Peak',
    description: 'Team productivity is approaching optimal levels. Maintaining current trajectory will reach target by Q2.',
    confidence: 91,
    impact: 'medium',
    timeframe: '2 months',
    recommendation: 'Implement workflow automation to sustain productivity gains.',
    category: 'Performance',
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

const getTrendIcon = (trend: string) => {
  const icons = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    stable: Minus,
  };
  return icons[trend as keyof typeof icons] || Minus;
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

  const filteredMetrics = sampleMetrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const handleRefreshData = () => {
    toast.success('Data refreshed successfully');
    // In a real implementation, this would trigger a data refresh from the backend
  };

  const handleExportData = () => {
    // Create sample CSV data
    const csvData = selectedMetrics.map(metric => ({
      metric: metric.name,
      current_value: metric.currentValue,
      previous_value: metric.previousValue,
      change: metric.change,
      change_percent: metric.changePercent,
      trend: metric.trend,
      status: metric.status,
      target: metric.target || 'N/A'
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-trends-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Analytics data exported successfully');
  };

  const handleCustomDashboard = () => {
    toast.success('Opening custom dashboard builder...');
    // In a real implementation, this would open a dashboard builder interface
  };

  const handleDrillDown = (metricId: string) => {
    const metric = sampleMetrics.find(m => m.id === metricId);
    if (metric) {
      toast.success(`Drilling down into ${metric.name} details...`);
      // In a real implementation, this would navigate to a detailed view
      // router.push(`/dashboard/analytics/trends/${metricId}`);
    }
  };

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => {
      const isSelected = prev.some(m => m.id === metricId);
      if (isSelected) {
        return prev.filter(m => m.id !== metricId);
      } else {
        const metric = sampleMetrics.find(m => m.id === metricId);
        return metric ? [...prev, metric] : prev;
      }
    });
  };

  const handlePredictiveAnalysis = () => {
    toast.success('Running predictive analysis...');
    // Simulate AI analysis delay
    setTimeout(() => {
      toast.success('Predictive insights generated successfully');
    }, 2000);
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
            value: sampleMetrics.filter(m => m.trend === 'up').length,
            variant: 'default',
          },
          {
            label: 'critical alerts',
            value: sampleMetrics.filter(m => m.status === 'critical').length,
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
          <DaisySelect value={selectedTimeRange} onValueChange={setSelectedTimeRange} />
            <DaisySelectTrigger className="w-40" />
              <DaisySelectValue placeholder="Time Range" /></DaisySelect>
            <DaisySelectContent />
              <DaisySelectItem value="1month">Last Month</DaisySelectContent>
              <DaisySelectItem value="3months">Last 3 Months</DaisySelectItem>
              <DaisySelectItem value="6months">Last 6 Months</DaisySelectItem>
              <DaisySelectItem value="1year">Last Year</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>

          <DaisySelect value={selectedCategory} onValueChange={setSelectedCategory} />
            <DaisySelectTrigger className="w-40" />
              <DaisySelectValue placeholder="Category" /></DaisySelect>
            <DaisySelectContent />
              <DaisySelectItem value="all">All Categories</DaisySelectContent>
              <DaisySelectItem value="risk">Risk</DaisySelectItem>
              <DaisySelectItem value="compliance">Compliance</DaisySelectItem>
              <DaisySelectItem value="security">Security</DaisySelectItem>
              <DaisySelectItem value="performance">Performance</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>

          <div className="text-sm text-gray-600 ml-auto">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-6" />
          <DaisyTabsList />
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
            <DaisyTabsTrigger value="metrics">Metric Details</DaisyTabsTrigger>
            <DaisyTabsTrigger value="predictions">Predictive Insights</DaisyTabsTrigger>
            <DaisyTabsTrigger value="comparisons">Comparisons</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>

        <DaisyTabsContent value="overview" className="space-y-6" />
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
                  onClick={() => handleDrillDown(metric.id)} />
                  <DaisyCardHeader className="pb-3" >
  <div className="flex items-center justify-between">
</DaisyTabsContent>
                      <div className="flex items-center space-x-2">
                        <div className={cn("p-1.5 rounded-full", categoryConfig.bg)}>
                          <CategoryIcon className={cn("h-4 w-4", categoryConfig.color)} />
                        </div>
                        <DaisyBadge variant="outline" className={cn("text-xs", statusConfig.color)} >
  {statusConfig.label}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                      <TrendIcon className={cn(
                        "h-4 w-4",
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      )} />
                    </div>
                    <DaisyCardTitle className="text-sm font-medium">{metric.name}</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-3">
</DaisyCardContent>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold">
                          {metric.currentValue}{metric.unit}
                        </span>
                        <span className={cn(
                          "text-sm font-medium",
                          metric.changePercent > 0 ? 'text-green-600' :
                          metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
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

                      <div className="text-xs text-gray-500">
                        {metric.description}
                      </div>
                    </div>
                  </DaisyProgress>
                </DaisyCard>
              );
            })}
          </div>

          {/* Trend Summary */}
          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="flex items-center space-x-2" >
  <TrendingUp className="h-5 w-5 text-blue-600" />
</DaisyCardTitle>
                <span>Trend Summary</span>
              </DaisyCardTitle>
              <DaisyCardDescription >
  Overall performance trends across all categories
</DaisyCardDescription>
              </p>
            
            <DaisyCardContent >
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
</DaisyCardContent>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Improving</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {sampleMetrics.filter(m => m.trend === 'up').length}
                  </div>
                  <div className="text-sm text-green-700">metrics trending up</div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Declining</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {sampleMetrics.filter(m => m.trend === 'down' && m.category !== 'risk').length}
                  </div>
                  <div className="text-sm text-red-700">metrics trending down</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Minus className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Stable</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {sampleMetrics.filter(m => m.trend === 'stable').length}
                  </div>
                  <div className="text-sm text-gray-600">metrics stable</div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">On Target</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {sampleMetrics.filter(m => m.target && m.currentValue >= m.target * 0.9).length}
                  </div>
                  <div className="text-sm text-yellow-700">near target goals</div>
                </div>
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="metrics" className="space-y-6" />
          <div className="space-y-4">
            {filteredMetrics.map((metric) => {
              const categoryConfig = getCategoryConfig(metric.category);
              const TrendIcon = getTrendIcon(metric.trend);
              const statusConfig = getStatusConfig(metric.status);
              const CategoryIcon = categoryConfig.icon;

              return (
                <DaisyCard key={metric.id} className="border-l-4" style={{ borderLeftColor: categoryConfig.color.replace('text-', '') }}>
                  <DaisyCardHeader >
  <div className="flex items-start justify-between">
</DaisyTabsContent>
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-full", categoryConfig.bg)}>
                          <CategoryIcon className={cn("h-5 w-5", categoryConfig.color)} />
                        </div>
                        <div>
                          <DaisyCardTitle className="text-lg">{metric.name}</DaisyCardTitle>
                          <DaisyCardDescription>{metric.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <DaisyBadge variant="outline" className={cn("text-xs", statusConfig.color)} >
  {statusConfig.label}
</DaisyCardDescription>
                          </DaisyBadge>
                          <TrendIcon className={cn(
                            "h-4 w-4",
                            metric.trend === 'up' ? 'text-green-600' :
                            metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          )} />
                        </div>
                        <div className="text-2xl font-bold">
                          {metric.currentValue}{metric.unit}
                        </div>
                        <div className={cn(
                          "text-sm font-medium",
                          metric.changePercent > 0 ? 'text-green-600' :
                          metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}% vs last period
                        </div>
                      </div>
                    </div>
                  
                  <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                      {/* Progress to Target */}
                      {metric.target && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress to Target ({metric.target}{metric.unit})</span>
                            <span className="font-medium">
                              {Math.round((metric.currentValue / metric.target) * 100)}%
                            </span>
                          </div>
                          <DaisyProgress 
                            value={(metric.currentValue / metric.target) * 100} 
                            className="h-3"
                          />
                        </div>
                      )}

                      {/* Historical Data Preview */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Recent Trend</h4>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          {metric.data.map((dataPoint, index) => (
                            <div key={index} className="text-center p-2 bg-gray-50 rounded">
                              <div className="font-medium">{dataPoint.period}</div>
                              <div className="text-gray-600">{dataPoint.value}{metric.unit}</div>
                              {index > 0 && (
                                <div className={cn(
                                  "text-xs",
                                  dataPoint.changePercent > 0 ? 'text-green-600' :
                                  dataPoint.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                                )}>
                                  {dataPoint.changePercent > 0 ? '+' : ''}{dataPoint.changePercent.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2 border-t">
                        <DaisyButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleDrillDown(metric.id)} />
                          <Eye className="h-4 w-4 mr-1" />
                          Drill Down
                        </DaisyProgress>
                        <DaisyButton variant="outline" size="sm" >
  <LineChart className="h-4 w-4 mr-1" />
</DaisyButton>
                          View Chart
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm" >
  <Download className="h-4 w-4 mr-1" />
</DaisyButton>
                          Export Data
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="predictions" className="space-y-6" />
          <DaisyAlert >
  <Zap className="h-4 w-4" />
</DaisyTabsContent>
            <DaisyAlertDescription >
  Predictive insights are generated using AI analysis of historical trends and patterns.
                </DaisyAlertDescription>
</DaisyAlert>
              Confidence levels indicate the reliability of each prediction.
                </DaisyAlertDescription>
              </DaisyAlert>

          <div className="space-y-4">
            {sampleInsights.map((insight) => {
              const impactConfig = getImpactConfig(insight.impact);

              return (
                <DaisyCard key={insight.id} >
  <DaisyCardHeader />
</DaisyCard>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge variant="outline" className={cn("text-xs", impactConfig.color)} >
  {impactConfig.label}
</DaisyBadge>
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs" >
  {insight.category}
</DaisyBadge>
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs" >
  {insight.timeframe}
</DaisyBadge>
                          </DaisyBadge>
                        </div>
                        <DaisyCardTitle className="text-lg">{insight.title}</DaisyCardTitle>
                        <DaisyCardDescription className="mt-1" >
  {insight.description}
</DaisyCardDescription>
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600">{insight.confidence}%</div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                    </div>
                  
                  <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                      <DaisyProgress value={insight.confidence} className="h-2" />
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm text-blue-900 mb-1">
                          Recommended Action
                        </h4>
                        <p className="text-sm text-blue-800">
                          {insight.recommendation}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <DaisyButton variant="outline" size="sm" >
  <Target className="h-4 w-4 mr-1" />
</DaisyProgress>
                          Create Action Plan
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm" >
  <DaisyCalendar className="h-4 w-4 mr-1" />
</DaisyButton>
                          Set Reminder
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm" >
  <FileText className="h-4 w-4 mr-1" />
</DaisyButton>
                          View Details
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="comparisons" />
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Comparative Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Compare metrics across time periods, categories, and benchmarks
            </p>
            <DaisyButton >
  <PieChart className="h-4 w-4 mr-2" />
</DaisyTabsContent>
              Create Comparison
            </DaisyButton>
          </div>
        </DaisyTabsContent>
      </MainContentArea>
    </ProtectedRoute>
  );
} 
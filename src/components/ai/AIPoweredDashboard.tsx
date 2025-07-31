'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  MessageSquare,
  Download,
  Settings,
  RefreshCw,
  Sparkles,
  Bot,
  LineChart,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  ArrowRight,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';

// Types
interface AIPrediction {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'control' | 'compliance' | 'trend';
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number; // 0-100
  timeframe: string; // e.g., "next 30 days"
  status: 'active' | 'resolved' | 'monitoring';
  dataSource: string[];
  createdAt: Date;
  lastUpdated: Date;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'risk-mitigation' | 'control-optimization' | 'compliance' | 'efficiency';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  actions: RecommendationAction[];
  relatedPredictions: string[];
  confidence: number;
}

interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignee?: string;
  dueDate?: Date;
}

interface AITrendData {
  id: string;
  metric: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  change: number; // percentage
  prediction: number[];
  timeLabels: string[];
  confidence: number;
}

interface RiskScenario {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number;
  triggers: string[];
  mitigations: string[];
  timeline: string;
  affectedAssets: string[];
}

// Sample AI Data
const samplePredictions: AIPrediction[] = [
  {
    id: 'AI-PRED-001',
    title: 'Increased Phishing Risk Detected',
    description: 'AI models detect 73% increase in phishing attempts targeting your industry. High probability of attacks in next 2 weeks.',
    type: 'risk',
    confidence: 87,
    impact: 'high',
    likelihood: 73,
    timeframe: 'next 14 days',
    status: 'active',
    dataSource: ['Threat Intelligence', 'Email Security Logs', 'Industry Reports'],
    createdAt: new Date('2024-01-20'),
    lastUpdated: new Date('2024-01-20'),
  },
  {
    id: 'AI-PRED-002',
    title: 'Control Effectiveness Decline',
    description: 'Access control CTL-001 showing declining effectiveness. Predicted to fall below 80% threshold within 30 days.',
    type: 'control',
    confidence: 82,
    impact: 'medium',
    likelihood: 68,
    timeframe: 'next 30 days',
    status: 'monitoring',
    dataSource: ['Control Testing Data', 'User Access Logs', 'Performance Metrics'],
    createdAt: new Date('2024-01-19'),
    lastUpdated: new Date('2024-01-20'),
  },
  {
    id: 'AI-PRED-003',
    title: 'Compliance Gap Emerging',
    description: 'SOC 2 compliance score trending downward. Risk of falling below required threshold by Q2 2024.',
    type: 'compliance',
    confidence: 76,
    impact: 'critical',
    likelihood: 65,
    timeframe: 'Q2 2024',
    status: 'active',
    dataSource: ['Compliance Monitoring', 'Control Test Results', 'Audit History'],
    createdAt: new Date('2024-01-18'),
    lastUpdated: new Date('2024-01-20'),
  },
];

const sampleRecommendations: AIRecommendation[] = [
  {
    id: 'AI-REC-001',
    title: 'Implement Advanced Email Security',
    description: 'Deploy AI-powered email filtering to counter predicted phishing surge. Expected 85% reduction in successful attacks.',
    priority: 'critical',
    category: 'risk-mitigation',
    impact: 'Reduce phishing risk by 85%',
    effort: 'medium',
    timeline: '2-3 weeks',
    actions: [
      {
        id: 'ACT-001',
        title: 'Evaluate email security vendors',
        description: 'Research and compare AI-powered email security solutions',
        completed: false,
      },
      {
        id: 'ACT-002',
        title: 'Conduct pilot deployment',
        description: 'Test solution with IT department',
        completed: false,
      },
    ],
    relatedPredictions: ['AI-PRED-001'],
    confidence: 89,
  },
  {
    id: 'AI-REC-002',
    title: 'Optimize Access Control Testing',
    description: 'Increase testing frequency for CTL-001 from quarterly to monthly. Implement automated monitoring.',
    priority: 'high',
    category: 'control-optimization',
    impact: 'Improve control effectiveness by 25%',
    effort: 'low',
    timeline: '1 week',
    actions: [
      {
        id: 'ACT-003',
        title: 'Update testing schedule',
        description: 'Modify CTL-001 testing from quarterly to monthly',
        completed: true,
      },
      {
        id: 'ACT-004',
        title: 'Setup automated monitoring',
        description: 'Configure real-time control effectiveness tracking',
        completed: false,
      },
    ],
    relatedPredictions: ['AI-PRED-002'],
    confidence: 84,
  },
];

const sampleTrendData: AITrendData[] = [
  {
    id: 'TREND-001',
    metric: 'Overall Risk Score',
    current: 3.2,
    previous: 2.8,
    trend: 'up',
    change: 14.3,
    prediction: [3.2, 3.4, 3.6, 3.5, 3.3, 3.1],
    timeLabels: ['Now', '+1M', '+2M', '+3M', '+4M', '+5M'],
    confidence: 78,
  },
  {
    id: 'TREND-002',
    metric: 'Control Effectiveness',
    current: 87,
    previous: 85,
    trend: 'up',
    change: 2.4,
    prediction: [87, 88, 90, 89, 91, 92],
    timeLabels: ['Now', '+1M', '+2M', '+3M', '+4M', '+5M'],
    confidence: 82,
  },
  {
    id: 'TREND-003',
    metric: 'Compliance Score',
    current: 92,
    previous: 94,
    trend: 'down',
    change: -2.1,
    prediction: [92, 90, 88, 89, 91, 93],
    timeLabels: ['Now', '+1M', '+2M', '+3M', '+4M', '+5M'],
    confidence: 85,
  },
];

// AI Prediction Card Component
const PredictionCard: React.FC<{
  prediction: AIPrediction;
  onAction: (action: string, prediction: AIPrediction) => void;
}> = ({ prediction, onAction }) => {
  const getTypeConfig = (type: string) => {
    const configs = {
      'risk': { icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50' },
      'control': { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
      'compliance': { icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
      'trend': { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    };
    return configs[type as keyof typeof configs] || configs.risk;
  };

  const getImpactConfig = (impact: string) => {
    const configs = {
      'low': { color: 'text-semantic-success', badge: 'default' },
      'medium': { color: 'text-semantic-warning', badge: 'secondary' },
      'high': { color: 'text-semantic-warning', badge: 'destructive' },
      'critical': { color: 'text-semantic-error', badge: 'destructive' },
    };
    return configs[impact as keyof typeof configs] || configs.medium;
  };

  const typeConfig = getTypeConfig(prediction.type);
  const impactConfig = getImpactConfig(prediction.impact);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="p-enterprise-4 border border-border rounded-lg hover:shadow-notion-sm transition-all duration-200 bg-white relative overflow-hidden">
      {/* AI Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex items-start space-x-enterprise-3">
          <div className={cn("p-enterprise-2 rounded-lg", typeConfig.bg)}>
            <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
              <h3 className="text-body-sm font-semibold text-text-primary">
                {prediction.title}
              </h3>
              <DaisyBadge variant={impactConfig.badge as any} className="text-caption" >
  {prediction.impact.toUpperCase()}
</DaisyBadge>
              </DaisyBadge>
            </div>
            <p className="text-caption text-text-secondary">
              {prediction.description}
            </p>
          </div>
        </div>
        <Bot className="h-4 w-4 text-purple-500" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-enterprise-4 mb-enterprise-3">
        <div>
          <div className="flex items-center justify-between mb-enterprise-1">
            <span className="text-caption text-text-secondary">Confidence</span>
            <span className="text-caption font-medium text-purple-600">{prediction.confidence}%</span>
          </div>
          <DaisyProgress value={prediction.confidence} className="h-2" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-enterprise-1">
            <span className="text-caption text-text-secondary">Likelihood</span>
            <span className="text-caption font-medium text-text-primary">{prediction.likelihood}%</span>
          </div>
          <DaisyProgress value={prediction.likelihood} className="h-2" />
        </div>
      </div>

      {/* Timeline & Data Sources */}
      <div className="space-y-enterprise-2 mb-enterprise-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">Timeframe:</span>
          </div>
          <span className="text-caption font-medium text-text-primary">{prediction.timeframe}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            <Activity className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">Data Sources:</span>
          </div>
          <span className="text-caption text-text-tertiary">{prediction.dataSource.length} sources</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-enterprise-3 border-t border-border">
        <div className="flex items-center space-x-enterprise-1">
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2 text-purple-600 hover:text-purple-700"
            onClick={() => onAction('view', prediction)} />
            <Eye className="h-3 w-3 mr-enterprise-1" />
            Analyze
          </DaisyProgress>
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('dismiss', prediction)} />
            Dismiss
          </DaisyButton>
        </div>
        <span className="text-caption text-text-tertiary">
          Updated {prediction.lastUpdated.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// AI Recommendation Panel Component
const RecommendationPanel: React.FC<{
  recommendation: AIRecommendation;
  onAction: (action: string, recommendation: AIRecommendation) => void;
}> = ({ recommendation, onAction }) => {
  const getPriorityConfig = (priority: string) => {
    const configs = {
      'low': { color: 'text-semantic-success', bg: 'bg-semantic-success/10' },
      'medium': { color: 'text-semantic-warning', bg: 'bg-semantic-warning/10' },
      'high': { color: 'text-semantic-warning', bg: 'bg-semantic-warning/10' },
      'critical': { color: 'text-semantic-error', bg: 'bg-semantic-error/10' },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const priorityConfig = getPriorityConfig(recommendation.priority);
  const completedActions = recommendation.actions.filter(a => a.completed).length;
  const progressPercentage = (completedActions / recommendation.actions.length) * 100;

  return (
    <div className="p-enterprise-4 border border-border rounded-lg bg-white hover:shadow-notion-sm transition-all duration-200 relative overflow-hidden">
      {/* AI Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-enterprise-3">
        <div className="flex-1">
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            <h3 className="text-body-sm font-semibold text-text-primary">
              {recommendation.title}
            </h3>
            <DaisyBadge 
              className={cn("text-caption", priorityConfig.color, priorityConfig.bg)}
              variant="outline" >
  {recommendation.priority.toUpperCase()}
</DaisyBadge>
            </DaisyBadge>
          </div>
          <p className="text-caption text-text-secondary mb-enterprise-2">
            {recommendation.description}
          </p>
          <div className="flex items-center space-x-enterprise-4 text-caption text-text-tertiary">
            <span>Impact: {recommendation.impact}</span>
            <span>Timeline: {recommendation.timeline}</span>
            <span>Effort: {recommendation.effort}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-body-sm font-medium text-purple-600">{recommendation.confidence}%</div>
          <div className="text-caption text-text-secondary">Confidence</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-enterprise-3">
        <div className="flex items-center justify-between mb-enterprise-1">
          <span className="text-caption text-text-secondary">Implementation Progress</span>
          <span className="text-caption font-medium text-text-primary">
            {completedActions}/{recommendation.actions.length} actions
          </span>
        </div>
        <DaisyProgress value={progressPercentage} className="h-2" />
      </div>

      {/* Actions List */}
      <div className="space-y-enterprise-2 mb-enterprise-3">
        {recommendation.actions.slice(0, 2).map((action) => (
          <div key={action.id} className="flex items-center space-x-enterprise-2">
            {action.completed ? (
              <CheckCircle className="h-3 w-3 text-semantic-success" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-border"></div>
            )}
            <span className={cn(
              "text-caption",
              action.completed ? "text-text-tertiary line-through" : "text-text-primary"
            )}>
              {action.title}
            </span>
          </div>
        ))}
        {recommendation.actions.length > 2 && (
          <div className="text-caption text-text-tertiary">
            +{recommendation.actions.length - 2} more actions
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-enterprise-3 border-t border-border">
        <div className="flex items-center space-x-enterprise-1">
          <DaisyButton 
            size="sm" 
            className="h-6 px-enterprise-3 bg-purple-600 hover:bg-purple-700"
            onClick={() => onAction('implement', recommendation)} />
            <ArrowRight className="h-3 w-3 mr-enterprise-1" />
            Implement
          </DaisyProgress>
          <DaisyButton 
            variant="outline" 
            size="sm" 
            className="h-6 px-enterprise-2"
            onClick={() => onAction('view', recommendation)} />
            Details
          </DaisyButton>
        </div>
        <DaisyButton 
          variant="ghost" 
          size="sm" 
          className="h-6 px-enterprise-2"
          onClick={() => onAction('dismiss', recommendation)} />
          Dismiss
        </DaisyButton>
      </div>
    </div>
  );
};

// Trend Chart Component
const TrendChart: React.FC<{ trend: AITrendData }> = ({ trend }) => {
  const TrendIcon = trend.trend === 'up' ? TrendingUp : trend.trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend.trend === 'up' ? 'text-semantic-success' : 
                     trend.trend === 'down' ? 'text-semantic-error' : 'text-text-secondary';

  return (
    <div className="p-enterprise-4 border border-border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-enterprise-3">
        <div>
          <h3 className="text-body-sm font-semibold text-text-primary">{trend.metric}</h3>
          <div className="flex items-center space-x-enterprise-2 mt-enterprise-1">
            <span className="text-heading-sm font-bold text-text-primary">{trend.current}</span>
            <div className={cn("flex items-center space-x-enterprise-1", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-caption font-medium">{Math.abs(trend.change)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-caption text-text-secondary">AI Confidence</div>
          <div className="text-body-sm font-medium text-purple-600">{trend.confidence}%</div>
        </div>
      </div>

      {/* Simple Chart Visualization */}
      <div className="h-24 relative mb-enterprise-2">
        <div className="absolute inset-0 flex items-end justify-between">
          {trend.prediction.map((value, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="w-6 bg-purple-200 rounded-t transition-all duration-300 hover:bg-purple-300"
                style={{ 
                  height: `${(value / Math.max(...trend.prediction)) * 80}%`,
                  minHeight: '4px'
                }}
              ></div>
              <span className="text-caption text-text-tertiary mt-1">{trend.timeLabels[index]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prediction Info */}
      <div className="flex items-center justify-between text-caption text-text-secondary">
        <span>Prediction based on {trend.timeLabels.length} data points</span>
        <div className="flex items-center space-x-enterprise-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span>AI Generated</span>
        </div>
      </div>
    </div>
  );
};

// Main AI Dashboard Component
export const AIPoweredDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  const handlePredictionAction = (action: string, prediction: AIPrediction) => {
    console.log(`Prediction action: ${action}`, prediction);
  };

  const handleRecommendationAction = (action: string, recommendation: AIRecommendation) => {
    console.log(`Recommendation action: ${action}`, recommendation);
  };

  const activePredictions = samplePredictions.filter(p => p.status === 'active').length;
  const criticalRecommendations = sampleRecommendations.filter(r => r.priority === 'critical').length;
  const avgConfidence = Math.round(
    samplePredictions.reduce((sum, p) => sum + p.confidence, 0) / samplePredictions.length
  );

  return (
    <MainContentArea
      title="AI-Powered Insights"
      subtitle="Advanced analytics and predictive intelligence for risk and compliance management"
      breadcrumbs={[
        { label: 'AI Insights', current: true },
      ]}
      primaryAction={{
        label: isLoading ? 'Processing...' : 'Refresh Insights',
        onClick: handleRefresh,
        icon: isLoading ? RefreshCw : Brain,
        disabled: isLoading,
      }}
      secondaryActions={[
        {
          label: 'AI Chat',
          onClick: () => console.log('Open AI Chat'),
          icon: MessageSquare,
          variant: 'outline',
        },
        {
          label: 'Export Report',
          onClick: () => console.log('Export report'),
          icon: Download,
          variant: 'outline',
        },
      ]}
      stats={[
        {
          label: 'active predictions',
          value: activePredictions,
          variant: 'default',
        },
        {
          label: 'critical recommendations',
          value: criticalRecommendations,
          variant: criticalRecommendations > 0 ? 'destructive' : 'default',
        },
        {
          label: 'avg confidence',
          value: `${avgConfidence}%`,
          variant: 'default',
        },
        {
          label: 'last updated',
          value: lastRefresh.toLocaleTimeString(),
          variant: 'default',
        },
      ]}
      maxWidth="2xl"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-enterprise-6 rounded-lg shadow-lg flex items-center space-x-enterprise-3">
            <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
            <span className="text-body-sm text-text-primary">AI processing insights...</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-enterprise-6" />
        <DaisyTabsList />
          <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
          <DaisyTabsTrigger value="predictions">Predictions</DaisyTabsTrigger>
          <DaisyTabsTrigger value="recommendations">Recommendations</DaisyTabsTrigger>
          <DaisyTabsTrigger value="trends">Trends</DaisyTabsTrigger>
        </DaisyTabsList>
      </DaisyTabs>

      <DaisyTabsContent value="overview" />
        <div className="space-y-enterprise-6">
          {/* Critical Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-4">
            {samplePredictions.slice(0, 2).map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onAction={handlePredictionAction}
              />
            ))}
          </div>

          {/* Top Recommendations */}
          <div>
            <h3 className="text-heading-sm font-semibold text-text-primary mb-enterprise-4">
              Priority Recommendations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-4">
              {sampleRecommendations.map((recommendation) => (
                <RecommendationPanel
                  key={recommendation.id}
                  recommendation={recommendation}
                  onAction={handleRecommendationAction}
                />
              ))}
            </div>
          </div>

          {/* Trend Overview */}
          <div>
            <h3 className="text-heading-sm font-semibold text-text-primary mb-enterprise-4">
              Trend Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
              {sampleTrendData.map((trend) => (
                <TrendChart key={trend.id} trend={trend} />
              ))}
            </div>
          </div>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="predictions" />
        <div className="space-y-enterprise-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-4">
            {samplePredictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onAction={handlePredictionAction}
              />
            ))}
          </div>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="recommendations" />
        <div className="space-y-enterprise-4">
          <div className="grid grid-cols-1 gap-enterprise-4">
            {sampleRecommendations.map((recommendation) => (
              <RecommendationPanel
                key={recommendation.id}
                recommendation={recommendation}
                onAction={handleRecommendationAction}
              />
            ))}
          </div>
        </div>
      </DaisyTabsContent>

      <DaisyTabsContent value="trends" />
        <div className="space-y-enterprise-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-enterprise-4">
            {sampleTrendData.map((trend) => (
              <TrendChart key={trend.id} trend={trend} />
            ))}
          </div>
        </div>
      </DaisyTabsContent>
    </MainContentArea>
  );
};

export default AIPoweredDashboard;
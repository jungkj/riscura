import React, { useState } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Target,
  BarChart3,
  Globe,
  Sparkles,
  Activity,
  Gauge,
  DollarSign,
  Users,
  Building,
  Zap,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';

interface RiskMetric {
  id: string;
  title: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  unit: string;
}

interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: number;
  action?: string;
}

const riskMetrics: RiskMetric[] = [
  {
    id: 'overall-risk-score',
    title: 'Overall Risk Score',
    value: 72,
    target: 85,
    trend: 'up',
    impact: 'high',
    unit: '/100'
  },
  {
    id: 'cyber-resilience',
    title: 'Cyber Resilience',
    value: 89,
    target: 90,
    trend: 'stable',
    impact: 'high',
    unit: '%'
  },
  {
    id: 'compliance-score',
    title: 'Compliance Score',
    value: 94,
    target: 95,
    trend: 'up',
    impact: 'medium',
    unit: '%'
  },
  {
    id: 'vendor-risk',
    title: 'Third-Party Risk',
    value: 67,
    target: 80,
    trend: 'down',
    impact: 'medium',
    unit: '/100'
  }
];

const aiInsights: AIInsight[] = [
  {
    id: 'cyber-prediction',
    type: 'prediction',
    title: 'Elevated Cyber Risk Predicted',
    description: 'AI analysis indicates 23% higher cyber attack probability in Q2 based on external threat intelligence',
    confidence: 87,
    impact: 85,
    action: 'Review security controls'
  },
  {
    id: 'compliance-opportunity',
    type: 'opportunity',
    title: 'Automation Opportunity Identified',
    description: 'SOX compliance workflow automation could reduce manual effort by 40% and improve accuracy',
    confidence: 92,
    impact: 70,
    action: 'Explore automation'
  },
  {
    id: 'vendor-alert',
    type: 'alert',
    title: 'Vendor Risk Concentration',
    description: 'High concentration risk detected: 3 critical vendors lack adequate business continuity plans',
    confidence: 95,
    impact: 78,
    action: 'Diversify vendor base'
  },
  {
    id: 'esg-recommendation',
    type: 'recommendation',
    title: 'ESG Risk Framework Enhancement',
    description: 'Integrate climate risk modeling to meet upcoming EU CSRD requirements',
    confidence: 88,
    impact: 65,
    action: 'Implement ESG framework'
  }
];

export function EnterpriseRiskDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate AI analysis refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getMetricColor = (metric: RiskMetric) => {
    const percentage = (metric.value / metric.target) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getInsightIcon = (type: string) => {
    const iconMap = {
      prediction: TrendingUp,
      recommendation: Sparkles,
      alert: AlertTriangle,
      opportunity: Target
    };
    const Icon = iconMap[type as keyof typeof iconMap] || Brain;
    return <Icon className="w-5 h-5" />;
  };

  const getInsightBadgeColor = (type: string) => {
    const colorMap = {
      prediction: 'bg-blue-100 text-blue-800',
      recommendation: 'bg-purple-100 text-purple-800',
      alert: 'bg-red-100 text-red-800',
      opportunity: 'bg-green-100 text-green-800'
    };
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Risk Intelligence</h1>
          <p className="text-gray-600">AI-powered risk management and strategic insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <DaisyButton 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2" >
  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
</DaisyButton>
            <span>Refresh AI Analysis</span>
          </DaisyButton>
        </div>
      </div>

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {riskMetrics.map((metric) => (
          <DaisyCard key={metric.id} className="bg-white border-gray-200" >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline space-x-2 mb-3">
                <span className={`text-2xl font-bold ${getMetricColor(metric)}`}>
                  {metric.value}
                </span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Target: {metric.target}{metric.unit}</span>
                  <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                </div>
                <DaisyProgress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-2" />
</div>
            </DaisyProgress>
          </DaisyCard>
        ))}
      </div>

      {/* AI-Powered Insights */}
      <DaisyCard className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center space-x-3" >
  <div className="p-2 bg-blue-600 rounded-lg">
</DaisyCardTitle>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">AI Risk Intelligence</span>
              <p className="text-sm text-gray-600 font-normal">Machine learning insights and predictions</p>
            </div>
            <DaisyBadge className="bg-blue-600 text-white" >
  {aiInsights.length} Insights
</DaisyBadge>
            </DaisyBadge>
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  {aiInsights.map((insight) => (
</DaisyCardBody>
            <div 
              key={insight.id} 
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <DaisyBadge className={`text-xs ${getInsightBadgeColor(insight.type)}`}>
                        {insight.type}
                      </DaisyBadge>
                    </div>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-xs text-gray-500">
                    Confidence: {insight.confidence}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Impact: {insight.impact}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-500">
                    Confidence Score
                  </div>
                  <DaisyProgress value={insight.confidence} className="w-20 h-2" />
</div>
                {insight.action && (
                  <DaisyButton size="sm" variant="outline" className="text-xs" >
  {insight.action}
</DaisyProgress>
                  </DaisyButton>
                )}
              </div>
            </div>
          ))}
        </DaisyCardBody>
      </DaisyCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DaisyCard className="bg-white border-gray-200 hover:border-blue-300 transition-colors cursor-pointer" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
            <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-3">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Real-time Monitoring</h3>
            <p className="text-xs text-gray-600">Live risk indicators</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border-gray-200 hover:border-green-300 transition-colors cursor-pointer" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
            <div className="p-3 bg-green-50 rounded-lg w-fit mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Control Assessment</h3>
            <p className="text-xs text-gray-600">Automated testing</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border-gray-200 hover:border-purple-300 transition-colors cursor-pointer" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
            <div className="p-3 bg-purple-50 rounded-lg w-fit mx-auto mb-3">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Regulatory Intel</h3>
            <p className="text-xs text-gray-600">Compliance tracking</p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard className="bg-white border-gray-200 hover:border-orange-300 transition-colors cursor-pointer" >
  <DaisyCardBody className="p-4 text-center" >
  </DaisyCard>
</DaisyCardBody>
            <div className="p-3 bg-orange-50 rounded-lg w-fit mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Impact Analysis</h3>
            <p className="text-xs text-gray-600">Financial modeling</p>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  );
} 
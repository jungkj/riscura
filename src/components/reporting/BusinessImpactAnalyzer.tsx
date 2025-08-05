import React, { useState } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calculator,
  Zap,
  ShieldCheck,
  Building,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ROIMetric {
  id: string;
  category: string;
  description: string;
  investment: number;
  savings: number;
  roi: number;
  timeframe: string;
  status: 'realized' | 'projected' | 'in-progress';
}

interface BusinessMetric {
  id: string;
  title: string;
  value: string;
  change: number;
  period: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
}

const roiMetrics: ROIMetric[] = [
  {
    id: 'automation-sox',
    category: 'Compliance Automation',
    description: 'SOX compliance process automation',
    investment: 250000,
    savings: 450000,
    roi: 180,
    timeframe: '12 months',
    status: 'realized'
  },
  {
    id: 'cyber-controls',
    category: 'Cybersecurity Enhancement',
    description: 'Advanced threat detection implementation',
    investment: 180000,
    savings: 320000,
    roi: 178,
    timeframe: '18 months',
    status: 'in-progress'
  },
  {
    id: 'vendor-optimization',
    category: 'Third-Party Risk',
    description: 'Vendor risk management optimization',
    investment: 120000,
    savings: 280000,
    roi: 233,
    timeframe: '24 months',
    status: 'projected'
  }
];

const businessMetrics: BusinessMetric[] = [
  {
    id: 'total-savings',
    title: 'Total Cost Savings',
    value: '$1.7M',
    change: 23,
    period: 'vs last year',
    trend: 'positive',
    icon: DollarSign
  },
  {
    id: 'efficiency-gain',
    title: 'Process Efficiency',
    value: '40%',
    change: 12,
    period: 'improvement',
    trend: 'positive',
    icon: Zap
  },
  {
    id: 'risk-reduction',
    title: 'Risk Exposure',
    value: '65%',
    change: -18,
    period: 'reduction',
    trend: 'positive',
    icon: ShieldCheck
  },
  {
    id: 'compliance-score',
    title: 'Compliance Score',
    value: '94%',
    change: 8,
    period: 'improvement',
    trend: 'positive',
    icon: CheckCircle
  }
];

export function BusinessImpactAnalyzer() {
  const [selectedView, setSelectedView] = useState<'roi' | 'metrics'>('roi');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'realized': 'bg-green-100 text-green-800',
      'projected': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  }

  const getTrendIcon = (_trend: string) => {
    if (trend === 'positive') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'negative') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Target className="w-4 h-4 text-gray-500" />;
  }

  const totalROI = roiMetrics.reduce((sum, metric) => sum + (metric.roi * metric.investment / 100), 0);
  const totalInvestment = roiMetrics.reduce((sum, metric) => sum + metric.investment, 0);
  const averageROI = totalROI / totalInvestment * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Impact Analysis</h1>
          <p className="text-gray-600">ROI tracking and financial impact of risk management investments</p>
        </div>
        <div className="flex items-center space-x-2">
          <DaisyButton
            variant={selectedView === 'roi' ? 'primary' : 'outline'}
            size="sm"
            onClick={() =>
          setSelectedView('roi')} />
            ROI Analysis
          
        </DaisyButton>
          <DaisyButton
            variant={selectedView === 'metrics' ? 'primary' : 'outline'}
            size="sm"
            onClick={() =>
          setSelectedView('metrics')} />
            Key Metrics
          
        </DaisyButton>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {businessMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <DaisyCard key={metric.id} className="bg-white border-gray-200" >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                    <span className={`text-sm font-medium ${
                      metric.trend === 'positive' ? 'text-green-600' : 
                      metric.trend === 'negative' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{metric.period}</p>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          );
        })}
      </div>

      {/* ROI Analysis View */}
      {selectedView === 'roi' && (
        <div className="space-y-6">
          {/* ROI Summary */}
          <DaisyCard className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200" >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle className="flex items-center space-x-3" >
  <div className="p-2 bg-green-600 rounded-lg">
</DaisyCardTitle>
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">ROI Summary</span>
                  <p className="text-sm text-gray-600 font-normal">Total return on risk management investments</p>
                </div>
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="grid grid-cols-1 md:grid-cols-3 gap-6" >
  <div className="text-center">
</DaisyCardBody>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalInvestment)}</div>
                <div className="text-sm text-gray-600">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalROI)}</div>
                <div className="text-sm text-gray-600">Total Returns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{Math.round(averageROI)}%</div>
                <div className="text-sm text-gray-600">Average ROI</div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* ROI Breakdown */}
          <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
              <DaisyCardTitle>ROI Breakdown by Initiative</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-4" >
  {roiMetrics.map((metric) => (
</DaisyCardBody>
                <div key={metric.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{metric.category}</h4>
                        <DaisyBadge className={getStatusColor(metric.status)} >
  {metric.status}
</DaisyBadge>
                        </DaisyBadge>
                      </div>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{metric.roi}%</div>
                      <div className="text-sm text-gray-500">ROI</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Investment</div>
                      <div className="font-semibold">{formatCurrency(metric.investment)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Savings</div>
                      <div className="font-semibold text-green-600">{formatCurrency(metric.savings)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Timeframe</div>
                      <div className="font-semibold">{metric.timeframe}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <DaisyProgress value={(metric.savings / (metric.savings + metric.investment)) * 100} className="h-2" />
</div>
                </div>
              ))}
            </DaisyProgress>
          </DaisyCard>
        </div>
      )}

      {/* Key Metrics View */}
      {selectedView === 'metrics' && (
        <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
            <DaisyCardTitle>Financial Impact Dashboard</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
</DaisyCardBody>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Cost Efficiency Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Automation Savings</span>
                    <span className="font-semibold">{formatCurrency(890000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Process Optimization</span>
                    <span className="font-semibold">{formatCurrency(340000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Reduction</span>
                    <span className="font-semibold">{formatCurrency(470000)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Performance Indicators</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Incident Response Time</span>
                    <span className="font-semibold text-green-600">-67%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manual Process Reduction</span>
                    <span className="font-semibold text-green-600">-45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliance Efficiency</span>
                    <span className="font-semibold text-green-600">+52%</span>
                  </div>
                </div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
} 
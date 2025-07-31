'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Building,
  Shield,
  CheckCircle,
  AlertTriangle,
  Target,
  Users,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Zap,
  Brain,
  FileText,
  PieChart,
  LineChart,
  BarChart,
  Activity,
  Layers,
  Grid,
  List,
  Table,
  Maximize,
  Minimize
} from 'lucide-react';

// Comparison data types
interface ComparisonMetric {
  id: string;
  name: string;
  category: 'risk' | 'compliance' | 'control' | 'incident' | 'financial';
  current: number;
  previous: number;
  target?: number;
  unit: string;
  format: 'number' | 'percentage' | 'currency' | 'score';
  trend: 'up' | 'down' | 'stable';
  change: number;
  changeType: 'absolute' | 'percentage';
  significance: 'high' | 'medium' | 'low';
}

interface ComparisonPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'quarter' | 'month' | 'year' | 'custom';
}

interface ComparisonDimension {
  id: string;
  name: string;
  type: 'time' | 'department' | 'framework' | 'geography' | 'product';
  values: string[];
}

interface ComparisonConfig {
  metrics: string[];
  dimensions: string[];
  periods: string[];
  visualization: 'table' | 'chart' | 'heatmap' | 'dashboard';
  groupBy?: string;
  filters?: Record<string, any>;
}

// Sample data
const SAMPLE_METRICS: ComparisonMetric[] = [
  {
    id: 'total-risks',
    name: 'Total Risks',
    category: 'risk',
    current: 47,
    previous: 42,
    target: 40,
    unit: 'risks',
    format: 'number',
    trend: 'up',
    change: 5,
    changeType: 'absolute',
    significance: 'medium'
  },
  {
    id: 'high-risks',
    name: 'High Risk Items',
    category: 'risk',
    current: 8,
    previous: 12,
    target: 5,
    unit: 'risks',
    format: 'number',
    trend: 'down',
    change: -4,
    changeType: 'absolute',
    significance: 'high'
  },
  {
    id: 'compliance-score',
    name: 'Overall Compliance Score',
    category: 'compliance',
    current: 94,
    previous: 89,
    target: 95,
    unit: '%',
    format: 'percentage',
    trend: 'up',
    change: 5,
    changeType: 'absolute',
    significance: 'high'
  },
  {
    id: 'control-effectiveness',
    name: 'Control Effectiveness',
    category: 'control',
    current: 87,
    previous: 85,
    target: 90,
    unit: '%',
    format: 'percentage',
    trend: 'up',
    change: 2,
    changeType: 'absolute',
    significance: 'medium'
  },
  {
    id: 'incident-count',
    name: 'Security Incidents',
    category: 'incident',
    current: 3,
    previous: 7,
    target: 2,
    unit: 'incidents',
    format: 'number',
    trend: 'down',
    change: -4,
    changeType: 'absolute',
    significance: 'high'
  },
  {
    id: 'risk-mitigation-cost',
    name: 'Risk Mitigation Cost',
    category: 'financial',
    current: 125000,
    previous: 98000,
    target: 100000,
    unit: '$',
    format: 'currency',
    trend: 'up',
    change: 27000,
    changeType: 'absolute',
    significance: 'medium'
  }
];

const COMPARISON_PERIODS: ComparisonPeriod[] = [
  {
    id: 'q1-2024',
    name: 'Q1 2024',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    type: 'quarter'
  },
  {
    id: 'q4-2023',
    name: 'Q4 2023',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-12-31'),
    type: 'quarter'
  },
  {
    id: 'q3-2023',
    name: 'Q3 2023',
    startDate: new Date('2023-07-01'),
    endDate: new Date('2023-09-30'),
    type: 'quarter'
  }
];

const COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    id: 'department',
    name: 'Department',
    type: 'department',
    values: ['IT', 'Finance', 'Operations', 'HR', 'Legal']
  },
  {
    id: 'framework',
    name: 'Compliance Framework',
    type: 'framework',
    values: ['SOX', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS']
  },
  {
    id: 'geography',
    name: 'Geography',
    type: 'geography',
    values: ['North America', 'Europe', 'Asia Pacific', 'Latin America']
  },
  {
    id: 'risk-category',
    name: 'Risk Category',
    type: 'product',
    values: ['Cybersecurity', 'Operational', 'Financial', 'Regulatory', 'Strategic']
  }
];

// Main comparative analysis component
interface ComparativeAnalysisProps {
  onExport?: (data: any, format: string) => void;
  onSave?: (config: ComparisonConfig) => void;
  className?: string;
}

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  onExport,
  onSave,
  className = ''
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['total-risks', 'compliance-score', 'high-risks']);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['q1-2024', 'q4-2023']);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['department']);
  const [visualizationType, setVisualizationType] = useState<'table' | 'chart' | 'heatmap' | 'dashboard'>('table');
  const [comparisonMode, setComparisonMode] = useState<'period' | 'dimension' | 'target'>('period');
  const [showPercentageChange, setShowPercentageChange] = useState(true);
  const [highlightSignificant, setHighlightSignificant] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Generate comparison data
  const comparisonData = useMemo(() => {
    return SAMPLE_METRICS.filter(metric => selectedMetrics.includes(metric.id));
  }, [selectedMetrics]);

  // Format value based on metric format
  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value}${unit}`;
      case 'number':
        return `${value.toLocaleString()} ${unit}`;
      case 'score':
        return `${value}/100`;
      default:
        return `${value} ${unit}`;
    }
  };

  // Get trend icon and color
  const getTrendIndicator = (trend: string, change: number, significance: string) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    let icon;
    let colorClass;
    
    if (isPositive) {
      icon = <ArrowUp className="w-4 h-4" />;
      colorClass = trend === 'up' ? 'text-green-600' : 'text-red-600';
    } else if (isNegative) {
      icon = <ArrowDown className="w-4 h-4" />;
      colorClass = trend === 'down' ? 'text-green-600' : 'text-red-600';
    } else {
      icon = <Minus className="w-4 h-4" />;
      colorClass = 'text-gray-500';
    };

  return (
      <div className={`flex items-center space-x-1 ${colorClass}`}>
        {icon}
        <span className="text-sm font-medium">
          {Math.abs(change)}
          {showPercentageChange && change !== 0 && (
            <span className="text-xs ml-1">
              ({((Math.abs(change) / (Math.abs(change) + Math.abs(change))) * 100).toFixed(1)}%)
            </span>
          )}
        </span>
        {significance === 'high' && highlightSignificant && (
          <DaisyBadge variant="error" className="text-xs">!</DaisyBadge>
        )}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">Metric</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Current</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Previous</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Change</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Target</th>
            <th className="text-right py-3 px-4 font-medium text-gray-900">Progress</th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((metric) => (
            <tr key={metric.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900">{metric.name}</div>
                  <DaisyBadge variant="outline" className="text-xs mt-1 capitalize">
                    {metric.category}
                  </DaisyBadge>
                </div>
              </td>
              <td className="text-right py-3 px-4 font-medium">
                {formatValue(metric.current, metric.format, metric.unit)}
              </td>
              <td className="text-right py-3 px-4 text-gray-600">
                {formatValue(metric.previous, metric.format, metric.unit)}
              </td>
              <td className="text-right py-3 px-4">
                {getTrendIndicator(metric.trend, metric.change, metric.significance)}
              </td>
              <td className="text-right py-3 px-4 text-gray-600">
                {metric.target ? formatValue(metric.target, metric.format, metric.unit) : '-'}
              </td>
              <td className="text-right py-3 px-4">
                {metric.target && (
                  <div className="flex items-center justify-end space-x-2">
                    <DaisyProgress 
                      value={(metric.current / metric.target) * 100} 
                      className="w-16 h-2" 
                    />
                    <span className="text-xs text-gray-500">
                      {Math.round((metric.current / metric.target) * 100)}%
                    </span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render chart view
  const renderChartView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {comparisonData.map((metric) => (
        <DaisyCard key={metric.id}>
          <DaisyCardHeader className="pb-2">
            <DaisyCardTitle className="text-sm">{metric.name}</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {formatValue(metric.current, metric.format, metric.unit)}
                  </div>
                  <div className="text-sm text-gray-500">Current</div>
                </div>
                <div className="text-right">
                  {getTrendIndicator(metric.trend, metric.change, metric.significance)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Previous</span>
                  <span>{formatValue(metric.previous, metric.format, metric.unit)}</span>
                </div>
                {metric.target && (
                  <div className="flex justify-between text-sm">
                    <span>Target</span>
                    <span>{formatValue(metric.target, metric.format, metric.unit)}</span>
                  </div>
                )}
              </div>

              {metric.target && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress to Target</span>
                    <span>{Math.round((metric.current / metric.target) * 100)}%</span>
                  </div>
                  <DaisyProgress value={(metric.current / metric.target) * 100} className="h-2" />
                </div>
              )}
            </div>
          </DaisyCardContent>
        </DaisyCard>
      ))}
    </div>
  );

  // Render heatmap view
  const renderHeatmapView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2 text-xs">
        <div></div>
        {selectedPeriods.map(periodId => {
          const period = COMPARISON_PERIODS.find(p => p.id === periodId);
          return (
            <div key={periodId} className="text-center font-medium">
              {period?.name}
            </div>
          );
        })}
      </div>
      
      {comparisonData.map((metric) => (
        <div key={metric.id} className="grid grid-cols-6 gap-2 items-center">
          <div className="text-sm font-medium">{metric.name}</div>
          {selectedPeriods.map(periodId => {
            const intensity = Math.random(); // In real app, calculate based on actual data
            const bgColor = intensity > 0.7 ? 'bg-red-200' : 
                           intensity > 0.4 ? 'bg-yellow-200' : 'bg-green-200';
            return (
              <div
                key={`${metric.id}-${periodId}`}
                className={`h-12 rounded flex items-center justify-center text-xs font-medium ${bgColor}`}
              >
                {formatValue(metric.current, metric.format, metric.unit)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // Render dashboard view
  const renderDashboardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Summary cards */}
      <div className="lg:col-span-2 space-y-4">
        {renderChartView()}
      </div>
      
      {/* Key insights */}
      <div className="space-y-4">
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-sm flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Key Insights
            </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-green-900">
                    Compliance Improved
                  </div>
                  <div className="text-xs text-green-700">
                    Overall compliance score increased by 5% this quarter
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <TrendingDown className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Risk Reduction
                  </div>
                  <div className="text-xs text-blue-700">
                    High-risk items decreased by 33% compared to last quarter
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <DaisyAlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-orange-900">
                    Cost Increase
                  </div>
                  <div className="text-xs text-orange-700">
                    Risk mitigation costs up 28% - review budget allocation
                  </div>
                </div>
              </div>
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-sm flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Target Progress
            </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-3">
            {comparisonData.filter(m => m.target).map(metric => (
              <div key={metric.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{metric.name}</span>
                  <span>{Math.round((metric.current / metric.target!) * 100)}%</span>
                </div>
                <DaisyProgress value={(metric.current / metric.target!) * 100} className="h-2" />
              </div>
            ))}
          </DaisyCardContent>
        </DaisyCard>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Panel */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Comparative Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <DaisyButton variant="outline" size="sm" onClick={() => onSave?.({
                metrics: selectedMetrics,
                dimensions: selectedDimensions,
                periods: selectedPeriods,
                visualization: visualizationType
              })}>
                <Settings className="w-4 h-4 mr-2" />
                Save Config
              </DaisyButton>
              <DaisyButton variant="outline" size="sm" onClick={() => onExport?.(comparisonData, 'excel')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </DaisyButton>
            </div>
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metrics Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Metrics to Compare
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {SAMPLE_METRICS.map(metric => (
                  <label key={metric.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetrics([...selectedMetrics, metric.id]);
                        } else {
                          setSelectedMetrics(selectedMetrics.filter(id => id !== metric.id));
                        }
                      }}
                    />
                    <span>{metric.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Periods Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time Periods
              </label>
              <div className="space-y-2">
                {COMPARISON_PERIODS.map(period => (
                  <label key={period.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.includes(period.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeriods([...selectedPeriods, period.id]);
                        } else {
                          setSelectedPeriods(selectedPeriods.filter(id => id !== period.id));
                        }
                      }}
                    />
                    <span>{period.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dimensions Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Comparison Dimensions
              </label>
              <div className="space-y-2">
                {COMPARISON_DIMENSIONS.map(dimension => (
                  <label key={dimension.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDimensions.includes(dimension.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDimensions([...selectedDimensions, dimension.id]);
                        } else {
                          setSelectedDimensions(selectedDimensions.filter(id => id !== dimension.id));
                        }
                      }}
                    />
                    <span>{dimension.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visualization Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Visualization
              </label>
              <div className="space-y-2">
                {[
                  { id: 'table', name: 'Table View', icon: Table },
                  { id: 'chart', name: 'Chart View', icon: BarChart3 },
                  { id: 'heatmap', name: 'Heatmap', icon: Grid },
                  { id: 'dashboard', name: 'Dashboard', icon: Layers }
                ].map(option => {
                  const Icon = option.icon;
                  return (
                    <label key={option.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="visualization"
                        value={option.id}
                        checked={visualizationType === option.id}
                        onChange={(e) => setVisualizationType(e.target.value as any)}
                      />
                      <Icon className="w-4 h-4" />
                      <span>{option.name}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showPercentageChange}
                    onChange={(e) => setShowPercentageChange(e.target.checked)}
                  />
                  <span>Show % change</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={highlightSignificant}
                    onChange={(e) => setHighlightSignificant(e.target.checked)}
                  />
                  <span>Highlight significant changes</span>
                </label>
              </div>
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {/* Analysis Results */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center justify-between">
            <span>Analysis Results</span>
            <div className="flex items-center space-x-2">
              <DaisyBadge variant="secondary" className="text-xs">
                {comparisonData.length} metrics
              </DaisyBadge>
              <DaisyButton variant="ghost" size="sm" onClick={() => setIsLoading(true)}>
                <RefreshCw className="w-4 h-4" />
              </DaisyButton>
            </div>
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Analyzing data...</p>
              </div>
            </div>
          ) : (
            <>
              {visualizationType === 'table' && renderTableView()}
              {visualizationType === 'chart' && renderChartView()}
              {visualizationType === 'heatmap' && renderHeatmapView()}
              {visualizationType === 'dashboard' && renderDashboardView()}
            </>
          )}
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
};

export default ComparativeAnalysis; 
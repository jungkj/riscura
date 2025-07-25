import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  Settings,
  Maximize,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
  Scatter
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  dashboardIntelligenceService,
  type PredictiveAnalytics,
  type DashboardConfig
} from '@/services/DashboardIntelligenceService';

interface PredictiveAnalyticsChartProps {
  metric: string;
  title: string;
  data?: number[];
  timeRange?: { start: Date; end: Date };
  className?: string;
  showConfidenceInterval?: boolean;
  showFactors?: boolean;
  interactive?: boolean;
}

interface ChartDataPoint {
  date: string;
  timestamp: Date;
  actual?: number;
  predicted?: number;
  upperBound?: number;
  lowerBound?: number;
  confidence?: number;
  anomaly?: boolean;
}

interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  confidence: number;
}

export const PredictiveAnalyticsChart: React.FC<PredictiveAnalyticsChartProps> = ({
  metric,
  title,
  data = [],
  timeRange,
  className,
  showConfidenceInterval = true,
  showFactors = true,
  interactive = true
}) => {
  const [prediction, setPrediction] = useState<PredictiveAnalytics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Generate predictions
  useEffect(() => {
    const generatePrediction = async () => {
      if (data.length < 10) {
        // Generate mock data if insufficient real data
        const mockData = Array.from({ length: 30 }, (_, i) => {
          const base = metric.includes('compliance') ? 85 : 10;
          const variance = base * 0.1;
          const trend = Math.sin(i / 7) * 2;
          return base + trend + (Math.random() - 0.5) * variance;
        });
        data = mockData;
      }

      setLoading(true);
      try {
        const config: DashboardConfig = {
          userId: 'demo-user',
          organizationId: 'demo-org',
          preferences: {
            insightTypes: ['trend_prediction'],
            refreshRate: 30000,
            notificationLevel: 'standard',
            showPredictions: true,
            enableInteractiveHelp: true
          },
          context: {
            currentView: 'analytics',
            activeFilters: {},
            timeRange: timeRange || {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date()
            },
            selectedEntities: []
          }
        };

        const metrics = { [metric]: data };
        const predictions = await dashboardIntelligenceService.generatePredictiveAnalytics(
          metrics,
          config
        );

        if (predictions.length > 0) {
          setPrediction(predictions[0]);
          prepareChartData(predictions[0]);
        } else {
          // Fallback to generated prediction
          generateFallbackPrediction();
        }
      } catch (error) {
        console.error('Error generating prediction:', error);
        generateFallbackPrediction();
      } finally {
        setLoading(false);
      }
    };

    generatePrediction();
  }, [metric, data, timeRange]);

  const generateFallbackPrediction = () => {
    const now = new Date();
    const mockPrediction: PredictiveAnalytics = {
      id: 'mock-prediction',
      metric,
      currentValue: data[data.length - 1] || 10,
      predictedValue: (data[data.length - 1] || 10) * 1.1,
      predictionHorizon: getHorizonFromTimeframe(selectedTimeframe),
      confidence: 0.78,
      factors: [
        {
          name: 'Historical Trend',
          impact: 0.6,
          direction: 'positive',
          confidence: 0.8
        },
        {
          name: 'Seasonal Pattern',
          impact: 0.3,
          direction: 'negative',
          confidence: 0.7
        },
        {
          name: 'External Factors',
          impact: 0.1,
          direction: 'positive',
          confidence: 0.5
        }
      ],
      trend: 'increasing',
      riskLevel: 'medium',
      recommendations: [
        'Monitor trend closely for next 7 days',
        'Consider implementing preventive measures',
        'Review historical patterns for insights'
      ],
      chartData: []
    };

    setPrediction(mockPrediction);
    prepareChartDataFromMock(mockPrediction);
  };

  const prepareChartData = (prediction: PredictiveAnalytics) => {
    const chartPoints: ChartDataPoint[] = prediction.chartData.map(point => ({
      date: point.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: point.timestamp,
      actual: point.actual,
      predicted: point.predicted,
      upperBound: point.upperBound,
      lowerBound: point.lowerBound,
      confidence: point.confidence,
      anomaly: Math.random() > 0.9 // Simulate anomalies
    }));

    setChartData(chartPoints);
  };

  const prepareChartDataFromMock = (prediction: PredictiveAnalytics) => {
    const chartPoints: ChartDataPoint[] = [];
    const now = new Date();
    const horizon = parseInt(selectedTimeframe);
    
    // Historical data (last 30 days)
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseValue = prediction.currentValue;
      const variance = baseValue * 0.1;
      const trend = Math.sin(i / 7) * (variance / 2);
      const value = baseValue + trend + (Math.random() - 0.5) * variance;
      
      chartPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date,
        actual: i === 0 ? prediction.currentValue : value,
        anomaly: Math.random() > 0.95
      });
    }
    
    // Future predictions
    for (let i = 1; i <= horizon; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const progressFactor = i / horizon;
      const predictedValue = prediction.currentValue + 
        (prediction.predictedValue - prediction.currentValue) * progressFactor;
      const confidenceInterval = Math.abs(predictedValue * 0.1);
      
      chartPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date,
        predicted: predictedValue,
        upperBound: predictedValue + confidenceInterval,
        lowerBound: predictedValue - confidenceInterval,
        confidence: prediction.confidence,
        anomaly: false
      });
    }
    
    setChartData(chartPoints);
  };

  const getHorizonFromTimeframe = (timeframe: string): string => {
    switch (timeframe) {
      case '7d': return '7 days';
      case '14d': return '14 days';
      case '30d': return '30 days';
      default: return '7 days';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'volatile': return <Activity className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: number; color: string; dataKey: string; }>; 
    label?: string; 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(2)}
              {entry.dataKey === 'confidence' && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    const dataToExport = {
      metric,
      prediction,
      chartData,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric}-prediction-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DaisyCard className={cn("w-full", className)}>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600 animate-pulse" />
            {title}
          </DaisyCardTitle>
        
        <DaisyCardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Generating predictions...</p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  const cardClass = cn(
    "w-full transition-all duration-300",
    fullscreen && "fixed inset-0 z-50 rounded-none",
    className
  );

  return (
    <DaisyCard className={cardClass}>
      <DaisyCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            {title}
            {prediction && getTrendIcon(prediction.trend)}
          </DaisyCardTitle>
          
          {interactive && (
            <div className="flex items-center gap-2">
              <DaisyButton variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </DaisyButton>
              <DaisyButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setFullscreen(!fullscreen)}
              >
                <Maximize className="h-4 w-4" />
              </DaisyButton>
            </div>
          )}
        </div>
        
        {prediction && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current:</span>
              <span className="font-semibold">{prediction.currentValue.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Predicted:</span>
              <span className="font-semibold">{prediction.predictedValue.toFixed(1)}</span>
            </div>
            <DaisyBadge className={cn("text-xs", getRiskLevelColor(prediction.riskLevel))}>
              {prediction.riskLevel} risk
            </DaisyBadge>
            <DaisyBadge variant="outline" className="text-xs">
              {(prediction.confidence * 100).toFixed(0)}% confidence
            </DaisyBadge>
          </div>
        )}
      

      <DaisyCardContent className="space-y-4">
        <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <DaisyTabsList className="grid grid-cols-3 w-auto">
              <DaisyTabsTrigger value="forecast" className="text-xs">
                Forecast
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="factors" className="text-xs">
                Factors
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="confidence" className="text-xs">
                Confidence
              </DaisyTabsTrigger>
            </DaisyTabsList>
            
            {interactive && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="7d">7 days</option>
                  <option value="14d">14 days</option>
                  <option value="30d">30 days</option>
                </select>
                
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={showAnomalies}
                    onChange={(e) => setShowAnomalies(e.target.checked)}
                    className="w-3 h-3"
                  />
                  Anomalies
                </label>
              </div>
            )}
          </div>

          {/* Forecast Tab */}
          <DaisyTabsContent value="forecast" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <DaisyTooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Confidence interval */}
                  {showConfidenceInterval && (
                    <Area 
                      type="monotone" 
                      dataKey="upperBound" 
                      stroke="none"
                      fill="#e0e7ff"
                      fillOpacity={0.3}
                      name="Confidence Interval"
                    />
                  )}
                  
                  {showConfidenceInterval && (
                    <Area 
                      type="monotone" 
                      dataKey="lowerBound" 
                      stroke="none"
                      fill="#ffffff"
                      fillOpacity={1}
                    />
                  )}
                  
                  {/* Actual data */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                    name="Actual"
                    connectNulls={false}
                  />
                  
                  {/* Predicted data */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    name="Predicted"
                    connectNulls={false}
                  />
                  
                  {/* Anomalies */}
                  {showAnomalies && (
                    <Scatter
                      dataKey="anomaly"
                      fill="#f59e0b"
                      shape="star"
                      name="Anomalies"
                    />
                  )}
                  
                  {/* Reference line for current value */}
                  {prediction && (
                    <ReferenceLine 
                      y={prediction.currentValue} 
                      stroke="#64748b" 
                      strokeDasharray="2 2"
                      label="Current"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </DaisyTabsContent>

          {/* Factors Tab */}
          <DaisyTabsContent value="factors" className="mt-4">
            {prediction && showFactors && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Prediction Factors</h4>
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{factor.name}</span>
                        <DaisyBadge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            factor.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {factor.direction === 'positive' ? '+' : '-'}{(factor.impact * 100).toFixed(0)}%
                        </DaisyBadge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full",
                            factor.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                          )}
                          style={{ width: `${factor.impact * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-gray-500">Confidence</div>
                      <div className="font-medium text-sm">{(factor.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DaisyTabsContent>

          {/* Confidence Tab */}
          <DaisyTabsContent value="confidence" className="mt-4">
            <div className="space-y-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.filter(d => d.confidence)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                      label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
                    />
                    <DaisyTooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      name="Confidence"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {prediction && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Overall Confidence</div>
                    <div className="text-2xl font-bold">{(prediction.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Prediction Horizon</div>
                    <div className="text-2xl font-bold">{prediction.predictionHorizon}</div>
                  </div>
                </div>
              )}
            </div>
          </DaisyTabsContent>
        </DaisyTabs>

        {/* Recommendations */}
        {prediction && prediction.recommendations.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {prediction.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
}; 
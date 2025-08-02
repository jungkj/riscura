import React, { useState, useEffect, useCallback } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Eye, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Activity,
  ArrowRight,
  Sparkles,
  Bot,
  LineChart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { 
  dashboardIntelligenceService,
  type DashboardInsight,
  type PredictiveAnalytics,
  type SmartRecommendation,
  type InteractiveAssistance,
  type DashboardConfig,
  type RealTimeUpdate
} from '@/services/DashboardIntelligenceService';
import type { Risk, Control } from '@/types';

interface AIInsightsWidgetProps {
  userId: string;
  risks?: Risk[];
  controls?: Control[];
  className?: string;
  showPredictions?: boolean;
  showRecommendations?: boolean;
  maxInsights?: number;
  refreshInterval?: number;
}

interface MetricData {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  prediction?: number;
  confidence?: number;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
  userId,
  risks = [],
  controls = [],
  className,
  showPredictions = true,
  showRecommendations = true,
  maxInsights = 8,
  refreshInterval = 30000
}) => {
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalytics[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [assistance, setAssistance] = useState<InteractiveAssistance | null>(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Dashboard configuration
  const config: DashboardConfig = {
    userId,
    organizationId: 'org-001',
    preferences: {
      insightTypes: ['critical_alert', 'trend_prediction', 'optimization', 'compliance_warning'],
      refreshRate: refreshInterval,
      notificationLevel: 'standard',
      showPredictions,
      enableInteractiveHelp: true
    },
    context: {
      currentView: 'dashboard',
      activeFilters: {},
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      },
      selectedEntities: []
    }
  };

  // Fetch AI insights
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate insights
      const aiInsights = await dashboardIntelligenceService.generateDashboardInsights(
        config,
        risks,
        controls
      );
      
      setInsights(aiInsights.slice(0, maxInsights));

      // Generate predictions if enabled
      if (showPredictions) {
        const mockMetrics = generateMockMetrics();
        const aiPredictions = await dashboardIntelligenceService.generatePredictiveAnalytics(
          mockMetrics,
          config
        );
        setPredictions(aiPredictions);
      }

      // Generate recommendations if enabled
      if (showRecommendations) {
        const aiRecommendations = await dashboardIntelligenceService.generateSmartRecommendations(
          config,
          aiInsights
        );
        setRecommendations(aiRecommendations);
      }

      // Update metrics
      updateMetrics();
      setLastUpdate(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights');
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  }, [config, risks, controls, maxInsights, showPredictions, showRecommendations]);

  // Start real-time updates
  const startRealTimeUpdates = useCallback(() => {
    dashboardIntelligenceService.startRealTimeUpdates(config, (update: RealTimeUpdate) => {
      if (update.type === 'metric') {
        updateMetrics();
      } else if (update.type === 'insight') {
        fetchInsights();
      }
    });
    setRealtimeEnabled(true);
  }, [config, fetchInsights]);

  // Stop real-time updates
  const stopRealTimeUpdates = useCallback(() => {
    dashboardIntelligenceService.stopRealTimeUpdates();
    setRealtimeEnabled(false);
  }, []);

  // Get interactive assistance
  const getAssistance = useCallback(async (elementType: string, elementData: Record<string, unknown>) => {
    try {
      const assistanceData = await dashboardIntelligenceService.getInteractiveAssistance(
        elementType,
        elementData
      );
      setAssistance(assistanceData);
    } catch (err) {
      console.error('Error getting assistance:', err);
    }
  }, []);

  // Update metrics with simulated data
  const updateMetrics = () => {
    const mockMetrics: MetricData[] = [
      {
        name: 'Risk Score',
        value: 8.7,
        change: 12.3,
        trend: 'up',
        prediction: 9.2,
        confidence: 0.85
      },
      {
        name: 'Compliance',
        value: 94.2,
        change: -2.1,
        trend: 'down',
        prediction: 92.8,
        confidence: 0.78
      },
      {
        name: 'Incidents',
        value: 3,
        change: -15.8,
        trend: 'down',
        prediction: 2,
        confidence: 0.72
      },
      {
        name: 'Controls Active',
        value: 89,
        change: 5.4,
        trend: 'up',
        prediction: 92,
        confidence: 0.81
      }
    ];
    setMetrics(mockMetrics);
  };

  // Generate mock metrics for predictions
  const generateMockMetrics = () => {
    const metrics: Record<string, number[]> = {};
    
    // Generate 30 days of mock data for each metric
    ['riskScore', 'complianceScore', 'incidentCount', 'controlsActive'].forEach(metric => {
      metrics[metric] = Array.from({ length: 30 }, (_, i) => {
        const base = metric === 'complianceScore' ? 90 : 10;
        const variance = base * 0.1;
        return base + (Math.random() - 0.5) * variance;
      });
    });
    
    return metrics;
  };

  // Toggle insight expansion
  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  // Auto-refresh insights
  useEffect(() => {
    fetchInsights();
    
    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchInsights, refreshInterval]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'critical': return <DaisyAlertTriangle className="h-4 w-4" >
  ;
</DaisyAlertTriangle>
      case 'high': return <DaisyAlertCircle className="h-4 w-4" >
  ;
</DaisyAlertCircle>
      case 'medium': return <Eye className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const preparePredictionChartData = (prediction: PredictiveAnalytics) => {
    return prediction.chartData.map(point => ({
      date: point.timestamp.toLocaleDateString(),
      actual: point.actual,
      predicted: point.predicted,
      upperBound: point.upperBound,
      lowerBound: point.lowerBound
    }));
  };

  if (loading && insights.length === 0) {
    return (
      <DaisyCard className={cn("w-full", className)} >
  <DaisyCardBody />
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="h-5 w-5 text-indigo-600 animate-pulse" />
</DaisyCardTitle>
            AI Intelligence Loading...
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  };

  return (
    <DaisyCard className={cn("w-full", className)} >
  <DaisyCardBody className="pb-3" />
</DaisyCard>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="flex items-center gap-2" >
  <Brain className="h-5 w-5 text-indigo-600" />
</DaisyCardTitle>
            AI Intelligence Hub
            <DaisyBadge variant="outline" className="ml-2" >
  <Sparkles className="h-3 w-3 mr-1" />
</DaisyBadge>
              Live
            </DaisyBadge>
          </DaisyCardTitle>
          <div className="flex items-center gap-2">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={realtimeEnabled ? stopRealTimeUpdates : startRealTimeUpdates} >
  {realtimeEnabled ? (
</DaisyButton>
                <>
                  <Activity className="h-4 w-4 mr-1 text-green-500" />
                  Live
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-1 text-gray-400" />
                  Start Live
                </>
              )}
            </DaisyButton>
            <DaisyButton variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} >
  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
</DaisyButton>
            </DaisyButton>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      

      <DaisyCardBody className="space-y-4" >
  <DaisyTabs value={activeTab} onValueChange={setActiveTab} />
</DaisyCardBody>
          <DaisyTabsList className="grid w-full grid-cols-4" />
            <DaisyTabsTrigger value="insights" className="text-xs" />
              Insights ({insights.length})
            </DaisyTabsList>
            <DaisyTabsTrigger value="predictions" className="text-xs" />
              Predictions
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="recommendations" className="text-xs" />
              Recommendations
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="metrics" className="text-xs" />
              Live Metrics
            </DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Insights Tab */}
          <DaisyTabsContent value="insights" className="space-y-3 mt-4" />
            {error && (
              <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            
            {insights.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer",
                      getImpactColor(insight.impact)
                    )}
                    onClick={() => toggleInsightExpansion(insight.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getImpactIcon(insight.impact)}
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <DaisyBadge variant="outline" className="text-xs" >
  {(insight.confidence * 100).toFixed(0)}%
</DaisyTabsContent>
                          </DaisyBadge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                        
                        {expandedInsights.has(insight.id) && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                            {insight.recommendations.length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium mb-1">Recommendations:</h5>
                                <ul className="text-xs space-y-1">
                                  {insight.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 pt-2">
                              <DaisyButton size="sm" variant="outline" className="text-xs" >
  <Eye className="h-3 w-3 mr-1" />
</DaisyButton>
                                Investigate
                              </DaisyButton>
                              <DaisyButton 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  getAssistance('insight', { insight });
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Ask AI
                              </DaisyButton>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <DaisyBadge variant="secondary" className="text-xs" >
  {insight.source.replace('_', ' ')}
</DaisyBadge>
                        </DaisyBadge>
                        {expandedInsights.has(insight.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No insights available yet.</p>
                <p className="text-xs">AI is analyzing your data...</p>
              </div>
            )}
          </DaisyTabsContent>

          {/* Predictions Tab */}
          <DaisyTabsContent value="predictions" className="space-y-3 mt-4" />
            {predictions.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">{prediction.metric}</h4>
                      <DaisyBadge variant="outline" className="text-xs" >
  {(prediction.confidence * 100).toFixed(0)}% confidence
</DaisyTabsContent>
                      </DaisyBadge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Current</p>
                        <p className="font-semibold">{prediction.currentValue.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Predicted ({prediction.predictionHorizon})</p>
                        <p className="font-semibold">{prediction.predictedValue.toFixed(1)}</p>
                      </div>
                    </div>
                    
                    <div className="h-32 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={preparePredictionChartData(prediction)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <DaisyTooltip />
                          <Area 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#8884d8" 
                            fill="#8884d8" 
                            fillOpacity={0.3}
                            name="Actual"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="predicted" 
                            stroke="#ff7c7c" 
                            fill="#ff7c7c" 
                            fillOpacity={0.3}
                            strokeDasharray="5 5"
                            name="Predicted"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <DaisyBadge className={cn(
                      "text-xs",
                      prediction.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    )} >
  {prediction.riskLevel} risk
</DaisyTooltip>
                    </DaisyBadge>
                  </div>
                ))}
              </div>
            ) : showPredictions ? (
              <div className="text-center py-8 text-gray-500">
                <LineChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Generating predictions...</p>
                <p className="text-xs">AI is analyzing trends</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Predictions disabled</p>
              </div>
            )}
          </DaisyTabsContent>

          {/* Recommendations Tab */}
          <DaisyTabsContent value="recommendations" className="space-y-3 mt-4" />
            {recommendations.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <div className="flex items-center gap-1">
                        <DaisyBadge variant="outline" className="text-xs">{rec.effort} effort</DaisyTabsContent>
                        <DaisyBadge variant="secondary" className="text-xs">P{rec.priority}</DaisyBadge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <span className="ml-1">{rec.timeline}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1">{rec.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <DaisyButton size="sm" variant="outline" className="text-xs" >
  <CheckCircle className="h-3 w-3 mr-1" />
</DaisyButton>
                        Accept
                      </DaisyButton>
                      <DaisyButton size="sm" variant="outline" className="text-xs" >
  <Lightbulb className="h-3 w-3 mr-1" />
</DaisyButton>
                        Learn More
                      </DaisyButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : showRecommendations ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Generating recommendations...</p>
                <p className="text-xs">AI is analyzing opportunities</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Recommendations disabled</p>
              </div>
            )}
          </DaisyTabsContent>

          {/* Live Metrics Tab */}
          <DaisyTabsContent value="metrics" className="space-y-3 mt-4" />
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium">{metric.name}</h4>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{metric.value}</span>
                      <span className={cn(
                        "text-xs",
                        metric.change > 0 ? "text-red-600" : metric.change < 0 ? "text-green-600" : "text-gray-600"
                      )}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                    
                    {metric.prediction && (
                      <div className="text-xs text-gray-500">
                        Predicted: {metric.prediction} ({(metric.confidence! * 100).toFixed(0)}%)
                      </div>
                    )}
                    
                    {metric.confidence && (
                      <DaisyProgress value={metric.confidence * 100} className="h-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DaisyTabsContent>
        </DaisyTabs>

        {/* Interactive Assistance Modal/Panel */}
        {assistance && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                AI Assistant
              </h4>
              <DaisyButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setAssistance(null)} />
                ×
              </DaisyButton>
            </div>
            
            {assistance.suggestions.length > 0 && (
              <div className="space-y-1">
                {assistance.suggestions.slice(0, 3).map((suggestion) => (
                  <p key={suggestion.id} className="text-xs text-blue-700">
                    • {suggestion.text}
                  </p>
                ))}
              </div>
            )}
            
            {assistance.quickActions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {assistance.quickActions.slice(0, 3).map((action) => (
                  <DaisyButton
                    key={action.id}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={!action.enabled} >
  {action.label}
</DaisyButton>
                  </DaisyButton>
                ))}
              </div>
            )}
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
}; 
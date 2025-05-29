import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  Eye, 
  Clock, 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Target,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  ProactiveInsight, 
  InsightPriority, 
  ActionItem,
  UserContext,
  DashboardContext 
} from '@/types/proactive-monitoring.types';
import { cn } from '@/lib/utils';
import { ProactiveMonitoringService } from '@/services/ProactiveMonitoringService';

// Mock interface for incomplete implementation
interface MockServiceDependency {
  // Placeholder for actual service implementation
  [key: string]: unknown;
}

interface AIInsightsWidgetProps {
  userId: string;
  context: DashboardContext;
  refreshInterval?: number;
  categories?: InsightCategory[];
  maxInsights?: number;
  showTrends?: boolean;
  className?: string;
}

interface InsightCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

interface TrendData {
  timestamp: Date;
  value: number;
  prediction?: number;
  confidence?: number;
}

const defaultCategories: InsightCategory[] = [
  {
    id: 'risk_alerts',
    name: 'Risk Alerts',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800',
    enabled: true
  },
  {
    id: 'compliance_gaps',
    name: 'Compliance Gaps',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800',
    enabled: true
  },
  {
    id: 'optimization_opportunities',
    name: 'Optimization',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
    enabled: true
  },
  {
    id: 'emerging_threats',
    name: 'Emerging Threats',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
    enabled: true
  },
  {
    id: 'process_improvements',
    name: 'Process Improvements',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
    enabled: true
  }
];

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
  userId,
  context,
  refreshInterval = 30000,
  categories = defaultCategories,
  maxInsights = 10,
  showTrends = true,
  className
}) => {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Fetch insights from proactive monitoring service
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const monitoringService = new ProactiveMonitoringService(
        // Dependencies would be injected here in real implementation
        {} as MockServiceDependency, 
        {} as MockServiceDependency, 
        {} as MockServiceDependency, 
        {} as MockServiceDependency, 
        {} as MockServiceDependency, 
        {} as MockServiceDependency, 
        {} as MockServiceDependency
      );

      const userContext: UserContext = {
        userId,
        organizationId: context.organizationId,
        role: context.userRole,
        permissions: context.permissions,
        preferences: context.preferences as any, // Mock preferences
        currentSession: {
          sessionId: 'mock-session',
          startTime: new Date(),
          lastActivity: new Date(),
          currentPage: context.currentView,
          deviceInfo: {
            type: 'desktop',
            os: 'unknown',
            browser: 'unknown',
            screen_resolution: 'unknown',
            network_type: 'unknown'
          },
          locationInfo: {
            timezone: 'UTC',
            country: 'unknown',
            region: 'unknown', 
            city: 'unknown',
            ip_address: 'unknown'
          }
        },
        workContext: {
          active_risks: [],
          recent_activities: [],
          pending_tasks: [],
          upcoming_deadlines: [],
          collaboration_sessions: []
        },
        historicalBehavior: []
      };

      const insights = await monitoringService.generateProactiveInsights(userContext);
      
      // Filter by category and limit
      const filteredInsights = selectedCategory === 'all' 
        ? insights 
        : insights.filter(insight => insight.type === selectedCategory);
      
      const limitedInsights = filteredInsights.slice(0, maxInsights);
      
      setInsights(limitedInsights);
      setLastUpdate(new Date());

      // Generate trend data for visualization
      if (showTrends) {
        const trends = generateTrendData(limitedInsights);
        setTrendData(trends);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch insights'));
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, context, selectedCategory, maxInsights, showTrends]);

  // Auto-refresh insights
  useEffect(() => {
    fetchInsights();
    
    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchInsights, refreshInterval]);

  // Handle insight expansion
  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  // Handle action execution
  const executeAction = async (insight: ProactiveInsight, action: ActionItem) => {
    try {
      console.log(`Executing action: ${action.title} for insight: ${insight.title}`);
      
      // In real implementation, this would call the appropriate service
      // For now, we'll just mark the action as completed
      
      // Update insight status
      const updatedInsights = insights.map(i => 
        i.id === insight.id 
          ? { ...i, status: 'acknowledged' as const }
          : i
      );
      setInsights(updatedInsights);

    } catch (err) {
      console.error('Error executing action:', err);
    }
  };

  // Generate mock trend data for visualization
  const generateTrendData = (insights: ProactiveInsight[]): TrendData[] => {
    const now = new Date();
    const data: TrendData[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseValue = 50 + Math.sin(i / 5) * 20;
      const noise = (Math.random() - 0.5) * 10;
      
      data.push({
        timestamp,
        value: Math.max(0, Math.min(100, baseValue + noise)),
        prediction: i < 7 ? baseValue + 5 : undefined,
        confidence: i < 7 ? 0.85 : undefined
      });
    }
    
    return data;
  };

  // Get priority icon and color
  const getPriorityDisplay = (priority: InsightPriority) => {
    const displays = {
      critical: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
      high: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
      medium: { icon: Eye, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      low: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
      info: { icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-50' }
    };
    
    return displays[priority] || displays.info;
  };

  // Get category display info
  const getCategoryDisplay = (type: string) => {
    const category = categories.find(c => c.id === type);
    return category || {
      id: type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: <Brain className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800',
      enabled: true
    };
  };

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load insights: {error.message}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInsights}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Insights
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchInsights}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-2 mt-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="h-6 text-xs"
            >
              All
            </Button>
            {categories.filter(c => c.enabled).map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="h-6 text-xs"
              >
                {category.icon}
                <span className="ml-1">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading && insights.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading AI insights...</p>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No insights available</p>
              <p className="text-xs text-gray-400 mt-1">Everything looks good!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map(insight => {
              const priorityDisplay = getPriorityDisplay(insight.priority);
              const categoryDisplay = getCategoryDisplay(insight.type);
              const isExpanded = expandedInsights.has(insight.id);
              const PriorityIcon = priorityDisplay.icon;

              return (
                <div
                  key={insight.id}
                  className={cn(
                    "border rounded-lg p-3 transition-all duration-200",
                    priorityDisplay.bg,
                    "hover:shadow-md"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <PriorityIcon className={cn("h-4 w-4 mt-0.5", priorityDisplay.color)} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 leading-tight">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Badge className={cn("text-xs", categoryDisplay.color)}>
                        {categoryDisplay.icon}
                        <span className="ml-1">{categoryDisplay.name}</span>
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleInsightExpansion(insight.id)}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 italic">
                      {insight.aiInsight || 'AI-generated insight not available'}
                    </p>
                  </div>

                  {/* Confidence & Priority */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{insight.confidence}%</span>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", priorityDisplay.color)}
                    >
                      {insight.priority.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Action Items */}
                  {insight.actionItems && insight.actionItems.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insight.actionItems.slice(0, isExpanded ? undefined : 2).map(action => (
                        <Button
                          key={action.id}
                          variant="outline"
                          size="sm"
                          onClick={() => executeAction(insight, action)}
                          className="h-6 text-xs"
                        >
                          {action.title}
                        </Button>
                      ))}
                      {!isExpanded && insight.actionItems.length > 2 && (
                        <span className="text-xs text-gray-500 self-center">
                          +{insight.actionItems.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {/* Detailed Context */}
                      {insight.details?.context && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-900 mb-1">Context</h5>
                          <p className="text-xs text-gray-600">{insight.details.context}</p>
                        </div>
                      )}

                      {/* Evidence */}
                      {insight.details?.evidence && insight.details.evidence.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-900 mb-1">Evidence</h5>
                          <ul className="space-y-1">
                            {insight.details.evidence.map((evidence, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-gray-400">•</span>
                                <span>{evidence.description}: {evidence.value} (threshold: {evidence.threshold})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {insight.details?.prediction?.assumptions && insight.details.prediction.assumptions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-900 mb-1">Recommendations</h5>
                          <ul className="space-y-1">
                            {insight.details.prediction.assumptions.map((assumption, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-gray-400">→</span>
                                <span>{assumption}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Source: {insight.source.system}</span>
                        <span>Created: {insight.createdAt.toLocaleString()}</span>
                        {insight.deadline && (
                          <span className="text-orange-600">
                            Due: {insight.deadline.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Trend Visualization */}
        {showTrends && trendData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Insight Trends (30 days)
            </h4>
            <div className="h-20 bg-gray-50 rounded-md flex items-end justify-between px-2 py-2">
              {trendData.map((point, index) => (
                <div
                  key={index}
                  className="w-1 bg-blue-500 rounded-t"
                  style={{ height: `${(point.value / 100) * 100}%` }}
                  title={`${point.timestamp.toLocaleDateString()}: ${point.value.toFixed(1)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
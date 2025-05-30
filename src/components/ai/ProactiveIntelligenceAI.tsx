import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Bell,
  AlertTriangle,
  Eye,
  Zap,
  Target,
  Clock,
  BarChart3,
  Activity,
  Shield,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Download
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { Risk, Control } from '@/types';
import { 
  ProactiveInsight,
  ActionRecommendation,
  SmartNotification,
  TrendAnalysis,
  PredictiveResult,
  InsightPriority
} from '@/types/proactive-monitoring.types';

// Import AI integration services
import { 
  proactiveAIIntegrationService,
  IntelligentInsight,
  AIProcessingResult
} from '@/services/ProactiveAIIntegrationService';

interface ProactiveIntelligenceAIProps {
  risks: Risk[];
  controls: Control[];
  onInsightGenerated?: (insight: IntelligentInsight) => void;
  onRecommendationAccepted?: (recommendation: ActionRecommendation) => void;
  onNotificationRead?: (notificationId: string) => void;
  className?: string;
}

interface SystemStatus {
  isProcessing: boolean;
  queueSize: number;
  activeTasksCount: number;
  completedTasksCount: number;
  lastProcessingTime: number;
  processingRate: number;
}

interface InsightMetrics {
  totalInsights: number;
  criticalInsights: number;
  actionableInsights: number;
  averageConfidence: number;
  lastGenerated: Date | null;
}

const ProactiveIntelligenceAI: React.FC<ProactiveIntelligenceAIProps> = ({
  risks,
  controls,
  onInsightGenerated,
  onRecommendationAccepted,
  onNotificationRead,
  className = ''
}) => {
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [insights, setInsights] = useState<IntelligentInsight[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [predictions, setPredictions] = useState<PredictiveResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isProcessing: false,
    queueSize: 0,
    activeTasksCount: 0,
    completedTasksCount: 0,
    lastProcessingTime: 0,
    processingRate: 0
  });
  const [insightMetrics, setInsightMetrics] = useState<InsightMetrics>({
    totalInsights: 0,
    criticalInsights: 0,
    actionableInsights: 0,
    averageConfidence: 0,
    lastGenerated: null
  });
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Start/stop background monitoring
  const handleToggleMonitoring = async () => {
    try {
      if (isMonitoringActive) {
        await proactiveAIIntegrationService.stopBackgroundProcessing();
        setIsMonitoringActive(false);
      } else {
        await proactiveAIIntegrationService.startBackgroundProcessing();
        setIsMonitoringActive(true);
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  };

  // Generate intelligent insights for all risks and controls
  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const newInsights: IntelligentInsight[] = [];

      // Generate insights for critical risks
      for (const risk of risks.filter(r => r.riskScore >= 15)) {
        try {
          const riskInsights = await proactiveAIIntegrationService.generateIntelligentInsights(
            risk.id,
            'risk',
            { risk, riskScore: risk.riskScore, category: risk.category }
          );
          newInsights.push(...riskInsights);
        } catch (error) {
          console.error(`Failed to generate insights for risk ${risk.id}:`, error);
        }
      }

      // Generate insights for controls
      for (const control of controls.slice(0, 5)) { // Limit to prevent overwhelming
        try {
          const controlInsights = await proactiveAIIntegrationService.generateIntelligentInsights(
            control.id,
            'control',
            { control, effectiveness: control.effectiveness, linkedRisks: control.linkedRisks }
          );
          newInsights.push(...controlInsights);
        } catch (error) {
          console.error(`Failed to generate insights for control ${control.id}:`, error);
        }
      }

      setInsights(prev => [...newInsights, ...prev].slice(0, 50)); // Keep latest 50
      updateInsightMetrics(newInsights);

      // Notify parent component
      newInsights.forEach(insight => onInsightGenerated?.(insight));

    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Perform predictive risk modeling
  const handlePredictiveModeling = async () => {
    try {
      const highRiskEntities = risks.filter(r => r.riskScore >= 12);
      const predictions = await proactiveAIIntegrationService.performPredictiveRiskModeling(
        highRiskEntities,
        controls,
        [] // Historical data would be provided here
      );
      setPredictions(predictions);
    } catch (error) {
      console.error('Failed to perform predictive modeling:', error);
    }
  };

  // Generate smart notifications
  const handleGenerateNotifications = async () => {
    try {
      const mockUserContext = {
        userId: 'current-user',
        role: 'risk_manager',
        permissions: ['read', 'write', 'analyze'],
        organizationId: 'org-1',
        preferences: {
          notificationChannels: ['in_app', 'email'],
          frequency: 'realtime',
          priority: 'medium'
        }
      };

      const newNotifications = await proactiveAIIntegrationService.generateSmartNotifications(
        'current-user',
        mockUserContext,
        [{ type: 'risk_change', entityIds: risks.map(r => r.id) }]
      );

      setNotifications(prev => [...newNotifications, ...prev].slice(0, 20)); // Keep latest 20
    } catch (error) {
      console.error('Failed to generate notifications:', error);
    }
  };

  // Update system status
  const updateSystemStatus = () => {
    const status = proactiveAIIntegrationService.getQueueStatus();
    setSystemStatus(prev => ({
      ...status,
      lastProcessingTime: prev.lastProcessingTime,
      processingRate: prev.processingRate
    }));
  };

  // Update insight metrics
  const updateInsightMetrics = (newInsights: IntelligentInsight[]) => {
    const allInsights = [...insights, ...newInsights];
    const criticalCount = allInsights.filter(i => i.priority === 'critical').length;
    const actionableCount = allInsights.filter(i => i.actionable).length;
    const avgConfidence = allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length;

    setInsightMetrics({
      totalInsights: allInsights.length,
      criticalInsights: criticalCount,
      actionableInsights: actionableCount,
      averageConfidence: avgConfidence,
      lastGenerated: new Date()
    });
  };

  // Get priority color
  const getPriorityColor = (priority: InsightPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  // Polling for updates
  useEffect(() => {
    if (isMonitoringActive) {
      const interval = setInterval(() => {
        updateSystemStatus();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isMonitoringActive]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Proactive Intelligence</CardTitle>
                <CardDescription>
                  AI-powered background monitoring, insights, and predictions
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="monitoring-toggle">Background Monitoring</Label>
              <Switch
                id="monitoring-toggle"
                checked={isMonitoringActive}
                onCheckedChange={handleToggleMonitoring}
              />
              <Badge variant={isMonitoringActive ? "default" : "secondary"}>
                {isMonitoringActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insightMetrics.totalInsights}</div>
                  <p className="text-sm text-muted-foreground">
                    {insightMetrics.criticalInsights} critical
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Actionable Insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insightMetrics.actionableInsights}</div>
                  <Progress 
                    value={insightMetrics.totalInsights > 0 ? 
                      (insightMetrics.actionableInsights / insightMetrics.totalInsights) * 100 : 0} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg Confidence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(insightMetrics.averageConfidence * 100).toFixed(0)}%
                  </div>
                  <Progress value={insightMetrics.averageConfidence * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{predictions.length}</div>
                  <p className="text-sm text-muted-foreground">Active forecasts</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>AI Actions</CardTitle>
                <CardDescription>Generate insights and perform analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights}
                    className="gap-2"
                  >
                    {isGeneratingInsights ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handlePredictiveModeling} className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Predictive Modeling
                  </Button>
                  <Button variant="outline" onClick={handleGenerateNotifications} className="gap-2">
                    <Bell className="h-4 w-4" />
                    Smart Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Queue Size</span>
                      <span>{systemStatus.queueSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Tasks</span>
                      <span>{systemStatus.activeTasksCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed Tasks</span>
                      <span>{systemStatus.completedTasksCount}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Processing Status</span>
                      <Badge variant={systemStatus.isProcessing ? "default" : "secondary"}>
                        {systemStatus.isProcessing ? "Processing" : "Idle"}
                      </Badge>
                    </div>
                    {systemStatus.isProcessing && (
                      <Progress value={75} className="w-full" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Insights Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent AI Insights</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('insights')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.slice(0, 3).map(insight => (
                    <div key={insight.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-1 rounded-full bg-blue-50">
                        {getCategoryIcon(insight.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                            {insight.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          Act
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Intelligent analysis and recommendations from AI processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map(insight => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                              {insight.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {insight.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          {insight.evidence.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Evidence:</p>
                              <ul className="text-xs text-muted-foreground ml-2">
                                {insight.evidence.slice(0, 3).map((evidence, index) => (
                                  <li key={index}>• {evidence}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {insight.actionable && (
                          <Button size="sm" onClick={() => onInsightGenerated?.(insight)}>
                            Take Action
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No insights generated yet. Click "Generate Insights" to start AI analysis.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analysis</CardTitle>
              <CardDescription>
                AI-powered predictions and forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map(prediction => (
                  <div key={prediction.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{prediction.prediction}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Probability: {(prediction.probability * 100).toFixed(0)}%</span>
                          <span>Timeframe: {prediction.timeframe}</span>
                          <span>Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {prediction.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ml-2 ${
                            prediction.impact === 'critical' ? 'border-red-500 text-red-600' :
                            prediction.impact === 'high' ? 'border-orange-500 text-orange-600' :
                            prediction.impact === 'medium' ? 'border-yellow-500 text-yellow-600' :
                            'border-green-500 text-green-600'
                          }`}>
                            {prediction.impact} impact
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {prediction.mitigation.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium">Recommended Mitigation:</p>
                        <ul className="text-sm text-muted-foreground mt-1">
                          {prediction.mitigation.map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {predictions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No predictions available. Run predictive modeling to generate forecasts.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Smart Notifications</CardTitle>
              <CardDescription>
                AI-generated notifications with intelligent prioritization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border rounded-lg ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Bell className="h-4 w-4 mt-1" />
                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {notification.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setNotifications(prev => 
                              prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                            );
                            onNotificationRead?.(notification.id);
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications yet. AI will generate smart notifications based on activity.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Background Processing</CardTitle>
                <CardDescription>Monitor AI processing queue and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Queue Size</div>
                      <div className="text-2xl font-bold">{systemStatus.queueSize}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Active Tasks</div>
                      <div className="text-2xl font-bold">{systemStatus.activeTasksCount}</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div className="text-2xl font-bold">{systemStatus.completedTasksCount}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Background Monitoring</h3>
                      <p className="text-sm text-muted-foreground">
                        Continuously analyze risks, controls, and compliance status
                      </p>
                    </div>
                    <Button 
                      onClick={handleToggleMonitoring}
                      variant={isMonitoringActive ? "destructive" : "default"}
                      className="gap-2"
                    >
                      {isMonitoringActive ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Stop Monitoring
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start Monitoring
                        </>
                      )}
                    </Button>
                  </div>

                  {isMonitoringActive && (
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertTitle>Monitoring Active</AlertTitle>
                      <AlertDescription>
                        AI is continuously analyzing your risk environment and will generate
                        insights, predictions, and notifications automatically.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Configuration</CardTitle>
                <CardDescription>Adjust AI processing settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Processing Interval</Label>
                      <p className="text-sm text-muted-foreground">Every 10 seconds</p>
                    </div>
                    <div>
                      <Label>Batch Size</Label>
                      <p className="text-sm text-muted-foreground">5 tasks per batch</p>
                    </div>
                    <div>
                      <Label>Max Concurrent Tasks</Label>
                      <p className="text-sm text-muted-foreground">3 tasks</p>
                    </div>
                    <div>
                      <Label>Retry Attempts</Label>
                      <p className="text-sm text-muted-foreground">3 retries</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProactiveIntelligenceAI; 
import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Bell,
  AlertTriangle,
  Target,
  BarChart3,
  Activity,
  Shield,
  Settings,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyLabel } from '@/components/ui/DaisyLabel';

import { Risk, Control } from '@/types';
import { 
  ActionRecommendation,
  SmartNotification,
  InsightPriority,
  UserContext
} from '@/types/proactive-monitoring.types';

// Import AI integration services
import { 
  proactiveAIIntegrationService,
  IntelligentInsight,
  PredictiveResult
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
      const mockUserContext: UserContext = {
        userId: 'current-user',
        organizationId: 'org-1',
        role: 'risk_manager',
        permissions: ['read', 'write', 'analyze'],
        preferences: {
          notificationFrequency: 'immediate',
          priorityThreshold: 'medium',
          categories: [],
          channels: ['in_app', 'email'],
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'UTC',
            exceptions: []
          },
          language: 'en'
        },
        currentSession: {
          sessionId: 'session-1',
          startTime: new Date(),
          lastActivity: new Date(),
          currentPage: '/dashboard',
          deviceInfo: {
            type: 'desktop',
            os: 'Windows',
            browser: 'Chrome',
            screen_resolution: '1920x1080',
            network_type: 'wifi'
          },
          locationInfo: {
            timezone: 'UTC',
            country: 'US',
            region: 'CA',
            city: 'San Francisco',
            ip_address: '127.0.0.1'
          }
        },
        workContext: {
          active_risks: risks.map(r => r.id),
          recent_activities: [],
          pending_tasks: [],
          upcoming_deadlines: [],
          collaboration_sessions: []
        },
        historicalBehavior: []
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
      default: return 'text-muted-foreground bg-secondary/10';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk': return <DaisyAlertTriangle className="h-4 w-4" >
  ;
</DaisyAlertTriangle>
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
      <DaisyCard className="bg-white border border-gray-100 shadow-sm" >
  <DaisyCardBody >
</DaisyCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#191919] to-[#191919] shadow-lg shadow-[#D8C3A5]/50">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <DaisyCardTitle className="text-xl font-bold text-gray-900 font-inter">Proactive Intelligence</DaisyCardTitle>
                <DaisyCardDescription className="text-gray-600 font-inter" >
  AI-powered background monitoring, insights, and predictions
</DaisyCardDescription>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DaisyLabel htmlFor="monitoring-toggle" className="text-sm font-medium text-gray-700">Background Monitoring</DaisyLabel>
              <DaisySwitch
                id="monitoring-toggle"
                checked={isMonitoringActive}
                onCheckedChange={handleToggleMonitoring} />
<DaisyBadge variant={isMonitoringActive ? "default" : "secondary"} className={isMonitoringActive ? "bg-green-100 text-green-700 border-0" : "bg-secondary/20 text-muted-foreground border-0"} >
  {isMonitoringActive ? "Active" : "Inactive"}
</DaisySwitch>
              </DaisyBadge>
            </div>
          </div>
        
      </DaisyCard>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="grid w-full grid-cols-5 bg-white border border-gray-100 p-1 shadow-sm rounded-xl" >
            <DaisyTabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg">Dashboard</DaisyTabs>
          <DaisyTabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg">AI Insights</DaisyTabsTrigger>
          <DaisyTabsTrigger value="predictions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg">Predictions</DaisyTabsTrigger>
          <DaisyTabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg">Notifications</DaisyTabsTrigger>
          <DaisyTabsTrigger value="monitoring" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 font-medium rounded-lg">Monitoring</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="dashboard" >
            <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg" >
  <DaisyCardBody className="pb-2" >
</DaisyTabsContent>
                  <DaisyCardDescription className="text-gray-600 font-inter">Total Insights</p>
                
                <DaisyCardBody >
  <div className="text-2xl font-bold text-gray-900">
</DaisyCardDescription>{insightMetrics.totalInsights}</div>
                  <p className="text-sm text-gray-500">
                    {insightMetrics.criticalInsights} critical
                  </p>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg" >
  <DaisyCardBody className="pb-2" >
</DaisyCard>
                  <DaisyCardDescription className="text-gray-600 font-inter">Actionable Insights</p>
                
                <DaisyCardBody >
  <div className="text-2xl font-bold text-gray-900">
</DaisyCardDescription>{insightMetrics.actionableInsights}</div>
                  <div className="relative h-2 bg-secondary/20 rounded-full overflow-hidden mt-2">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#191919] to-[#191919] rounded-full"
                      style={{ width: `${insightMetrics.totalInsights > 0 ? (insightMetrics.actionableInsights / insightMetrics.totalInsights) * 100 : 0}%` }} />
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg" >
  <DaisyCardBody className="pb-2" >
</DaisyCard>
                  <DaisyCardDescription className="text-gray-600 font-inter">Avg Confidence</p>
                
                <DaisyCardBody >
  <div className="text-2xl font-bold text-gray-900">
</DaisyCardDescription>
                    {(insightMetrics.averageConfidence * 100).toFixed(0)}%
                  </div>
                  <div className="relative h-2 bg-secondary/20 rounded-full overflow-hidden mt-2">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#191919] to-[#191919] rounded-full"
                      style={{ width: `${insightMetrics.averageConfidence * 100}%` }} />
                  </div>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg" >
  <DaisyCardBody className="pb-2" >
</DaisyCard>
                  <DaisyCardDescription className="text-gray-600 font-inter">Predictions</p>
                
                <DaisyCardBody >
  <div className="text-2xl font-bold text-gray-900">
</DaisyCardDescription>{predictions.length}</div>
                  <p className="text-sm text-gray-500">Active forecasts</p>
                </DaisyCardBody>
              </DaisyCard>
            </div>

            {/* Quick Actions */}
            <DaisyCard className="bg-white border border-gray-100 shadow-sm" >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle className="text-lg font-bold text-gray-900 font-inter">AI Actions</DaisyCardTitle>
                <DaisyCardDescription className="text-gray-600 font-inter">Generate insights and perform analysis</p>
              
              <DaisyCardBody >
  <div className="flex gap-3">
</DaisyCardDescription>
                  <DaisyButton 
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights}
                    className="gap-2 bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] border-0 shadow-md hover:shadow-lg transition-all duration-300 font-inter font-medium">
          {isGeneratingInsights ? (

        </DaisyButton>
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
                  </DaisyButton>
                  <DaisyButton variant="outline" onClick={handlePredictiveModeling} className="gap-2 border border-gray-200 text-gray-700 hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] transition-all duration-300 font-inter font-medium" >
  <TrendingUp className="h-4 w-4" />
</DaisyButton>
                    Predictive Modeling
                  </DaisyButton>
                  <DaisyButton variant="outline" onClick={handleGenerateNotifications} className="gap-2 border border-gray-200 text-gray-700 hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] transition-all duration-300 font-inter font-medium" >
  <Bell className="h-4 w-4" />
</DaisyButton>
                    Smart Notifications
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>

            {/* System Status */}
            <DaisyCard className="bg-white border border-gray-100 shadow-sm" >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 font-inter" >
  <Activity className="h-5 w-5 text-[#191919]" />
</DaisyCardTitle>
                  System Status
                </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
</DaisyCardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm p-2 bg-secondary/10 rounded-lg">
                      <span className="text-gray-600">Queue Size</span>
                      <span className="font-medium text-gray-900">{systemStatus.queueSize}</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-secondary/10 rounded-lg">
                      <span className="text-gray-600">Active Tasks</span>
                      <span className="font-medium text-gray-900">{systemStatus.activeTasksCount}</span>
                    </div>
                    <div className="flex justify-between text-sm p-2 bg-secondary/10 rounded-lg">
                      <span className="text-gray-600">Completed Tasks</span>
                      <span className="font-medium text-gray-900">{systemStatus.completedTasksCount}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                      <span className="text-sm text-gray-600">Processing Status</span>
                      <DaisyBadge variant={systemStatus.isProcessing ? "default" : "secondary"} className={systemStatus.isProcessing ? "bg-[#D8C3A5] text-[#191919] border-0" : "bg-secondary/20 text-muted-foreground border-0"} >
  {systemStatus.isProcessing ? "Processing" : "Idle"}
</DaisyBadge>
                      </DaisyBadge>
                    </div>
                    {systemStatus.isProcessing && (
                      <div className="relative h-2 bg-secondary/20 rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#191919] to-[#191919] rounded-full animate-pulse" style={{ width: '75%' }} />
                      </div>
                    )}
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>

            {/* Recent Insights Preview */}
            <DaisyCard className="bg-white border border-gray-100 shadow-sm" >
  <DaisyCardBody >
</DaisyCard>
                <div className="flex items-center justify-between">
                  <DaisyCardTitle className="text-lg font-bold text-gray-900 font-inter">Recent AI Insights</DaisyCardTitle>
                  <DaisyButton variant="outline" size="sm" onClick={() =>
          setActiveTab('insights')} className="border border-gray-200 text-gray-700 hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] font-inter font-medium" />
                    View All
                  
        </DaisyButton>
                </div>
              
              <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
                  {insights.slice(0, 3).map(insight => (
                    <div key={insight.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-[#D8C3A5]/20 hover:border-[#191919] transition-all duration-200">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <div className="text-[#191919]">
                          {getCategoryIcon(insight.category)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <DaisyBadge variant="outline" className={`text-xs ${getPriorityColor(insight.priority)}`}>
                            {insight.priority}
                          </DaisyBadge>
                          <span className="text-xs text-gray-500">
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                      {insight.actionable && (
                        <DaisyButton size="sm" variant="outline" className="text-[#191919] hover:text-[#191919] hover:bg-[#D8C3A5]/20 border-[#D8C3A5]">
          Act

        </DaisyButton>
                        </DaisyButton>
                      )}
                    </div>
                  ))}
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="insights" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>AI-Generated Insights</DaisyCardTitle>
              <DaisyCardDescription >
  Intelligent analysis and recommendations from AI processing
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
                {insights.map(insight => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <DaisyBadge className={`text-xs ${getPriorityColor(insight.priority)}`}>
                              {insight.priority}
                            </DaisyBadge>
                            <DaisyBadge variant="secondary" className="text-xs" >
  {insight.category}
</DaisyBadge>
                            </DaisyBadge>
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
                          <DaisyButton size="sm" onClick={() =>
          onInsightGenerated?.(insight)} />
                            Take Action
                          
        </DaisyButton>
                        )}
                        <DaisyButton size="sm" variant="outline">
          Details

        </DaisyButton>
                        </DaisyButton>
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
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="predictions" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Predictive Analysis</DaisyCardTitle>
              <DaisyCardDescription >
  AI-powered predictions and forecasts
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
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
                          <DaisyBadge variant="outline" className="text-xs" >
  {prediction.type.replace('_', ' ')}
</DaisyBadge>
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className={`text-xs ml-2 ${
                            prediction.impact === 'critical' ? 'border-red-500 text-red-600' :
                            prediction.impact === 'high' ? 'border-orange-500 text-orange-600' :
                            prediction.impact === 'medium' ? 'border-yellow-500 text-yellow-600' :
                            'border-green-500 text-green-600'
                          }`}>
                            {prediction.impact} impact
                          </DaisyBadge>
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
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="notifications" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Smart Notifications</DaisyCardTitle>
              <DaisyCardDescription >
  AI-generated notifications with intelligent prioritization
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <div className="space-y-3">
</DaisyCardBody>
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
                            <DaisyBadge variant="outline" className="text-xs" >
  {notification.priority}
</DaisyBadge>
                            </DaisyBadge>
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <DaisyButton 
                          size="sm" 
                          variant="outline"
                          onClick={() =>
          {
                            setNotifications(prev => 
                              prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                            );
                            onNotificationRead?.(notification.id);
                          }}
                        >
                          Mark Read
                        
        </DaisyButton>
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
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="monitoring" >
            <div className="space-y-6">
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
                <DaisyCardTitle>Background Processing</DaisyCardTitle>
                <DaisyCardDescription>Monitor AI processing queue and performance</p>
              
              <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardDescription>
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
                    <DaisyButton 
                      onClick={handleToggleMonitoring}
                      variant={isMonitoringActive ? "danger" : "primary"}
                      className="gap-2">
          {isMonitoringActive ? (

        </DaisyButton>
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
                    </DaisyButton>
                  </div>

                  {isMonitoringActive && (
                    <DaisyAlert >
  <Activity className="h-4 w-4" />
</DaisyAlert>
                      <DaisyAlertTitle>Monitoring Active</DaisyAlertTitle>
                      <DaisyAlertDescription >
  AI is continuously analyzing your risk environment and will generate
                </DaisyAlertDescription>
</DaisyAlert>
                        insights, predictions, and notifications automatically.
                </DaisyAlertDescription>
              </DaisyAlert>
                  )}
                </div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
                <DaisyCardTitle>Processing Configuration</DaisyCardTitle>
                <DaisyCardDescription>Adjust AI processing settings</p>
              
              <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <DaisyLabel>Processing Interval</DaisyLabel>
                      <p className="text-sm text-muted-foreground">Every 10 seconds</p>
                    </div>
                    <div>
                      <DaisyLabel>Batch Size</DaisyLabel>
                      <p className="text-sm text-muted-foreground">5 tasks per batch</p>
                    </div>
                    <div>
                      <DaisyLabel>Max Concurrent Tasks</DaisyLabel>
                      <p className="text-sm text-muted-foreground">3 tasks</p>
                    </div>
                    <div>
                      <DaisyLabel>Retry Attempts</DaisyLabel>
                      <p className="text-sm text-muted-foreground">3 retries</p>
                    </div>
                  </div>
                  <DaisyButton variant="outline" size="sm" className="gap-2" >
  <Settings className="h-4 w-4" />
</DaisyButton>
                    Configure Settings
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
};

export default ProactiveIntelligenceAI; 
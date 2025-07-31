import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  AlertTriangle,
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Bell,
  Eye,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Target,
  Shield,
  Cpu,
  AlertCircle
} from 'lucide-react';

import {
  anomalyDetectionAIService,
  type AnomalyAlert,
  type AnomalyPattern,
  type AnomalyDetectionConfig
} from '@/services/AnomalyDetectionAIService';
import { generateId } from '@/lib/utils';
import type { Risk } from '@/types';

interface DemoProps {
  onAnomalyDetected?: (alert: AnomalyAlert) => void;
}

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: Date;
  anomalyScore: number;
  isAnomaly: boolean;
}

export const AnomalyDetectionDemo: React.FC<DemoProps> = ({
  onAnomalyDetected
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<AnomalyAlert[]>([]);
  const [detectionPatterns, setDetectionPatterns] = useState<AnomalyPattern[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealTimeMetric[]>([]);
  const [selectedAlertType, setSelectedAlertType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Demo configuration
  const [config, setConfig] = useState<AnomalyDetectionConfig>({
    statistical: {
      zScoreThreshold: 3.0,
      iqrMultiplier: 1.5,
      madThreshold: 3.5,
      isolationForestContamination: 0.1
    },
    timeSeries: {
      seasonalityPeriod: 30,
      trendSensitivity: 0.05,
      changePointThreshold: 2.0,
      forecastHorizon: 7
    },
    patterns: {
      clusteringAlgorithm: 'kmeans',
      patternMatchThreshold: 0.8,
      behaviorBaselineWindow: 90,
      adaptiveLearning: true
    },
    alerts: {
      severityLevels: ['low', 'medium', 'high', 'critical'],
      notificationChannels: ['email', 'dashboard', 'webhook'],
      escalationRules: [],
      suppressionPeriod: 60
    }
  });

  // Demo risks for testing
  const demoRisks: Risk[] = [
    {
      id: 'risk-001',
      title: 'Cybersecurity Incident Risk',
      description: 'Risk of data breach or cyber attack',
      category: 'TECHNOLOGY',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      owner: 'CISO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'risk-002',
      title: 'Market Volatility Risk',
      description: 'Risk from market fluctuations',
      category: 'FINANCIAL',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      owner: 'CFO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'risk-003',
      title: 'Regulatory Compliance Risk',
      description: 'Risk of regulatory violations',
      category: 'COMPLIANCE',
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      owner: 'Legal',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    }
  ];

  // Initialize real-time metrics
  useEffect(() => {
    const metrics: RealTimeMetric[] = [
      {
        id: 'metric-1',
        name: 'Risk Score Variance',
        value: 8.5,
        trend: 'up',
        change: 12.3,
        timestamp: new Date(),
        anomalyScore: 0.75,
        isAnomaly: false
      },
      {
        id: 'metric-2',
        name: 'Control Effectiveness',
        value: 85.2,
        trend: 'stable',
        change: -2.1,
        timestamp: new Date(),
        anomalyScore: 0.3,
        isAnomaly: false
      },
      {
        id: 'metric-3',
        name: 'Incident Frequency',
        value: 3.2,
        trend: 'down',
        change: -15.8,
        timestamp: new Date(),
        anomalyScore: 0.45,
        isAnomaly: false
      },
      {
        id: 'metric-4',
        name: 'Compliance Score',
        value: 92.1,
        trend: 'up',
        change: 5.4,
        timestamp: new Date(),
        anomalyScore: 0.2,
        isAnomaly: false
      }
    ];
    
    setRealtimeMetrics(metrics);
  }, []);

  // Start anomaly detection
  const startAnomalyDetection = async () => {
    setIsMonitoring(true);
    
    try {
      // Detect anomalies in demo risks
      const alerts = await anomalyDetectionAIService.detectRiskAnomalies(demoRisks, config);
      
      // Generate some demo alerts
      const demoAlerts: AnomalyAlert[] = [
        {
          id: generateId('alert'),
          type: 'statistical',
          severity: 'high',
          entityId: 'risk-001',
          entityType: 'risk',
          title: 'Statistical Anomaly in Risk Score',
          description: 'Cybersecurity risk score has increased by 40% above normal range',
          detectedAt: new Date(),
          confidence: 87.5,
          metric: 'riskScore',
          currentValue: 16.8,
          expectedValue: 12.0,
          deviation: 40.0,
          context: {
            timeWindow: '24h',
            relatedEntities: ['control-001', 'control-002'],
            environmentalFactors: ['increased_threat_activity'],
            historicalPatterns: ['seasonal_increase'],
            correlatedAnomalies: [],
            dataQualityScore: 0.92
          },
          rootCauseAnalysis: {
            primaryCauses: [
              {
                id: 'cause-1',
                description: 'Increased threat actor activity in region',
                probability: 0.85,
                evidence: ['threat_intelligence_reports', 'security_logs'],
                impact: 4,
                category: 'external'
              }
            ],
            secondaryCauses: [],
            correlationAnalysis: [],
            timelineAnalysis: [],
            confidence: 0.85,
            methodology: ['Statistical Analysis', 'Threat Intelligence']
          },
          recommendations: [
            'Review security monitoring configurations',
            'Validate threat intelligence sources',
            'Consider additional security controls'
          ],
          status: 'new',
          tags: ['cybersecurity', 'statistical', 'high-priority']
        },
        {
          id: generateId('alert'),
          type: 'pattern',
          severity: 'medium',
          entityId: 'risk-002',
          entityType: 'risk',
          title: 'Unusual Pattern in Market Risk',
          description: 'Market volatility pattern deviates from historical baseline',
          detectedAt: new Date(),
          confidence: 72.3,
          metric: 'volatilityIndex',
          currentValue: 28.5,
          expectedValue: 22.1,
          deviation: 29.0,
          context: {
            timeWindow: '7d',
            relatedEntities: ['risk-003'],
            environmentalFactors: ['market_conditions'],
            historicalPatterns: ['quarterly_pattern'],
            correlatedAnomalies: [],
            dataQualityScore: 0.88
          },
          rootCauseAnalysis: {
            primaryCauses: [
              {
                id: 'cause-2',
                description: 'Unusual market correlation patterns',
                probability: 0.72,
                evidence: ['market_data_analysis'],
                impact: 3,
                category: 'external'
              }
            ],
            secondaryCauses: [],
            correlationAnalysis: [],
            timelineAnalysis: [],
            confidence: 0.72,
            methodology: ['Pattern Analysis']
          },
          recommendations: [
            'Monitor market correlation changes',
            'Review hedging strategies',
            'Update risk models'
          ],
          status: 'new',
          tags: ['market', 'pattern', 'volatility']
        }
      ];
      
      setActiveAlerts([...alerts, ...demoAlerts]);
      
      if (onAnomalyDetected) {
        demoAlerts.forEach(alert => onAnomalyDetected(alert));
      }
      
    } catch (error) {
      console.error('Error starting anomaly detection:', error);
    }
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(() => {
      setRealtimeMetrics(prev => prev.map(metric => {
        const variance = (Math.random() - 0.5) * 0.1;
        const newValue = Math.max(0, metric.value * (1 + variance));
        const change = ((newValue - metric.value) / metric.value) * 100;
        
        // Calculate anomaly score based on deviation
        const anomalyScore = Math.abs(variance) * 10;
        const isAnomaly = anomalyScore > 0.8;
        
        return {
          ...metric,
          value: Number(newValue.toFixed(2)),
          change: Number(change.toFixed(1)),
          timestamp: new Date(),
          anomalyScore: Number(anomalyScore.toFixed(2)),
          isAnomaly,
          trend: change > 1 ? 'up' : change < -1 ? 'down' : 'stable'
        };
      }));
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Filter alerts
  const filteredAlerts = activeAlerts.filter(alert => {
    const typeMatch = selectedAlertType === 'all' || alert.type === selectedAlertType;
    const severityMatch = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    return typeMatch && severityMatch;
  });

  // Prepare chart data
  const prepareMetricsChartData = () => {
    return realtimeMetrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      anomalyScore: metric.anomalyScore * 100,
      isAnomaly: metric.isAnomaly
    }));
  };

  const prepareTimeSeriesData = () => {
    const data: Array<{ date: string; value: number; anomaly: number }> = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const baseValue = 8 + Math.sin(i / 7) * 2; // Weekly pattern
      const noise = (Math.random() - 0.5) * 1;
      
      data.push({
        date: date.toLocaleDateString(),
        value: Number((baseValue + noise).toFixed(2)),
        anomaly: i < 5 && Math.random() > 0.7 ? 1 : 0
      });
    }
    
    return data;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <DaisyAlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <DaisyAlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Eye className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            AI Anomaly Detection
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Intelligent monitoring and early warning system for risk anomalies
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DaisyButton
            onClick={isMonitoring ? stopMonitoring : startAnomalyDetection}
            className={isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
          >
            {isMonitoring ? (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Detection
              </>
            )}
          </DaisyButton>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeAlerts.filter(a => a.status === 'new').length}
                </p>
              </div>
              <DaisyAlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monitoring Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isMonitoring ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${isMonitoring ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anomalies Detected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {realtimeMetrics.filter(m => m.isAnomaly).length}
                </p>
              </div>
              <Cpu className="h-8 w-8 text-purple-500" />
            </div>
          </DaisyCardContent>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Detection Accuracy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">87.3%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </DaisyCardContent>
        </DaisyCard>
      </div>

      {/* Main Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <DaisyTabsList className="grid w-full grid-cols-4">
          <DaisyTabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts ({activeAlerts.length})
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-time
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analysis
          </DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Dashboard Tab */}
        <DaisyTabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomaly Detection Overview */}
            <DaisyCard className="lg:col-span-2">
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Anomaly Detection Timeline
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Historical anomaly detection results over time
                </p>
              
              <DaisyCardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareTimeSeriesData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <DaisyTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Risk Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="anomaly"
                        stroke="#ff7c7c"
                        strokeWidth={3}
                        dot={{ fill: '#ff7c7c', strokeWidth: 2, r: 4 }}
                        name="Detected Anomalies"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            {/* Current Metrics */}
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Real-time Metrics</DaisyCardTitle>
                <DaisyCardDescription>Current anomaly scores for key metrics</p>
              
              <DaisyCardContent>
                <div className="space-y-4">
                  {realtimeMetrics.map((metric) => (
                    <div key={metric.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <DaisyBadge variant={metric.isAnomaly ? 'destructive' : 'default'}>
                            {metric.value}
                          </DaisyBadge>
                          {getTrendIcon(metric.trend)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DaisyProgress 
                          value={metric.anomalyScore * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-gray-500 w-12">
                          {(metric.anomalyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      {metric.isAnomaly && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Anomaly detected with {(metric.anomalyScore * 100).toFixed(1)}% confidence
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DaisyCardContent>
            </DaisyCard>

            {/* Detection Methods */}
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Detection Methods</DaisyCardTitle>
                <DaisyCardDescription>Active anomaly detection algorithms</p>
              
              <DaisyCardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Z-Score Analysis</span>
                    <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">IQR Outlier Detection</span>
                    <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Isolation Forest</span>
                    <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Pattern Recognition</span>
                    <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Time Series Analysis</span>
                    <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        {/* Alerts Tab */}
        <DaisyTabsContent value="alerts" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <DaisySelect value={selectedAlertType} onValueChange={setSelectedAlertType}>
              <DaisySelectTrigger className="w-48">
                <DaisySelectValue placeholder="Filter by Type" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Types</SelectItem>
                <DaisySelectItem value="statistical">Statistical</SelectItem>
                <DaisySelectItem value="pattern">Pattern</SelectItem>
                <DaisySelectItem value="behavior">Behavior</SelectItem>
                <DaisySelectItem value="trend">Trend</SelectItem>
              </SelectContent>
            </DaisySelect>
            
            <DaisySelect value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <DaisySelectTrigger className="w-48">
                <DaisySelectValue placeholder="Filter by Severity" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Severities</SelectItem>
                <DaisySelectItem value="critical">Critical</SelectItem>
                <DaisySelectItem value="high">High</SelectItem>
                <DaisySelectItem value="medium">Medium</SelectItem>
                <DaisySelectItem value="low">Low</SelectItem>
              </SelectContent>
            </DaisySelect>
          </div>

          <div className="space-y-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <DaisyCard key={alert.id}>
                  <DaisyCardHeader>
                    <div className="flex items-center justify-between">
                      <DaisyCardTitle className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        {alert.title}
                      </DaisyCardTitle>
                      <div className="flex items-center gap-2">
                        <DaisyBadge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </DaisyBadge>
                        <DaisyBadge variant="outline">
                          {alert.confidence.toFixed(1)}% confidence
                        </DaisyBadge>
                      </div>
                    </div>
                    <DaisyCardDescription className="flex items-center gap-4">
                      <span>Detected {alert.detectedAt.toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>{alert.entityType}: {alert.entityId}</span>
                      <span>•</span>
                      <span>{alert.metric}</span>
                    </p>
                  
                  <DaisyCardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300">{alert.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Value</p>
                          <p className="text-lg font-semibold">{alert.currentValue}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Value</p>
                          <p className="text-lg font-semibold">{alert.expectedValue}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deviation</p>
                          <p className="text-lg font-semibold text-red-600">+{alert.deviation.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      {alert.rootCauseAnalysis.primaryCauses.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Primary Root Causes:</h4>
                          <div className="space-y-1">
                            {alert.rootCauseAnalysis.primaryCauses.map((cause, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex items-center justify-between">
                                  <span>{cause.description}</span>
                                  <DaisyBadge variant="outline">{(cause.probability * 100).toFixed(0)}%</DaisyBadge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {alert.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Recommendations:</h4>
                          <ul className="text-sm space-y-1">
                            {alert.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 pt-2">
                        <DaisyButton size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Investigate
                        </DaisyButton>
                        <DaisyButton size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </DaisyButton>
                        <DaisyButton size="sm" variant="outline">
                          <Clock className="h-4 w-4 mr-1" />
                          Snooze
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              ))
            ) : (
              <DaisyCard>
                <DaisyCardContent className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No anomaly alerts found. Start monitoring to detect anomalies.
                  </p>
                </DaisyCardContent>
              </DaisyCard>
            )}
          </div>
        </DaisyTabsContent>

        {/* Real-time Monitoring Tab */}
        <DaisyTabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard className="lg:col-span-2">
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Real-time Anomaly Scores
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Live monitoring of anomaly detection scores
                </p>
              
              <DaisyCardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareMetricsChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <DaisyTooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Current Value" />
                      <Bar dataKey="anomalyScore" fill="#ff7c7c" name="Anomaly Score %" />
                      <ReferenceLine y={80} stroke="red" strokeDasharray="2 2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Monitoring Configuration</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Z-Score Threshold</label>
                  <input
                    type="number"
                    value={config.statistical.zScoreThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      statistical: {
                        ...prev.statistical,
                        zScoreThreshold: Number(e.target.value)
                      }
                    }))}
                    className="w-full p-2 border rounded"
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">IQR Multiplier</label>
                  <input
                    type="number"
                    value={config.statistical.iqrMultiplier}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      statistical: {
                        ...prev.statistical,
                        iqrMultiplier: Number(e.target.value)
                      }
                    }))}
                    className="w-full p-2 border rounded"
                    step="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Frequency</label>
                  <select className="w-full p-2 border rounded">
                    <option value="5">5 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>System Status</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Detection Engine</span>
                  <DaisyBadge className={isMonitoring ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {isMonitoring ? 'Running' : 'Stopped'}
                  </DaisyBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Pipeline</span>
                  <DaisyBadge className="bg-green-100 text-green-800">Healthy</DaisyBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alert System</span>
                  <DaisyBadge className="bg-green-100 text-green-800">Active</DaisyBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        {/* Analysis Tab */}
        <DaisyTabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Detection Accuracy</DaisyCardTitle>
                <DaisyCardDescription>Performance metrics for anomaly detection</p>
              
              <DaisyCardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">True Positive Rate</span>
                      <span className="text-sm">87.3%</span>
                    </div>
                    <DaisyProgress value={87.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">False Positive Rate</span>
                      <span className="text-sm">8.1%</span>
                    </div>
                    <DaisyProgress value={8.1} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Precision</span>
                      <span className="text-sm">91.5%</span>
                    </div>
                    <DaisyProgress value={91.5} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Recall</span>
                      <span className="text-sm">85.2%</span>
                    </div>
                    <DaisyProgress value={85.2} className="h-2" />
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Pattern Analysis</DaisyCardTitle>
                <DaisyCardDescription>Identified anomaly patterns and trends</p>
              
              <DaisyCardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Weekly Spike Pattern</h4>
                      <DaisyBadge variant="outline">85% confidence</DaisyBadge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recurring anomalies every Monday morning, likely due to system batch processing
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Seasonal Variance</h4>
                      <DaisyBadge variant="outline">72% confidence</DaisyBadge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Higher anomaly rates during quarter-end periods
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Correlation Cluster</h4>
                      <DaisyBadge variant="outline">91% confidence</DaisyBadge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Market risk and compliance risk anomalies often occur together
                    </p>
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}; 
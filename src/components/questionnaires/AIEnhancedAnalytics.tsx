'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisySeparator } from '@/components/ui/DaisySeparator';

import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';

import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Eye,
  Zap, Activity, Shield, Search, Bell, CheckCircle, XCircle,
  BarChart3, LineChart as LineIcon, PieChart as PieIcon,
  RefreshCw, Download, Settings, Info, Lightbulb, ArrowUp,
  ArrowDown, Minus, Users, Clock, Star, ThumbsUp, ThumbsDown
} from 'lucide-react';

// AI Analytics Types
interface PredictiveMetric {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: '1d' | '7d' | '30d' | '90d';
}

interface RiskScore {
  id: string;
  category: string;
  score: number;
  maxScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
}

interface Anomaly {
  id: string;
  type: 'response_pattern' | 'completion_time' | 'score_distribution' | 'user_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  affectedEntities: string[];
  confidence: number;
  automaticActions: string[];
  requiresReview: boolean;
}

interface SentimentData {
  id: string;
  source: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
  keywords: string[];
  context: string;
  timestamp: string;
}

interface PatternInsight {
  id: string;
  pattern: string;
  frequency: number;
  significance: 'low' | 'medium' | 'high';
  description: string;
  implications: string[];
  actionable: boolean;
  relatedData: any[];
}

interface AutomatedInsight {
  id: string;
  title: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  evidence: string[];
  recommendations: string[];
  confidence: number;
  impact: string;
  generatedAt: string;
}

// Mock AI Analytics Data
const mockPredictiveMetrics: PredictiveMetric[] = [
  {
    id: 'pm-001',
    metric: 'Completion Rate',
    currentValue: 87,
    predictedValue: 92,
    confidence: 94,
    trend: 'up',
    impact: 'medium',
    timeframe: '30d'
  },
  {
    id: 'pm-002',
    metric: 'Response Time',
    currentValue: 15.2,
    predictedValue: 12.8,
    confidence: 89,
    trend: 'down',
    impact: 'high',
    timeframe: '7d'
  },
  {
    id: 'pm-003',
    metric: 'Risk Score',
    currentValue: 6.8,
    predictedValue: 7.2,
    confidence: 91,
    trend: 'up',
    impact: 'critical',
    timeframe: '30d'
  },
  {
    id: 'pm-004',
    metric: 'User Engagement',
    currentValue: 78,
    predictedValue: 81,
    confidence: 86,
    trend: 'up',
    impact: 'medium',
    timeframe: '7d'
  }
];

const mockRiskScores: RiskScore[] = [
  {
    id: 'rs-001',
    category: 'Cybersecurity',
    score: 8.2,
    maxScore: 10,
    riskLevel: 'high',
    factors: ['Incomplete MFA coverage', 'Outdated security policies', 'High privilege accounts'],
    recommendations: ['Implement MFA for all critical systems', 'Update security policies quarterly', 'Review privileged access'],
    trend: 'declining'
  },
  {
    id: 'rs-002',
    category: 'Compliance',
    score: 6.5,
    maxScore: 10,
    riskLevel: 'medium',
    factors: ['Missing documentation', 'Audit gaps', 'Training deficiencies'],
    recommendations: ['Complete compliance documentation', 'Address audit findings', 'Enhance training programs'],
    trend: 'improving'
  },
  {
    id: 'rs-003',
    category: 'Operational',
    score: 4.1,
    maxScore: 10,
    riskLevel: 'low',
    factors: ['Process efficiency', 'Resource allocation', 'Performance metrics'],
    recommendations: ['Optimize workflows', 'Balance resource distribution', 'Track KPIs'],
    trend: 'stable'
  }
];

const mockAnomalies: Anomaly[] = [
  {
    id: 'an-001',
    type: 'response_pattern',
    severity: 'high',
    description: 'Unusual spike in "Strongly Disagree" responses for security questions',
    detectedAt: '2024-01-25T14:30:00Z',
    affectedEntities: ['Security Assessment Q1-Q5'],
    confidence: 95,
    automaticActions: ['Flag for review', 'Notify administrators'],
    requiresReview: true
  },
  {
    id: 'an-002',
    type: 'completion_time',
    severity: 'medium',
    description: 'Completion times 3x longer than average for Department B',
    detectedAt: '2024-01-25T11:15:00Z',
    affectedEntities: ['Department B users'],
    confidence: 88,
    automaticActions: ['Generate report', 'Track progress'],
    requiresReview: false
  },
  {
    id: 'an-003',
    type: 'user_behavior',
    severity: 'low',
    description: 'Increased abandonment rate during lunch hours',
    detectedAt: '2024-01-25T12:45:00Z',
    affectedEntities: ['All questionnaires'],
    confidence: 76,
    automaticActions: ['Log pattern', 'Monitor trend'],
    requiresReview: false
  }
];

const mockSentimentData: SentimentData[] = [
  {
    id: 'sd-001',
    source: 'Feedback Comments',
    sentiment: 'positive',
    score: 0.8,
    confidence: 92,
    keywords: ['easy', 'clear', 'helpful'],
    context: 'Users appreciate the questionnaire clarity',
    timestamp: '2024-01-25T10:30:00Z'
  },
  {
    id: 'sd-002',
    source: 'Support Tickets',
    sentiment: 'negative',
    score: -0.6,
    confidence: 89,
    keywords: ['confusing', 'technical', 'difficult'],
    context: 'Technical questions causing confusion',
    timestamp: '2024-01-25T09:15:00Z'
  },
  {
    id: 'sd-003',
    source: 'Exit Surveys',
    sentiment: 'neutral',
    score: 0.1,
    confidence: 74,
    keywords: ['okay', 'average', 'standard'],
    context: 'Mixed feedback on questionnaire length',
    timestamp: '2024-01-25T08:45:00Z'
  }
];

const mockPatternInsights: PatternInsight[] = [
  {
    id: 'pi-001',
    pattern: 'Higher engagement on Tuesdays and Wednesdays',
    frequency: 78,
    significance: 'high',
    description: 'Response rates consistently 23% higher mid-week',
    implications: ['Optimal scheduling window', 'Resource allocation opportunity'],
    actionable: true,
    relatedData: []
  },
  {
    id: 'pi-002',
    pattern: 'Mobile users have 15% lower completion rates',
    frequency: 92,
    significance: 'high',
    description: 'Mobile interface may need optimization',
    implications: ['Mobile UX improvement needed', 'Responsive design review'],
    actionable: true,
    relatedData: []
  },
  {
    id: 'pi-003',
    pattern: 'Questions 8-12 show consistent drop-off',
    frequency: 85,
    significance: 'medium',
    description: 'Mid-questionnaire fatigue pattern detected',
    implications: ['Questionnaire length optimization', 'Question reordering'],
    actionable: true,
    relatedData: []
  }
];

const mockAutomatedInsights: AutomatedInsight[] = [
  {
    id: 'ai-001',
    title: 'Completion Rate Optimization Opportunity',
    type: 'opportunity',
    priority: 'high',
    description: 'AI analysis suggests 15% completion rate improvement possible',
    evidence: ['Pattern analysis of 10,000+ responses', 'Mobile optimization gaps', 'Question sequencing issues'],
    recommendations: ['Implement mobile-first design', 'Reorder questions by difficulty', 'Add progress incentives'],
    confidence: 94,
    impact: '15% increase in completion rates, estimated 450 additional responses monthly',
    generatedAt: '2024-01-25T14:00:00Z'
  },
  {
    id: 'ai-002',
    title: 'Security Risk Score Trending Up',
    type: 'risk',
    priority: 'urgent',
    description: 'Risk algorithms detect increasing security exposure',
    evidence: ['MFA adoption declining', 'Policy review overdue', 'Incident response gaps'],
    recommendations: ['Immediate MFA implementation', 'Policy update initiative', 'Response team training'],
    confidence: 91,
    impact: 'Critical security risk increase of 12% over 30 days',
    generatedAt: '2024-01-25T13:45:00Z'
  },
  {
    id: 'ai-003',
    title: 'User Engagement Pattern Shift',
    type: 'alert',
    priority: 'medium',
    description: 'Behavioral patterns indicate changing user preferences',
    evidence: ['Decreased weekend activity', 'Increased mobile usage', 'Shorter session times'],
    recommendations: ['Adjust notification timing', 'Optimize mobile experience', 'Implement micro-interactions'],
    confidence: 87,
    impact: 'Potential 8% engagement improvement with proper adjustments',
    generatedAt: '2024-01-25T12:30:00Z'
  }
];

interface AIEnhancedAnalyticsProps {
  className?: string;
}

export function AIEnhancedAnalytics({ className }: AIEnhancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('predictive');
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Simulate real-time AI analysis
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate AI processing updates
      console.log('AI analysis running...');
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshAI = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Lightbulb;
      case 'risk': return AlertTriangle;
      case 'optimization': return Target;
      case 'alert': return Bell;
      default: return Info;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return ThumbsUp;
      case 'negative': return ThumbsDown;
      default: return Minus;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-notion-text-primary flex items-center">
            <Brain className="w-6 h-6 mr-3 text-purple-600" />
            AI-Enhanced Analytics
          </h2>
          <p className="text-sm text-notion-text-secondary">
            Advanced AI-powered insights and predictive analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <DaisySwitch 
              checked={isAIEnabled} 
              onCheckedChange={setIsAIEnabled}
              id="ai-toggle"
            />
            <label htmlFor="ai-toggle" className="text-sm text-notion-text-secondary">
              AI Analysis
            </label>
          </div>
          
          <DaisyButton 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAI}
            disabled={refreshing || !isAIEnabled}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh AI
          </DaisyButton>
        </div>
      </div>

      {!isAIEnabled && (
        <DaisyCard className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <DaisyCardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DaisyAlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-600">
                AI analysis is disabled. Enable to access predictive insights and advanced analytics.
              </p>
            </div>
          </DaisyCardContent>
        </DaisyCard>
      )}

      {/* AI Analytics Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <DaisyTabsList className="grid w-full grid-cols-6">
          <DaisyTabsTrigger value="predictive">Predictive</DaisyTabsTrigger>
          <DaisyTabsTrigger value="risk">Risk Scoring</DaisyTabsTrigger>
          <DaisyTabsTrigger value="anomalies">Anomalies</DaisyTabsTrigger>
          <DaisyTabsTrigger value="sentiment">Sentiment</DaisyTabsTrigger>
          <DaisyTabsTrigger value="patterns">Patterns</DaisyTabsTrigger>
          <DaisyTabsTrigger value="insights">Insights</DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Predictive Analytics Tab */}
        <DaisyTabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockPredictiveMetrics.map((metric, index) => {
              const TrendIcon = getTrendIcon(metric.trend);
              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DaisyCard>
                    <DaisyCardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-notion-text-secondary">
                          {metric.metric}
                        </h3>
                        <DaisyBadge className={getRiskColor(metric.impact)}>
                          {metric.impact}
                        </DaisyBadge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-bold text-notion-text-primary">
                            {metric.currentValue}
                            {metric.metric.includes('Rate') && '%'}
                          </span>
                          <span className="text-sm text-notion-text-tertiary">current</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <TrendIcon className={`w-4 h-4 ${getTrendColor(metric.trend)}`} />
                          <span className="text-sm font-medium text-notion-text-primary">
                            {metric.predictedValue}
                            {metric.metric.includes('Rate') && '%'} predicted
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-notion-text-tertiary">
                          <span>{metric.confidence}% confidence</span>
                          <span>{metric.timeframe}</span>
                        </div>
                        
                        <DaisyProgress value={metric.confidence} className="h-1" />
                      </div>
                    </DaisyCardContent>
                  </DaisyCard>
                </motion.div>
              );
            })}
          </div>

          {/* Predictive Chart */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Predictive Trends</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { name: 'Week 1', actual: 87, predicted: 89, confidence: 0.9 },
                  { name: 'Week 2', actual: 89, predicted: 91, confidence: 0.92 },
                  { name: 'Week 3', actual: 91, predicted: 92, confidence: 0.94 },
                  { name: 'Week 4', actual: null, predicted: 94, confidence: 0.91 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <DaisyTooltip />
                  <Legend />
                  <Bar dataKey="confidence" fill="#e0e7ff" opacity={0.3} />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Risk Scoring Tab */}
        <DaisyTabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockRiskScores.map((risk, index) => (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DaisyCard>
                  <DaisyCardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <DaisyCardTitle className="text-lg">{risk.category}</DaisyCardTitle>
                      <DaisyBadge className={getRiskColor(risk.riskLevel)}>
                        {risk.riskLevel}
                      </DaisyBadge>
                    </div>
                  
                  <DaisyCardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-notion-text-primary">
                          {risk.score}
                        </div>
                        <div className="text-sm text-notion-text-secondary">
                          out of {risk.maxScore}
                        </div>
                        <DaisyProgress value={(risk.score / risk.maxScore) * 100} className="mt-2" />
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-notion-text-primary mb-2">Risk Factors</h4>
                        <ul className="space-y-1">
                          {risk.factors.slice(0, 3).map((factor, i) => (
                            <li key={i} className="text-xs text-notion-text-secondary flex items-center">
                              <div className="w-1 h-1 bg-notion-text-tertiary rounded-full mr-2" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-notion-text-primary mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {risk.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="text-xs text-notion-text-secondary flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              </motion.div>
            ))}
          </div>
        </DaisyTabsContent>

        {/* Anomaly Detection Tab */}
        <DaisyTabsContent value="anomalies" className="space-y-6">
          <div className="space-y-4">
            {mockAnomalies.map((anomaly, index) => (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DaisyCard className={anomaly.severity === 'high' ? 'border-red-200 dark:border-red-800' : ''}>
                  <DaisyCardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge className={getRiskColor(anomaly.severity)}>
                            {anomaly.severity}
                          </DaisyBadge>
                          <DaisyBadge variant="outline">{anomaly.type.replace('_', ' ')}</DaisyBadge>
                          <span className="text-xs text-notion-text-tertiary">
                            {new Date(anomaly.detectedAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                          {anomaly.description}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-notion-text-secondary">Affected:</span>
                            <ul className="mt-1">
                              {anomaly.affectedEntities.map((entity, i) => (
                                <li key={i} className="text-notion-text-tertiary">{entity}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <span className="font-medium text-notion-text-secondary">Actions Taken:</span>
                            <ul className="mt-1">
                              {anomaly.automaticActions.map((action, i) => (
                                <li key={i} className="text-notion-text-tertiary">{action}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <span className="font-medium text-notion-text-secondary">Confidence:</span>
                            <div className="mt-1">
                              <DaisyProgress value={anomaly.confidence} className="h-2" />
                              <span className="text-xs text-notion-text-tertiary">{anomaly.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {anomaly.requiresReview && (
                        <DaisyButton variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </DaisyButton>
                      )}
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              </motion.div>
            ))}
          </div>
        </DaisyTabsContent>

        {/* Sentiment Analysis Tab */}
        <DaisyTabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <DaisyCard>
              <DaisyCardContent className="p-6 text-center">
                <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">68%</div>
                <div className="text-sm text-notion-text-secondary">Positive</div>
              </DaisyCardContent>
            </DaisyCard>
            <DaisyCard>
              <DaisyCardContent className="p-6 text-center">
                <Minus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">22%</div>
                <div className="text-sm text-notion-text-secondary">Neutral</div>
              </DaisyCardContent>
            </DaisyCard>
            <DaisyCard>
              <DaisyCardContent className="p-6 text-center">
                <ThumbsDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">10%</div>
                <div className="text-sm text-notion-text-secondary">Negative</div>
              </DaisyCardContent>
            </DaisyCard>
          </div>

          <div className="space-y-4">
            {mockSentimentData.map((sentiment, index) => {
              const SentimentIcon = getSentimentIcon(sentiment.sentiment);
              return (
                <motion.div
                  key={sentiment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DaisyCard>
                    <DaisyCardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <SentimentIcon className={`w-5 h-5 mt-1 ${getSentimentColor(sentiment.sentiment)}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-notion-text-primary">{sentiment.source}</h4>
                            <div className="flex items-center space-x-2">
                              <DaisyBadge variant="outline" className="text-xs">
                                {sentiment.confidence}% confidence
                              </DaisyBadge>
                              <span className="text-xs text-notion-text-tertiary">
                                {new Date(sentiment.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-notion-text-secondary mb-2">
                            {sentiment.context}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-notion-text-tertiary">Keywords:</span>
                            {sentiment.keywords.map((keyword, i) => (
                              <DaisyBadge key={i} variant="secondary" className="text-xs">
                                {keyword}
                              </DaisyBadge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DaisyCardContent>
                  </DaisyCard>
                </motion.div>
              );
            })}
          </div>
        </DaisyTabsContent>

        {/* Pattern Recognition Tab */}
        <DaisyTabsContent value="patterns" className="space-y-6">
          <div className="space-y-4">
            {mockPatternInsights.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <DaisyCard>
                  <DaisyCardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge className={getRiskColor(pattern.significance)}>
                            {pattern.significance}
                          </DaisyBadge>
                          <span className="text-sm text-notion-text-tertiary">
                            {pattern.frequency}% frequency
                          </span>
                          {pattern.actionable && (
                            <DaisyBadge variant="outline" className="text-xs">
                              Actionable
                            </DaisyBadge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                          {pattern.pattern}
                        </h3>
                        
                        <p className="text-sm text-notion-text-secondary mb-3">
                          {pattern.description}
                        </p>
                        
                        <div>
                          <h4 className="text-sm font-medium text-notion-text-primary mb-1">
                            Implications:
                          </h4>
                          <ul className="space-y-1">
                            {pattern.implications.map((implication, i) => (
                              <li key={i} className="text-sm text-notion-text-secondary flex items-center">
                                <div className="w-1 h-1 bg-notion-text-tertiary rounded-full mr-2" />
                                {implication}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <DaisyProgress value={pattern.frequency} className="w-16 h-2" />
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              </motion.div>
            ))}
          </div>
        </DaisyTabsContent>

        {/* Automated Insights Tab */}
        <DaisyTabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {mockAutomatedInsights.map((insight, index) => {
              const IconComponent = getInsightTypeIcon(insight.type);
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DaisyCard className={insight.priority === 'urgent' ? 'border-red-200 dark:border-red-800' : ''}>
                    <DaisyCardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          insight.type === 'opportunity' ? 'bg-green-100 dark:bg-green-900/20' :
                          insight.type === 'risk' ? 'bg-red-100 dark:bg-red-900/20' :
                          insight.type === 'optimization' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          'bg-yellow-100 dark:bg-yellow-900/20'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            insight.type === 'opportunity' ? 'text-green-600' :
                            insight.type === 'risk' ? 'text-red-600' :
                            insight.type === 'optimization' ? 'text-blue-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-notion-text-primary">
                              {insight.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <DaisyBadge className={getRiskColor(insight.priority)}>
                                {insight.priority}
                              </DaisyBadge>
                              <span className="text-xs text-notion-text-tertiary">
                                {insight.confidence}% confidence
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-notion-text-secondary mb-3">
                            {insight.description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-notion-text-primary mb-1">
                                Evidence:
                              </h4>
                              <ul className="space-y-1">
                                {insight.evidence.map((evidence, i) => (
                                  <li key={i} className="text-xs text-notion-text-secondary flex items-start">
                                    <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                                    {evidence}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-notion-text-primary mb-1">
                                Recommendations:
                              </h4>
                              <ul className="space-y-1">
                                {insight.recommendations.map((rec, i) => (
                                  <li key={i} className="text-xs text-notion-text-secondary flex items-start">
                                    <Target className="w-3 h-3 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="bg-notion-bg-tertiary rounded-lg p-3">
                            <h4 className="text-sm font-medium text-notion-text-primary mb-1">
                              Expected Impact:
                            </h4>
                            <p className="text-sm text-notion-text-secondary">
                              {insight.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DaisyCardContent>
                  </DaisyCard>
                </motion.div>
              );
            })}
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
} 
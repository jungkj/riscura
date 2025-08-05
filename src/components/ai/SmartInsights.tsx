'use client';

import React, { useState, useEffect } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
// import {
  StatusIcons,
  RiskManagementIcons,
  DataIcons,
  NavigationIcons,
  ActionIcons,
} from '@/components/icons/IconLibrary';
import { LoadingStates } from '@/components/states/LoadingState';
import { EmptyStates } from '@/components/states/EmptyState';

// Insight types and interfaces
interface Insight {
  id: string
  type: 'risk' | 'compliance' | 'control' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  timestamp: Date;
  data?: any;
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary';
    action: () => void;
  }>;
  sources?: string[];
  relatedInsights?: string[];
}

interface SmartInsightsProps {
  context?: 'dashboard' | 'risk-assessment' | 'compliance' | 'audit' | 'general';
  filters?: {
    types?: string[];
    severity?: string[];
    categories?: string[];
  }
  onInsightAction?: (insightId: string, actionId: string) => void;
  onInsightDismiss?: (insightId: string) => void;
  className?: string;
}

// Mock insights data (replace with actual AI service)
const generateMockInsights = (_context: string): Insight[] => {
  const baseInsights: Insight[] = [
    {
      id: 'risk-trend-1',
      type: 'trend',
      title: 'Increasing Cybersecurity Risk Trend',
      description:
        'AI analysis shows a 35% increase in cybersecurity incidents across your risk categories over the past 3 months. This trend correlates with increased remote work and third-party integrations.',
      severity: 'high',
      confidence: 0.92,
      impact: 'high',
      category: 'Cybersecurity',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      data: {
        trendPercentage: 35,
        timeframe: '3 months',
        affectedCategories: ['Data Security', 'Access Control', 'Third-party Risk'],
      },
      actions: [
        {
          id: 'review-controls',
          label: 'Review Security Controls',
          type: 'primary',
          action: () => {},
        },
        {
          id: 'schedule-assessment',
          label: 'Schedule Risk Assessment',
          type: 'secondary',
          action: () => {},
        },
      ],
      sources: ['Risk Register', 'Incident Reports', 'Industry Benchmarks'],
    },
    {
      id: 'compliance-gap-1',
      type: 'compliance',
      title: 'GDPR Compliance Gap Detected',
      description:
        'AI review identified potential gaps in your GDPR compliance framework. Data retention policies for 3 systems lack proper documentation, and consent management needs updating.',
      severity: 'medium',
      confidence: 0.87,
      impact: 'medium',
      category: 'Data Privacy',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      data: {
        framework: 'GDPR',
        gapCount: 3,
        affectedSystems: ['CRM', 'Analytics Platform', 'Marketing Automation'],
      },
      actions: [
        { id: 'update-policies', label: 'Update Data Policies', type: 'primary', action: () => {} },
        {
          id: 'audit-systems',
          label: 'Audit Affected Systems',
          type: 'secondary',
          action: () => {},
        },
      ],
      sources: ['Compliance Dashboard', 'System Audits', 'Legal Requirements'],
    },
    {
      id: 'control-recommendation-1',
      type: 'recommendation',
      title: 'Automated Monitoring Recommendation',
      description:
        'Based on your current risk profile, implementing automated security monitoring could reduce incident response time by 60% and improve threat detection by 45%.',
      severity: 'medium',
      confidence: 0.84,
      impact: 'high',
      category: 'Security Controls',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      data: {
        expectedImprovement: {
          responseTime: '60%',
          threatDetection: '45%',
        },
        estimatedCost: '$25,000',
        implementationTime: '6-8 weeks',
      },
      actions: [
        {
          id: 'get-proposal',
          label: 'Get Implementation Proposal',
          type: 'primary',
          action: () => {},
        },
        { id: 'cost-analysis', label: 'View Cost Analysis', type: 'secondary', action: () => {} },
      ],
      sources: ['Control Assessments', 'Industry Benchmarks', 'Vendor Analysis'],
    },
    {
      id: 'alert-1',
      type: 'alert',
      title: 'Critical Risk Threshold Exceeded',
      description:
        'The operational risk score for your supply chain has exceeded the critical threshold (85/100). This is primarily due to recent vendor security incidents and supply chain disruptions.',
      severity: 'critical',
      confidence: 0.96,
      impact: 'high',
      category: 'Operational Risk',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      data: {
        currentScore: 85,
        threshold: 80,
        primaryFactors: [
          'Vendor Security Incidents',
          'Supply Chain Disruptions',
          'Dependency Concentration',
        ],
      },
      actions: [
        {
          id: 'immediate-review',
          label: 'Immediate Risk Review',
          type: 'primary',
          action: () => {},
        },
        {
          id: 'vendor-assessment',
          label: 'Assess Key Vendors',
          type: 'secondary',
          action: () => {},
        },
      ],
      sources: ['Risk Monitoring', 'Vendor Assessments', 'External Intelligence'],
    },
    {
      id: 'risk-correlation-1',
      type: 'risk',
      title: 'Risk Correlation Pattern Identified',
      description:
        'AI analysis discovered a strong correlation between IT system downtime and customer satisfaction scores. When system availability drops below 99.5%, customer satisfaction decreases by an average of 12%.',
      severity: 'medium',
      confidence: 0.89,
      impact: 'medium',
      category: 'Business Continuity',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      data: {
        correlation: 0.78,
        threshold: '99.5%',
        impactPercentage: '12%',
      },
      actions: [
        { id: 'improve-sla', label: 'Review SLA Requirements', type: 'primary', action: () => {} },
        { id: 'redundancy-plan', label: 'Enhance Redundancy', type: 'secondary', action: () => {} },
      ],
      sources: ['System Monitoring', 'Customer Surveys', 'Performance Analytics'],
    },
  ]

  // Filter insights based on context
  return baseInsights.filter((insight) => {
    switch (context) {
      case 'risk-assessment':
        return ['risk', 'trend', 'recommendation'].includes(insight.type)
      case 'compliance':
        return ['compliance', 'alert'].includes(insight.type);
      case 'audit':
        return ['compliance', 'control', 'recommendation'].includes(insight.type);
      case 'dashboard':
        return insight.severity === 'high' || insight.severity === 'critical';
      default:
        return true;
    }
  });
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  context = 'general',
  filters,
  onInsightAction,
  onInsightDismiss,
  className = '',
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity' | 'confidence'>('timestamp');

  // Load insights
  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const mockInsights = generateMockInsights(context);
        setInsights(mockInsights);
      } catch (error) {
        // console.error('Failed to load insights:', error)
      } finally {
        setIsLoading(false);
      }
    }

    loadInsights();
  }, [context]);

  // Filter and sort insights
  const filteredInsights = insights
    .filter((insight) => {
      if (!filters) return true

      if (filters.types && !filters.types.includes(insight.type)) return false;
      if (filters.severity && !filters.severity.includes(insight.severity)) return false;
      if (filters.categories && !filters.categories.includes(insight.category)) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'confidence':
          return b.confidence - a.confidence;
        case 'timestamp':
        default:
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }

  const getTypeIcon = (_type: string) => {
    switch (type) {
      case 'risk':
        return RiskManagementIcons.Risk;
      case 'compliance':
        return RiskManagementIcons.Compliance;
      case 'control':
        return RiskManagementIcons.Control;
      case 'trend':
        return DataIcons.TrendingUp;
      case 'recommendation':
        return StatusIcons.Info;
      case 'alert':
        return StatusIcons.AlertTriangle;
      default:
        return DataIcons.BarChart3;
    }
  }

  const handleInsightAction = (insightId: string, actionId: string) => {
    if (onInsightAction) {
      onInsightAction(insightId, actionId);
    }
  }

  const handleInsightDismiss = (insightId: string) => {
    setInsights((prev) => prev.filter((insight) => insight.id !== insightId));
    if (onInsightDismiss) {
      onInsightDismiss(insightId);
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
        <LoadingStates.Dashboard />
      </div>
    );
  }

  if (filteredInsights.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <EmptyStates.NoData
          title="No insights available"
          description="AI analysis hasn't identified any insights for your current context. Check back later as new data becomes available."
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DataIcons.BarChart3 size="md" color="primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Smart Insights</h2>
              <p className="text-sm text-gray-500">AI-powered analysis and recommendations</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="timestamp">Latest First</option>
              <option value="severity">By Severity</option>
              <option value="confidence">By Confidence</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm rounded-l-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-r-md border-l border-gray-300 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map((severity) => {
            const count = filteredInsights.filter((i) => i.severity === severity).length;
            return (
              <div key={severity} className="text-center">
                <div
                  className={`text-lg font-semibold ${getSeverityColor(severity).split(' ')[0]}`}
                >
                  {count}
                </div>
                <div className="text-xs text-gray-500 capitalize">{severity}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Content */}
      <div className="p-6">
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInsights.map((insight) => {
              const IconComponent = getTypeIcon(insight.type);
              return (
                <div
                  key={insight.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Insight Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent size="sm" color="secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {insight.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(insight.severity)}`}
                          >
                            {insight.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInsightDismiss(insight.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      aria-label="Dismiss insight"
                    >
                      <NavigationIcons.Close size="xs" />
                    </button>
                  </div>

                  {/* Insight Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {insight.description}
                  </p>

                  {/* Insight Data */}
                  {insight.data && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <div className="text-xs text-gray-500 mb-2">Key Metrics</div>
                      <div className="space-y-1">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-medium text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {insight.actions && insight.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {insight.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleInsightAction(insight.id, action.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            action.type === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span>{insight.category}</span>
                      {insight.sources && (
                        <>
                          <span>•</span>
                          <span>{insight.sources.length} sources</span>
                        </>
                      )}
                    </div>
                    <span>{insight.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredInsights.map((insight) => {
              const IconComponent = getTypeIcon(insight.type);
              return (
                <div
                  key={insight.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent size="sm" color="secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {insight.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(insight.severity)}`}
                      >
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{insight.description}</p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{Math.round(insight.confidence * 100)}%</span>
                    <span>{insight.timestamp.toLocaleTimeString()}</span>
                  </div>

                  <button
                    onClick={() => handleInsightDismiss(insight.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Dismiss insight"
                  >
                    <NavigationIcons.Close size="xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartInsights;

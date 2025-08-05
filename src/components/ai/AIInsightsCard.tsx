'use client';

import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCardTitle, DaisyTabsTrigger } from '@/components/ui/daisy-components';
// import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  BarChart3,
  Zap,
  Star,
  Clock,
  ArrowRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIInsight {
  id: string;
  type: 'risk_analysis' | 'control_recommendation' | 'compliance_gap' | 'trend_prediction' | 'anomaly_detection';
  title: string;
  description: string;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  timestamp: Date;
  metadata: {
    impact?: number;
    likelihood?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    recommendedActions?: string[];
    relatedRisks?: string[];
    frameworks?: string[];
    dataPoints?: number;
    accuracy?: number;
  }
  actions?: Array<{
    label: string;
    action: string;
    parameters?: any;
  }>;
}

interface AIInsightsCardProps {
  organizationId: string;
  context?: {
    currentPage?: string;
    selectedRisk?: string;
    selectedControl?: string;
  }
  onActionTrigger?: (_action: string, parameters?: any) => void;
  onInsightInteraction?: (insightId: string, interaction: 'view' | 'like' | 'dislike' | 'bookmark') => void;
  className?: string;
}

export default function AIInsightsCard({
  organizationId,
  context,
  onActionTrigger,
  onInsightInteraction,
  className = ''
}: AIInsightsCardProps) {
  const { toast } = useToast();
  
  // State management
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [bookmarkedInsights, setBookmarkedInsights] = useState<Set<string>>(new Set());

  // Fetch insights on component mount
  useEffect(() => {
    fetchInsights()
  }, [organizationId]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch AI insights
      // In real implementation, this would call multiple AI endpoints
      const mockInsights: AIInsight[] = [
        {
          id: 'insight-1',
          type: 'risk_analysis',
          title: 'Elevated Cybersecurity Risk Detected',
          description: 'Analysis indicates a 23% increase in cybersecurity risk exposure over the past 30 days, primarily driven by increased remote work patterns and new cloud service adoption.',
          confidence: 0.87,
          priority: 'HIGH',
          category: 'Cybersecurity',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          metadata: {
            impact: 4.2,
            likelihood: 3.8,
            trend: 'increasing',
            recommendedActions: [
              'Implement additional MFA requirements',
              'Conduct security awareness training',
              'Review cloud service configurations'
            ],
            relatedRisks: ['Data Breach', 'Unauthorized Access', 'Cloud Misconfiguration'],
            dataPoints: 1247
          },
          actions: [
            { label: 'View Risk Details', action: 'view_risk', parameters: { category: 'Cybersecurity' } },
            { label: 'Generate Action Plan', action: 'create_action_plan', parameters: { type: 'cybersecurity' } }
          ]
        },
        {
          id: 'insight-2',
          type: 'control_recommendation',
          title: 'Automated Control Optimization Opportunity',
          description: 'AI analysis suggests implementing automated compliance monitoring could reduce manual effort by 40% while improving control effectiveness by 15%.',
          confidence: 0.92,
          priority: 'MEDIUM',
          category: 'Process Automation',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          metadata: {
            impact: 3.5,
            recommendedActions: [
              'Deploy automated monitoring tools',
              'Establish real-time dashboards',
              'Set up automated alerts'
            ],
            frameworks: ['SOC 2', 'ISO 27001'],
            accuracy: 0.89
          },
          actions: [
            { label: 'View Control Library', action: 'view_controls' },
            { label: 'Start Implementation', action: 'implement_control' }
          ]
        },
        {
          id: 'insight-3',
          type: 'compliance_gap',
          title: 'GDPR Compliance Gap Identified',
          description: 'Potential compliance gap detected in data retention policies. Current practices may not fully align with GDPR Article 5 requirements for data minimization.',
          confidence: 0.78,
          priority: 'HIGH',
          category: 'Regulatory Compliance',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          metadata: {
            frameworks: ['GDPR'],
            recommendedActions: [
              'Review data retention schedules',
              'Update privacy policies',
              'Implement automated data deletion'
            ],
            dataPoints: 892
          },
          actions: [
            { label: 'View Compliance Status', action: 'view_compliance' },
            { label: 'Schedule Review', action: 'schedule_review' }
          ]
        },
        {
          id: 'insight-4',
          type: 'trend_prediction',
          title: 'Operational Risk Trend Analysis',
          description: 'Predictive models indicate operational risks are likely to decrease by 12% over the next quarter due to recent process improvements and staff training initiatives.',
          confidence: 0.84,
          priority: 'LOW',
          category: 'Operational Risk',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          metadata: {
            trend: 'decreasing',
            accuracy: 0.91,
            dataPoints: 2156,
            recommendedActions: [
              'Continue current improvement initiatives',
              'Monitor key performance indicators',
              'Plan for resource reallocation'
            ]
          },
          actions: [
            { label: 'View Trend Analysis', action: 'view_trends' },
            { label: 'Update Forecasts', action: 'update_forecasts' }
          ]
        },
        {
          id: 'insight-5',
          type: 'anomaly_detection',
          title: 'Unusual Pattern in Control Testing',
          description: 'Anomaly detection algorithms identified an unusual pattern in control testing results for financial reporting controls, suggesting potential systematic issues.',
          confidence: 0.73,
          priority: 'MEDIUM',
          category: 'Internal Controls',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          metadata: {
            impact: 3.8,
            likelihood: 2.9,
            recommendedActions: [
              'Investigate testing methodology',
              'Review control design',
              'Conduct additional testing'
            ],
            frameworks: ['SOX', 'COSO'],
            dataPoints: 567
          },
          actions: [
            { label: 'Investigate Anomaly', action: 'investigate_anomaly' },
            { label: 'Run Diagnostics', action: 'run_diagnostics' }
          ]
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setInsights(mockInsights);
    } catch (error) {
      // console.error('Error fetching insights:', error)
      toast({
        title: 'Error',
        description: 'Failed to load AI insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Filter insights based on active tab
  const filteredInsights = insights.filter(insight => {
    if (activeTab === 'all') return true
    if (activeTab === 'high-priority') return ['HIGH', 'CRITICAL'].includes(insight.priority);
    if (activeTab === 'recommendations') return insight.type === 'control_recommendation';
    if (activeTab === 'risks') return insight.type === 'risk_analysis';
    if (activeTab === 'compliance') return insight.type === 'compliance_gap';
    return false;
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  // Get type icon
  const getTypeIcon = (_type: string) => {
    switch (type) {
      case 'risk_analysis': return <DaisyAlertTriangle className="w-4 h-4" >
  
</DaisyAlertTriangle>
      case 'control_recommendation': return <Target className="w-4 h-4" />;
      case 'compliance_gap': return <CheckCircle2 className="w-4 h-4" />;
      case 'trend_prediction': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly_detection': return <Eye className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  }

  // Handle insight interaction
  const handleInsightInteraction = (insightId: string, interaction: 'view' | 'like' | 'dislike' | 'bookmark') => {
    if (interaction === 'bookmark') {
      setBookmarkedInsights(prev => {
        const newSet = new Set(prev)
        if (newSet.has(insightId)) {
          newSet.delete(insightId);
        } else {
          newSet.add(insightId);
        }
        return newSet;
      });
    }
    
    onInsightInteraction?.(insightId, interaction);
  }

  // Handle action trigger
  const handleActionTrigger = (_action: string, parameters?: any) => {
    onActionTrigger?.(action, parameters)
  }

  // Share insight
  const shareInsight = (insight: AIInsight) => {
    const shareText = `AI Insight: ${insight.title}\n\n${insight.description}\n\nConfidence: ${Math.round(insight.confidence * 100)}%`
    
    if (navigator.share) {
      navigator.share({
        title: insight.title,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied',
        description: 'Insight copied to clipboard',
      });
    }
  }

  if (isLoading) {

  return (
    <DaisyCard className={className} >
  <DaisyCardBody >
</DaisyCard>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <DaisyCardTitle className="text-lg">AI Insights</DaisyCardTitle>
          </div>
        
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return (
    <DaisyCard className={className} >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <DaisyCardTitle className="text-lg">AI Insights</DaisyCardTitle>
            <DaisyBadge variant="secondary" className="text-xs" >
  <Zap className="w-3 h-3 mr-1" />
</DaisyBadge>
              {insights.length} insights
            </DaisyBadge>
          </div>
          
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={isLoading}
            className="p-2" >
  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
</DaisyButton>
          </DaisyButton>
        </div>
      

      <DaisyCardBody className="p-0" >
  <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full" >
</DaisyCardBody>
          <DaisyTabsList className="grid w-full grid-cols-5 mx-4 mb-4" >
              <DaisyTabsTrigger value="all" className="text-xs">All</DaisyTabsList>
            <DaisyTabsTrigger value="high-priority" className="text-xs">Priority</DaisyTabsTrigger>
            <DaisyTabsTrigger value="risks" className="text-xs">Risks</DaisyTabsTrigger>
            <DaisyTabsTrigger value="recommendations" className="text-xs">Controls</DaisyTabsTrigger>
            <DaisyTabsTrigger value="compliance" className="text-xs">Compliance</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value={activeTab} className="mt-0" >
              <div className="max-h-96 overflow-y-auto px-4">
              {filteredInsights.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No insights available for this filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedInsight(insight)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="text-purple-600">
                            {getTypeIcon(insight.type)}
                          </div>
                          <DaisyBadge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(insight.priority)}`}
                          >
                            {insight.priority}
                          </DaisyTabsContent>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <DaisyButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightInteraction(insight.id, 'bookmark');
                            }}
                            className="p-1 h-6 w-6"
                          >
                            <Bookmark
                              className={`w-3 h-3 ${
                                bookmarkedInsights.has(insight.id) ? 'fill-current text-yellow-500' : ''
                              }`} />
                          </DaisyButton>
                          
                          <DaisyButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareInsight(insight);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            <Share2 className="w-3 h-3" />
                          </DaisyButton>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-2">{insight.title}</h4>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {insight.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-gray-500">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </div>
                          <DaisyProgress
                            value={insight.confidence * 100}
                            className="w-16 h-1" />
</div>
                        
                        <div className="text-xs text-gray-500">
                          {insight.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {insight.actions && insight.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {insight.actions.slice(0, 2).map((action, index) => (
                            <DaisyButton
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionTrigger(action.action, action.parameters);
                              }}
                              className="text-xs h-6 px-2"
                            >
                              {action.label}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </DaisyProgress>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </DaisyCardBody>

      {/* Detailed Insight Modal/Panel */}
      {Boolean(selectedInsight) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-purple-600">
                    {getTypeIcon(selectedInsight.type)}
                  </div>
                  <h3 className="text-lg font-semibold">{selectedInsight.title}</h3>
                </div>
                
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
          setSelectedInsight(null)}
                  className="p-2" />
                  ×
                
        </DaisyButton>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <DaisyBadge
                    variant="outline"
                    className={`${getPriorityColor(selectedInsight.priority)}`}
                  >
                    {selectedInsight.priority} Priority
                  </DaisyBadge>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <DaisyProgress
                      value={selectedInsight.confidence * 100}
                      className="w-24 h-2" />
<span className="text-sm font-medium">
                      {Math.round(selectedInsight.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700">{selectedInsight.description}</p>
                
                {selectedInsight.metadata.recommendedActions && (
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {selectedInsight.metadata.recommendedActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedInsight.actions && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {selectedInsight.actions.map((action, index) => (
                      <DaisyButton
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleActionTrigger(action.action, action.parameters);
                          setSelectedInsight(null);
                        }}
                      >
                        {action.label}
                      </DaisyProgress>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsightInteraction(selectedInsight.id, 'like')} />
                      <ThumbsUp className="w-4 h-4" />
                    </DaisyButton>
                    
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsightInteraction(selectedInsight.id, 'dislike')} />
                      <ThumbsDown className="w-4 h-4" />
                    </DaisyButton>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {selectedInsight.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DaisyCard>
  );
} 
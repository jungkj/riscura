import React, { useState, useEffect } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { toast } from 'sonner';
import {
  Bot,
  Sparkles,
  Brain,
  Search,
  FileText,
  BarChart3,
  Shield,
  Lightbulb,
  Zap,
  Settings,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Eye,
  MessageSquare,
} from 'lucide-react';

// Import our AI services
import { aiService, AIAgent } from '@/lib/mockAI';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'ANALYSIS' | 'GENERATION' | 'OPTIMIZATION' | 'INSIGHTS';
  agentType: 'RISK_ANALYST' | 'COMPLIANCE_EXPERT' | 'CONTROL_AUDITOR' | 'POLICY_REVIEWER' | 'GENERAL_ASSISTANT';
  requiresData: boolean;
  estimatedTime: string;
  action: (context?: any) => Promise<void>;
}

interface AIActionResult {
  id: string;
  actionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  confidence?: number;
}

// ============================================================================
// AI ACTION DEFINITIONS
// ============================================================================

const createAIActions = (
  onAnalyzeRisk: (context: any) => Promise<void>,
  onGenerateReport: (context: any) => Promise<void>,
  onOptimizeControls: (context: any) => Promise<void>,
  onGetInsights: (context: any) => Promise<void>,
  onAnalyzeCompliance: (context: any) => Promise<void>,
  onGenerateQuestions: (context: any) => Promise<void>,
  onAnalyzeDocument: (context: any) => Promise<void>,
  onPredictTrends: (context: any) => Promise<void>
): AIAction[] => [
  {
    id: 'analyze-risk',
    name: 'Analyze Risk',
    description: 'AI-powered risk analysis with scoring and recommendations',
    icon: Shield,
    category: 'ANALYSIS',
    agentType: 'RISK_ANALYST',
    requiresData: true,
    estimatedTime: '30-60s',
    action: onAnalyzeRisk,
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Create comprehensive risk or compliance reports',
    icon: FileText,
    category: 'GENERATION',
    agentType: 'GENERAL_ASSISTANT',
    requiresData: true,
    estimatedTime: '45-90s',
    action: onGenerateReport,
  },
  {
    id: 'optimize-controls',
    name: 'Optimize Controls',
    description: 'Analyze and suggest control improvements',
    icon: Target,
    category: 'OPTIMIZATION',
    agentType: 'CONTROL_AUDITOR',
    requiresData: true,
    estimatedTime: '60-120s',
    action: onOptimizeControls,
  },
  {
    id: 'get-insights',
    name: 'Get Insights',
    description: 'Extract key insights from your risk data',
    icon: Lightbulb,
    category: 'INSIGHTS',
    agentType: 'RISK_ANALYST',
    requiresData: true,
    estimatedTime: '30-45s',
    action: onGetInsights,
  },
  {
    id: 'analyze-compliance',
    name: 'Compliance Analysis',
    description: 'Assess compliance gaps and requirements',
    icon: CheckCircle,
    category: 'ANALYSIS',
    agentType: 'COMPLIANCE_EXPERT',
    requiresData: true,
    estimatedTime: '45-75s',
    action: onAnalyzeCompliance,
  },
  {
    id: 'generate-questions',
    name: 'Generate Questions',
    description: 'Create assessment questionnaires',
    icon: MessageSquare,
    category: 'GENERATION',
    agentType: 'GENERAL_ASSISTANT',
    requiresData: false,
    estimatedTime: '20-30s',
    action: onGenerateQuestions,
  },
  {
    id: 'analyze-document',
    name: 'Document Analysis',
    description: 'Extract risks and controls from documents',
    icon: Search,
    category: 'ANALYSIS',
    agentType: 'POLICY_REVIEWER',
    requiresData: true,
    estimatedTime: '60-90s',
    action: onAnalyzeDocument,
  },
  {
    id: 'predict-trends',
    name: 'Predict Trends',
    description: 'Generate predictive risk insights',
    icon: TrendingUp,
    category: 'INSIGHTS',
    agentType: 'RISK_ANALYST',
    requiresData: true,
    estimatedTime: '90-120s',
    action: onPredictTrends,
  },
];

// ============================================================================
// AI ACTION TOOLBAR COMPONENT
// ============================================================================

interface AIActionToolbarProps {
  context?: any;
  selectedData?: any[];
  onActionComplete?: (result: any) => void;
}

const AIActionToolbar: React.FC<AIActionToolbarProps> = ({
  context,
  selectedData,
  onActionComplete,
}) => {
  const [availableAgents, setAvailableAgents] = useState<AIAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [runningActions, setRunningActions] = useState<Map<string, AIActionResult>>(new Map());
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isAIEnabled, setIsAIEnabled] = useState(false);

  // Check if AI is enabled and load agents
  useEffect(() => {
    const checkAIStatus = async () => {
      const enabled = aiService.isEnabled();
      setIsAIEnabled(enabled);
      
      if (enabled) {
        try {
          const agents = await aiService.agents.getAvailableAgents();
          setAvailableAgents(agents);
          
          if (agents.length > 0) {
            setSelectedAgent(agents[0].id);
          }
          
          const stats = await aiService.usage.getUsageStats('30d');
          setUsageStats(stats);
        } catch (error) {
          console.error('Failed to load AI agents:', error);
        }
      }
    };
    
    checkAIStatus();
  }, []);

  // AI Action Handlers
  const handleAnalyzeRisk = async (actionContext?: any) => {
    const riskData = actionContext || context;
    if (!riskData) {
      toast.error('No risk data available for analysis');
      return;
    }

    try {
      const analysis = await aiService.risk.analyzeRisk({
        title: riskData.title || 'Untitled Risk',
        description: riskData.description || '',
        category: riskData.category,
        context: riskData,
      });

      toast.success('Risk analysis completed');
      onActionComplete?.(analysis);
    } catch (error) {
      toast.error('Failed to analyze risk');
      throw error;
    }
  };

  const handleGenerateReport = async (actionContext?: any) => {
    const reportData = actionContext || { risks: selectedData, context };
    
    try {
      // For now, we'll create a simple report structure
      // In a real implementation, this would call a report generation service
      const report = {
        title: 'AI-Generated Risk Report',
        generatedAt: new Date().toISOString(),
        summary: 'Comprehensive risk analysis report generated by AI',
        sections: [
          {
            title: 'Executive Summary',
            content: 'AI-generated executive summary of risk landscape...',
          },
          {
            title: 'Risk Analysis',
            content: 'Detailed analysis of identified risks...',
          },
          {
            title: 'Recommendations',
            content: 'AI-generated recommendations for risk mitigation...',
          },
        ],
        data: reportData,
      };

      toast.success('Report generated successfully');
      onActionComplete?.(report);
    } catch (error) {
      toast.error('Failed to generate report');
      throw error;
    }
  };

  const handleOptimizeControls = async (actionContext?: any) => {
    const controlData = actionContext || context;
    
    try {
      if (controlData?.id) {
        const optimization = await aiService.control.suggestControlImprovements(
          controlData.id,
          controlData
        );
        
        toast.success('Control optimization completed');
        onActionComplete?.(optimization);
      } else {
        throw new Error('No control data available');
      }
    } catch (error) {
      toast.error('Failed to optimize controls');
      throw error;
    }
  };

  const handleGetInsights = async (actionContext?: any) => {
    const dashboardData = actionContext || { context, selectedData };
    
    try {
      const insights = await aiService.insights.generateDashboardInsights(dashboardData);
      
      toast.success('Insights generated successfully');
      onActionComplete?.(insights);
    } catch (error) {
      toast.error('Failed to generate insights');
      throw error;
    }
  };

  const handleAnalyzeCompliance = async (actionContext?: any) => {
    const complianceData = actionContext || context;
    
    try {
      const analysis = await aiService.compliance.analyzeComplianceGaps(
        complianceData?.framework || 'ISO27001',
        complianceData
      );
      
      toast.success('Compliance analysis completed');
      onActionComplete?.(analysis);
    } catch (error) {
      toast.error('Failed to analyze compliance');
      throw error;
    }
  };

  const handleGenerateQuestions = async (actionContext?: any) => {
    const questionContext = actionContext || context;
    
    try {
      const questions = await aiService.risk.generateRiskQuestions(
        questionContext?.category || 'OPERATIONAL',
        questionContext
      );
      
      toast.success('Questions generated successfully');
      onActionComplete?.(questions);
    } catch (error) {
      toast.error('Failed to generate questions');
      throw error;
    }
  };

  const handleAnalyzeDocument = async (actionContext?: any) => {
    const documentData = actionContext || context;
    
    if (!documentData?.content) {
      toast.error('No document content available for analysis');
      return;
    }

    try {
      const analysis = await aiService.document.extractDocumentMetadata(documentData.content);
      
      toast.success('Document analysis completed');
      onActionComplete?.(analysis);
    } catch (error) {
      toast.error('Failed to analyze document');
      throw error;
    }
  };

  const handlePredictTrends = async (actionContext?: any) => {
    const trendData = actionContext || { historicalData: selectedData, context };
    
    try {
      const predictions = await aiService.insights.generatePredictiveInsights(
        trendData.historicalData || [],
        '3months'
      );
      
      toast.success('Trend predictions generated');
      onActionComplete?.(predictions);
    } catch (error) {
      toast.error('Failed to predict trends');
      throw error;
    }
  };

  // Create AI actions with handlers
  const aiActions = createAIActions(
    handleAnalyzeRisk,
    handleGenerateReport,
    handleOptimizeControls,
    handleGetInsights,
    handleAnalyzeCompliance,
    handleGenerateQuestions,
    handleAnalyzeDocument,
    handlePredictTrends
  );

  // Execute AI action
  const executeAction = async (action: AIAction) => {
    if (!isAIEnabled) {
      toast.error('AI features are not enabled');
      return;
    }

    const actionResult: AIActionResult = {
      id: `${action.id}-${Date.now()}`,
      actionId: action.id,
      status: 'RUNNING',
      startTime: new Date().toISOString(),
    };

    setRunningActions(prev => new Map(prev.set(actionResult.id, actionResult)));

    try {
      await action.action(context);
      
      const completedResult = {
        ...actionResult,
        status: 'COMPLETED' as const,
        endTime: new Date().toISOString(),
      };
      
      setRunningActions(prev => new Map(prev.set(actionResult.id, completedResult)));
      
      // Remove completed action after 3 seconds
      setTimeout(() => {
        setRunningActions(prev => {
          const newMap = new Map(prev);
          newMap.delete(actionResult.id);
          return newMap;
        });
      }, 3000);
      
    } catch (error) {
      const failedResult = {
        ...actionResult,
        status: 'FAILED' as const,
        endTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      setRunningActions(prev => new Map(prev.set(actionResult.id, failedResult)));
      
      // Remove failed action after 5 seconds
      setTimeout(() => {
        setRunningActions(prev => {
          const newMap = new Map(prev);
          newMap.delete(actionResult.id);
          return newMap;
        });
      }, 5000);
    }
  };

  // Get actions by category
  const actionsByCategory = aiActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, AIAction[]>);

  // Check if action is currently running
  const isActionRunning = (actionId: string) => {
    return Array.from(runningActions.values()).some(
      result => result.actionId === actionId && result.status === 'RUNNING'
    );
  };

  if (!isAIEnabled) {
    return (
      <DaisyCard className="border-dashed">
        <DaisyCardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">AI features are not enabled</p>
            <p className="text-xs text-gray-500 mt-1">
              Contact your administrator to enable AI capabilities
            </p>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Toolbar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">AI Assistant</h3>
          <DaisyBadge variant="secondary" className="text-xs">
            {availableAgents.length} agents
          </DaisyBadge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Agent Selector */}
          <DaisySelect value={selectedAgent} onValueChange={setSelectedAgent}>
            <DaisySelectTrigger className="w-40">
              <DaisySelectValue placeholder="Select agent" />
            </SelectTrigger>
            <DaisySelectContent>
              {availableAgents.map((agent) => (
                <DaisySelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </DaisySelect>

          {/* Usage Stats */}
          {usageStats && (
            <Popover>
              <PopoverTrigger asChild>
                <DaisyButton variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Usage
                </DaisyButton>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium">AI Usage (30 days)</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Requests</div>
                      <div className="font-medium">{usageStats.totalRequests?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Tokens</div>
                      <div className="font-medium">{usageStats.totalTokens?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="font-medium">${usageStats.totalCost?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Response</div>
                      <div className="font-medium">
                        {usageStats.avgResponseTime ? `${usageStats.avgResponseTime}ms` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Running Actions Status */}
      {runningActions.size > 0 && (
        <DaisyCard>
          <DaisyCardContent className="py-3">
            <div className="space-y-2">
              {Array.from(runningActions.values()).map((result) => {
                const action = aiActions.find(a => a.id === result.actionId);
                if (!action) return null;

                return (
                  <div key={result.id} className="flex items-center gap-3">
                    {result.status === 'RUNNING' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {result.status === 'COMPLETED' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {result.status === 'FAILED' && (
                      <DaisyAlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium">{action.name}</div>
                      {result.status === 'RUNNING' && (
                        <div className="text-xs text-gray-600">
                          Running... (est. {action.estimatedTime})
                        </div>
                      )}
                      {result.status === 'FAILED' && result.error && (
                        <div className="text-xs text-red-600">{result.error}</div>
                      )}
                    </div>
                    
                    <DaisyBadge 
                      variant={
                        result.status === 'RUNNING' ? 'secondary' :
                        result.status === 'COMPLETED' ? 'default' : 'destructive'
                      }
                    >
                      {result.status.toLowerCase()}
                    </DaisyBadge>
                  </div>
                );
              })}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* AI Actions Grid */}
      <div className="space-y-4">
        {Object.entries(actionsByCategory).map(([category, actions]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
              {category.toLowerCase().replace('_', ' ')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {actions.map((action) => {
                const IconComponent = action.icon;
                const isRunning = isActionRunning(action.id);
                const requiresDataAndMissing = action.requiresData && !context && !selectedData?.length;
                
                return (
                  <DaisyButton
                    key={action.id}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start gap-2"
                    onClick={() => executeAction(action)}
                    disabled={isRunning || requiresDataAndMissing}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                      <span className="font-medium text-sm">{action.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 w-full mt-1">
                      <DaisyBadge variant="outline" className="text-xs">
                        {action.estimatedTime}
                      </DaisyBadge>
                      {requiresDataAndMissing && (
                        <DaisyBadge variant="secondary" className="text-xs">
                          No data
                        </DaisyBadge>
                      )}
                    </div>
                  </DaisyButton>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Tips */}
      <DaisyCard className="bg-blue-50 border-blue-200">
        <DaisyCardContent className="py-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">AI Tips</h4>
              <p className="text-xs text-blue-700 mt-1">
                Select specific risks or controls to get more targeted AI analysis. 
                The AI works best with detailed context and clear objectives.
              </p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
};

export default AIActionToolbar;
export { AIActionToolbar }; 
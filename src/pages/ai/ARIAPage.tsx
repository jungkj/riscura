import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, usePathname } from 'next/navigation';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  Brain,
  Target,
  Eye,
  Lightbulb,
  CheckCircle,
  Clock,
  Users,
  Maximize2,
  Minimize2,
  X,
  Send,
  Sparkles,
  User
} from 'lucide-react';

import { ARIAChat } from '@/components/ai/ARIAChat';
import { ARIAWidget } from '@/components/ai/ARIAWidget';
import { TokenUsageAnalytics } from '@/components/ai/TokenUsageAnalytics';
import { useARIAChat, RiskContext } from '@/hooks/useARIAChat';
import { useAI } from '@/context/AIContext';
import { Risk, Control } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskAnalysisAI } from '@/components/ai/RiskAnalysisAI';
import { ControlRecommendationsAI } from '@/components/ai/ControlRecommendationsAI';
import { ComplianceIntelligenceAI } from '@/components/ai/ComplianceIntelligenceAI';
import ProactiveIntelligenceAI from '@/components/ai/ProactiveIntelligenceAI';
import { ComplianceAssessment, ComplianceRoadmap, AuditPreparation } from '@/services/ComplianceAIService';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  badge, 
  onClick 
}) => (
  <Card 
    className={cn(
      "transition-all duration-200 hover:shadow-md cursor-pointer group",
      onClick && "hover:border-blue-200 dark:hover:border-blue-800"
    )}
    onClick={onClick}
  >
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {badge && <Badge variant="secondary" className="mt-1">{badge}</Badge>}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

// Mock data for demonstration
const mockRisks: Risk[] = [
  {
    id: 'risk-1',
    title: 'Data Breach Risk',
    description: 'Risk of unauthorized access to sensitive customer data',
    category: 'operational',
    likelihood: 4,
    impact: 5,
    riskScore: 18,
    riskLevel: 'high',
    owner: 'CISO',
    status: 'identified',
    controls: ['ctrl-1', 'ctrl-2'],
    evidence: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastAssessed: new Date('2024-01-15'),
    dateIdentified: '2024-01-01T00:00:00Z',
    nextReview: new Date('2024-04-15')
  },
  {
    id: 'risk-2', 
    title: 'Compliance Violation Risk',
    description: 'Risk of failing to meet regulatory requirements',
    category: 'compliance',
    likelihood: 2,
    impact: 5,
    riskScore: 15,
    riskLevel: 'high',
    owner: 'Compliance Officer',
    status: 'identified',
    controls: ['ctrl-3'],
    evidence: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    lastAssessed: new Date('2024-01-10'),
    dateIdentified: '2024-01-01T00:00:00Z',
    nextReview: new Date('2024-04-10')
  },
  {
    id: 'risk-3',
    title: 'System Outage Risk',
    description: 'Risk of critical system unavailability',
    category: 'operational',
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: 'medium',
    owner: 'IT Manager',
    status: 'identified',
    controls: ['ctrl-4'],
    evidence: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    lastAssessed: new Date('2024-01-20'),
    dateIdentified: '2024-01-01T00:00:00Z',
    nextReview: new Date('2024-04-20')
  }
];

const mockControls: Control[] = [
  {
    id: 'ctrl-1',
    title: 'Data Encryption',
    description: 'Encryption of data at rest and in transit',
    type: 'preventive',
    effectiveness: 'high',
    owner: 'IT Security Team',
    frequency: 'continuous',
    evidence: [],
    linkedRisks: ['risk-1'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    lastTestDate: '2024-01-15T00:00:00Z',
    nextTestDate: '2024-04-15T00:00:00Z'
  },
  {
    id: 'ctrl-2',
    title: 'Access Control',
    description: 'Role-based access control system',
    type: 'preventive',
    effectiveness: 'high',
    owner: 'IT Security Team',
    frequency: 'continuous',
    evidence: [],
    linkedRisks: ['risk-1'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    lastTestDate: '2024-01-10T00:00:00Z',
    nextTestDate: '2024-04-10T00:00:00Z'
  },
  {
    id: 'ctrl-3',
    title: 'Compliance Monitoring',
    description: 'Automated compliance monitoring and reporting',
    type: 'detective',
    effectiveness: 'high',
    owner: 'Compliance Team',
    frequency: 'daily',
    evidence: [],
    linkedRisks: ['risk-2'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    lastTestDate: '2024-01-20T00:00:00Z',
    nextTestDate: '2024-04-20T00:00:00Z'
  },
  {
    id: 'ctrl-4',
    title: 'System Monitoring',
    description: 'Real-time system health monitoring',
    type: 'detective',
    effectiveness: 'high',
    owner: 'IT Operations',
    frequency: 'continuous',
    evidence: [],
    linkedRisks: ['risk-3'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    lastTestDate: '2024-01-18T00:00:00Z',
    nextTestDate: '2024-04-18T00:00:00Z'
  }
];

const ARIAPage: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'sidebar' | 'fullscreen'>('sidebar');
  const [initialContext, setInitialContext] = useState<RiskContext | undefined>();
  const [activeTab, setActiveTab] = useState<'features' | 'chat' | 'analytics' | 'risk-analysis' | 'control-recommendations' | 'compliance-intelligence' | 'proactive-intelligence'>('features');

  const { state: chatState, actions } = useARIAChat();
  const { 
    performanceMetrics, 
    rateLimitStatus,
    conversations
  } = useAI();

  // Extract context from URL or state if coming from another page
  useEffect(() => {
    if (!searchParams) return;
    
    const riskId = searchParams.get('risk');
    const controlId = searchParams.get('control');
    
    if (riskId || controlId) {
      setInitialContext({
        relatedEntities: {
          risks: riskId ? [riskId] : [],
          controls: controlId ? [controlId] : [],
          documents: [],
        },
        pageContext: {
          section: pathname || '',
          data: { riskId, controlId },
        },
      });
      setActiveTab('features');
      setIsChatOpen(true);
    }
  }, [searchParams, pathname]);

  const handleFeatureClick = (feature: string) => {
    let context: RiskContext | undefined;
    
    switch (feature) {
      case 'risk_analysis':
        context = {
          relatedEntities: { risks: [], controls: [], documents: [] },
          pageContext: { section: 'risk_analysis', data: {} },
        };
        break;
      case 'control_design':
        context = {
          relatedEntities: { risks: [], controls: [], documents: [] },
          pageContext: { section: 'control_design', data: {} },
        };
        break;
      case 'compliance':
        context = {
          relatedEntities: { risks: [], controls: [], documents: [] },
          pageContext: { section: 'compliance', data: {} },
        };
        break;
    }
    
    setInitialContext(context);
    setActiveTab('features');
    setIsChatOpen(true);
  };

  const handleStartConversation = () => {
    setActiveTab('features');
    setIsChatOpen(true);
  };

  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: 'Risk Analysis AI',
      description: 'AI-powered risk assessment and quantification',
      tab: 'risk-analysis' as const
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Control Recommendations',
      description: 'Intelligent control design and optimization',
      tab: 'control-recommendations' as const
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Compliance Intelligence',
      description: 'Automated compliance gap analysis and roadmaps',
      tab: 'compliance-intelligence' as const
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'Proactive Intelligence',
      description: 'Background AI monitoring and predictive insights',
      tab: 'proactive-intelligence' as const
    }
  ];

  const handleAssessmentCompleted = (assessment: ComplianceAssessment) => {
    console.log('Compliance assessment completed:', assessment);
    // Handle assessment completion
  };

  const handleRoadmapGenerated = (roadmap: ComplianceRoadmap) => {
    console.log('Compliance roadmap generated:', roadmap);
    // Handle roadmap generation
  };

  const handleAuditPlanCreated = (plan: AuditPreparation) => {
    console.log('Audit plan created:', plan);
    // Handle audit plan creation
  };

  const handleInsightGenerated = (insight: unknown) => {
    console.log('Proactive insight generated:', insight);
    // Handle insight generation
  };

  const handleRecommendationAccepted = (recommendation: unknown) => {
    console.log('Recommendation accepted:', recommendation);
    // Handle recommendation acceptance
  };

  const handleNotificationRead = (notificationId: string) => {
    console.log('Notification read:', notificationId);
    // Handle notification read
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ARIA</h1>
              <p className="text-lg text-muted-foreground">
                AI Risk Intelligence Assistant
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">
              v1.0.0
            </Badge>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Token Analytics
                </TabsTrigger>
                <TabsTrigger value="risk-analysis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Risk Analysis
                </TabsTrigger>
                <TabsTrigger value="control-recommendations" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Control Recommendations
                </TabsTrigger>
                <TabsTrigger value="compliance-intelligence" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Compliance Intelligence
                </TabsTrigger>
                <TabsTrigger value="proactive-intelligence" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Proactive Intelligence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="space-y-8">
                {/* Welcome Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-500" />
                        Welcome to ARIA
                      </CardTitle>
                      <CardDescription>
                        Your intelligent assistant for risk management, compliance, and control optimization.
                        Start a conversation or choose from the features below.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleStartConversation}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Start Conversation
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedMode(selectedMode === 'sidebar' ? 'fullscreen' : 'sidebar')}
                        >
                          {selectedMode === 'sidebar' ? 'Fullscreen' : 'Sidebar'} Mode
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-semibold mb-6">AI-Powered Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <FeatureCard {...feature} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Conversations */}
                {conversations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Conversations</CardTitle>
                        <CardDescription>
                          Continue previous conversations or review AI insights
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {conversations.slice(0, 3).map((conversation) => (
                            <div
                              key={conversation.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setActiveTab('chat');
                                setIsChatOpen(true);
                              }}
                            >
                              <div>
                                <p className="font-medium text-sm">{conversation.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {conversation.messages.length} messages • {conversation.updatedAt.toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {conversation.agentType.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="chat">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[calc(100vh-16rem)]"
                >
                  <ARIAChat
                    isOpen={true}
                    onClose={() => {
                      setIsChatOpen(false);
                      setActiveTab('features');
                    }}
                    initialContext={initialContext}
                    mode={selectedMode}
                    className="h-full"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TokenUsageAnalytics />
                </motion.div>
              </TabsContent>

              <TabsContent value="risk-analysis">
                <div className="space-y-6">
                  <RiskAnalysisAI
                    risks={mockRisks}
                    controls={mockControls}
                    onReportGenerated={(report) => {
                      console.log('Risk analysis report generated:', report);
                      // Handle report generation
                    }}
                    onRecommendationApplied={(recommendation) => {
                      console.log('Recommendation applied:', recommendation);
                      // Handle recommendation application
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="control-recommendations">
                <div className="space-y-6">
                  <ControlRecommendationsAI
                    risks={mockRisks}
                    existingControls={mockControls}
                    onRecommendationAccepted={(recommendation) => {
                      console.log('Control recommendation accepted:', recommendation);
                      // Handle recommendation acceptance - could create new control
                    }}
                    onImplementationPlanGenerated={(plan) => {
                      console.log('Implementation plan generated:', plan);
                      // Handle implementation plan generation
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="compliance-intelligence">
                <div className="space-y-6">
                  <ComplianceIntelligenceAI
                    risks={mockRisks}
                    existingControls={mockControls}
                    onAssessmentCompleted={handleAssessmentCompleted}
                    onRoadmapGenerated={handleRoadmapGenerated}
                    onAuditPlanCreated={handleAuditPlanCreated}
                  />
                </div>
              </TabsContent>

              <TabsContent value="proactive-intelligence">
                <div className="space-y-6">
                  <ProactiveIntelligenceAI
                    risks={mockRisks}
                    controls={mockControls}
                    onInsightGenerated={handleInsightGenerated}
                    onRecommendationAccepted={handleRecommendationAccepted}
                    onNotificationRead={handleNotificationRead}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Service</span>
                  <Badge variant={chatState.isConnected ? "default" : "destructive"}>
                    {chatState.isConnected ? "Online" : "Offline"}
                  </Badge>
                </div>
                
                {rateLimitStatus && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>API Requests</span>
                      <span>{rateLimitStatus.requestsRemaining}/50</span>
                    </div>
                    <Progress 
                      value={(rateLimitStatus.requestsRemaining / 50) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {performanceMetrics && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span>{performanceMetrics.averageResponseTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Hit Rate</span>
                      <span>{(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Conversations</span>
                  <span className="font-medium">{conversations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Messages Today</span>
                  <span className="font-medium">{chatState.messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Confidence</span>
                  <span className="font-medium">87%</span>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {chatState.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Service Error</AlertTitle>
                <AlertDescription>
                  {chatState.error.message}
                  {chatState.error.retryable && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={actions.clearError}
                      className="mt-2 p-0 h-auto text-destructive"
                    >
                      Try Again
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice Input</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">File Upload</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-scroll</span>
                    <Badge variant="outline">On</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Widget (for other pages) */}
      {!isChatOpen && pathname !== '/aria' && (
        <ARIAWidget initialContext={initialContext} />
      )}
    </div>
  );
};

export default ARIAPage; 
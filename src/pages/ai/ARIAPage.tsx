import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';

import { ARIAChat } from '@/components/ai/ARIAChat';
import { ARIAWidget } from '@/components/ai/ARIAWidget';
import { useARIAChat, RiskContext } from '@/hooks/useARIAChat';
import { useAI } from '@/context/AIContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const ARIAPage: React.FC = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'sidebar' | 'fullscreen'>('sidebar');
  const [initialContext, setInitialContext] = useState<RiskContext | undefined>();

  const { state: chatState, actions } = useARIAChat();
  const { 
    performanceMetrics, 
    rateLimitStatus,
    conversations
  } = useAI();

  // Extract context from URL or state if coming from another page
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const riskId = urlParams.get('risk');
    const controlId = urlParams.get('control');
    
    if (riskId || controlId) {
      setInitialContext({
        relatedEntities: {
          risks: riskId ? [riskId] : [],
          controls: controlId ? [controlId] : [],
          documents: [],
        },
        pageContext: {
          section: location.pathname,
          data: { riskId, controlId },
        },
      });
      setIsChatOpen(true);
    }
  }, [location]);

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
    setIsChatOpen(true);
  };

  const features = [
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: "Risk Analysis",
      description: "Get AI-powered insights into risk assessment, likelihood, impact, and mitigation strategies.",
      badge: "Popular",
      onClick: () => handleFeatureClick('risk_analysis'),
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "Control Design",
      description: "Design effective controls with AI recommendations for implementation and testing.",
      onClick: () => handleFeatureClick('control_design'),
    },
    {
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      title: "Compliance Guidance",
      description: "Navigate regulatory requirements and ensure compliance with expert AI assistance.",
      onClick: () => handleFeatureClick('compliance'),
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      title: "Risk Insights",
      description: "Discover patterns and trends in your risk data with advanced analytics.",
      badge: "New",
      onClick: () => handleFeatureClick('insights'),
    },
    {
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      title: "Quick Actions",
      description: "Streamline common risk management tasks with AI-powered automation.",
      onClick: () => handleFeatureClick('quick_actions'),
    },
    {
      icon: <MessageSquare className="h-5 w-5 text-teal-500" />,
      title: "Expert Consultation",
      description: "Get expert advice on complex risk scenarios and regulatory questions.",
      onClick: () => handleFeatureClick('consultation'),
    },
  ];

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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {!isChatOpen ? (
              <>
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
                          onClick={() => setIsChatOpen(true)}
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
                                // Load conversation context
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
              </>
            ) : (
              /* Chat Interface */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[calc(100vh-12rem)]"
              >
                <ARIAChat
                  isOpen={isChatOpen}
                  onClose={() => setIsChatOpen(false)}
                  initialContext={initialContext}
                  mode={selectedMode}
                  className="h-full"
                />
              </motion.div>
            )}
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
      {!isChatOpen && location.pathname !== '/aria' && (
        <ARIAWidget initialContext={initialContext} />
      )}
    </div>
  );
};

export default ARIAPage; 
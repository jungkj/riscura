import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RiskHeatMap from '@/components/dashboard/RiskHeatMap';
import RecentActivityTimeline from '@/components/dashboard/RecentActivityTimeline';
import { ComplianceDonut } from '@/components/dashboard/ComplianceDonut';
import { RiskByCategory } from '@/components/dashboard/RiskByCategory';
import { toast } from '@/hooks/use-toast';

// Enhanced components
import { MetricsGrid } from '@/components/ui/aceternity/animated-counter';
import { DashboardErrorBoundary } from '@/components/ui/error-boundary';
import { PageLoading } from '@/components/ui/enhanced-loading';

// AI Intelligence Components
import { AIInsightsWidget } from '@/components/ai/AIInsightsWidget';
import { PredictiveAnalyticsChart } from '@/components/ai/PredictiveAnalyticsChart';
import { AnomalyDetectionDemo } from '@/components/ai/AnomalyDetectionDemo';

// Icons
import { 
  ArrowRight, 
  BarChart, 
  Calendar, 
  FileText, 
  Plus, 
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  Sparkles,
  TrendingUp,
  Bot,
  Zap,
  Eye,
  Target
} from 'lucide-react';

// Types
import type { Risk, Control } from '@/types';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('riskScore');
  
  // Mock data for AI components
  const [demoRisks] = useState<Risk[]>([
    {
      id: 'risk-001',
      title: 'Cybersecurity Incident Risk',
      description: 'Risk of data breach or cyber attack',
      category: 'technology',
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
      category: 'financial',
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
      category: 'compliance',
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
  ]);

  const [demoControls] = useState<Control[]>([
    {
      id: 'ctrl-001',
      title: 'Multi-Factor Authentication',
      description: 'Enhanced authentication system',
      type: 'preventive',
      status: 'active',
      effectiveness: 'high',
      linkedRisks: ['risk-001'],
      owner: 'IT Security',
      frequency: 'Continuous',
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ctrl-002',
      title: 'Financial Risk Monitoring',
      description: 'Automated market risk monitoring',
      type: 'detective',
      status: 'active',
      effectiveness: 'medium',
      linkedRisks: ['risk-002'],
      owner: 'Risk Management',
      frequency: 'Daily',
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    }
  ]);
  
  useEffect(() => {
    // Simulate data loading with realistic delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Dashboard Updated',
        description: 'AI insights and data have been refreshed.',
      });
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const metrics = [
    {
      id: 'total-risks',
      title: 'Total Risks',
      value: 156,
      trend: { value: 12, isPositive: true },
      icon: <BarChart className="h-5 w-5" />,
      aiInsight: "AI detected 3 emerging risk patterns requiring attention"
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      value: 23,
      trend: { value: 5, isPositive: false },
      icon: <AlertTriangle className="h-5 w-5" />,
      aiInsight: "Risk exposure increased 15% due to market volatility"
    },
    {
      id: 'controls',
      title: 'Active Controls',
      value: 89,
      trend: { value: 8, isPositive: true },
      icon: <Shield className="h-5 w-5" />,
      aiInsight: "Control effectiveness improved through automation"
    },
    {
      id: 'compliance',
      title: 'Compliance Score',
      value: 94,
      suffix: '%',
      trend: { value: 2, isPositive: true },
      icon: <CheckCircle className="h-5 w-5" />,
      aiInsight: "Compliance trending positive with predictive score 96%"
    },
  ];

  const predictiveMetrics = [
    { 
      name: 'Risk Score Trend', 
      metric: 'riskScore',
      description: 'Overall organizational risk exposure prediction'
    },
    { 
      name: 'Compliance Forecast', 
      metric: 'complianceScore',
      description: 'Regulatory compliance trajectory analysis'
    },
    { 
      name: 'Incident Prediction', 
      metric: 'incidentRate',
      description: 'Security incident likelihood forecasting'
    },
    { 
      name: 'Control Effectiveness', 
      metric: 'controlEffectiveness',
      description: 'Control performance predictive modeling'
    }
  ];

  if (isLoading) {
    return <PageLoading title="Loading Dashboard" description="Preparing your AI-powered risk management overview" />;
  }

  return (
    <DashboardErrorBoundary>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
              Dashboard
              {aiEnabled && (
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Your AI-powered risk management overview with predictive insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
              className="transition-all duration-200 hover:scale-105"
            >
              <Bot className="h-4 w-4 mr-1" />
              {aiEnabled ? 'AI On' : 'AI Off'}
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              disabled={refreshing}
              className="transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="transition-all duration-200">Overview</TabsTrigger>
              <TabsTrigger value="ai-insights" className="transition-all duration-200">
                <Brain className="h-4 w-4 mr-1" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="predictions" className="transition-all duration-200">
                <TrendingUp className="h-4 w-4 mr-1" />
                Predictions
              </TabsTrigger>
              <TabsTrigger value="anomalies" className="transition-all duration-200">
                <Eye className="h-4 w-4 mr-1" />
                Anomalies
              </TabsTrigger>
              <TabsTrigger value="risks" className="transition-all duration-200">Risks</TabsTrigger>
            </TabsList>
          </motion.div>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Metrics Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MetricsGrid metrics={metrics} />
            </motion.div>

            {/* AI-Enhanced Content Layout */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Main Analytics - Left Column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Risk Heat Map */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-md font-medium flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Risk Heat Map
                      {aiEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Enhanced
                        </Badge>
                      )}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <RiskHeatMap isLoading={false} />
                  </CardContent>
                </Card>
                
                {/* Additional Analytics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-md font-medium flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        Compliance Status
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ComplianceDonut isLoading={false} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-md font-medium flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-orange-600" />
                        Risks by Category
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                        View All <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <RiskByCategory />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* AI Insights Sidebar - Right Column (1/3) */}
              <div className="space-y-6">
                {aiEnabled && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AIInsightsWidget
                      userId="demo-user"
                      risks={demoRisks}
                      controls={demoControls}
                      maxInsights={5}
                    />
                  </motion.div>
                )}
                
                {/* Recent Activity */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-md font-medium flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs hover:scale-105 transition-transform">
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <RecentActivityTimeline isLoading={false} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
            
            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Smart Actions
                {aiEnabled && (
                  <Badge variant="outline" className="text-xs">
                    AI Recommended
                  </Badge>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Plus,
                    title: 'Add New Risk',
                    description: 'AI will auto-categorize',
                    color: 'text-blue-600',
                    delay: 0.1,
                    aiEnhanced: true
                  },
                  {
                    icon: FileText,
                    title: 'Upload Document',
                    description: 'AI risk extraction',
                    color: 'text-green-600',
                    delay: 0.2,
                    aiEnhanced: true
                  },
                  {
                    icon: Calendar,
                    title: 'Schedule Assessment',
                    description: 'Smart scheduling',
                    color: 'text-purple-600',
                    delay: 0.3,
                    aiEnhanced: false
                  },
                  {
                    icon: Target,
                    title: 'AI Risk Scan',
                    description: 'Automated detection',
                    color: 'text-orange-600',
                    delay: 0.4,
                    aiEnhanced: true
                  },
                ].map((action) => (
                  <motion.div
                    key={action.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: action.delay }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 px-4 justify-start w-full group hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <action.icon className={`h-4 w-4 ${action.color} group-hover:scale-110 transition-transform`} />
                          <span className="font-medium">{action.title}</span>
                          {action.aiEnhanced && aiEnabled && (
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <AIInsightsWidget
                userId="demo-user"
                risks={demoRisks}
                controls={demoControls}
                maxInsights={10}
                showPredictions={true}
                showRecommendations={true}
                className="lg:col-span-2"
              />
            </motion.div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictiveMetrics.map((metric) => (
                  <PredictiveAnalyticsChart
                    key={metric.metric}
                    metric={metric.metric}
                    title={metric.name}
                    showConfidenceInterval={true}
                    showFactors={true}
                    interactive={true}
                  />
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnomalyDetectionDemo />
            </motion.div>
          </TabsContent>

          {/* Enhanced Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Risk Management
                    {aiEnabled && (
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <Brain className="h-3 w-3 mr-1" />
                        AI Enhanced
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {demoRisks.map((risk) => (
                      <Card key={risk.id} className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{risk.title}</CardTitle>
                            <Badge 
                              variant={risk.riskScore >= 15 ? 'destructive' : risk.riskScore >= 10 ? 'secondary' : 'default'}
                            >
                              {risk.riskScore}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-600 mb-2">{risk.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Category: {risk.category}</span>
                            <span className="text-gray-500">Owner: {risk.owner}</span>
                          </div>
                          {aiEnabled && (
                            <div className="mt-2 p-2 bg-indigo-50 rounded text-xs">
                              <div className="flex items-center gap-1 text-indigo-700">
                                <Brain className="h-3 w-3" />
                                <span className="font-medium">AI Insight:</span>
                              </div>
                              <p className="text-indigo-600 mt-1">
                                {risk.category === 'technology' && "Threat landscape evolving, consider additional monitoring"}
                                {risk.category === 'financial' && "Market volatility indicators suggest increased monitoring needed"}
                                {risk.category === 'compliance' && "Regulatory changes may impact risk rating within 30 days"}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
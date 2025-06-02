import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Enhanced components
import RiskHeatMap from '@/components/dashboard/RiskHeatMap';
import RecentActivityTimeline from '@/components/dashboard/RecentActivityTimeline';
import { ComplianceDonut } from '@/components/dashboard/ComplianceDonut';
import { RiskByCategory } from '@/components/dashboard/RiskByCategory';

// AI Intelligence Components
import { AIInsightsWidget } from '@/components/ai/AIInsightsWidget';
import { PredictiveAnalyticsChart } from '@/components/ai/PredictiveAnalyticsChart';
import { AnomalyDetectionDemo } from '@/components/ai/AnomalyDetectionDemo';

// Icons
import { 
  ArrowRight, 
  BarChart3, 
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
  Target,
  Users,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Globe,
  Lock,
  AlertCircle
} from 'lucide-react';

// Types
import type { Risk, Control } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Mock data for demonstration
  const [demoRisks] = useState<Risk[]>([
    {
      id: 'risk-001',
      title: 'Cybersecurity Incident Risk',
      description: 'Risk of data breach or cyber attack affecting customer data and business operations',
      category: 'technology',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: 'high',
      owner: 'CISO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-15'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-15')
    },
    {
      id: 'risk-002',
      title: 'Market Volatility Risk',
      description: 'Risk from market fluctuations affecting investment portfolio and revenue streams',
      category: 'financial',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'high',
      owner: 'CFO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-10'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-10')
    },
    {
      id: 'risk-003',
      title: 'Regulatory Compliance Risk',
      description: 'Risk of regulatory violations and non-compliance with industry standards',
      category: 'compliance',
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      riskLevel: 'medium',
      owner: 'Legal',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-20'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-20')
    }
  ]);

  const [demoControls] = useState<Control[]>([
    {
      id: 'ctrl-001',
      title: 'Multi-Factor Authentication',
      description: 'Enhanced authentication system for all user accounts',
      type: 'preventive',
      status: 'active',
      effectiveness: 'high',
      linkedRisks: ['risk-001'],
      owner: 'IT Security',
      frequency: 'Continuous',
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastTestDate: '2024-01-15',
      nextTestDate: '2024-04-15'
    },
    {
      id: 'ctrl-002',
      title: 'Financial Risk Monitoring',
      description: 'Automated market risk monitoring and alerting system',
      type: 'detective',
      status: 'active',
      effectiveness: 'high',
      linkedRisks: ['risk-002'],
      owner: 'Risk Management',
      frequency: 'Daily',
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastTestDate: '2024-01-10',
      nextTestDate: '2024-04-10'
    }
  ]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Dashboard Updated',
        description: 'All data and AI insights have been refreshed successfully.',
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

  // Enhanced metrics with better formatting
  const metrics = [
    {
      id: 'total-risks',
      title: 'Total Risks',
      value: 156,
      trend: { value: 12, isPositive: true },
      icon: <BarChart3 className="h-4 w-4 text-notion-blue" />,
      description: 'Across all categories',
      color: 'blue'
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      value: 23,
      trend: { value: 5, isPositive: false },
      icon: <AlertTriangle className="h-4 w-4 text-notion-red" />,
      description: 'Require immediate attention',
      color: 'red'
    },
    {
      id: 'controls-active',
      title: 'Active Controls',
      value: 89,
      trend: { value: 8, isPositive: true },
      icon: <Shield className="h-4 w-4 text-notion-green" />,
      description: 'Currently implemented',
      color: 'green'
    },
    {
      id: 'compliance-score',
      title: 'Compliance Score',
      value: 94,
      trend: { value: 2, isPositive: true },
      icon: <CheckCircle className="h-4 w-4 text-notion-purple" />,
      description: 'Overall compliance rating',
      color: 'purple'
    }
  ];

  const aiInsights = [
    {
      type: 'risk',
      title: 'Risk Exposure Rising',
      description: 'Overall risk exposure increased 5.3% based on recent assessments',
      action: 'Review high-impact risks',
      priority: 'high'
    },
    {
      type: 'recommendation',
      title: 'Dashboard Performance Optimization Available',
      description: 'AI identified 3 controls that could be automated for better effectiveness',
      action: 'View recommendations',
      priority: 'medium'
    },
    {
      type: 'prediction',
      title: 'Compliance Forecast',
      description: 'Predicted compliance score of 96% for next quarter',
      action: 'View details',
      priority: 'low'
    }
  ];

  const quickActions = [
    {
      icon: Plus,
      title: 'Add New Risk',
      description: 'Create and categorize',
      href: '/risks/new',
      color: 'blue'
    },
    {
      icon: FileText,
      title: 'Upload Document',
      description: 'AI risk extraction',
      href: '/documents/upload',
      color: 'green'
    },
    {
      icon: Calendar,
      title: 'Schedule Assessment',
      description: 'Plan review cycle',
      href: '/assessments/schedule',
      color: 'purple'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Get AI insights',
      href: '/dashboard/aria',
      color: 'indigo'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notion-content p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your risk management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="notion-button-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/risks/new')}
            className="notion-button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="notion-card hover:shadow-notion transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded-md">
                      {metric.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {metric.value}
                        {metric.id === 'compliance-score' && '%'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-xs ${
                      metric.trend.isPositive ? 'text-notion-green' : 'text-notion-red'
                    }`}>
                      {metric.trend.isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {metric.trend.value}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      vs last month
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-insights" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <Eye className="h-4 w-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Analytics (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Risk Heat Map */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Risk Heat Map
                      {aiEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Enhanced
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Impact vs Likelihood analysis
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push('/risks')}>
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <RiskHeatMap isLoading={false} />
                </CardContent>
              </Card>
              
              {/* Secondary Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                        Compliance Status
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Details <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ComplianceDonut isLoading={false} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        Risk Categories
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RiskByCategory />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - AI Insights & Activity (1/3) */}
            <div className="space-y-6">
              {/* AI Intelligence Hub */}
              {aiEnabled && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-indigo-600" />
                      AI Intelligence Hub
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                        Live
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                            {insight.type === 'recommendation' && <Sparkles className="h-4 w-4 text-blue-500" />}
                            {insight.type === 'prediction' && <TrendingUp className="h-4 w-4 text-green-500" />}
                            <span className="text-sm font-medium">{insight.title}</span>
                          </div>
                          <Badge 
                            variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          {insight.action}
                        </Button>
                      </div>
                    ))}
                    <Button className="w-full" onClick={() => router.push('/dashboard/aria')}>
                      <Brain className="h-4 w-4 mr-2" />
                      Open ARIA AI Assistant
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Recent Activity
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <RecentActivityTimeline isLoading={false} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Actions
                {aiEnabled && (
                  <Badge variant="outline" className="text-xs">
                    AI Recommended
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 w-full group hover:shadow-md transition-all"
                      onClick={() => router.push(action.href)}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className={`p-2 rounded-lg bg-${action.color}-50 text-${action.color}-600 group-hover:scale-110 transition-transform`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <AIInsightsWidget
            userId="demo-user"
            risks={demoRisks}
            controls={demoControls}
            maxInsights={10}
            showPredictions={true}
            showRecommendations={true}
          />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictiveAnalyticsChart
              metric="riskScore"
              title="Risk Score Trend"
              showConfidenceInterval={true}
              showFactors={true}
              interactive={true}
            />
            <PredictiveAnalyticsChart
              metric="complianceScore"
              title="Compliance Forecast"
              showConfidenceInterval={true}
              showFactors={true}
              interactive={true}
            />
            <PredictiveAnalyticsChart
              metric="incidentRate"
              title="Incident Prediction"
              showConfidenceInterval={true}
              showFactors={true}
              interactive={true}
            />
            <PredictiveAnalyticsChart
              metric="controlEffectiveness"
              title="Control Effectiveness"
              showConfidenceInterval={true}
              showFactors={true}
              interactive={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <AnomalyDetectionDemo />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoRisks.map((risk) => (
              <Card key={risk.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{risk.title}</CardTitle>
                    <Badge 
                      variant={risk.riskScore >= 15 ? 'destructive' : risk.riskScore >= 10 ? 'default' : 'secondary'}
                    >
                      Score: {risk.riskScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{risk.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <p className="text-muted-foreground capitalize">{risk.category}</p>
                    </div>
                    <div>
                      <span className="font-medium">Owner:</span>
                      <p className="text-muted-foreground">{risk.owner}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Likelihood:</span>
                      <span>{risk.likelihood}/5</span>
                    </div>
                    <Progress value={(risk.likelihood / 5) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Impact:</span>
                      <span>{risk.impact}/5</span>
                    </div>
                    <Progress value={(risk.impact / 5) * 100} className="h-2" />
                  </div>

                  {aiEnabled && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-2">
                        <Brain className="h-4 w-4" />
                        <span className="text-sm font-medium">AI Insight</span>
                      </div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        {risk.category === 'technology' && "Threat landscape evolving, consider additional monitoring"}
                        {risk.category === 'financial' && "Market volatility indicators suggest increased monitoring needed"}
                        {risk.category === 'compliance' && "Regulatory changes may impact risk rating within 30 days"}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => router.push(`/risks/${risk.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/risks/${risk.id}/edit`)}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center pt-4">
            <Button onClick={() => router.push('/risks')} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Full Risk Register
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
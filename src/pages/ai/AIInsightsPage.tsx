import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

// Icons
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  RefreshCw,
  Zap,
  Shield,
  Users
} from 'lucide-react';

// Types
interface AIInsight {
  id: string;
  type: 'risk_prediction' | 'trend_analysis' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  createdAt: Date;
}

interface PredictiveAnalysis {
  riskScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: string;
  timeframe: string;
  factors: string[];
}

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  estimatedTime: string;
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'risk_prediction',
          title: 'Emerging Cybersecurity Risk',
          description: 'AI models predict a 35% increase in cybersecurity risks over the next quarter based on current threat patterns and system vulnerabilities.',
          confidence: 87,
          impact: 'high',
          category: 'Technology',
          actionable: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 30)
        },
        {
          id: '2',
          type: 'trend_analysis',
          title: 'Compliance Risk Trending Down',
          description: 'Regulatory compliance risks have decreased by 22% this month due to improved documentation and process standardization.',
          confidence: 92,
          impact: 'medium',
          category: 'Compliance',
          actionable: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        {
          id: '3',
          type: 'anomaly',
          title: 'Unusual Risk Pattern Detected',
          description: 'Anomalous clustering of operational risks in the finance department suggests potential process breakdown or training gap.',
          confidence: 78,
          impact: 'medium',
          category: 'Operational',
          actionable: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
        },
        {
          id: '4',
          type: 'recommendation',
          title: 'Risk Assessment Optimization',
          description: 'AI suggests implementing quarterly risk assessments for high-impact processes to improve early detection by 40%.',
          confidence: 85,
          impact: 'high',
          category: 'Process',
          actionable: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
        }
      ];

      const mockPredictive: PredictiveAnalysis = {
        riskScore: 73,
        trend: 'increasing',
        prediction: 'Overall risk exposure is projected to increase by 12% over the next 3 months',
        timeframe: '3 months',
        factors: [
          'Increased remote work vulnerabilities',
          'New regulatory requirements',
          'Supply chain disruptions',
          'Technology infrastructure aging'
        ]
      };

      const mockRecommendations: RecommendationItem[] = [
        {
          id: '1',
          title: 'Implement Zero-Trust Security Model',
          description: 'Deploy zero-trust architecture to reduce cybersecurity risks by 45%',
          priority: 'high',
          effort: 'high',
          impact: 'high',
          category: 'Security',
          estimatedTime: '3-6 months'
        },
        {
          id: '2',
          title: 'Automate Compliance Monitoring',
          description: 'Set up automated compliance tracking to reduce manual oversight burden',
          priority: 'medium',
          effort: 'medium',
          impact: 'high',
          category: 'Compliance',
          estimatedTime: '1-2 months'
        },
        {
          id: '3',
          title: 'Enhanced Staff Training Program',
          description: 'Develop targeted training for departments with higher risk concentrations',
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          category: 'Training',
          estimatedTime: '2-4 weeks'
        },
        {
          id: '4',
          title: 'Risk Dashboard Optimization',
          description: 'Improve risk visualization and reporting for better decision-making',
          priority: 'low',
          effort: 'low',
          impact: 'medium',
          category: 'Analytics',
          estimatedTime: '1-2 weeks'
        }
      ];

      setInsights(mockInsights);
      setPredictiveAnalysis(mockPredictive);
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    };

    const timer = setTimeout(generateMockData, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update insights with new data
      setInsights(prev => prev.map(insight => ({
        ...insight,
        confidence: Math.max(70, Math.min(95, insight.confidence + (Math.random() - 0.5) * 10))
      })));
      
      toast({
        title: 'Insights Updated',
        description: 'AI insights have been refreshed with latest data',
      });
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh insights. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'risk_prediction':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'trend_analysis':
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'anomaly':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline">Low Impact</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg font-medium">AI is analyzing your data...</p>
          <p className="text-sm text-muted-foreground">Generating insights and recommendations</p>
        </div>
      </div>
    );
  }

  return (
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Intelligent analysis and recommendations powered by machine learning.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </motion.div>

      {/* Predictive Analysis Overview */}
      {predictiveAnalysis && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Predictive Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {predictiveAnalysis.riskScore}
                  </div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Progress value={predictiveAnalysis.riskScore} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {predictiveAnalysis.trend === 'increasing' ? (
                      <TrendingUp className="h-6 w-6 text-red-500" />
                    ) : predictiveAnalysis.trend === 'decreasing' ? (
                      <TrendingDown className="h-6 w-6 text-green-500" />
                    ) : (
                      <div className="h-6 w-6 bg-gray-400 rounded-full" />
                    )}
                    <span className="text-lg font-semibold capitalize">
                      {predictiveAnalysis.trend}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Trend Direction</p>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">
                    {predictiveAnalysis.timeframe}
                  </div>
                  <p className="text-sm text-muted-foreground">Forecast Period</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Key Risk Factors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {predictiveAnalysis.factors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{predictiveAnalysis.prediction}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="insights" className="space-y-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="insights" className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <div className="flex items-center gap-2">
                          {getImpactBadge(insight.impact)}
                          <Badge variant="outline">{insight.confidence}% confidence</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{insight.category}</span>
                          <span>•</span>
                          <span>{insight.createdAt.toLocaleString()}</span>
                        </div>
                        {insight.actionable && (
                          <Button size="sm" variant="outline">
                            <Target className="h-4 w-4 mr-2" />
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {recommendations.map((rec) => (
              <Card key={rec.id} className={`border-l-4 ${getPriorityColor(rec.priority)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{rec.title}</h3>
                      <p className="text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effort:</span>
                      <span className="ml-2 capitalize">{rec.effort}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact:</span>
                      <span className="ml-2 capitalize">{rec.impact}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-2">{rec.category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="ml-2">{rec.estimatedTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button size="sm">
                      Implement Recommendation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Correlation Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  AI-identified correlations between different risk categories
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cyber ↔ Operational</span>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="w-20" />
                      <span className="text-sm">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Financial ↔ Compliance</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20" />
                      <span className="text-sm">65%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Strategic ↔ Operational</span>
                    <div className="flex items-center gap-2">
                      <Progress value={52} className="w-20" />
                      <span className="text-sm">52%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Department Risk Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Risk distribution and patterns across departments
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IT Department</span>
                    <Badge variant="destructive">High Risk</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Finance</span>
                    <Badge variant="secondary">Medium Risk</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">HR</span>
                    <Badge variant="outline">Low Risk</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operations</span>
                    <Badge variant="secondary">Medium Risk</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
} 
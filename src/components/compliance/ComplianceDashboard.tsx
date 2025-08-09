'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, Clock, Brain, 
  FileText, Users, Settings, TrendingUp, Target 
} from 'lucide-react';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  type: string;
  mandatory: boolean;
  coverage?: number;
  maturityScore?: number;
  gaps?: number;
  status: 'not-started' | 'in-progress' | 'compliant' | 'non-compliant';
}

interface ComplianceGap {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  framework: string;
  category: string;
  dueDate: string;
}

interface ComplianceInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  recommendations: any[];
}

const ComplianceDashboard: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);
  const [insights, setInsights] = useState<ComplianceInsight[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('');

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/compliance/dashboard', { 
          credentials: 'include' 
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setFrameworks(data.data.frameworks || []);
            setGaps(data.data.gaps || []);
            setInsights(data.data.insights || []);
            setSummary(data.data.summary || {});
          } else {
            console.error('Failed to load compliance data:', data.error);
            // Fallback to empty data
            setFrameworks([]);
            setGaps([]);
            setInsights([]);
            setSummary({});
          }
        } else {
          console.error('Failed to fetch compliance data:', response.statusText);
          // Fallback to empty data
          setFrameworks([]);
          setGaps([]);
          setInsights([]);
          setSummary({});
        }
      } catch (error) {
        console.error('Error fetching compliance data:', error);
        // Fallback to empty data
        setFrameworks([]);
        setGaps([]);
        setInsights([]);
        setSummary({});
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, []);

  const overallComplianceScore = summary?.overallComplianceScore || 
    (frameworks.length > 0 ? Math.round(frameworks.reduce((sum, f) => sum + (f.coverage || 0), 0) / frameworks.length) : 0);

  const criticalGaps = summary?.criticalGaps || gaps.filter(g => g.priority === 'critical').length;
  const highGaps = summary?.highPriorityGaps || gaps.filter(g => g.priority === 'high').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'non-compliant': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const frameworkChartData = frameworks.map(f => ({
    name: f.name.split(' ')[0],
    coverage: f.coverage || 0,
    maturity: f.maturityScore || 0,
    gaps: f.gaps || 0,
  }));

  const gapsByCategory = gaps.reduce((acc, gap) => {
    acc[gap.category] = (acc[gap.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(gapsByCategory).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your compliance posture across frameworks</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallComplianceScore}%</div>
            <Progress value={overallComplianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Across {frameworks.length} frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalGaps}</div>
            <p className="text-xs text-muted-foreground">
              {highGaps} high priority gaps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Frameworks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{frameworks.length}</div>
            <p className="text-xs text-muted-foreground">
              {frameworks.filter(f => f.mandatory).length} mandatory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insights.filter(i => i.severity === 'critical').length} critical insights
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="gaps">Gaps & Issues</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Coverage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Framework Coverage</CardTitle>
                <CardDescription>Coverage and maturity across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={frameworkChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="coverage" fill="#3B82F6" name="Coverage %" />
                    <Bar dataKey="maturity" fill="#10B981" name="Maturity %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gap Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Gap Distribution</CardTitle>
                <CardDescription>Gaps by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {frameworks.map((framework) => (
              <Card key={framework.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{framework.name}</CardTitle>
                      <CardDescription>{framework.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={framework.mandatory ? 'destructive' : 'secondary'}>
                        {framework.mandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(framework.status)}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Coverage</span>
                        <span>{framework.coverage}%</span>
                      </div>
                      <Progress value={framework.coverage} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Maturity</span>
                        <span>{framework.maturityScore}%</span>
                      </div>
                      <Progress value={framework.maturityScore} className="mt-1" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Open Gaps</span>
                      <span className="font-medium text-red-600">{framework.gaps}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Gaps</CardTitle>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gaps.map((gap) => (
                  <div key={gap.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(gap.priority)}`} />
                      <div>
                        <h4 className="font-medium">{gap.title}</h4>
                        <p className="text-sm text-gray-600">
                          {gap.framework} • {gap.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge variant={gap.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {gap.priority}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Due: {gap.dueDate}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Clock className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Alert key={insight.id} className={insight.severity === 'critical' ? 'border-red-200' : 'border-blue-200'}>
                <Brain className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  {insight.title}
                  <Badge variant="outline">
                    {Math.round(insight.confidence * 100)}% confidence
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {insight.description}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceDashboard; 
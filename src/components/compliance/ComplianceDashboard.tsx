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
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('');

  // Mock data for demonstration
  const mockFrameworks: ComplianceFramework[] = [
    {
      id: 'sox-2002',
      name: 'Sarbanes-Oxley Act',
      description: 'U.S. federal law for public companies',
      type: 'regulatory',
      mandatory: true,
      coverage: 85,
      maturityScore: 78,
      gaps: 12,
      status: 'in-progress',
    },
    {
      id: 'iso-27001-2022',
      name: 'ISO/IEC 27001:2022',
      description: 'Information security management systems',
      type: 'standard',
      mandatory: false,
      coverage: 92,
      maturityScore: 88,
      gaps: 3,
      status: 'compliant',
    },
    {
      id: 'gdpr-2018',
      name: 'General Data Protection Regulation',
      description: 'EU regulation on data protection',
      type: 'regulatory',
      mandatory: true,
      coverage: 76,
      maturityScore: 71,
      gaps: 8,
      status: 'in-progress',
    },
    {
      id: 'nist-csf-2.0',
      name: 'NIST Cybersecurity Framework',
      description: 'Framework for cybersecurity',
      type: 'guideline',
      mandatory: false,
      coverage: 68,
      maturityScore: 65,
      gaps: 15,
      status: 'in-progress',
    },
  ];

  const mockGaps: ComplianceGap[] = [
    { id: '1', title: 'Access Control Testing', priority: 'critical', framework: 'SOX', category: 'IT Controls', dueDate: '2024-03-15' },
    { id: '2', title: 'Data Encryption Policy', priority: 'high', framework: 'GDPR', category: 'Data Protection', dueDate: '2024-03-22' },
    { id: '3', title: 'Incident Response Plan', priority: 'medium', framework: 'ISO 27001', category: 'Security Management', dueDate: '2024-04-01' },
    { id: '4', title: 'Risk Assessment Documentation', priority: 'high', framework: 'NIST', category: 'Risk Management', dueDate: '2024-03-30' },
  ];

  const mockInsights: ComplianceInsight[] = [
    {
      id: '1',
      type: 'risk-based-prioritization',
      title: 'Control Prioritization Recommendations',
      description: 'Based on risk analysis, 5 controls should be prioritized for implementation',
      severity: 'warning',
      confidence: 0.85,
      recommendations: [],
    },
    {
      id: '2',
      type: 'regulatory-interpretation',
      title: 'New GDPR Guidance Available',
      description: 'Updated guidance on AI systems under GDPR requires review',
      severity: 'info',
      confidence: 0.92,
      recommendations: [],
    },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setFrameworks(mockFrameworks);
      setGaps(mockGaps);
      setInsights(mockInsights);
      setLoading(false);
    }, 1000);
  }, []);

  const overallComplianceScore = Math.round(
    frameworks.reduce((sum, f) => sum + (f.coverage || 0), 0) / frameworks.length
  );

  const criticalGaps = gaps.filter(g => g.priority === 'critical').length;
  const highGaps = gaps.filter(g => g.priority === 'high').length;

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
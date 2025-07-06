'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ComplianceFrameworkSelector } from './ComplianceFrameworkSelector';
import { ComplianceGapList } from './ComplianceGapList';
import { ComplianceRequirementAssessment } from './ComplianceRequirementAssessment';

interface Framework {
  id: string;
  name: string;
  type: string;
  version?: string;
}

interface Assessment {
  id: string;
  name: string;
  frameworkId: string;
  framework: Framework;
  status: string;
  overallScore?: number;
  assessmentDate: string;
  dueDate?: string;
  _count: {
    items: number;
    gaps: number;
  };
}

interface GapAnalysis {
  framework: Framework;
  assessment: Assessment;
  overallCompliance: number;
  requirementCount: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  notAssessedCount: number;
  gaps: any[];
  criticalGaps: any[];
  recommendations: string[];
}

const COLORS = {
  compliant: '#10b981',
  partial: '#f59e0b',
  nonCompliant: '#ef4444',
  notAssessed: '#6b7280',
};

export function ComplianceGapAnalysis() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [analysis, setAnalysis] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Fetch frameworks
  useEffect(() => {
    fetchFrameworks();
  }, []);

  // Fetch assessments when framework is selected
  useEffect(() => {
    if (selectedFramework) {
      fetchAssessments(selectedFramework);
    }
  }, [selectedFramework]);

  const fetchFrameworks = async () => {
    try {
      const response = await fetch('/api/compliance/frameworks?isActive=true');
      const data = await response.json();
      if (data.success) {
        setFrameworks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch frameworks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load compliance frameworks',
        variant: 'destructive',
      });
    }
  };

  const fetchAssessments = async (frameworkId: string) => {
    try {
      const response = await fetch(`/api/compliance/assessments?frameworkId=${frameworkId}`);
      const data = await response.json();
      if (data.success) {
        setAssessments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    }
  };

  const performGapAnalysis = async () => {
    if (!selectedAssessment) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/compliance/assessments/${selectedAssessment}/gap-analysis`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
        toast({
          title: 'Analysis Complete',
          description: 'Gap analysis has been performed successfully',
        });
      }
    } catch (error) {
      console.error('Failed to perform gap analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform gap analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getComplianceData = () => {
    if (!analysis) return [];
    
    return [
      { name: 'Compliant', value: analysis.compliantCount, color: COLORS.compliant },
      { name: 'Partially Compliant', value: analysis.partiallyCompliantCount, color: COLORS.partial },
      { name: 'Non-Compliant', value: analysis.nonCompliantCount, color: COLORS.nonCompliant },
      { name: 'Not Assessed', value: analysis.notAssessedCount, color: COLORS.notAssessed },
    ];
  };

  const getGapsBySeverity = () => {
    if (!analysis) return [];
    
    const severityCount = analysis.gaps.reduce((acc, gap) => {
      acc[gap.severity] = (acc[gap.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count,
    }));
  };

  const getGapsByType = () => {
    if (!analysis) return [];
    
    const typeCount = analysis.gaps.reduce((acc, gap) => {
      const type = gap.gapType.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
    }));
  };

  const exportReport = async () => {
    if (!selectedAssessment) return;

    try {
      const response = await fetch(`/api/compliance/assessments/${selectedAssessment}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-gap-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Gap Analysis</CardTitle>
          <CardDescription>
            Analyze compliance gaps and generate remediation recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger>
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((framework) => (
                  <SelectItem key={framework.id} value={framework.id}>
                    {framework.name} {framework.version && `(${framework.version})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedAssessment} 
              onValueChange={setSelectedAssessment}
              disabled={!selectedFramework}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assessment" />
              </SelectTrigger>
              <SelectContent>
                {assessments.map((assessment) => (
                  <SelectItem key={assessment.id} value={assessment.id}>
                    {assessment.name} - {format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={performGapAnalysis}
              disabled={!selectedAssessment || loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Gaps
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gaps">Gaps</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Overall Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analysis.overallCompliance.toFixed(1)}%
                  </div>
                  <Progress value={analysis.overallCompliance} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.requirementCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.notAssessedCount} not assessed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Compliance Gaps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.gaps.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.criticalGaps.length} critical
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Assessment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.assessment.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(analysis.assessment.assessmentDate), 'MMM dd, yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getComplianceData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getComplianceData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gaps by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getGapsBySeverity()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gaps by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getGapsByType()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaps">
            <ComplianceGapList assessmentId={selectedAssessment} gaps={analysis.gaps} />
          </TabsContent>

          <TabsContent value="requirements">
            <ComplianceRequirementAssessment 
              assessmentId={selectedAssessment}
              frameworkId={analysis.framework.id}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>
                  Prioritized recommendations based on gap analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Recommendation {index + 1}</AlertTitle>
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={exportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
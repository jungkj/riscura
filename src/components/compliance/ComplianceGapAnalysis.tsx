'use client';

import { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
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
import { useToast } from '@/components/ui/DaisyToast';
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
      <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
          <DaisyCardTitle>Compliance Gap Analysis</DaisyCardTitle>
          <DaisyCardDescription >
  Analyze compliance gaps and generate remediation recommendations
</DaisyCardDescription>
          </p>
        
        <DaisyCardContent >
  <div className="grid gap-4 md:grid-cols-3">
</DaisyCardContent>
            <DaisySelect value={selectedFramework} onValueChange={setSelectedFramework} />
              <DaisySelectTrigger />
                <DaisySelectValue placeholder="Select framework" /></DaisySelect>
              <DaisySelectContent />
                {frameworks.map((framework) => (
                  <DaisySelectItem key={framework.id} value={framework.id} />
                    {framework.name} {framework.version && `(${framework.version})`}
                  </DaisySelectContent>
                ))}
              </DaisySelectContent>
            </DaisySelect>

            <DaisySelect 
              value={selectedAssessment} 
              onValueChange={setSelectedAssessment}
              disabled={!selectedFramework} />
              <DaisySelectTrigger />
                <DaisySelectValue placeholder="Select assessment" /></DaisySelect>
              <DaisySelectContent />
                {assessments.map((assessment) => (
                  <DaisySelectItem key={assessment.id} value={assessment.id} />
                    {assessment.name} - {format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}
                  </DaisySelectContent>
                ))}
              </DaisySelectContent>
            </DaisySelect>

            <DaisyButton 
              onClick={performGapAnalysis}
              disabled={!selectedAssessment || loading} >
  {loading ? (
</DaisyButton>
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
            </DaisyButton>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {analysis && (
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} />
          <DaisyTabsList className="grid w-full grid-cols-4" />
            <DaisyTabsTrigger value="overview">Overview</DaisyTabs>
            <DaisyTabsTrigger value="gaps">Gaps</DaisyTabsTrigger>
            <DaisyTabsTrigger value="requirements">Requirements</DaisyTabsTrigger>
            <DaisyTabsTrigger value="recommendations">Recommendations</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value="overview" className="space-y-6" />
            <div className="grid gap-4 md:grid-cols-4">
              <DaisyCard >
  <DaisyCardHeader className="pb-3" />
</DaisyTabsContent>
                  <DaisyCardTitle className="text-base">Overall Compliance</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="text-2xl font-bold">
</DaisyCardContent>
                    {analysis.overallCompliance.toFixed(1)}%
                  </div>
                  <DaisyProgress value={analysis.overallCompliance} className="mt-2" /></DaisyProgress>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
                  <DaisyCardTitle className="text-base">Total Requirements</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="text-2xl font-bold">
</DaisyCardContent>{analysis.requirementCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.notAssessedCount} not assessed
                  </p>
                </DaisyCardContent>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
                  <DaisyCardTitle className="text-base">Compliance Gaps</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="text-2xl font-bold">
</DaisyCardContent>{analysis.gaps.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.criticalGaps.length} critical
                  </p>
                </DaisyCardContent>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
                  <DaisyCardTitle className="text-base">Assessment Status</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <DaisyBadge variant="secondary" className="text-xs" >
  </DaisyCardContent>
</DaisyBadge>
                    {analysis.assessment.status}
                  </DaisyBadge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(analysis.assessment.assessmentDate), 'MMM dd, yyyy')}
                  </p>
                </DaisyCardContent>
              </DaisyCard>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-base">Compliance Status Distribution</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardContent>
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
                      <DaisyTooltip /></DaisyTooltip>
                  </ResponsiveContainer>
                </DaisyCardContent>
              </DaisyCard>

              <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                  <DaisyCardTitle className="text-base">Gaps by Severity</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardContent>
                    <BarChart data={getGapsBySeverity()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <DaisyTooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </DaisyTooltip>
              </DaisyCard>
            </div>

            <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                <DaisyCardTitle className="text-base">Gaps by Type</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardContent>
                  <BarChart data={getGapsByType()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" width={150} />
                    <DaisyTooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </DaisyTooltip>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="gaps" />
            <ComplianceGapList assessmentId={selectedAssessment} gaps={analysis.gaps} />
          </DaisyTabsContent>

          <DaisyTabsContent value="requirements" />
            <ComplianceRequirementAssessment 
              assessmentId={selectedAssessment}
              frameworkId={analysis.framework.id}
            />
          </DaisyTabsContent>

          <DaisyTabsContent value="recommendations" className="space-y-4" />
            <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                <DaisyCardTitle>Recommended Actions</DaisyCardTitle>
                <DaisyCardDescription >
  Prioritized recommendations based on gap analysis
</DaisyCardDescription>
                </p>
              
              <DaisyCardContent className="space-y-4" >
  {analysis.recommendations.map((recommendation, index) => (
</DaisyCardContent>
                  <DaisyAlert key={index} >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyAlert>
                    <DaisyAlertTitle>Recommendation {index + 1}</DaisyAlertTitle>
                    <DaisyAlertDescription>{recommendation}
                </DaisyAlertDescription>
                </DaisyAlertDescription>
              </DaisyAlert>
                ))}
              </DaisyCardContent>
            </DaisyCard>

            <div className="flex justify-end">
              <DaisyButton onClick={exportReport} >
  <Download className="mr-2 h-4 w-4" />
</DaisyButton>
                Export Report
              </DaisyButton>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      )}
    </div>
  );
}
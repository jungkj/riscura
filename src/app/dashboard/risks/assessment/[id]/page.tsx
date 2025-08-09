'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  FileCheck, 
  AlertTriangle, 
  Calendar,
  Users,
  Edit,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Target,
  Shield,
  TrendingUp,
  FileText,
  MessageSquare,
  Brain,
  Sparkles
} from 'lucide-react';
import AIControlGenerator from '@/components/probo/AIControlGenerator';
import SmartRiskControlMapper from '@/components/probo/SmartRiskControlMapper';

interface Risk {
  id: string;
  title: string;
  riskLevel: string;
  status: string;
  likelihood: number;
  impact: number;
  category: string;
  riskScore: number;
}

interface Assessment {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string;
  createdDate?: string;
  assignedToName: string;
  priority: string;
  riskCount: number;
  description: string;
  objectives?: string[];
  type?: string;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        // Fetch assessment details and risks in parallel
        const [assessmentResponse, risksResponse] = await Promise.all([
          fetch(`/api/assessments`),
          fetch(`/api/assessments/${assessmentId}/risks`)
        ]);

        if (assessmentResponse.ok) {
          const assessmentData = await assessmentResponse.json();
          if (assessmentData.success && assessmentData.data) {
            // Find the specific assessment
            const foundAssessment = assessmentData.data.find((a: any) => a.id === assessmentId);
            if (foundAssessment) {
              setAssessment(foundAssessment);
            } else {
              setError('Assessment not found');
            }
          }
        }

        if (risksResponse.ok) {
          const risksData = await risksResponse.json();
          if (risksData.success && risksData.data) {
            setRisks(risksData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessmentData();
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error || 'Assessment not found'}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/risks/assessment/${assessmentId}/edit`);
  };

  const handleExport = () => {
    console.log('Exporting assessment...');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-gray-600">Assessment ID: {assessment.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Assessment
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={getStatusColor(assessment.status)}>
                  {assessment.status}
                </Badge>
              </div>
              <FileCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{assessment.progress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risks Found</p>
                <p className="text-2xl font-bold text-gray-900">{assessment.riskCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-sm font-bold text-gray-900">{assessment.dueDate}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {assessment.status === 'In Progress' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Assessment Progress</h3>
                <span className="text-sm text-gray-600">{assessment.progress}% Complete</span>
              </div>
              <Progress value={assessment.progress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risks ({assessment.riskCount})</TabsTrigger>
          <TabsTrigger value="ai-controls" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Controls
          </TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600">{assessment.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Assignee</h4>
                    <p className="text-sm text-gray-600">{assessment.assignedToName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Priority</h4>
                    <Badge className={getPriorityColor(assessment.priority)}>
                      {assessment.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Created</h4>
                    <p className="text-sm text-gray-600">{assessment.createdDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Due Date</h4>
                    <p className="text-sm text-gray-600">{assessment.dueDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(assessment.objectives || []).map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
                {(!assessment.objectives || assessment.objectives.length === 0) && (
                  <div className="text-sm text-gray-500 italic">No objectives defined for this assessment.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identified Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{risk.title}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getSeverityColor(risk.riskLevel)}>
                            {risk.riskLevel} Risk
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Likelihood: {risk.likelihood}/5
                          </span>
                          <span className="text-sm text-gray-600">
                            Impact: {risk.impact}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{risk.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(assessment as any).activities && (assessment as any).activities.length > 0 ? (
                  (assessment as any).activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0">
                        {activity.type === 'create' && <FileCheck className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'progress' && <Clock className="h-5 w-5 text-orange-600" />}
                        {activity.type === 'milestone' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">by {activity.user}</p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Activities Yet</h3>
                    <p className="text-center text-sm">Assessment activities and updates will appear here as they occur.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-controls" className="space-y-6">
          <div className="space-y-6">
            {/* AI Control Generator for each risk */}
            {risks.map((risk) => (
              <AIControlGenerator
                key={risk.id}
                riskId={risk.id.toString()}
                riskTitle={risk.title}
                riskDescription={`${risk.riskLevel} severity risk with likelihood ${risk.likelihood}/5 and impact ${risk.impact}/5`}
                riskCategory={risk.category}
                riskSeverity={risk.riskLevel as 'Critical' | 'High' | 'Medium' | 'Low'}
                onControlsGenerated={(controls, mappings) => {
                  console.log('Generated controls for risk:', risk.id, controls, mappings);
                }}
              />
            ))}
            
            {/* Smart Risk-Control Mapper */}
            <SmartRiskControlMapper
              risks={risks.map(risk => ({
                id: risk.id,
                title: risk.title,
                description: `${risk.riskLevel} severity risk with likelihood ${risk.likelihood} and impact ${risk.impact}`,
                category: risk.category,
                severity: risk.riskLevel as 'Critical' | 'High' | 'Medium' | 'Low',
                likelihood: (['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const)[risk.likelihood - 1] || 'Medium',
                impact: (['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const)[risk.impact - 1] || 'Medium',
                riskScore: risk.riskScore
              }))}
              controls={[]} // Would be populated from actual controls
              existingMappings={[]} // Would be populated from existing mappings
              onMappingsUpdate={(mappings) => {
                console.log('Updated mappings:', mappings);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Reports</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Reports Generated</h3>
              <p className="text-sm text-gray-600 text-center mb-6 max-w-md">
                Assessment reports will be available once the assessment is completed or reaches certain milestones.
              </p>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generate Interim Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
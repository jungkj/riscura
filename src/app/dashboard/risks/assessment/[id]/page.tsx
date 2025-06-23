'use client';

import { useState } from 'react';
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

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id;

  // Mock assessment data
  const assessment = {
    id: Number(assessmentId),
    title: 'Annual Security Assessment',
    status: 'In Progress',
    progress: 65,
    dueDate: '2025-02-15',
    createdDate: '2025-01-01',
    assignee: 'Security Team',
    priority: 'High',
    riskCount: 12,
    description: 'Comprehensive annual security risk assessment covering all critical business processes, systems, and third-party integrations.',
    objectives: [
      'Identify and assess security vulnerabilities',
      'Evaluate current security controls effectiveness',
      'Recommend improvements and remediation actions',
      'Ensure compliance with security frameworks'
    ],
    risks: [
      { id: 1, title: 'Data Breach Risk', severity: 'High', status: 'Open', likelihood: 'Medium', impact: 'High' },
      { id: 2, title: 'System Downtime', severity: 'Medium', status: 'In Review', likelihood: 'Low', impact: 'High' },
      { id: 3, title: 'Third-party Vendor Risk', severity: 'High', status: 'Open', likelihood: 'High', impact: 'Medium' }
    ],
    activities: [
      { id: 1, action: 'Assessment created', user: 'John Doe', date: '2025-01-01', type: 'create' },
      { id: 2, action: 'Risk analysis started', user: 'Jane Smith', date: '2025-01-05', type: 'progress' },
      { id: 3, action: 'Controls evaluation completed', user: 'Security Team', date: '2025-01-10', type: 'milestone' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
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
                    <p className="text-sm text-gray-600">{assessment.assignee}</p>
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
                  {assessment.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
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
                {assessment.risks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{risk.title}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getSeverityColor(risk.severity)}>
                            {risk.severity} Risk
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Likelihood: {risk.likelihood}
                          </span>
                          <span className="text-sm text-gray-600">
                            Impact: {risk.impact}
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
                {assessment.activities.map((activity) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-controls" className="space-y-6">
          <div className="space-y-6">
            {/* AI Control Generator for each risk */}
            {assessment.risks.map((risk) => (
              <AIControlGenerator
                key={risk.id}
                riskId={risk.id.toString()}
                riskTitle={risk.title}
                riskDescription={`${risk.severity} severity risk with ${risk.likelihood} likelihood and ${risk.impact} impact`}
                riskCategory="Security"
                riskSeverity={risk.severity as 'Critical' | 'High' | 'Medium' | 'Low'}
                onControlsGenerated={(controls, mappings) => {
                  console.log('Generated controls for risk:', risk.id, controls, mappings);
                }}
              />
            ))}
            
            {/* Smart Risk-Control Mapper */}
            <SmartRiskControlMapper
              risks={assessment.risks.map(risk => ({
                id: risk.id.toString(),
                title: risk.title,
                description: `${risk.severity} severity risk with ${risk.likelihood} likelihood and ${risk.impact} impact`,
                category: 'Security',
                severity: risk.severity as 'Critical' | 'High' | 'Medium' | 'Low',
                likelihood: risk.likelihood as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low',
                impact: risk.impact as 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low',
                riskScore: risk.severity === 'High' ? 80 : risk.severity === 'Medium' ? 60 : 40
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
'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileCheck, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Users,
  Target,
  Plus,
  Filter,
  Download,
  Eye,
  Edit
} from 'lucide-react';

export default function RiskAssessmentPage() {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);

  // Mock data for assessments
  const assessments = [
    {
      id: 1,
      title: 'Annual Security Assessment',
      status: 'In Progress',
      progress: 65,
      dueDate: '2025-02-15',
      assignee: 'Security Team',
      priority: 'High',
      riskCount: 12
    },
    {
      id: 2,
      title: 'Compliance Risk Review',
      status: 'Completed',
      progress: 100,
      dueDate: '2025-01-30',
      assignee: 'Compliance Team',
      priority: 'Medium',
      riskCount: 8
    },
    {
      id: 3,
      title: 'Third-Party Vendor Assessment',
      status: 'Pending',
      progress: 0,
      dueDate: '2025-03-01',
      assignee: 'Risk Team',
      priority: 'High',
      riskCount: 15
    }
  ];

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

  const handleViewDetails = (assessmentId: number) => {
    // Navigate to assessment detail page
    router.push(`/dashboard/risks/assessment/${assessmentId}`);
  };

  const handleEditAssessment = (assessmentId: number) => {
    // Navigate to assessment edit page
    router.push(`/dashboard/risks/assessment/${assessmentId}/edit`);
  };

  const handleNewAssessment = () => {
    router.push('/dashboard/risks/assessment/new');
  };

  const handleExportAssessments = () => {
    // Mock export functionality
    console.log('Exporting assessments...');
    // In a real app, this would trigger a download
  };

  const handleFilterAssessments = () => {
    // Mock filter functionality
    console.log('Opening filter modal...');
    // In a real app, this would open a filter modal
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Assessments</h1>
          <p className="text-gray-600">Manage and track your organization's risk assessment processes and outcomes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-sm" onClick={handleFilterAssessments}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" className="text-sm" onClick={handleExportAssessments}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleNewAssessment}>
            <FileCheck className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assessments</p>
                <p className="text-3xl font-bold text-blue-900">3</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">In Progress</p>
                <p className="text-3xl font-bold text-green-900">1</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">1</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Completed</p>
                <p className="text-3xl font-bold text-emerald-900">1</p>
              </div>
              <FileCheck className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Assessment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<LoadingSpinner />}>
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assessment.title}
                        </h3>
                        <Badge className={getStatusColor(assessment.status)}>
                          {assessment.status}
                        </Badge>
                        <Badge className={getPriorityColor(assessment.priority)}>
                          {assessment.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {assessment.dueDate}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{assessment.assignee}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{assessment.riskCount} risks identified</span>
                        </div>
                      </div>

                      {assessment.status === 'In Progress' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{assessment.progress}%</span>
                          </div>
                          <Progress value={assessment.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(assessment.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAssessment(assessment.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { Suspense, useState, useEffect } from 'react';
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

interface Assessment {
  id: string;
  title: string;
  status: string;
  progress: number;
  dueDate: string;
  assignedToName: string;
  priority: string;
  riskCount: number;
  type?: string;
  description?: string;
}

export default function RiskAssessmentPage() {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments from API
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/assessments', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setAssessments(data.data);
          } else {
            // Only show fallback in development
            if (process.env.NODE_ENV !== 'production') {
              console.warn('No assessments data available, using fallback in development');
              setAssessments([]);
            } else {
              setAssessments([]);
            }
          }
        } else {
          console.error('Failed to fetch assessments:', response.statusText);
          setError('Failed to fetch assessments');
          setAssessments([]);
        }
      } catch (error) {
        console.error('Error fetching assessments:', error);
        setError('Failed to load assessments');
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

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

  // Calculate stats from actual data
  const calculateStats = () => {
    const total = assessments.length;
    const inProgress = assessments.filter(a => a.status === 'IN_PROGRESS').length;
    const pending = assessments.filter(a => a.status === 'DRAFT').length;
    const completed = assessments.filter(a => a.status === 'COMPLETED').length;
    
    return { total, inProgress, pending, completed };
  };

  const stats = calculateStats();

  const handleViewDetails = (assessmentId: string) => {
    // Navigate to assessment detail page
    router.push(`/dashboard/risks/assessment/${assessmentId}`);
  };

  const handleEditAssessment = (assessmentId: string) => {
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
                <p className="text-3xl font-bold text-blue-900">{loading ? '-' : stats.total}</p>
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
                <p className="text-3xl font-bold text-green-900">{loading ? '-' : stats.inProgress}</p>
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
                <p className="text-3xl font-bold text-yellow-900">{loading ? '-' : stats.pending}</p>
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
                <p className="text-3xl font-bold text-emerald-900">{loading ? '-' : stats.completed}</p>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600">Loading assessments...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : assessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileCheck className="h-12 w-12 mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No Assessments Found</h3>
              <p className="text-center mb-4">Get started by creating your first risk assessment.</p>
              <Button onClick={handleNewAssessment}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assessment
              </Button>
            </div>
          ) : (
            assessments.map((assessment) => (
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
                          <span>{assessment.assignedToName || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{assessment.riskCount} risks identified</span>
                        </div>
                      </div>

                      {assessment.status === 'IN_PROGRESS' && (
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { QuestionnaireBuilder } from '@/components/questionnaires/QuestionnaireBuilder';
import { Questionnaire, QuestionnaireCategory, QuestionnaireType, QuestionnaireStatus } from '@/types/questionnaire.types';
import { formatDate } from '@/lib/utils';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Icons
import {
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Send,
  BarChart3,
  CheckCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function QuestionnairePage() {
  // Mock data that matches the proper Questionnaire type
  const mockQuestionnaires: Questionnaire[] = [
    {
      id: 'q1',
      title: 'Annual Risk Assessment',
      description: 'Comprehensive risk assessment questionnaire for all departments',
      category: 'risk_assessment' as QuestionnaireCategory,
      type: 'static' as QuestionnaireType,
      version: '1.0',
      status: 'active' as QuestionnaireStatus,
      config: {
        allowPartialSave: true,
        requiresApproval: false,
        randomizeQuestions: false,
        showProgress: true,
        allowSkipping: false,
        requiredCompletion: 100,
        notificationSettings: {
          enabled: true,
          types: ['response_submitted'],
          channels: ['email'],
          frequency: 'immediate',
          recipients: []
        },
        accessControl: {
          publicAccess: false,
          requiresAuthentication: true,
          allowedRoles: ['admin', 'auditor'],
          allowedUsers: [],
          restrictions: []
        }
      },
      sections: [],
      scoring: {
        type: 'weighted',
        maxScore: 100,
        categories: [],
        aggregation: 'sum',
        normalization: false
      },
      createdBy: 'admin',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      analytics: {
        overview: {
          totalResponses: 25,
          completionRate: 0.85,
          averageScore: 78.5,
          averageTime: 45,
          lastUpdated: new Date()
        },
        completion: {
          started: 30,
          completed: 25,
          abandoned: 5,
          averageCompletionTime: 42,
          completionRateBySection: [],
          dropOffPoints: []
        },
        performance: {
          averageResponseTime: 2.5,
          questionDifficulty: [],
          userExperience: {
            satisfactionScore: 4.2,
            usabilityScore: 4.0,
            clarityScore: 4.3,
            feedbackCount: 15,
            commonComplaints: []
          },
          technicalMetrics: {
            loadTime: 1.2,
            errorRate: 0.02,
            crashRate: 0.001,
            deviceBreakdown: [],
            browserBreakdown: []
          }
        },
        responses: {
          patterns: [],
          distributions: [],
          correlations: [],
          outliers: []
        },
        trends: {
          timeSeriesData: [],
          trendDirection: 'stable',
          seasonality: [],
          forecasts: []
        }
      },
      aiSettings: {
        enabled: true,
        questionGeneration: {
          enabled: false,
          contextSources: [],
          generationRules: [],
          reviewRequired: true,
          maxQuestions: 50
        },
        responseAnalysis: {
          enabled: true,
          patterns: [],
          riskScoring: true,
          anomalyDetection: true,
          sentimentAnalysis: false
        },
        riskAssessment: {
          enabled: true,
          scoringModel: {
            type: 'weighted',
            weights: {},
            rules: []
          },
          riskCategories: [],
          thresholds: [],
          autoPopulate: false
        },
        followUpSuggestions: {
          enabled: false,
          triggerConditions: [],
          suggestionRules: [],
          maxSuggestions: 5
        }
      },
      permissions: {
        read: ['admin', 'auditor', 'manager'],
        write: ['admin'],
        admin: ['admin'],
        respond: ['all'],
        review: ['admin', 'auditor'],
        approve: ['admin'],
        analytics: ['admin', 'auditor']
      }
    },
    {
      id: 'q2',
      title: 'Control Effectiveness Survey',
      description: 'Quarterly survey to assess control effectiveness',
      category: 'control_testing' as QuestionnaireCategory,
      type: 'dynamic' as QuestionnaireType,
      version: '2.1',
      status: 'completed' as QuestionnaireStatus,
      config: {
        allowPartialSave: true,
        requiresApproval: true,
        randomizeQuestions: false,
        showProgress: true,
        allowSkipping: true,
        requiredCompletion: 90,
        notificationSettings: {
          enabled: true,
          types: ['response_submitted', 'review_required'],
          channels: ['email'],
          frequency: 'immediate',
          recipients: []
        },
        accessControl: {
          publicAccess: false,
          requiresAuthentication: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          restrictions: []
        }
      },
      sections: [],
      scoring: {
        type: 'weighted',
        maxScore: 100,
        categories: [],
        aggregation: 'weighted_average',
        normalization: true
      },
      createdBy: 'admin',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
      analytics: {
        overview: {
          totalResponses: 18,
          completionRate: 0.72,
          averageScore: 82.3,
          averageTime: 35,
          lastUpdated: new Date()
        },
        completion: {
          started: 25,
          completed: 18,
          abandoned: 7,
          averageCompletionTime: 33,
          completionRateBySection: [],
          dropOffPoints: []
        },
        performance: {
          averageResponseTime: 1.8,
          questionDifficulty: [],
          userExperience: {
            satisfactionScore: 4.1,
            usabilityScore: 4.2,
            clarityScore: 4.0,
            feedbackCount: 12,
            commonComplaints: []
          },
          technicalMetrics: {
            loadTime: 0.9,
            errorRate: 0.01,
            crashRate: 0.0005,
            deviceBreakdown: [],
            browserBreakdown: []
          }
        },
        responses: {
          patterns: [],
          distributions: [],
          correlations: [],
          outliers: []
        },
        trends: {
          timeSeriesData: [],
          trendDirection: 'improving',
          seasonality: [],
          forecasts: []
        }
      },
      aiSettings: {
        enabled: false,
        questionGeneration: {
          enabled: false,
          contextSources: [],
          generationRules: [],
          reviewRequired: true,
          maxQuestions: 30
        },
        responseAnalysis: {
          enabled: false,
          patterns: [],
          riskScoring: false,
          anomalyDetection: false,
          sentimentAnalysis: false
        },
        riskAssessment: {
          enabled: false,
          scoringModel: {
            type: 'weighted',
            weights: {},
            rules: []
          },
          riskCategories: [],
          thresholds: [],
          autoPopulate: false
        },
        followUpSuggestions: {
          enabled: false,
          triggerConditions: [],
          suggestionRules: [],
          maxSuggestions: 3
        }
      },
      permissions: {
        read: ['admin', 'manager'],
        write: ['admin'],
        admin: ['admin'],
        respond: ['all'],
        review: ['admin', 'manager'],
        approve: ['admin'],
        analytics: ['admin']
      }
    },
  ];

  const mockStats = {
    total: 8,
    active: 3,
    completed: 4,
    draft: 1,
    averageCompletion: 0.75,
    totalResponses: 142,
  };

  const [questionnaires] = useState(mockQuestionnaires);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const stats = mockStats;

  const handleCreateNew = () => {
    setEditingQuestionnaire(null);
    setShowBuilder(true);
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire.id);
    setShowBuilder(true);
  };

  const handleDuplicate = async (questionnaire: Questionnaire) => {
    try {
      console.log('Duplicating questionnaire:', questionnaire.id);
      // Mock implementation
    } catch (error) {
      console.error('Failed to duplicate questionnaire:', error);
    }
  };

  const handleDelete = async (questionnaireId: string) => {
    if (confirm('Are you sure you want to delete this questionnaire?')) {
      try {
        console.log('Deleting questionnaire:', questionnaireId);
        // Mock implementation
      } catch (error) {
        console.error('Failed to delete questionnaire:', error);
      }
    }
  };

  const handleDistribute = async (questionnaire: Questionnaire) => {
    try {
      // In a real app, this would open a user selection dialog
      const mockUserIds = ['user1', 'user2', 'user3'];
      console.log('Distributing questionnaire:', questionnaire.id, 'to:', mockUserIds);
      alert(`Questionnaire distributed to ${mockUserIds.length} users`);
    } catch (error) {
      console.error('Failed to distribute questionnaire:', error);
    }
  };

  const handleViewAnalytics = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setShowAnalytics(true);
  };

  const getStatusBadge = (status: QuestionnaireStatus) => {
    const statusConfig = {
      draft: { color: 'bg-secondary/20 text-foreground', label: 'Draft' },
      review: { color: 'bg-yellow-100 text-yellow-800', label: 'Review' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      deprecated: { color: 'bg-gray-100 text-gray-800', label: 'Deprecated' },
      archived: { color: 'bg-yellow-100 text-yellow-800', label: 'Archived' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingSpinner text="Loading questionnaires..." />;
  }

  if (error) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading questionnaires: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2 bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a]">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showBuilder) {
    return (
      <QuestionnaireBuilder
        questionnaire={editingQuestionnaire ? questionnaires.find(q => q.id === editingQuestionnaire) || null : null}
        onSave={() => setShowBuilder(false)}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-inter">Questionnaires</h1>
          <p className="text-gray-600 font-inter">
            Create and manage dynamic questionnaires with AI assistance
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] border-0 shadow-md hover:shadow-lg transition-all duration-300 font-inter font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Create Questionnaire
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Questionnaires</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-600">
              Across all statuses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-gray-600">
              Currently collecting responses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#191919]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCompletionColor(stats.averageCompletion)}`}>
              {(stats.averageCompletion * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">
              Average across all questionnaires
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#191919]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#191919]">{stats.totalResponses}</div>
            <p className="text-xs text-gray-600">
              All-time responses collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questionnaires Table */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 font-inter">Questionnaires</CardTitle>
          <CardDescription className="text-gray-600 font-inter">
            Manage your questionnaires and track completion rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700 font-medium">Title</TableHead>
                <TableHead className="text-gray-700 font-medium">Status</TableHead>
                <TableHead className="text-gray-700 font-medium">Category</TableHead>
                <TableHead className="text-gray-700 font-medium">Created</TableHead>
                <TableHead className="text-gray-700 font-medium">Completion</TableHead>
                <TableHead className="text-gray-700 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((questionnaire) => (
                <TableRow key={questionnaire.id} className="hover:bg-[#D8C3A5]/20">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{questionnaire.title}</div>
                      <div className="text-sm text-gray-600">{questionnaire.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(questionnaire.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-secondary/20 text-muted-foreground border-0">
                      {questionnaire.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(questionnaire.createdAt.toISOString())}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={questionnaire.analytics.overview.completionRate * 100} className="w-16 bg-secondary/20 border border-border h-2" />
                      <span className="text-sm text-gray-600">{(questionnaire.analytics.overview.completionRate * 100).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-[#D8C3A5]/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-100 shadow-lg">
                        <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleEdit(questionnaire)}
                          className="hover:bg-[#D8C3A5]/20 text-gray-700 font-inter font-medium"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(questionnaire)}
                          className="hover:bg-[#D8C3A5]/20 text-gray-700 font-inter font-medium"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDistribute(questionnaire)}
                          className="hover:bg-[#D8C3A5]/20 text-gray-700 font-inter font-medium"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Distribute
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewAnalytics(questionnaire)}
                          className="hover:bg-[#D8C3A5]/20 text-gray-700 font-inter font-medium"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(questionnaire.id)}
                          className="text-red-600 hover:bg-red-50 font-inter font-medium"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl bg-white border border-gray-100 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Questionnaire Analytics</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedQuestionnaire?.title} - Response analytics and insights
            </DialogDescription>
          </DialogHeader>
          {selectedQuestionnaire && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedQuestionnaire.analytics.overview.totalResponses}
                  </div>
                  <div className="text-sm text-gray-600">Total Responses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(selectedQuestionnaire.analytics.overview.completionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#191919]">
                    {selectedQuestionnaire.analytics.overview.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
              <div className="text-center py-8 text-gray-600">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed analytics charts coming soon</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
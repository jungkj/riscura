import React, { useState } from 'react';
import { useQuestionnaires } from '@/context/QuestionnaireContext';
import { QuestionnaireBuilder } from '@/components/questionnaires/QuestionnaireBuilder';
import { Questionnaire } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function QuestionnairePage() {
  const {
    questionnaires,
    loading,
    error,
    deleteQuestionnaire,
    duplicateQuestionnaire,
    distributeQuestionnaire,
    getCompletionStats,
  } = useQuestionnaires();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const stats = getCompletionStats();

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
      await duplicateQuestionnaire(questionnaire.id, `${questionnaire.title} (Copy)`);
    } catch (error) {
      console.error('Failed to duplicate questionnaire:', error);
    }
  };

  const handleDelete = async (questionnaireId: string) => {
    if (confirm('Are you sure you want to delete this questionnaire?')) {
      try {
        await deleteQuestionnaire(questionnaireId);
      } catch (error) {
        console.error('Failed to delete questionnaire:', error);
      }
    }
  };

  const handleDistribute = async (questionnaire: Questionnaire) => {
    try {
      // In a real app, this would open a user selection dialog
      const mockUserIds = ['user1', 'user2', 'user3'];
      await distributeQuestionnaire(questionnaire.id, mockUserIds);
      alert(`Questionnaire distributed to ${mockUserIds.length} users`);
    } catch (error) {
      console.error('Failed to distribute questionnaire:', error);
    }
  };

  const handleViewAnalytics = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setShowAnalytics(true);
  };

  const getStatusBadge = (status: Questionnaire['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      archived: { color: 'bg-yellow-100 text-yellow-800', label: 'Archived' },
    };

    const config = statusConfig[status];
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading questionnaires: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
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
        questionnaireId={editingQuestionnaire || undefined}
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
          <h1 className="text-3xl font-bold">Questionnaires</h1>
          <p className="text-muted-foreground">
            Create and manage dynamic questionnaires with AI assistance
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Questionnaire
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questionnaires</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all statuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Currently collecting responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Finished questionnaires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Questionnaire List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Questionnaires</CardTitle>
              <CardDescription>
                Manage your questionnaires, track responses, and analyze results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questionnaires.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No questionnaires yet</p>
                  <p className="text-sm">Create your first questionnaire to get started</p>
                  <Button onClick={handleCreateNew} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Questionnaire
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Target Roles</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionnaires.map((questionnaire) => (
                      <TableRow key={questionnaire.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{questionnaire.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {questionnaire.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(questionnaire.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{questionnaire.questions.length}</span>
                            <span className="text-xs text-muted-foreground">
                              (~{questionnaire.estimatedTime}min)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={(questionnaire.completionRate || 0) * 100} 
                              className="w-16" 
                            />
                            <span className={`text-sm font-medium ${getCompletionColor(questionnaire.completionRate || 0)}`}>
                              {Math.round((questionnaire.completionRate || 0) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm ${new Date(questionnaire.dueDate) < new Date() ? 'text-red-600' : ''}`}>
                            {formatDate(questionnaire.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {questionnaire.targetRoles.slice(0, 2).map(role => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role.replace('_', ' ')}
                              </Badge>
                            ))}
                            {questionnaire.targetRoles.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{questionnaire.targetRoles.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(questionnaire)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewAnalytics(questionnaire)}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(questionnaire)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              {questionnaire.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleDistribute(questionnaire)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Distribute
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(questionnaire.id)}
                                className="text-red-600"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
                <CardDescription>
                  Response collection over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Response trends chart coming soon</p>
                  <p className="text-sm">Will show response collection over time</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rates</CardTitle>
                <CardDescription>
                  Average completion rates by questionnaire type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionnaires.slice(0, 5).map(q => (
                    <div key={q.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{q.title}</p>
                        <Progress value={(q.completionRate || 0) * 100} className="mt-1" />
                      </div>
                      <span className={`ml-4 text-sm font-medium ${getCompletionColor(q.completionRate || 0)}`}>
                        {Math.round((q.completionRate || 0) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators for questionnaire effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {questionnaires.reduce((acc, q) => acc + (q.completionRate || 0), 0) / questionnaires.length * 100 || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {questionnaires.reduce((acc, q) => acc + (q.estimatedTime || 0), 0) / questionnaires.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Time (minutes)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {questionnaires.reduce((acc, q) => acc + q.questions.length, 0) / questionnaires.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Questions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedQuestionnaire?.title} - Analytics</DialogTitle>
            <DialogDescription>
              Detailed analytics and response data for this questionnaire
            </DialogDescription>
          </DialogHeader>
          {selectedQuestionnaire && (
            <QuestionnaireAnalytics questionnaire={selectedQuestionnaire} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Questionnaire Analytics Component
interface QuestionnaireAnalyticsProps {
  questionnaire: Questionnaire;
}

const QuestionnaireAnalytics: React.FC<QuestionnaireAnalyticsProps> = ({
  questionnaire,
}) => {
  const { getQuestionnaireAnalytics } = useQuestionnaires();
  const analytics = getQuestionnaireAnalytics(questionnaire.id);

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{analytics.totalResponses}</div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(analytics.completionRate * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.averageTime}min
            </div>
            <div className="text-sm text-muted-foreground">Average Time</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {questionnaire.questions.length}
            </div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </CardContent>
        </Card>
      </div>

      {/* Response Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Response Trends</CardTitle>
          <CardDescription>
            Daily response collection over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Response trends chart coming soon</p>
            <p className="text-sm">Will integrate with Recharts for visualization</p>
          </div>
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
          <CardDescription>
            Response patterns by question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questionnaire.questions.slice(0, 5).map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium">Q{index + 1}: {question.text}</p>
                    <Badge variant="outline" className="mt-1">
                      {question.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * 50) + 10} responses
                    </div>
                  </div>
                </div>
                <Progress value={Math.random() * 100} className="mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
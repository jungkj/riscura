import React, { useState } from 'react';
import { useWorkflows } from '@/context/WorkflowContext';
import { Workflow, WorkflowStep } from '@/types';
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
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  GitBranch,
  Users,
  BarChart3,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';

export default function WorkflowPage() {
  const {
    workflows,
    activeSteps,
    loading,
    error,
    deleteWorkflow,
    startWorkflow,
    completeStep,
    getWorkflowStats,
    duplicateWorkflow,
  } = useWorkflows();

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showStepsDialog, setShowStepsDialog] = useState(false);

  const stats = getWorkflowStats();

  const handleCreateNew = () => {
    // In a real app, this would open a workflow designer
    console.log('Create new workflow');
  };

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowDialog(true);
  };

  const handleViewSteps = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowStepsDialog(true);
  };

  const handleDuplicate = async (workflow: Workflow) => {
    try {
      await duplicateWorkflow(workflow.id, `${workflow.name} (Copy)`);
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await deleteWorkflow(workflowId);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  const handleStart = async (workflow: Workflow) => {
    try {
      await startWorkflow(workflow.id);
      alert(`Workflow "${workflow.name}" started successfully`);
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  const handleCompleteStep = async (workflowId: string, stepId: string, result: 'completed' | 'rejected') => {
    try {
      await completeStep(workflowId, stepId, result);
      alert(`Step ${result} successfully`);
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const getStatusBadge = (status: Workflow['status']) => {
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

  const getPriorityBadge = (priority: Workflow['priority']) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    };

    const config = priorityConfig[priority];
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-gray-500" />,
      in_progress: <Play className="h-4 w-4 text-blue-500" />,
      completed: <CheckCircle className="h-4 w-4 text-green-500" />,
      rejected: <AlertTriangle className="h-4 w-4 text-red-500" />,
      skipped: <ArrowRight className="h-4 w-4 text-gray-400" />,
    };
    return icons[status];
  };

  if (loading) {
    return <LoadingSpinner text="Loading workflows..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading workflows: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground">
            Design, manage, and track approval workflows and business processes
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
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
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">All Workflows</TabsTrigger>
          <TabsTrigger value="active-steps">Active Steps</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Library</CardTitle>
              <CardDescription>
                Manage workflow templates and active processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No workflows yet</p>
                  <p className="text-sm">Create your first workflow to get started</p>
                  <Button onClick={handleCreateNew} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Assignees</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((workflow) => {
                      const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
                      const totalSteps = workflow.steps.length;
                      const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                      return (
                        <TableRow key={workflow.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{workflow.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {workflow.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {workflow.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(workflow.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(workflow.priority)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={progress} className="w-16" />
                              <span className="text-sm text-muted-foreground">
                                {completedSteps}/{totalSteps}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{workflow.assignedTo.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(workflow.createdAt)}
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
                                <DropdownMenuItem onClick={() => handleViewSteps(workflow)}>
                                  <GitBranch className="mr-2 h-4 w-4" />
                                  View Steps
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(workflow)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(workflow)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                {workflow.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStart(workflow)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(workflow.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active-steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Steps ({activeSteps.length})</CardTitle>
              <CardDescription>
                Steps requiring attention across all active workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSteps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active steps</p>
                  <p className="text-sm">All workflow steps are completed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSteps.map((step) => {
                    const workflow = workflows.find(w => w.steps.some(s => s.id === step.id));
                    const isOverdue = new Date(step.dueDate) < new Date();

                    return (
                      <Card key={step.id} className={isOverdue ? 'border-red-200' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStepStatusIcon(step.status)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{step.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {step.type}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Workflow: {workflow?.name}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{step.assignee}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Due: {formatDate(step.dueDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {step.status === 'in_progress' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCompleteStep(workflow?.id || '', step.id, 'rejected')}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteStep(workflow?.id || '', step.id, 'completed')}
                                  >
                                    Complete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>
                  Average completion times and success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.averageCompletionTime} days
                    </div>
                    <div className="text-sm text-muted-foreground">Average Completion Time</div>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance charts coming soon</p>
                    <p className="text-sm">Will show completion trends and bottlenecks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step Analytics</CardTitle>
                <CardDescription>
                  Step completion rates and average times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.slice(0, 3).map(workflow => (
                    <div key={workflow.id} className="border rounded-lg p-3">
                      <div className="font-medium text-sm mb-2">{workflow.name}</div>
                      <div className="space-y-2">
                        {workflow.steps.slice(0, 2).map(step => (
                          <div key={step.id} className="flex items-center justify-between text-xs">
                            <span className="truncate">{step.name}</span>
                            <div className="flex items-center space-x-2">
                              {getStepStatusIcon(step.status)}
                              <span className="text-muted-foreground">
                                {step.status === 'completed' ? '✓' : '⏳'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workflow Details Dialog */}
      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>
              Workflow details and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <WorkflowDetails workflow={selectedWorkflow} />
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Steps Dialog */}
      <Dialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.name} - Steps</DialogTitle>
            <DialogDescription>
              Workflow step details and progress
            </DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <WorkflowSteps workflow={selectedWorkflow} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workflow Details Component
interface WorkflowDetailsProps {
  workflow: Workflow;
}

const WorkflowDetails: React.FC<WorkflowDetailsProps> = ({ workflow }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Type</label>
          <p className="text-sm text-muted-foreground">{workflow.type}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <p className="text-sm text-muted-foreground">{workflow.priority}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <p className="text-sm text-muted-foreground">{workflow.status}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Created By</label>
          <p className="text-sm text-muted-foreground">{workflow.createdBy}</p>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Assigned To ({workflow.assignedTo.length})</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {workflow.assignedTo.map(assignee => (
            <Badge key={assignee} variant="outline" className="text-xs">
              {assignee}
            </Badge>
          ))}
        </div>
      </div>
      {workflow.tags && workflow.tags.length > 0 && (
        <div>
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {workflow.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Workflow Steps Component
interface WorkflowStepsProps {
  workflow: Workflow;
}

const WorkflowSteps: React.FC<WorkflowStepsProps> = ({ workflow }) => {
  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-gray-500" />,
      in_progress: <Play className="h-4 w-4 text-blue-500" />,
      completed: <CheckCircle className="h-4 w-4 text-green-500" />,
      rejected: <AlertTriangle className="h-4 w-4 text-red-500" />,
      skipped: <ArrowRight className="h-4 w-4 text-gray-400" />,
    };
    return icons[status];
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {workflow.steps.length} steps • {workflow.steps.filter(s => s.status === 'completed').length} completed
      </div>
      
      <div className="space-y-3">
        {workflow.steps.map((step, index) => (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStepStatusIcon(step.status)}
                    <h4 className="font-medium">{step.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {step.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assignee:</span> {step.assignee}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due:</span> {formatDate(step.dueDate)}
                    </div>
                    {step.completedAt && (
                      <div>
                        <span className="text-muted-foreground">Completed:</span> {formatDate(step.completedAt)}
                      </div>
                    )}
                    {step.completedBy && (
                      <div>
                        <span className="text-muted-foreground">Completed by:</span> {step.completedBy}
                      </div>
                    )}
                  </div>
                  {step.comments && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="text-muted-foreground">Comments:</span> {step.comments}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
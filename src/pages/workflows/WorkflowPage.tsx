'use client';

import React, { useState } from 'react';
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
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { LoadingSpinner } from '@/components/ui/DaisyLoadingSpinner';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCard, DaisyCardContent, DaisyCardHeader, DaisyCardTitle, DaisyCardDescription } from '@/components/ui/DaisyCard';
import { DaisyTable, DaisyTableBody, DaisyTableCell, DaisyTableHead, DaisyTableHeader, DaisyTableRow } from '@/components/ui/DaisyTable';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuLabel, DaisyDropdownMenuSeparator, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdownMenu';
import { DaisyDialog, DaisyDialogContent } from '@/components/ui/DaisyDialog';
import { DaisyAlertTriangle } from '@/components/ui/DaisyAlert';

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
  XCircle,
  X,
} from 'lucide-react';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function WorkflowPage() {
  // Mock data instead of using context hook
  const mockWorkflows: Workflow[] = [
    {
      id: 'wf1',
      name: 'Risk Assessment Workflow',
      description: 'Comprehensive risk assessment process with multiple approval stages',
      type: 'assessment',
      status: 'active',
      priority: 'high',
      steps: [
        {
          id: 'step1',
          name: 'Initial Assessment',
          type: 'approval',
          status: 'completed',
          assignee: 'user1',
          order: 1,
          dueDate: new Date('2024-01-20').toISOString(),
          completedAt: new Date('2024-01-18').toISOString(),
        },
        {
          id: 'step2',
          name: 'Risk Analysis',
          type: 'review',
          status: 'in_progress',
          assignee: 'user2',
          order: 2,
          dueDate: new Date('2024-01-25').toISOString(),
        },
      ],
      assignedTo: ['user1', 'user2'],
      createdAt: new Date('2024-01-15').toISOString(),
      createdBy: 'admin',
    },
    {
      id: 'wf2',
      name: 'Control Testing Workflow',
      description: 'Automated workflow for control effectiveness testing',
      type: 'approval',
      status: 'draft',
      priority: 'medium',
      steps: [
        {
          id: 'step1',
          name: 'Test Design',
          type: 'action',
          status: 'pending',
          assignee: 'user3',
          order: 1,
          dueDate: new Date('2024-02-01').toISOString(),
        },
      ],
      assignedTo: ['user3'],
      createdAt: new Date('2024-01-20').toISOString(),
      createdBy: 'admin',
    },
  ];

  const mockActiveSteps: WorkflowStep[] = [
    {
      id: 'step2',
      name: 'Risk Analysis',
      type: 'review',
      status: 'in_progress',
      assignee: 'user2',
      order: 2,
      dueDate: new Date('2024-01-25').toISOString(),
    },
  ];

  const mockStats = {
    total: 8,
    active: 3,
    completed: 4,
    draft: 1,
    pendingSteps: 5,
    overdueSteps: 1,
    avgCompletionTime: 3.2,
  };

  const [workflows] = useState(mockWorkflows);
  const [activeSteps] = useState(mockActiveSteps);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showStepsDialog, setShowStepsDialog] = useState(false);

  const stats = mockStats;

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
      console.log('Duplicating workflow:', workflow.id);
      // Mock implementation
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        console.log('Deleting workflow:', workflowId);
        // Mock implementation
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  const handleStart = async (workflow: Workflow) => {
    try {
      console.log('Starting workflow:', workflow.id);
      alert(`Workflow "${workflow.name}" started successfully`);
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  const handleCompleteStep = async (workflowId: string, stepId: string, result: 'completed' | 'rejected') => {
    try {
      console.log('Completing step:', stepId, 'with result:', result);
      alert(`Step ${result} successfully`);
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const getStatusBadge = (status: Workflow['status']) => {
    const statusConfig = {
      draft: { color: 'bg-secondary/20 text-foreground', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      archived: { color: 'bg-yellow-100 text-yellow-800', label: 'Archived' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };

  return (
    <DaisyBadge variant="outline" className={config.color}>
      {config.label}
    </DaisyBadge>
  );
  };

  const getPriorityBadge = (priority: Workflow['priority']) => {
    const priorityConfig = {
      low: { color: 'bg-secondary/20 text-foreground', label: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    };

    const config = priorityConfig[priority] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    return (
      <DaisyBadge variant="outline" className={config.color}>
        {config.label}
      </DaisyBadge>
    );
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'skipped': return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading workflows..." />;
  }

  if (error) {
    return (
      <DaisyCard className="bg-white border border-gray-100 shadow-sm">
        <DaisyCardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading workflows: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] rounded"
            >
              Retry
            </button>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-inter">Workflow Management</h1>
          <p className="text-gray-600 font-inter">
            Design, manage, and monitor automated workflows
          </p>
        </div>
        <DaisyButton onClick={handleCreateNew} className="bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] border-0 shadow-md hover:shadow-lg transition-all duration-300 font-inter font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </DaisyButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Total Workflows</DaisyCardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </DaisyCardHeader>
          <DaisyCardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Active</DaisyCardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </DaisyCardHeader>
          <DaisyCardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Completed</DaisyCardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </DaisyCardHeader>
          <DaisyCardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Overdue</DaisyCardTitle>
            <DaisyAlertTriangle className="h-4 w-4 text-red-600" />
          </DaisyCardHeader>
          <DaisyCardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueSteps}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </DaisyCardContent>
        </DaisyCard>
      </div>

      {/* Main Content */}
      <DaisyTabs defaultValue="workflows" className="space-y-4">
        <DaisyTabsList>
          <DaisyTabsTrigger value="workflows">All Workflows</DaisyTabsTrigger>
          <DaisyTabsTrigger value="active-steps">Active Steps</DaisyTabsTrigger>
          <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="workflows" className="space-y-4">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Workflow Library</DaisyCardTitle>
              <DaisyCardDescription>
                Manage workflow templates and active processes
              </DaisyCardDescription>
            </DaisyCardHeader>
            <DaisyCardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No workflows yet</p>
                  <p className="text-sm">Create your first workflow to get started</p>
                  <DaisyButton onClick={handleCreateNew} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </DaisyButton>
                </div>
              ) : (
                <DaisyTable>
                  <DaisyTableHeader>
                    <DaisyTableRow>
                      <DaisyTableHead>Name</DaisyTableHead>
                      <DaisyTableHead>Type</DaisyTableHead>
                      <DaisyTableHead>Status</DaisyTableHead>
                      <DaisyTableHead>Priority</DaisyTableHead>
                      <DaisyTableHead>Progress</DaisyTableHead>
                      <DaisyTableHead>Assignees</DaisyTableHead>
                      <DaisyTableHead>Created</DaisyTableHead>
                      <DaisyTableHead className="w-12"></DaisyTableHead>
                    </DaisyTableRow>
                  </DaisyTableHeader>
                  <DaisyTableBody>
                    {workflows.map((workflow) => {
                      const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
                      const totalSteps = workflow.steps.length;
                      const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

                      return (
                        <DaisyTableRow key={workflow.id}>
                          <DaisyTableCell>
                            <div>
                              <div className="font-medium">{workflow.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {workflow.description}
                              </div>
                            </div>
                          </DaisyTableCell>
                          <DaisyTableCell>
                            <DaisyBadge variant="outline">
                              {workflow.type.replace('_', ' ')}
                            </DaisyBadge>
                          </DaisyTableCell>
                          <DaisyTableCell>
                            {getStatusBadge(workflow.status)}
                          </DaisyTableCell>
                          <DaisyTableCell>
                            {getPriorityBadge(workflow.priority)}
                          </DaisyTableCell>
                          <DaisyTableCell>
                            <div className="flex items-center space-x-2">
                              <DaisyProgress value={progress} className="w-16" />
                              <span className="text-sm text-muted-foreground">
                                {completedSteps}/{totalSteps}
                              </span>
                            </div>
                          </DaisyTableCell>
                          <DaisyTableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{workflow.assignedTo.length}</span>
                            </div>
                          </DaisyTableCell>
                          <DaisyTableCell>
                            <div className="text-sm">
                              {formatDate(workflow.createdAt)}
                            </div>
                          </DaisyTableCell>
                          <DaisyTableCell>
                            <DaisyDropdownMenu>
                              <DaisyDropdownMenuTrigger asChild>
                                <DaisyButton variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </DaisyButton>
                              </DaisyDropdownMenuTrigger>
                              <DaisyDropdownMenuContent align="end">
                                <DaisyDropdownMenuLabel>Actions</DaisyDropdownMenuLabel>
                                <DaisyDropdownMenuItem onClick={() => handleViewSteps(workflow)}>
                                  <GitBranch className="mr-2 h-4 w-4" />
                                  View Steps
                                </DaisyDropdownMenuItem>
                                <DaisyDropdownMenuItem onClick={() => handleEdit(workflow)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DaisyDropdownMenuItem>
                                <DaisyDropdownMenuItem onClick={() => handleDuplicate(workflow)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DaisyDropdownMenuItem>
                                {workflow.status === 'draft' && (
                                  <DaisyDropdownMenuItem onClick={() => handleStart(workflow)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Start
                                  </DaisyDropdownMenuItem>
                                )}
                                <DaisyDropdownMenuSeparator />
                                <DaisyDropdownMenuItem
                                  onClick={() => handleDelete(workflow.id)}
                                  className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DaisyDropdownMenuItem>
                              </DaisyDropdownMenuContent>
                            </DaisyDropdownMenu>
                          </DaisyTableCell>
                        </DaisyTableRow>
                      );
                    })}
                  </DaisyTableBody>
                </DaisyTable>
              )}
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="active-steps" className="space-y-4">
          <DaisyCard>
  <DaisyCardHeader />
</DaisyTabsContent>
              <DaisyCardTitle>Active Steps ({activeSteps.length})</DaisyCardTitle>
              <DaisyCardDescription >
  Steps requiring attention across all active workflows
</DaisyCardDescription>
              </p>
            
            <DaisyCardContent >
  {activeSteps.length === 0 ? (
</DaisyCardContent>
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
                      <DaisyCard key={step.id} className={isOverdue ? 'border-red-200' : ''} >
  <DaisyCardContent className="p-4" >
  </DaisyCard>
</DaisyCardContent>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getStepStatusIcon(step.status)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{step.name}</h4>
                                  <DaisyBadge variant="outline" className="text-xs">
                                    {step.type}
                                  </DaisyBadge>
                                  {isOverdue && (
                                    <DaisyBadge variant="error" className="text-xs" >
  Overdue
</DaisyBadge>
                                    </DaisyBadge>
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
                                    <DaisyCalendar className="h-3 w-3" />
                                    <span>Due: {formatDate(step.dueDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {step.status === 'in_progress' && (
                                <>
                                  <DaisyButton
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCompleteStep(workflow?.id || '', step.id, 'rejected')} />
                                    Reject
                                  </DaisyCalendar>
                                  <DaisyButton
                                    size="sm"
                                    onClick={() => handleCompleteStep(workflow?.id || '', step.id, 'completed')} />
                                    Complete
                                  </DaisyButton>
                                </>
                              )}
                            </div>
                          </div>
                        </DaisyCardContent>
                      </DaisyCard>
                    );
                  })}
                </div>
              )}
            </DaisyCardContent>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="analytics" className="space-y-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                <DaisyCardTitle>Workflow Performance</DaisyCardTitle>
                <DaisyCardDescription >
  Average completion times and success rates
</DaisyCardDescription>
                </p>
              
              <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.avgCompletionTime} days
                    </div>
                    <div className="text-sm text-muted-foreground">Average Completion Time</div>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance charts coming soon</p>
                    <p className="text-sm">Will show completion trends and bottlenecks</p>
                  </div>
                </div>
              </DaisyCardContent>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                <DaisyCardTitle>Step Analytics</DaisyCardTitle>
                <DaisyCardDescription >
  Step completion rates and average times
</DaisyCardDescription>
                </p>
              
              <DaisyCardContent >
  <div className="space-y-4">
</DaisyCardContent>
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
              </DaisyCardContent>
            </DaisyCard>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>

      {/* Workflow Details Dialog */}
      <DaisyDialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DaisyDialogContent className="max-w-2xl">
  <DaisyDialogHeader />
</DaisyDialog>
            <DaisyDialogTitle>{selectedWorkflow?.name}</DaisyDialogTitle>
            <DaisyDialogDescription >
  Workflow details and configuration
</DaisyDialogDescription>
            </DaisyDialogDescription>
          </DaisyDialogHeader>
          {selectedWorkflow && (
            <WorkflowDetails workflow={selectedWorkflow} />
          )}
        </DaisyDialogContent>
      </DaisyDialog>

      {/* Workflow Steps Dialog */}
      <DaisyDialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
        <DaisyDialogContent className="max-w-4xl">
  <DaisyDialogHeader />
</DaisyDialog>
            <DaisyDialogTitle>{selectedWorkflow?.name} - Steps</DaisyDialogTitle>
            <DaisyDialogDescription >
  Workflow step details and progress
</DaisyDialogDescription>
            </DaisyDialogDescription>
          </DaisyDialogHeader>
          {selectedWorkflow && (
            <WorkflowSteps workflow={selectedWorkflow} />
          )}
        </DaisyDialogContent>
      </DaisyDialog>
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
            <DaisyBadge key={assignee} variant="outline" className="text-xs">
              {assignee}
            </DaisyBadge>
          ))}
        </div>
      </div>
      {workflow.tags && workflow.tags.length > 0 && (
        <div>
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {workflow.tags.map(tag => (
              <DaisyBadge key={tag} variant="secondary" className="text-xs">
                {tag}
              </DaisyBadge>
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
      rejected: <DaisyAlertTriangle className="h-4 w-4 text-red-500" >
  ,
</DaisyAlertTriangle>
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
          <DaisyCard key={step.id} >
  <DaisyCardContent className="p-4" >
  </DaisyCard>
</DaisyCardContent>
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStepStatusIcon(step.status)}
                    <h4 className="font-medium">{step.name}</h4>
                    <DaisyBadge variant="outline" className="text-xs">
                      {step.type}
                    </DaisyBadge>
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
            </DaisyCardContent>
          </DaisyCard>
        ))}
      </div>
    </div>
  );
};
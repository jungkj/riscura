'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import {
  Workflow, Users, Clock, Bell, CheckCircle, AlertCircle, Calendar,
  Play, Pause, RotateCcw, Settings, Plus, Edit, Trash2, Eye,
  ArrowRight, ArrowDown, User, UserCheck, UserX, Mail, Smartphone,
  Filter, Search, MoreVertical, ChevronRight, ChevronDown, Target,
  Activity, Timer, Flag, Send, MessageSquare, FileText, Download
} from 'lucide-react';

// Mock workflow data
interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'approval' | 'assignment' | 'notification' | 'completion' | 'assessment';
  assignees: string[];
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue';
  description?: string;
  completedAt?: string;
  completedBy?: string;
  comments?: string;
  requirements?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'approval' | 'review' | 'assessment' | 'audit';
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  averageCompletionTime: number; // in hours
}

interface WorkflowInstance {
  id: string;
  templateId: string;
  templateName: string;
  questionnaireName: string;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  currentStep: number;
  progress: number;
  startedAt: string;
  deadline?: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  steps: WorkflowStep[];
}

const mockWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'wf-001',
    name: 'Standard Approval Workflow',
    description: 'Standard 3-step approval process for questionnaires',
    category: 'approval',
    isActive: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    usageCount: 45,
    averageCompletionTime: 72,
    steps: [
      {
        id: 'step-1',
        name: 'Initial Review',
        type: 'review',
        assignees: ['reviewer@company.com'],
        deadline: '2024-02-01',
        status: 'completed',
        description: 'Review questionnaire structure and content',
        requirements: ['Check question clarity', 'Verify compliance requirements', 'Review scoring logic']
      },
      {
        id: 'step-2',
        name: 'Manager Approval',
        type: 'approval',
        assignees: ['manager@company.com'],
        deadline: '2024-02-03',
        status: 'in_progress',
        description: 'Manager approval for questionnaire publication',
        requirements: ['Approve content', 'Confirm target audience', 'Set distribution timeline']
      },
      {
        id: 'step-3',
        name: 'Final Publication',
        type: 'completion',
        assignees: ['admin@company.com'],
        deadline: '2024-02-05',
        status: 'pending',
        description: 'Publish questionnaire and notify stakeholders'
      }
    ]
  },
  {
    id: 'wf-002',
    name: 'Compliance Review Process',
    description: 'Comprehensive compliance review for regulatory questionnaires',
    category: 'review',
    isActive: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    usageCount: 23,
    averageCompletionTime: 120,
    steps: [
      {
        id: 'step-1',
        name: 'Legal Review',
        type: 'review',
        assignees: ['legal@company.com'],
        status: 'pending',
        description: 'Legal compliance review'
      },
      {
        id: 'step-2',
        name: 'Risk Assessment',
        type: 'assessment',
        assignees: ['risk@company.com'],
        status: 'pending',
        description: 'Risk impact assessment'
      },
      {
        id: 'step-3',
        name: 'Senior Management Approval',
        type: 'approval',
        assignees: ['senior@company.com'],
        status: 'pending',
        description: 'Final approval from senior management'
      }
    ]
  }
];

const mockWorkflowInstances: WorkflowInstance[] = [
  {
    id: 'wi-001',
    templateId: 'wf-001',
    templateName: 'Standard Approval Workflow',
    questionnaireName: 'Cybersecurity Risk Assessment Q1 2024',
    status: 'active',
    currentStep: 2,
    progress: 67,
    startedAt: '2024-01-20T09:00:00Z',
    deadline: '2024-02-05T17:00:00Z',
    assignedTo: ['manager@company.com', 'admin@company.com'],
    priority: 'high',
    steps: [
      {
        id: 'step-1',
        name: 'Initial Review',
        type: 'review',
        assignees: ['reviewer@company.com'],
        status: 'completed',
        completedAt: '2024-01-22T14:30:00Z',
        completedBy: 'reviewer@company.com'
      },
      {
        id: 'step-2',
        name: 'Manager Approval',
        type: 'approval',
        assignees: ['manager@company.com'],
        status: 'in_progress',
        description: 'Awaiting manager approval'
      },
      {
        id: 'step-3',
        name: 'Final Publication',
        type: 'completion',
        assignees: ['admin@company.com'],
        status: 'pending',
        description: 'Ready for publication'
      }
    ]
  },
  {
    id: 'wi-002',
    templateId: 'wf-002',
    templateName: 'Compliance Review Process',
    questionnaireName: 'GDPR Compliance Assessment 2024',
    status: 'overdue',
    currentStep: 1,
    progress: 33,
    startedAt: '2024-01-15T10:00:00Z',
    deadline: '2024-01-30T17:00:00Z',
    assignedTo: ['legal@company.com'],
    priority: 'urgent',
    steps: [
      {
        id: 'step-1',
        name: 'Legal Review',
        type: 'review',
        assignees: ['legal@company.com'],
        status: 'overdue',
        deadline: '2024-01-25T17:00:00Z'
      },
      {
        id: 'step-2',
        name: 'Risk Assessment',
        type: 'assessment',
        assignees: ['risk@company.com'],
        status: 'pending'
      }
    ]
  }
];

interface WorkflowManagementProps {
  className?: string;
}

export function WorkflowManagement({ className }: WorkflowManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isInstanceDialogOpen, setIsInstanceDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredInstances = useMemo(() => {
    return mockWorkflowInstances.filter(instance => {
      const matchesSearch = instance.questionnaireName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           instance.templateName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || instance.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'blocked': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'review': return Eye;
      case 'approval': return CheckCircle;
      case 'assignment': return Users;
      case 'notification': return Bell;
      case 'completion': return Flag;
      default: return Activity;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-notion-text-primary">Workflow Management</h2>
          <p className="text-sm text-notion-text-secondary">
            Manage approval processes, assignments, and workflow automation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
          <Button onClick={() => setIsInstanceDialogOpen(true)}>
            <Play className="w-4 h-4 mr-2" />
            Start Workflow
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-notion-text-secondary">Active Workflows</p>
                      <p className="text-2xl font-bold text-notion-text-primary">8</p>
                      <div className="flex items-center mt-1">
                        <ArrowRight className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-sm text-blue-500">3 in progress</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-notion-text-secondary">Pending Approvals</p>
                      <p className="text-2xl font-bold text-notion-text-primary">5</p>
                      <div className="flex items-center mt-1">
                        <Clock className="w-4 h-4 text-orange-500 mr-1" />
                        <span className="text-sm text-orange-500">2 overdue</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-notion-text-secondary">Avg Completion</p>
                      <p className="text-2xl font-bold text-notion-text-primary">3.2 days</p>
                      <div className="flex items-center mt-1">
                        <Timer className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500">Improved</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-notion-text-secondary">Templates</p>
                      <p className="text-2xl font-bold text-notion-text-primary">12</p>
                      <div className="flex items-center mt-1">
                        <Target className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-sm text-purple-500">8 active</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Workflow className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInstances.slice(0, 5).map((instance, index) => (
                  <motion.div
                    key={instance.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-notion-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-notion-bg-secondary rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-notion-text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-notion-text-primary">{instance.questionnaireName}</p>
                        <p className="text-sm text-notion-text-secondary">
                          Step {instance.currentStep} of {instance.steps.length} • {instance.templateName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(instance.status)}>
                        {instance.status}
                      </Badge>
                      <Badge className={getPriorityColor(instance.priority)}>
                        {instance.priority}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="active" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-notion-text-tertiary w-4 h-4" />
                    <Input
                      placeholder="Search workflows..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Instances */}
          <div className="space-y-4">
            {filteredInstances.map((instance, index) => (
              <motion.div
                key={instance.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <WorkflowInstanceCard
                  instance={instance}
                  onSelect={() => setSelectedInstance(instance)}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  getStepIcon={getStepIcon}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockWorkflowTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WorkflowTemplateCard
                  template={template}
                  onSelect={() => setSelectedWorkflow(template)}
                  getStatusColor={getStatusColor}
                />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-notion-text-primary">Email Notifications</p>
                    <p className="text-sm text-notion-text-secondary">Send email alerts for workflow events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-notion-text-primary">Overdue Reminders</p>
                    <p className="text-sm text-notion-text-secondary">Daily reminders for overdue approvals</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-notion-text-primary">Assignment Notifications</p>
                    <p className="text-sm text-notion-text-secondary">Notify users when assigned to workflow steps</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-notion-text-primary">Default Approval Timeout</label>
                <Select defaultValue="72">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-notion-text-primary">Auto-escalation</label>
                <Select defaultValue="enabled">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Instance Detail Dialog */}
      <Dialog open={!!selectedInstance} onOpenChange={() => setSelectedInstance(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedInstance && (
            <WorkflowInstanceDetail
              instance={selectedInstance}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getStepIcon={getStepIcon}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workflow Instance Card Component
interface WorkflowInstanceCardProps {
  instance: WorkflowInstance;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStepIcon: (type: string) => any;
}

function WorkflowInstanceCard({ 
  instance, 
  onSelect, 
  getStatusColor, 
  getPriorityColor, 
  getStepIcon 
}: WorkflowInstanceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-notion-text-primary mb-1">
              {instance.questionnaireName}
            </h3>
            <p className="text-sm text-notion-text-secondary mb-2">
              {instance.templateName}
            </p>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(instance.status)}>
                {instance.status}
              </Badge>
              <Badge className={getPriorityColor(instance.priority)}>
                {instance.priority}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-notion-text-secondary">
              Step {instance.currentStep} of {instance.steps.length}
            </p>
            <p className="text-lg font-semibold text-notion-text-primary">
              {instance.progress}%
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Progress value={instance.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-notion-text-secondary">
          <span>Started {new Date(instance.startedAt).toLocaleDateString()}</span>
          {instance.deadline && (
            <span>Due {new Date(instance.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Template Card Component
interface WorkflowTemplateCardProps {
  template: WorkflowTemplate;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
}

function WorkflowTemplateCard({ template, onSelect, getStatusColor }: WorkflowTemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-notion-text-primary mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-notion-text-secondary mb-2">
              {template.description}
            </p>
            <Badge className={getStatusColor(template.isActive ? 'active' : 'inactive')}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm text-notion-text-secondary">
          <div className="flex justify-between">
            <span>Steps:</span>
            <span className="font-medium">{template.steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Usage:</span>
            <span className="font-medium">{template.usageCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Time:</span>
            <span className="font-medium">{template.averageCompletionTime}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Instance Detail Component
interface WorkflowInstanceDetailProps {
  instance: WorkflowInstance;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStepIcon: (type: string) => any;
}

function WorkflowInstanceDetail({ 
  instance, 
  getStatusColor, 
  getPriorityColor, 
  getStepIcon 
}: WorkflowInstanceDetailProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{instance.questionnaireName}</DialogTitle>
        <DialogDescription>
          {instance.templateName} • Started {new Date(instance.startedAt).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold text-notion-text-primary mb-3">Workflow Progress</h3>
            <div className="space-y-4">
              {instance.steps.map((step, index) => {
                const Icon = getStepIcon(step.type);
                const isActive = index === instance.currentStep - 1;
                const isCompleted = index < instance.currentStep - 1;
                
                return (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 dark:bg-green-900/20' :
                      isActive ? 'bg-blue-100 dark:bg-blue-900/20' :
                      'bg-gray-100 dark:bg-gray-900/20'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isCompleted ? 'text-green-600 dark:text-green-400' :
                        isActive ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-notion-text-primary">{step.name}</h4>
                        <Badge className={getStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </div>
                      {step.description && (
                        <p className="text-sm text-notion-text-secondary mt-1">
                          {step.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-notion-text-tertiary">
                        {step.assignees.map((assignee, i) => (
                          <span key={i} className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {assignee}
                          </span>
                        ))}
                        {step.deadline && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {new Date(step.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          <div className="p-4 bg-notion-bg-tertiary rounded-lg">
            <h3 className="font-semibold text-notion-text-primary mb-3">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-notion-text-secondary">Status</span>
                <Badge className={getStatusColor(instance.status)}>
                  {instance.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-notion-text-secondary">Priority</span>
                <Badge className={getPriorityColor(instance.priority)}>
                  {instance.priority}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-notion-text-secondary">Progress</span>
                <span className="font-medium">{instance.progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-notion-text-secondary">Started</span>
                <span className="font-medium">
                  {new Date(instance.startedAt).toLocaleDateString()}
                </span>
              </div>
              {instance.deadline && (
                <div className="flex justify-between">
                  <span className="text-notion-text-secondary">Deadline</span>
                  <span className="font-medium">
                    {new Date(instance.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Comment
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 
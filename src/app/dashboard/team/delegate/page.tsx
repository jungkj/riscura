'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Send,
  Filter,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react';

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'auditor' | 'viewer';
  department: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'busy';
  workload: number; // percentage
  completedTasks: number;
  assignedTasks: number;
  expertise: string[];
}

interface DelegatedTask {
  id: string;
  title: string;
  description: string;
  type: 'risk_assessment' | 'control_testing' | 'compliance_review' | 'audit_preparation' | 'documentation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';
  assignee: string;
  assignedBy: string;
  dueDate: Date;
  createdDate: Date;
  estimatedHours: number;
  actualHours?: number;
  progress: number;
  framework?: string;
  tags: string[];
  attachments: number;
  comments: number;
}

// Sample data
const sampleTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'manager',
    department: 'Security',
    status: 'active',
    workload: 75,
    completedTasks: 23,
    assignedTasks: 8,
    expertise: ['SOC 2', 'Risk Management', 'Access Controls'],
  },
  {
    id: 'user-2',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    role: 'analyst',
    department: 'Compliance',
    status: 'active',
    workload: 60,
    completedTasks: 18,
    assignedTasks: 5,
    expertise: ['GDPR', 'Data Protection', 'Privacy'],
  },
  {
    id: 'user-3',
    name: 'Emma Johnson',
    email: 'emma.johnson@company.com',
    role: 'auditor',
    department: 'Internal Audit',
    status: 'busy',
    workload: 90,
    completedTasks: 31,
    assignedTasks: 12,
    expertise: ['ISO 27001', 'Control Testing', 'Documentation'],
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'analyst',
    department: 'IT Security',
    status: 'active',
    workload: 45,
    completedTasks: 15,
    assignedTasks: 3,
    expertise: ['Network Security', 'Vulnerability Management', 'NIST'],
  },
];

const sampleTasks: DelegatedTask[] = [
  {
    id: 'TASK-001',
    title: 'SOC 2 Access Control Review',
    description: 'Review and test access control implementations for SOC 2 Type II audit preparation',
    type: 'control_testing',
    priority: 'critical',
    status: 'in_progress',
    assignee: 'user-1',
    assignedBy: 'admin',
    dueDate: new Date('2024-02-15'),
    createdDate: new Date('2024-01-20'),
    estimatedHours: 16,
    actualHours: 8,
    progress: 50,
    framework: 'SOC 2',
    tags: ['access-control', 'soc2', 'audit'],
    attachments: 3,
    comments: 7,
  },
  {
    id: 'TASK-002',
    title: 'GDPR Data Processing Assessment',
    description: 'Conduct comprehensive assessment of data processing activities for GDPR compliance',
    type: 'compliance_review',
    priority: 'high',
    status: 'pending',
    assignee: 'user-2',
    assignedBy: 'admin',
    dueDate: new Date('2024-02-28'),
    createdDate: new Date('2024-01-25'),
    estimatedHours: 24,
    progress: 0,
    framework: 'GDPR',
    tags: ['gdpr', 'data-protection', 'assessment'],
    attachments: 1,
    comments: 2,
  },
  {
    id: 'TASK-003',
    title: 'Risk Register Update',
    description: 'Update quarterly risk register with new identified risks and control assessments',
    type: 'risk_assessment',
    priority: 'medium',
    status: 'review',
    assignee: 'user-3',
    assignedBy: 'admin',
    dueDate: new Date('2024-02-10'),
    createdDate: new Date('2024-01-15'),
    estimatedHours: 12,
    actualHours: 14,
    progress: 95,
    tags: ['risk-management', 'quarterly-review'],
    attachments: 5,
    comments: 12,
  },
];

const getRoleConfig = (role: string) => {
  const configs = {
    admin: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Admin' },
    manager: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Manager' },
    analyst: { color: 'text-green-600', bg: 'bg-green-50', label: 'Analyst' },
    auditor: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Auditor' },
    viewer: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Viewer' },
  };
  return configs[role as keyof typeof configs] || configs.viewer;
};

const getStatusConfig = (status: string) => {
  const configs = {
    active: { color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
    inactive: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Inactive' },
    busy: { color: 'text-red-600', bg: 'bg-red-50', label: 'Busy' },
  };
  return configs[status as keyof typeof configs] || configs.active;
};

const getPriorityConfig = (priority: string) => {
  const configs = {
    critical: { color: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
    low: { color: 'text-green-600', bg: 'bg-green-50', label: 'Low' },
  };
  return configs[priority as keyof typeof configs] || configs.medium;
};

const getTaskStatusConfig = (status: string) => {
  const configs = {
    pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
    in_progress: { variant: 'default' as const, icon: Target, label: 'In Progress' },
    review: { variant: 'outline' as const, icon: Eye, label: 'In Review' },
    completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
    overdue: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Overdue' },
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

export default function TeamDelegatePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState('');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'risk_assessment' as const,
    priority: 'medium' as const,
    assignee: '',
    dueDate: '',
    estimatedHours: '',
    framework: '',
    tags: [] as string[],
  });

  const totalTasks = sampleTasks.length;
  const pendingTasks = sampleTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = sampleTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = sampleTasks.filter(t => t.status === 'completed').length;

  const handleCreateTask = () => {
    setIsCreateTaskModalOpen(true);
  };

  const handleAssignTask = (taskId: string, memberId: string) => {
    toast.success(`Task ${taskId} assigned to member ${memberId}`);
  };

  const handleTaskAction = (action: string, taskId: string) => {
    switch (action) {
      case 'view':
        toast.success(`Viewing task ${taskId} details...`);
        break;
      case 'edit':
        toast.success(`Editing task ${taskId}...`);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this task?')) {
          toast.success(`Deleted task ${taskId}`);
        }
        break;
      case 'comment':
        toast.success(`Opening comments for task ${taskId}...`);
        break;
      default:
        toast(`Action "${action}" not yet implemented for task ${taskId}`);
    }
  };

  const handleCreateNewTask = () => {
    if (!newTask.title || !newTask.assignee || !newTask.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create new task
    const task: DelegatedTask = {
      id: `TASK-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      type: newTask.type,
      priority: newTask.priority,
      status: 'pending',
      assignee: newTask.assignee,
      assignedBy: 'current-user',
      dueDate: new Date(newTask.dueDate),
      createdDate: new Date(),
      estimatedHours: parseInt(newTask.estimatedHours) || 8,
      progress: 0,
      framework: newTask.framework,
      tags: newTask.tags,
      attachments: 0,
      comments: 0,
    };

    toast.success(`Task "${task.title}" created and assigned to ${sampleTeamMembers.find(m => m.id === task.assignee)?.name}`);
    setIsCreateTaskModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      type: 'risk_assessment',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      estimatedHours: '',
      framework: '',
      tags: [],
    });
  };

  const addTag = (tag: string) => {
    if (tag && !newTask.tags.includes(tag)) {
      setNewTask(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Team Delegation"
        subtitle="Assign tasks, manage workloads, and track team performance"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Team', href: '/dashboard/team' },
          { label: 'Delegation', current: true },
        ]}
        primaryAction={{
          label: 'Create Task',
          onClick: handleCreateTask,
          icon: UserPlus,
        }}
        secondaryActions={[
          {
            label: 'Team Analytics',
            onClick: () => toast.success('Opening team analytics...'),
            icon: TrendingUp,
            variant: 'outline',
          },
          {
            label: 'Export Report',
            onClick: () => toast.success('Exporting delegation report...'),
            icon: FileText,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'total tasks',
            value: totalTasks,
            variant: 'default',
          },
          {
            label: 'pending',
            value: pendingTasks,
            variant: 'warning',
          },
          {
            label: 'in progress',
            value: inProgressTasks,
            variant: 'default',
          },
          {
            label: 'completed',
            value: completedTasks,
            variant: 'default',
          },
        ]}
        maxWidth="2xl"
      >
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <DaisyTabsList>
            <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
            <DaisyTabsTrigger value="tasks">Task Management</DaisyTabsTrigger>
            <DaisyTabsTrigger value="team">Team Members</DaisyTabsTrigger>
            <DaisyTabsTrigger value="workload">Workload Analysis</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>

        <DaisyTabsContent value="overview" className="space-y-6">
          {/* Team Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleTeamMembers.map((member) => {
              const roleConfig = getRoleConfig(member.role);
              const statusConfig = getStatusConfig(member.status);
              
              return (
                <DaisyCard key={member.id}>
                  <DaisyCardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <DaisyAvatar className="h-10 w-10">
                        <DaisyAvatarImage src={member.avatar} />
                        <DaisyAvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</DaisyAvatarFallback>
                      </DaisyAvatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DaisyBadge variant="outline" className={cn("text-xs", roleConfig.color)}>
                        {roleConfig.label}
                      </DaisyBadge>
                      <DaisyBadge variant="outline" className={cn("text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </DaisyBadge>
                    </div>
                  
                  <DaisyCardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Workload</span>
                          <span className="font-medium">{member.workload}%</span>
                        </div>
                        <DaisyProgress 
                          value={member.workload} 
                          className={cn(
                            "h-2",
                            member.workload > 80 ? "text-red-500" : 
                            member.workload > 60 ? "text-yellow-500" : "text-green-500"
                          )} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-medium text-green-600">{member.completedTasks}</div>
                          <div className="text-gray-500">Completed</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-600">{member.assignedTasks}</div>
                          <div className="text-gray-500">Assigned</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {member.expertise.slice(0, 2).map((skill) => (
                          <DaisyBadge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </DaisyBadge>
                        ))}
                        {member.expertise.length > 2 && (
                          <DaisyBadge variant="outline" className="text-xs">
                            +{member.expertise.length - 2}
                          </DaisyBadge>
                        )}
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>

          {/* Recent Activity */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle>Recent Delegation Activity</DaisyCardTitle>
              <DaisyCardDescription>Latest task assignments and updates</p>
            
            <DaisyCardContent>
              <div className="space-y-4">
                {sampleTasks.slice(0, 3).map((task) => {
                  const member = sampleTeamMembers.find(m => m.id === task.assignee);
                  const priorityConfig = getPriorityConfig(task.priority);
                  const statusConfig = getTaskStatusConfig(task.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div key={task.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <DaisyAvatar className="h-8 w-8">
                        <DaisyAvatarFallback className="text-xs">
                          {member?.name.split(' ').map(n => n[0]).join('')}
                        </DaisyAvatarFallback>
                      </DaisyAvatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          Assigned to {member?.name} • Due {task.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DaisyBadge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                          {priorityConfig.label}
                        </DaisyBadge>
                        <DaisyBadge variant={statusConfig.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </DaisyBadge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="tasks" className="space-y-6">
          {/* Task Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DaisySelect value={selectedStatus} onValueChange={setSelectedStatus}>
              <DaisySelectTrigger className="w-32">
                <DaisySelectValue placeholder="Status" />
              </SelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Status</SelectItem>
                <DaisySelectItem value="pending">Pending</SelectItem>
                <DaisySelectItem value="in_progress">In Progress</SelectItem>
                <DaisySelectItem value="review">In Review</SelectItem>
                <DaisySelectItem value="completed">Completed</SelectItem>
                <DaisySelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </DaisySelect>

            <DaisySelect value={selectedPriority} onValueChange={setSelectedPriority}>
              <DaisySelectTrigger className="w-32">
                <DaisySelectValue placeholder="Priority" />
              </SelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Priorities</SelectItem>
                <DaisySelectItem value="critical">Critical</SelectItem>
                <DaisySelectItem value="high">High</SelectItem>
                <DaisySelectItem value="medium">Medium</SelectItem>
                <DaisySelectItem value="low">Low</SelectItem>
              </SelectContent>
            </DaisySelect>

            <div className="text-sm text-gray-600 ml-auto">
              {sampleTasks.length} task{sampleTasks.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {sampleTasks.map((task) => {
              const member = sampleTeamMembers.find(m => m.id === task.assignee);
              const priorityConfig = getPriorityConfig(task.priority);
              const statusConfig = getTaskStatusConfig(task.status);
              const StatusIcon = statusConfig.icon;
              const isOverdue = task.dueDate < new Date() && task.status !== 'completed';

              return (
                <DaisyCard key={task.id} className={cn(
                  "border-l-4",
                  isOverdue ? "border-red-500" : priorityConfig.bg.replace('bg-', 'border-')
                )}>
                  <DaisyCardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <DaisyBadge variant="outline" className="text-xs">
                            {task.id}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className="text-xs">
                            {task.type.replace('_', ' ').toUpperCase()}
                          </DaisyBadge>
                          <DaisyBadge variant={statusConfig.variant} className="text-xs">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </DaisyBadge>
                          <DaisyBadge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                            {priorityConfig.label}
                          </DaisyBadge>
                          {task.framework && (
                            <DaisyBadge variant="outline" className="text-xs">
                              {task.framework}
                            </DaisyBadge>
                          )}
                        </div>
                        <DaisyCardTitle className="text-base">{task.title}</DaisyCardTitle>
                        <DaisyCardDescription className="mt-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold">{task.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                  
                  <DaisyCardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <DaisyProgress value={task.progress} className="h-2" />
                      
                      {/* Task Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <DaisyAvatar className="h-6 w-6">
                            <DaisyAvatarFallback className="text-xs">
                              {member?.name.split(' ').map(n => n[0]).join('')}
                            </DaisyAvatarFallback>
                          </DaisyAvatar>
                          <div>
                            <div className="font-medium">{member?.name}</div>
                            <div className="text-gray-500 text-xs">Assignee</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{task.dueDate.toLocaleDateString()}</div>
                          <div className="text-gray-500 text-xs">Due Date</div>
                        </div>
                        <div>
                          <div className="font-medium">{task.estimatedHours}h</div>
                          <div className="text-gray-500 text-xs">Estimated</div>
                        </div>
                        <div>
                          <div className="font-medium">{task.actualHours || 0}h</div>
                          <div className="text-gray-500 text-xs">Actual</div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <DaisyBadge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </DaisyBadge>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {task.attachments} files
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {task.comments} comments
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <DaisyButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('view', task.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </DaisyButton>
                          <DaisyButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('edit', task.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </DaisyButton>
                          <DaisyButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('comment', task.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Comment
                          </DaisyButton>
                        </div>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="team" className="space-y-6">
          <div className="grid gap-6">
            {sampleTeamMembers.map((member) => {
              const roleConfig = getRoleConfig(member.role);
              const statusConfig = getStatusConfig(member.status);
              
              return (
                <DaisyCard key={member.id}>
                  <DaisyCardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <DaisyAvatar className="h-12 w-12">
                          <DaisyAvatarImage src={member.avatar} />
                          <DaisyAvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</DaisyAvatarFallback>
                        </DaisyAvatar>
                        <div>
                          <DaisyCardTitle className="text-lg">{member.name}</DaisyCardTitle>
                          <DaisyCardDescription>{member.email}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <DaisyBadge variant="outline" className={cn("text-xs", roleConfig.color)}>
                              {roleConfig.label}
                            </DaisyBadge>
                            <DaisyBadge variant="outline" className={cn("text-xs", statusConfig.color)}>
                              {statusConfig.label}
                            </DaisyBadge>
                            <DaisyBadge variant="outline" className="text-xs">
                              {member.department}
                            </DaisyBadge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{member.workload}%</div>
                        <div className="text-sm text-gray-500">Workload</div>
                      </div>
                    </div>
                  
                  <DaisyCardContent>
                    <div className="space-y-4">
                      <DaisyProgress value={member.workload} className="h-3" />
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-600">{member.completedTasks}</div>
                          <div className="text-gray-500">Completed Tasks</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-600">{member.assignedTasks}</div>
                          <div className="text-gray-500">Assigned Tasks</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.expertise.length}</div>
                          <div className="text-gray-500">Expertise Areas</div>
                        </div>
                      </div>

                      <div>
                        <DaisyLabel className="text-sm font-medium">Expertise</DaisyLabel>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.expertise.map((skill) => (
                            <DaisyBadge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </DaisyBadge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t">
                        <DaisyButton
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMember(member.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Assign Task
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </DaisyButton>
                        <DaisyButton variant="outline" size="sm">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Performance
                        </DaisyButton>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="workload">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Workload Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Detailed workload analytics and capacity planning tools
            </p>
            <DaisyButton>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </DaisyButton>
          </div>
        </DaisyTabsContent>

        {/* Create Task Modal */}
        <DaisyDialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
          <DaisyDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DaisyDialogHeader>
              <DaisyDialogTitle>Create New Task</DaisyDialogTitle>
              <DaisyDialogDescription>
                Assign a new task to a team member with detailed specifications
              </DaisyDialogDescription>
            </DaisyDialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <DaisyLabel htmlFor="title">Task Title *</DaisyLabel>
                  <DaisyInput
                    id="title"
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <DaisyLabel htmlFor="description">Description</DaisyLabel>
                  <DaisyTextarea
                    id="description"
                    placeholder="Describe the task requirements and objectives..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DaisyLabel htmlFor="type">Task Type</DaisyLabel>
                    <DaisySelect value={newTask.type} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, type: value }))}>
                      <DaisySelectTrigger>
                        <DaisySelectValue />
                      </SelectTrigger>
                      <DaisySelectContent>
                        <DaisySelectItem value="risk_assessment">Risk Assessment</SelectItem>
                        <DaisySelectItem value="control_testing">Control Testing</SelectItem>
                        <DaisySelectItem value="compliance_review">Compliance Review</SelectItem>
                        <DaisySelectItem value="audit_preparation">Audit Preparation</SelectItem>
                        <DaisySelectItem value="documentation">Documentation</SelectItem>
                      </SelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel htmlFor="priority">Priority</DaisyLabel>
                    <DaisySelect value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                      <DaisySelectTrigger>
                        <DaisySelectValue />
                      </SelectTrigger>
                      <DaisySelectContent>
                        <DaisySelectItem value="critical">Critical</SelectItem>
                        <DaisySelectItem value="high">High</SelectItem>
                        <DaisySelectItem value="medium">Medium</SelectItem>
                        <DaisySelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </DaisySelect>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DaisyLabel htmlFor="assignee">Assign To *</DaisyLabel>
                    <DaisySelect value={newTask.assignee} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignee: value }))}>
                      <DaisySelectTrigger>
                        <DaisySelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <DaisySelectContent>
                        {sampleTeamMembers.map((member) => (
                          <DaisySelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <span>{member.name}</span>
                              <DaisyBadge variant="outline" className="text-xs">
                                {member.workload}% workload
                              </DaisyBadge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel htmlFor="dueDate">Due Date *</DaisyLabel>
                    <DaisyInput
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DaisyLabel htmlFor="estimatedHours">Estimated Hours</DaisyLabel>
                    <DaisyInput
                      id="estimatedHours"
                      type="number"
                      placeholder="8"
                      value={newTask.estimatedHours}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    />
                  </div>

                  <div>
                    <DaisyLabel htmlFor="framework">Framework (Optional)</DaisyLabel>
                    <DaisySelect value={newTask.framework} onValueChange={(value) => setNewTask(prev => ({ ...prev, framework: value }))}>
                      <DaisySelectTrigger>
                        <DaisySelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <DaisySelectContent>
                        <DaisySelectItem value="">None</SelectItem>
                        <DaisySelectItem value="SOC 2">SOC 2</SelectItem>
                        <DaisySelectItem value="ISO 27001">ISO 27001</SelectItem>
                        <DaisySelectItem value="GDPR">GDPR</SelectItem>
                        <DaisySelectItem value="NIST">NIST</SelectItem>
                        <DaisySelectItem value="HIPAA">HIPAA</SelectItem>
                      </SelectContent>
                    </DaisySelect>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <DaisyLabel>Tags</DaisyLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTask.tags.map((tag) => (
                    <DaisyBadge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </DaisyBadge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <DaisyInput
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <DaisyButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add tag..."]') as HTMLInputElement;
                      if (input?.value) {
                        addTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </DaisyButton>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <DaisyButton
                  variant="outline"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                >
                  Cancel
                </DaisyButton>
                <DaisyButton onClick={handleCreateNewTask}>
                  <Send className="h-4 w-4 mr-2" />
                  Create Task
                </DaisyButton>
              </div>
            </div>
          </DaisyDialogContent>
        </DaisyDialog>
      </MainContentArea>
    </ProtectedRoute>
  );
} 
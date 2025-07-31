'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Calendar,
  User,
  Users,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  SortAsc,
  Eye,
  MessageSquare,
  Paperclip,
  Target,
  Zap,
  Shield,
  FileText,
  UserCheck,
  UserX,
  Timer,
  Dot,
  ChevronDown,
  GripVertical,
  Copy,
  Archive,
  Send,
  Bell,
  Activity,
  BarChart3,
  TrendingUp,
  Layers,
  GitBranch,
  CheckSquare,
  Square,
} from 'lucide-react';

// Types
interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  type: 'risk_assessment' | 'control_testing' | 'audit_finding' | 'compliance_review' | 'documentation' | 'approval';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'backlog' | 'in_progress' | 'review' | 'approved' | 'completed';
  assignee?: User;
  reviewer?: User;
  approver?: User;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  progress: number; // 0-100
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  attachments: Attachment[];
  dependencies: string[]; // task IDs
  subtasks: SubTask[];
  comments: number;
  entityType?: 'risk' | 'control' | 'document';
  entityId?: string;
  workflowStage: WorkflowStage;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  isOnline: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  size?: number;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: User;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: User[];
  isCompleted: boolean;
  completedAt?: Date;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: WorkflowTask['status'];
  color: string;
  limit?: number;
  description?: string;
}

// Sample Data
const sampleUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: '/avatars/sarah.jpg',
    role: 'Risk Manager',
    department: 'Risk & Compliance',
    isOnline: true,
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    avatar: '/avatars/michael.jpg',
    role: 'Compliance Officer',
    department: 'Risk & Compliance',
    isOnline: false,
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    avatar: '/avatars/emily.jpg',
    role: 'Security Analyst',
    department: 'IT Security',
    isOnline: true,
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    avatar: '/avatars/david.jpg',
    role: 'Audit Manager',
    department: 'Internal Audit',
    isOnline: true,
  },
];

const kanbanColumns: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    status: 'backlog',
    color: 'gray',
    description: 'Tasks waiting to be started',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    color: 'blue',
    limit: 5,
    description: 'Tasks currently being worked on',
  },
  {
    id: 'review',
    title: 'Review',
    status: 'review',
    color: 'orange',
    limit: 3,
    description: 'Tasks pending review',
  },
  {
    id: 'approved',
    title: 'Approved',
    status: 'approved',
    color: 'green',
    description: 'Tasks approved and ready for completion',
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'completed',
    color: 'green',
    description: 'Completed tasks',
  },
];

const sampleTasks: WorkflowTask[] = [
  {
    id: 'task-1',
    title: 'Quarterly Risk Assessment Review',
    description: 'Review and update risk ratings for Q4 2024 based on latest threat intelligence',
    type: 'risk_assessment',
    priority: 'high',
    status: 'in_progress',
    assignee: sampleUsers[0],
    reviewer: sampleUsers[1],
    approver: sampleUsers[3],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    progress: 65,
    estimatedHours: 16,
    actualHours: 12,
    tags: ['quarterly', 'risk-assessment', 'critical'],
    attachments: [
      {
        id: 'att-1',
        name: 'Q4-Risk-Matrix.xlsx',
        type: 'document',
        url: '/documents/Q4-Risk-Matrix.xlsx',
        size: 1024000,
      },
    ],
    dependencies: [],
    subtasks: [
      {
        id: 'sub-1',
        title: 'Update threat landscape analysis',
        completed: true,
        assignee: sampleUsers[0],
      },
      {
        id: 'sub-2',
        title: 'Review control effectiveness',
        completed: true,
        assignee: sampleUsers[0],
      },
      {
        id: 'sub-3',
        title: 'Update risk ratings',
        completed: false,
        assignee: sampleUsers[0],
      },
    ],
    comments: 5,
    entityType: 'risk',
    entityId: 'RSK-001',
    workflowStage: {
      id: 'stage-1',
      name: 'Risk Analysis',
      description: 'Analyze and assess risk factors',
      requiredApprovals: 1,
      currentApprovals: 0,
      approvers: [sampleUsers[1]],
      isCompleted: false,
    },
  },
  {
    id: 'task-2',
    title: 'SOC 2 Control Testing',
    description: 'Test effectiveness of information security controls for SOC 2 compliance',
    type: 'control_testing',
    priority: 'critical',
    status: 'review',
    assignee: sampleUsers[2],
    reviewer: sampleUsers[1],
    approver: sampleUsers[3],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    progress: 90,
    estimatedHours: 24,
    actualHours: 22,
    tags: ['soc2', 'compliance', 'testing'],
    attachments: [
      {
        id: 'att-2',
        name: 'SOC2-Test-Results.pdf',
        type: 'document',
        url: '/documents/SOC2-Test-Results.pdf',
        size: 2048000,
      },
      {
        id: 'att-3',
        name: 'Control-Evidence.zip',
        type: 'document',
        url: '/documents/Control-Evidence.zip',
        size: 5120000,
      },
    ],
    dependencies: [],
    subtasks: [
      {
        id: 'sub-4',
        title: 'Test access controls',
        completed: true,
        assignee: sampleUsers[2],
      },
      {
        id: 'sub-5',
        title: 'Test data encryption',
        completed: true,
        assignee: sampleUsers[2],
      },
      {
        id: 'sub-6',
        title: 'Document test results',
        completed: true,
        assignee: sampleUsers[2],
      },
    ],
    comments: 8,
    entityType: 'control',
    entityId: 'CTL-001',
    workflowStage: {
      id: 'stage-2',
      name: 'Testing Complete',
      description: 'Control testing completed, awaiting review',
      requiredApprovals: 2,
      currentApprovals: 1,
      approvers: [sampleUsers[1], sampleUsers[3]],
      isCompleted: false,
    },
  },
  {
    id: 'task-3',
    title: 'Update Privacy Policy Documentation',
    description: 'Update privacy policy to reflect new data processing activities',
    type: 'documentation',
    priority: 'medium',
    status: 'backlog',
    assignee: sampleUsers[1],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    progress: 0,
    estimatedHours: 8,
    actualHours: 0,
    tags: ['privacy', 'documentation', 'gdpr'],
    attachments: [],
    dependencies: [],
    subtasks: [
      {
        id: 'sub-7',
        title: 'Review current policy',
        completed: false,
        assignee: sampleUsers[1],
      },
      {
        id: 'sub-8',
        title: 'Identify updates needed',
        completed: false,
        assignee: sampleUsers[1],
      },
    ],
    comments: 2,
    entityType: 'document',
    entityId: 'DOC-001',
    workflowStage: {
      id: 'stage-3',
      name: 'Not Started',
      description: 'Task not yet started',
      requiredApprovals: 1,
      currentApprovals: 0,
      approvers: [sampleUsers[3]],
      isCompleted: false,
    },
  },
];

// Task Card Component
const TaskCard: React.FC<{
  task: WorkflowTask;
  onEdit: (task: WorkflowTask) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: WorkflowTask['status']) => void;
}> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const getPriorityColor = (priority: WorkflowTask['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: WorkflowTask['type']) => {
    switch (type) {
      case 'risk_assessment': return <Target className="h-4 w-4" />;
      case 'control_testing': return <Shield className="h-4 w-4" />;
      case 'audit_finding': return <Eye className="h-4 w-4" />;
      case 'compliance_review': return <CheckSquare className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'approval': return <UserCheck className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: 'text-red-600' };
    if (days === 0) return { text: 'Due today', color: 'text-orange-600' };
    if (days === 1) return { text: 'Due tomorrow', color: 'text-yellow-600' };
    if (days <= 7) return { text: `${days}d left`, color: 'text-blue-600' };
    return { text: date.toLocaleDateString(), color: 'text-text-secondary' };
  };

  const dueInfo = formatDueDate(task.dueDate);
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;

  return (
    <DaisyCard 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-notion-sm border border-border",
        isDragging && "opacity-50 transform rotate-1"
      )}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <DaisyCardContent className="p-enterprise-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-enterprise-3">
          <div className="flex items-center space-x-enterprise-2">
            <div className={cn("w-1 h-6 rounded-full", getPriorityColor(task.priority))} />
            <div className="text-text-secondary">
              {getTypeIcon(task.type)}
            </div>
          </div>
          
          <DaisyDropdownMenu>
            <DaisyDropdownMenuTrigger asChild>
              <DaisyButton 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </DaisyButton>
            </DaisyDropdownMenuTrigger>
            <DaisyDropdownMenuContent align="end">
              <DaisyDropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-3 w-3 mr-enterprise-2" />
                Edit Task
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuItem onClick={() => {}}>
                <Copy className="h-3 w-3 mr-enterprise-2" />
                Duplicate
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuItem onClick={() => {}}>
                <Archive className="h-3 w-3 mr-enterprise-2" />
                Archive
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-semantic-error"
              >
                <Trash2 className="h-3 w-3 mr-enterprise-2" />
                Delete
              </DaisyDropdownMenuItem>
            </DaisyDropdownMenuContent>
          </DaisyDropdownMenu>
        </div>

        {/* Title & Description */}
        <div className="mb-enterprise-3">
          <h4 className="text-body-sm font-medium line-clamp-2 mb-enterprise-1">
            {task.title}
          </h4>
          <p className="text-caption text-text-secondary line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Progress */}
        {task.progress > 0 && (
          <div className="mb-enterprise-3">
            <div className="flex items-center justify-between text-caption text-text-secondary mb-enterprise-1">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <DaisyProgress value={task.progress} className="h-1" />
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks.length > 0 && (
          <div className="mb-enterprise-3">
            <div className="flex items-center space-x-enterprise-1 text-caption text-text-secondary">
              <CheckSquare className="h-3 w-3" />
              <span>{completedSubtasks}/{task.subtasks.length} subtasks</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-enterprise-1 mb-enterprise-3">
            {task.tags.slice(0, 3).map((tag) => (
              <DaisyBadge key={tag} variant="secondary" className="text-caption px-enterprise-1 py-0">
                {tag}
              </DaisyBadge>
            ))}
            {task.tags.length > 3 && (
              <DaisyBadge variant="secondary" className="text-caption px-enterprise-1 py-0">
                +{task.tags.length - 3}
              </DaisyBadge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-3">
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center space-x-enterprise-1">
                <DaisyAvatar className="h-5 w-5">
                  <DaisyAvatarImage src={task.assignee.avatar} />
                  <DaisyAvatarFallback className="text-caption">
                    {task.assignee.name.split(' ').map(n => n[0]).join('')}
                  </DaisyAvatarFallback>
                </DaisyAvatar>
              </div>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div className="flex items-center space-x-enterprise-1 text-text-secondary">
                <Paperclip className="h-3 w-3" />
                <span className="text-caption">{task.attachments.length}</span>
              </div>
            )}

            {/* Comments */}
            {task.comments > 0 && (
              <div className="flex items-center space-x-enterprise-1 text-text-secondary">
                <MessageSquare className="h-3 w-3" />
                <span className="text-caption">{task.comments}</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className={cn("text-caption", dueInfo.color)}>
            <div className="flex items-center space-x-enterprise-1">
              <Clock className="h-3 w-3" />
              <span>{dueInfo.text}</span>
            </div>
          </div>
        </div>

        {/* Approval Status */}
        {task.workflowStage.requiredApprovals > 0 && (
          <div className="mt-enterprise-3 pt-enterprise-3 border-t border-border">
            <div className="flex items-center justify-between text-caption">
              <span className="text-text-secondary">Approvals</span>
              <div className="flex items-center space-x-enterprise-1">
                <span className={cn(
                  task.workflowStage.currentApprovals >= task.workflowStage.requiredApprovals 
                    ? "text-green-600" 
                    : "text-text-secondary"
                )}>
                  {task.workflowStage.currentApprovals}/{task.workflowStage.requiredApprovals}
                </span>
                {task.workflowStage.currentApprovals >= task.workflowStage.requiredApprovals ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <Clock className="h-3 w-3 text-text-secondary" />
                )}
              </div>
            </div>
          </div>
        )}
      </DaisyCardContent>
    </DaisyCard>
  );
};

// Kanban Column Component
const KanbanColumn: React.FC<{
  column: KanbanColumn;
  tasks: WorkflowTask[];
  onTaskEdit: (task: WorkflowTask) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: WorkflowTask['status']) => void;
  onAddTask: (status: WorkflowTask['status']) => void;
}> = ({ column, tasks, onTaskEdit, onTaskDelete, onTaskStatusChange, onAddTask }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const isOverLimit = column.limit && tasks.length >= column.limit;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Handle task drop logic here
  };

  return (
    <div className="flex flex-col min-h-0 w-80">
      {/* Column Header */}
      <div className="flex items-center justify-between p-enterprise-4 border-b border-border">
        <div className="flex items-center space-x-enterprise-2">
          <h3 className="text-body-sm font-medium">{column.title}</h3>
          <DaisyBadge variant="outline" className="text-caption">
            {tasks.length}
            {column.limit && `/${column.limit}`}
          </DaisyBadge>
          {isOverLimit && (
            <DaisyBadge variant="error" className="text-caption">
              Over Limit
            </DaisyBadge>
          )}
        </div>
        
        <DaisyButton
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onAddTask(column.status)}
        >
          <Plus className="h-3 w-3" />
        </DaisyButton>
      </div>

      {/* Column Description */}
      {column.description && (
        <div className="px-enterprise-4 py-enterprise-2 text-caption text-text-secondary border-b border-border">
          {column.description}
        </div>
      )}

      {/* Tasks */}
      <div 
        className={cn(
          "flex-1 p-enterprise-3 space-y-enterprise-3 min-h-0 overflow-y-auto",
          isDragOver && "bg-blue-50 border-2 border-dashed border-blue-300"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete}
            onStatusChange={onTaskStatusChange}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-enterprise-8 text-text-secondary">
            <div className="mb-enterprise-2">
              <Square className="h-8 w-8 mx-auto opacity-50" />
            </div>
            <p className="text-body-sm">No tasks</p>
            <p className="text-caption">Drag tasks here or add new ones</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Workflow Kanban Component
export const WorkflowKanban: React.FC<{
  projectId?: string;
  showMetrics?: boolean;
}> = ({ projectId, showMetrics = true }) => {
  const [tasks, setTasks] = useState<WorkflowTask[]>(sampleTasks);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [filterBy, setFilterBy] = useState<{
    assignee?: string;
    priority?: WorkflowTask['priority'];
    type?: WorkflowTask['type'];
    search?: string;
  }>({});

  const handleTaskEdit = (task: WorkflowTask) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleTaskStatusChange = (taskId: string, newStatus: WorkflowTask['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date() }
        : task
    ));
  };

  const handleAddTask = (status: WorkflowTask['status']) => {
    const newTask: WorkflowTask = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: '',
      type: 'documentation',
      priority: 'medium',
      status,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      estimatedHours: 8,
      actualHours: 0,
      tags: [],
      attachments: [],
      dependencies: [],
      subtasks: [],
      comments: 0,
      workflowStage: {
        id: 'stage-new',
        name: 'Not Started',
        description: 'New task created',
        requiredApprovals: 0,
        currentApprovals: 0,
        approvers: [],
        isCompleted: false,
      },
    };

    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setShowTaskDialog(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterBy.assignee && task.assignee?.id !== filterBy.assignee) return false;
    if (filterBy.priority && task.priority !== filterBy.priority) return false;
    if (filterBy.type && task.type !== filterBy.type) return false;
    if (filterBy.search && !task.title.toLowerCase().includes(filterBy.search.toLowerCase())) return false;
    return true;
  });

  // Group tasks by status
  const tasksByStatus = kanbanColumns.reduce((acc, column) => {
    acc[column.status] = filteredTasks.filter(task => task.status === column.status);
    return acc;
  }, {} as Record<WorkflowTask['status'], WorkflowTask[]>);

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.dueDate < new Date() && t.status !== 'completed').length;
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-enterprise-6 border-b border-border">
        <div>
          <h2 className="text-heading-sm font-semibold">Workflow Board</h2>
          <p className="text-body-sm text-text-secondary mt-enterprise-1">
            Manage tasks and track progress across workflow stages
          </p>
        </div>

        <div className="flex items-center space-x-enterprise-3">
          {/* Filters */}
          <div className="flex items-center space-x-enterprise-2">
            <DaisyInput
              placeholder="Search tasks..."
              value={filterBy.search || ''}
              onChange={(e) => setFilterBy(prev => ({ ...prev, search: e.target.value }))}
              className="w-48"
            />
            
            <DaisyDropdownMenu>
              <DaisyDropdownMenuTrigger asChild>
                <DaisyButton variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-enterprise-2" />
                  Filter
                  <ChevronDown className="h-3 w-3 ml-enterprise-1" />
                </DaisyButton>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={() => setFilterBy(prev => ({ ...prev, priority: 'critical' }))}>
                  Critical Priority
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => setFilterBy(prev => ({ ...prev, priority: 'high' }))}>
                  High Priority
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => setFilterBy({})}>
                  Clear Filters
                </DaisyDropdownMenuItem>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
          </div>

          <DaisyButton onClick={() => handleAddTask('backlog')}>
            <Plus className="h-4 w-4 mr-enterprise-2" />
            Add Task
          </DaisyButton>
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-4 gap-enterprise-4 p-enterprise-6 border-b border-border">
          <DaisyCard>
            <DaisyCardContent className="p-enterprise-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-text-secondary">Total Tasks</p>
                  <p className="text-heading-xs font-semibold">{totalTasks}</p>
                </div>
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardContent className="p-enterprise-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-text-secondary">Completed</p>
                  <p className="text-heading-xs font-semibold text-green-600">{completedTasks}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardContent className="p-enterprise-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-text-secondary">Overdue</p>
                  <p className="text-heading-xs font-semibold text-red-600">{overdueTasks}</p>
                </div>
                <DaisyAlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </DaisyCardContent>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardContent className="p-enterprise-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-text-secondary">Avg Progress</p>
                  <p className="text-heading-xs font-semibold">{avgProgress}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </DaisyCardContent>
          </DaisyCard>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-enterprise-4 p-enterprise-6 h-full">
          {kanbanColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.status] || []}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskStatusChange={handleTaskStatusChange}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </div>

      {/* Task Dialog */}
      <DaisyDialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DaisyDialogContent className="max-w-2xl">
          <DaisyDialogHeader>
            <DaisyDialogTitle>
              {selectedTask?.id.startsWith('task-') ? 'Edit Task' : 'Create Task'}
            </DaisyDialogTitle>
          </DaisyDialogHeader>
          
          {selectedTask && (
            <div className="space-y-enterprise-4">
              <div className="grid grid-cols-2 gap-enterprise-4">
                <div>
                  <label className="text-body-sm font-medium">Title</label>
                  <DaisyInput 
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      title: e.target.value
                    })}
                    className="mt-enterprise-1"
                  />
                </div>
                
                <div>
                  <label className="text-body-sm font-medium">Priority</label>
                  <DaisyDropdownMenu>
                    <DaisyDropdownMenuTrigger asChild>
                      <DaisyButton variant="outline" className="w-full mt-enterprise-1 justify-start">
                        <div className={cn("w-2 h-2 rounded-full mr-enterprise-2", 
                          selectedTask.priority === 'critical' ? 'bg-red-500' :
                          selectedTask.priority === 'high' ? 'bg-orange-500' :
                          selectedTask.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        )} />
                        {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                        <ChevronDown className="h-3 w-3 ml-auto" />
                      </DaisyButton>
                    </DaisyDropdownMenuTrigger>
                    <DaisyDropdownMenuContent>
                      {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
                        <DaisyDropdownMenuItem 
                          key={priority}
                          onClick={() => setSelectedTask({
                            ...selectedTask,
                            priority
                          })}
                        >
                          <div className={cn("w-2 h-2 rounded-full mr-enterprise-2",
                            priority === 'critical' ? 'bg-red-500' :
                            priority === 'high' ? 'bg-orange-500' :
                            priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          )} />
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </DaisyDropdownMenuItem>
                      ))}
                    </DaisyDropdownMenuContent>
                  </DaisyDropdownMenu>
                </div>
              </div>

              <div>
                <label className="text-body-sm font-medium">Description</label>
                <DaisyTextarea 
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({
                    ...selectedTask,
                    description: e.target.value
                  })}
                  className="mt-enterprise-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-enterprise-4">
                <div>
                  <label className="text-body-sm font-medium">Due Date</label>
                  <DaisyInput 
                    type="date"
                    value={selectedTask.dueDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      dueDate: new Date(e.target.value)
                    })}
                    className="mt-enterprise-1"
                  />
                </div>

                <div>
                  <label className="text-body-sm font-medium">Estimated Hours</label>
                  <DaisyInput 
                    type="number"
                    value={selectedTask.estimatedHours}
                    onChange={(e) => setSelectedTask({
                      ...selectedTask,
                      estimatedHours: parseInt(e.target.value) || 0
                    })}
                    className="mt-enterprise-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-enterprise-2">
                <DaisyButton 
                  variant="outline" 
                  onClick={() => setShowTaskDialog(false)}
                >
                  Cancel
                </DaisyButton>
                <DaisyButton 
                  onClick={() => {
                    if (selectedTask.id.includes(Date.now().toString())) {
                      // New task, already added to state
                    } else {
                      // Update existing task
                      setTasks(prev => prev.map(task => 
                        task.id === selectedTask.id ? selectedTask : task
                      ));
                    }
                    setShowTaskDialog(false);
                  }}
                >
                  Save Task
                </DaisyButton>
              </div>
            </div>
          )}
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
};

export default WorkflowKanban;
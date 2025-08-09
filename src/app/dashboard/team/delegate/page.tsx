'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Data will be fetched from API

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
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [delegatedTasks, setDelegatedTasks] = useState<DelegatedTask[]>([]);
  const [summary, setSummary] = useState<any>({});
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

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team?includeWorkload=true&includeTasks=true', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTeamMembers(data.data.teamMembers || []);
          setDelegatedTasks(data.data.delegatedTasks || []);
          setSummary(data.data.summary || {});
        } else {
          console.error('Failed to load team data:', data.error);
          // Fallback to empty data
          setTeamMembers([]);
          setDelegatedTasks([]);
          setSummary({});
        }
      } else {
        console.error('Failed to fetch team data:', response.statusText);
        setTeamMembers([]);
        setDelegatedTasks([]);
        setSummary({});
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setTeamMembers([]);
      setDelegatedTasks([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = summary.totalTasks || 0;
  const pendingTasks = summary.pendingTasks || 0;
  const inProgressTasks = summary.inProgressTasks || 0;
  const completedTasks = summary.completedTasks || 0;

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

    toast.success(`Task "${task.title}" created and assigned to ${teamMembers.find(m => m.id === task.assignee)?.name}`);
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="workload">Workload Analysis</TabsTrigger>
          </TabsList>
        </Tabs>

        <TabsContent value="overview" className="space-y-6">
          {/* Team Performance Overview */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading team data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMembers.map((member) => {
                const roleConfig = getRoleConfig(member.role);
                const statusConfig = getStatusConfig(member.status);
                
                return (
                  <Card key={member.id}>
                    <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={cn("text-xs", roleConfig.color)}>
                        {roleConfig.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Workload</span>
                          <span className="font-medium">{member.workload}%</span>
                        </div>
                        <Progress 
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
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {member.expertise.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.expertise.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                );
              })}
          </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Delegation Activity</CardTitle>
              <CardDescription>Latest task assignments and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {delegatedTasks.slice(0, 3).map((task) => {
                  const member = teamMembers.find(m => m.id === task.assignee);
                  const priorityConfig = getPriorityConfig(task.priority);
                  const statusConfig = getTaskStatusConfig(task.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div key={task.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          Assigned to {member?.name} • Due {task.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                          {priorityConfig.label}
                        </Badge>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {/* Task Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 ml-auto">
              {delegatedTasks.length} task{delegatedTasks.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {delegatedTasks.map((task) => {
              const member = teamMembers.find(m => m.id === task.assignee);
              const priorityConfig = getPriorityConfig(task.priority);
              const statusConfig = getTaskStatusConfig(task.status);
              const StatusIcon = statusConfig.icon;
              const isOverdue = task.dueDate < new Date() && task.status !== 'completed';

              return (
                <Card key={task.id} className={cn(
                  "border-l-4",
                  isOverdue ? "border-red-500" : priorityConfig.bg.replace('bg-', 'border-')
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {task.id}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant={statusConfig.variant} className="text-xs">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                            {priorityConfig.label}
                          </Badge>
                          {task.framework && (
                            <Badge variant="outline" className="text-xs">
                              {task.framework}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {task.description}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold">{task.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <Progress value={task.progress} className="h-2" />
                      
                      {/* Task Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {member?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
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
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('view', task.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('edit', task.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskAction('comment', task.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid gap-6">
            {teamMembers.map((member) => {
              const roleConfig = getRoleConfig(member.role);
              const statusConfig = getStatusConfig(member.status);
              
              return (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{member.name}</CardTitle>
                          <CardDescription>{member.email}</CardDescription>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className={cn("text-xs", roleConfig.color)}>
                              {roleConfig.label}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {member.department}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{member.workload}%</div>
                        <div className="text-sm text-gray-500">Workload</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={member.workload} className="h-3" />
                      
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
                        <Label className="text-sm font-medium">Expertise</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.expertise.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMember(member.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Assign Task
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Performance
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="workload">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Workload Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Detailed workload analytics and capacity planning tools
            </p>
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </TabsContent>

        {/* Create Task Modal */}
        <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a new task to a team member with detailed specifications
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task requirements and objectives..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Task Type</Label>
                    <Select value={newTask.type} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                        <SelectItem value="control_testing">Control Testing</SelectItem>
                        <SelectItem value="compliance_review">Compliance Review</SelectItem>
                        <SelectItem value="audit_preparation">Audit Preparation</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignee">Assign To *</Label>
                    <Select value={newTask.assignee} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignee: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <span>{member.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.workload}% workload
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      placeholder="8"
                      value={newTask.estimatedHours}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="framework">Framework (Optional)</Label>
                    <Select value={newTask.framework} onValueChange={(value) => setNewTask(prev => ({ ...prev, framework: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="SOC 2">SOC 2</SelectItem>
                        <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                        <SelectItem value="GDPR">GDPR</SelectItem>
                        <SelectItem value="NIST">NIST</SelectItem>
                        <SelectItem value="HIPAA">HIPAA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTask.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
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
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTaskModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateNewTask}>
                  <Send className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </MainContentArea>
    </ProtectedRoute>
  );
} 
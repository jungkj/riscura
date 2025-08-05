'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyDialogTitle, DaisyDropdownMenuTrigger } from '@/components/ui/daisy-components';
// import {
  Activity,
  Filter,
  Download,
  Search,
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  FileText,
  Shield,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
  Eye,
  UserCheck,
  UserX,
  Upload,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  Dot,
  Bell,
  BellOff,
  Star,
  Share2,
  Copy,
  Archive,
  Flag,
  GitBranch,
  GitCommit,
  GitMerge,
  Workflow,
  Database,
  Lock,
  Unlock,
  Key,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  MapPin,
  Link,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Building,
  Briefcase,
  Globe,
  MoreHorizontal,
} from 'lucide-react';

// Types
interface Activity {
  id: string
  type: ActivityType;
  action: string;
  actor: User;
  target?: ActivityTarget;
  context?: ActivityContext;
  metadata?: Record<string, any>;
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  category: ActivityCategory;
  entityType?: 'risk' | 'control' | 'document' | 'task' | 'user' | 'system';
  entityId?: string;
  changes?: ActivityChange[];
  relatedActivities?: string[]; // Related activity IDs
}

type ActivityType = 
  | 'created' | 'updated' | 'deleted' | 'assigned' | 'approved' | 'rejected'
  | 'commented' | 'mentioned' | 'reviewed' | 'completed' | 'archived'
  | 'login' | 'logout' | 'permission_changed' | 'status_changed'
  | 'uploaded' | 'downloaded' | 'shared' | 'exported' | 'imported'
  | 'deadline_approaching' | 'deadline_missed' | 'reminder_sent'
  | 'workflow_started' | 'workflow_completed' | 'approval_requested';

type ActivityCategory = 
  | 'risk_management' | 'compliance' | 'audit' | 'security' 
  | 'user_management' | 'system' | 'workflow' | 'communication'
  | 'documents' | 'reporting' | 'data_management';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  isOnline: boolean;
}

interface ActivityTarget {
  id: string;
  type: string;
  name: string;
  url?: string;
}

interface ActivityContext {
  project?: string;
  workflow?: string;
  department?: string;
  location?: string;
}

interface ActivityChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'text' | 'number' | 'date' | 'status' | 'user' | 'array';
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
  {
    id: 'system',
    name: 'System',
    email: 'system@company.com',
    role: 'Automated System',
    department: 'System',
    isOnline: true,
  },
]

const sampleActivities: Activity[] = [
  {
    id: 'activity-1',
    type: 'commented',
    action: 'added a comment to',
    actor: sampleUsers[0],
    target: {
      id: 'RSK-001',
      type: 'risk',
      name: 'Data Breach Risk Assessment',
      url: '/risks/RSK-001',
    },
    context: {
      project: 'Q4 Risk Review',
      department: 'Risk & Compliance',
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    description: 'Added comment: "We need to review the likelihood assessment based on latest threat intel"',
    severity: 'medium',
    isRead: false,
    category: 'risk_management',
    entityType: 'risk',
    entityId: 'RSK-001',
  },
  {
    id: 'activity-2',
    type: 'updated',
    action: 'updated',
    actor: sampleUsers[2],
    target: {
      id: 'CTL-001',
      type: 'control',
      name: 'Access Control Testing',
      url: '/controls/CTL-001',
    },
    context: {
      workflow: 'SOC 2 Compliance',
      department: 'IT Security',
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    description: 'Updated control testing status to "In Progress"',
    severity: 'low',
    isRead: false,
    category: 'compliance',
    entityType: 'control',
    entityId: 'CTL-001',
    changes: [
      {
        field: 'status',
        oldValue: 'Not Started',
        newValue: 'In Progress',
        type: 'status',
      },
      {
        field: 'assignee',
        oldValue: null,
        newValue: 'Emily Rodriguez',
        type: 'user',
      },
    ],
  },
  {
    id: 'activity-3',
    type: 'approved',
    action: 'approved',
    actor: sampleUsers[3],
    target: {
      id: 'DOC-001',
      type: 'document',
      name: 'Privacy Policy Update',
      url: '/documents/DOC-001',
    },
    context: {
      workflow: 'Document Review',
      department: 'Internal Audit',
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    description: 'Approved privacy policy updates for Q4 compliance',
    severity: 'medium',
    isRead: true,
    category: 'documents',
    entityType: 'document',
    entityId: 'DOC-001',
  },
  {
    id: 'activity-4',
    type: 'deadline_approaching',
    action: 'reminder',
    actor: sampleUsers[4], // System user
    target: {
      id: 'TASK-001',
      type: 'task',
      name: 'SOC 2 Control Testing',
      url: '/tasks/TASK-001',
    },
    context: {
      project: 'SOC 2 Audit',
      department: 'IT Security',
    },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    description: 'Deadline approaching in 3 days for SOC 2 Control Testing',
    severity: 'high',
    isRead: true,
    category: 'workflow',
    entityType: 'task',
    entityId: 'TASK-001',
  },
  {
    id: 'activity-5',
    type: 'mentioned',
    action: 'mentioned you in',
    actor: sampleUsers[1],
    target: {
      id: 'RSK-002',
      type: 'risk',
      name: 'Supply Chain Risk',
      url: '/risks/RSK-002',
    },
    context: {
      project: 'Q4 Risk Review',
      department: 'Risk & Compliance',
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    description: 'Mentioned you in a comment about supply chain risk mitigation strategies',
    severity: 'medium',
    isRead: true,
    category: 'communication',
    entityType: 'risk',
    entityId: 'RSK-002',
  },
  {
    id: 'activity-6',
    type: 'created',
    action: 'created',
    actor: sampleUsers[0],
    target: {
      id: 'RSK-003',
      type: 'risk',
      name: 'Cloud Infrastructure Risk',
      url: '/risks/RSK-003',
    },
    context: {
      project: 'Infrastructure Assessment',
      department: 'Risk & Compliance',
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    description: 'Created new risk assessment for cloud infrastructure vulnerabilities',
    severity: 'medium',
    isRead: true,
    category: 'risk_management',
    entityType: 'risk',
    entityId: 'RSK-003',
  },
  {
    id: 'activity-7',
    type: 'login',
    action: 'logged in',
    actor: sampleUsers[2],
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    description: 'Successfully logged in from IP 192.168.1.100',
    severity: 'low',
    isRead: true,
    category: 'security',
    metadata: {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Mac) Chrome/119.0.0.0',
      location: 'San Francisco, CA',
    },
  },
];

// Activity Item Component
const ActivityItem: React.FC<{
  activity: Activity
  isCompact?: boolean;
  showDetails?: boolean;
  onMarkAsRead?: (activityId: string) => void;
  onViewDetails?: (activity: Activity) => void;
}> = ({ activity, isCompact = false, showDetails = false, onMarkAsRead, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActivityIcon = (_type: ActivityType) => {
    switch (type) {
      case 'created': return <Plus className="h-4 w-4" />;
      case 'updated': return <Edit className="h-4 w-4" />;
      case 'deleted': return <Trash2 className="h-4 w-4" />;
      case 'assigned': return <UserCheck className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'commented': return <MessageSquare className="h-4 w-4" />;
      case 'mentioned': return <Bell className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      case 'login': return <Key className="h-4 w-4" />;
      case 'logout': return <Unlock className="h-4 w-4" />;
      case 'permission_changed': return <Settings className="h-4 w-4" />;
      case 'status_changed': return <RefreshCw className="h-4 w-4" />;
      case 'uploaded': return <Upload className="h-4 w-4" />;
      case 'downloaded': return <Download className="h-4 w-4" />;
      case 'shared': return <Share2 className="h-4 w-4" />;
      case 'deadline_approaching': return <DaisyAlertTriangle className="h-4 w-4" >
  ;
</DaisyAlertTriangle>
      case 'deadline_missed': return <Clock className="h-4 w-4" />;
      case 'workflow_started': return <Workflow className="h-4 w-4" />;
      case 'workflow_completed': return <GitCommit className="h-4 w-4" />;
      case 'approval_requested': return <UserCheck className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  }

  const getActivityColor = (_type: ActivityType, severity: Activity['severity']) => {
    if (severity === 'critical') return 'text-red-600';
    if (severity === 'high') return 'text-orange-600';
    if (severity === 'medium') return 'text-blue-600';
    return 'text-green-600';
  }

  const getSeverityBadge = (severity: Activity['severity']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    }

    return (
      <DaisyBadge className={cn('text-caption px-enterprise-1 py-0', colors[severity])} >
  {severity}
</DaisyBadge>
      </DaisyBadge>
    );
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  }

  const renderChanges = (changes: ActivityChange[]) => {
    if (!changes || changes.length === 0) return null;

    return (
      <div className="mt-enterprise-3 space-y-enterprise-2">
        <div className="text-caption text-text-secondary font-medium">Changes:</div>
        {changes.map((change, index) => (
          <div key={index} className="flex items-center space-x-enterprise-2 text-caption">
            <DaisyBadge variant="outline" className="text-caption px-enterprise-1 py-0" >
  {change.field}
</DaisyBadge>
            </DaisyBadge>
            <span className="text-text-secondary">from</span>
            <span className="font-mono bg-surface-secondary px-enterprise-1 rounded">
              {change.oldValue || 'null'}
            </span>
            <ArrowRight className="h-3 w-3 text-text-secondary" />
            <span className="font-mono bg-surface-secondary px-enterprise-1 rounded">
              {change.newValue}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const renderMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mt-enterprise-3 space-y-enterprise-2">
        <div className="text-caption text-text-secondary font-medium">Details:</div>
        <div className="grid grid-cols-2 gap-enterprise-2 text-caption">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-text-secondary">{key}:</span>
              <span className="font-mono">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={cn(
        "flex items-center space-x-enterprise-3 p-enterprise-3 rounded-lg hover:bg-surface-secondary transition-colors",
        !activity.isRead && "bg-blue-50 border-l-2 border-l-blue-500"
      )}>
        <div className={cn("p-1 rounded", getActivityColor(activity.type, activity.severity))}>
          {getActivityIcon(activity.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-body-sm truncate">
            <span className="font-medium">{activity.actor.name}</span>
            {' '}{activity.action}{' '}
            {activity.target && (
              <span className="font-medium">{activity.target.name}</span>
            )}
          </p>
          <div className="flex items-center space-x-enterprise-2 text-caption text-text-secondary">
            <span>{formatTimestamp(activity.timestamp)}</span>
            {getSeverityBadge(activity.severity)}
          </div>
        </div>

        {!activity.isRead && (
          <DaisyButton
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMarkAsRead?.(activity.id)} />
            <Dot className="h-4 w-4 text-blue-600" />
          </DaisyButton>
        )}
      </div>
    );
  }

  return (
    <DaisyCard className={cn(
      "transition-all duration-200 hover:shadow-notion-sm",
      !activity.isRead && "border-l-4 border-l-blue-500 bg-blue-50/30"
    )} >
  <DaisyCardBody className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardBody>
        <div className="flex items-start space-x-enterprise-3">
          {/* Avatar & Icon */}
          <div className="relative">
            <DaisyAvatar className="h-8 w-8" >
                <DaisyAvatarImage src={activity.actor.avatar} />
                <DaisyAvatarFallback className="text-caption" >
                  {activity.actor.name === 'System' ? 'SYS' : 
                 activity.actor.name.split(' ').map(n => n[0]).join('')}
                </DaisyAvatarFallback>
            </DaisyAvatar>
            <div className={cn(
              "absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white border",
              getActivityColor(activity.type, activity.severity)
            )}>
              {getActivityIcon(activity.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-body-sm">
                  <span className="font-medium">{activity.actor.name}</span>
                  {' '}{activity.action}{' '}
                  {activity.target && (
                    <DaisyButton
                      variant="link"
                      className="h-auto p-0 font-medium text-body-sm"
                      onClick={() => activity.target?.url && window.open(activity.target.url, '_blank')} />
                      {activity.target.name}
                      <ExternalLink className="h-3 w-3 ml-enterprise-1" />
                    </DaisyButton>
                  )}
                </p>
                
                <div className="flex items-center space-x-enterprise-3 mt-enterprise-1">
                  <div className="flex items-center space-x-enterprise-1 text-caption text-text-secondary">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                  
                  {activity.context?.department && (
                    <DaisyBadge variant="outline" className="text-caption px-enterprise-1 py-0" >
  {activity.context.department}
</DaisyBadge>
                    </DaisyBadge>
                  )}
                  
                  {getSeverityBadge(activity.severity)}
                </div>
              </div>

              <div className="flex items-center space-x-enterprise-1">
                {!activity.isRead && (
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onMarkAsRead?.(activity.id)} />
                    <Dot className="h-4 w-4 text-blue-600" />
                  </DaisyButton>
                )}
                
                <DaisyDropdownMenu >
                    <DaisyDropdownMenuTrigger asChild >
                      <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <MoreHorizontal className="h-3 w-3" />
</DaisyDropdownMenu>
                    </DaisyButton>
                  </DaisyDropdownMenuTrigger>
                  <DaisyDropdownMenuContent align="end" >
                      <DaisyDropdownMenuItem onClick={() => onViewDetails?.(activity)} />
                      <Eye className="h-3 w-3 mr-enterprise-2" />
                      View Details
                    </DaisyDropdownMenuContent>
                    <DaisyDropdownMenuItem onClick={() => {}}>
                      <Copy className="h-3 w-3 mr-enterprise-2" />
                      Copy Link
                    </DaisyDropdownMenuItem>
                    <DaisyDropdownMenuItem onClick={() => {}}>
                      <Flag className="h-3 w-3 mr-enterprise-2" />
                      Report Issue
                    </DaisyDropdownMenuItem>
                  </DaisyDropdownMenuContent>
                </DaisyDropdownMenu>
              </div>
            </div>

            {/* Description */}
            <div className="mt-enterprise-2">
              <p className="text-body-sm text-text-secondary leading-relaxed">
                {activity.description}
              </p>
            </div>

            {/* Context */}
            {activity.context && (
              <div className="flex items-center space-x-enterprise-4 mt-enterprise-3 text-caption text-text-secondary">
                {activity.context.project && (
                  <div className="flex items-center space-x-enterprise-1">
                    <Briefcase className="h-3 w-3" />
                    <span>{activity.context.project}</span>
                  </div>
                )}
                
                {activity.context.workflow && (
                  <div className="flex items-center space-x-enterprise-1">
                    <Workflow className="h-3 w-3" />
                    <span>{activity.context.workflow}</span>
                  </div>
                )}
                
                {activity.context.location && (
                  <div className="flex items-center space-x-enterprise-1">
                    <MapPin className="h-3 w-3" />
                    <span>{activity.context.location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Expandable Details */}
            {(showDetails || isExpanded) && (
              <div className="mt-enterprise-4 pt-enterprise-3 border-t border-border">
                {renderChanges(activity.changes || [])}
                {renderMetadata(activity.metadata || {})}
              </div>
            )}

            {/* Expand/Collapse Button */}
            {(activity.changes || activity.metadata) && !showDetails && (
              <DaisyButton
                variant="ghost"
                size="sm"
                className="mt-enterprise-2 h-auto p-0 text-caption text-text-secondary"
                onClick={() => setIsExpanded(!isExpanded)} />
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-enterprise-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 mr-enterprise-1" />
                    Show Details
                  </>
                )}
              </DaisyButton>
            )}
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}

// Main Activity Feed Component
export const ActivityFeed: React.FC<{
  isCompact?: boolean
  maxItems?: number;
  showFilters?: boolean;
  showExport?: boolean;
  entityType?: string;
  entityId?: string;
  userId?: string;
}> = ({ 
  isCompact = false, 
  maxItems, 
  showFilters = true, 
  showExport = true,
  entityType,
  entityId,
  userId
}) => {
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [filters, setFilters] = useState<{
    category?: ActivityCategory;
    type?: ActivityType;
    severity?: Activity['severity'];
    actor?: string;
    dateRange?: { start: Date; end: Date }
    search?: string;
    unreadOnly?: boolean;
  }>({});
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      // Simulate new activities
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        type: 'updated',
        action: 'updated',
        actor: sampleUsers[Math.floor(Math.random() * sampleUsers.length)],
        target: {
          id: 'RSK-004',
          type: 'risk',
          name: 'New Risk Item',
          url: '/risks/RSK-004',
        },
        timestamp: new Date(),
        description: 'Made updates to risk assessment',
        severity: 'low',
        isRead: false,
        category: 'risk_management',
        entityType: 'risk',
        entityId: 'RSK-004',
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (entityType && activity.entityType !== entityType) return false
    if (entityId && activity.entityId !== entityId) return false;
    if (userId && activity.actor.id !== userId) return false;
    if (filters.category && activity.category !== filters.category) return false;
    if (filters.type && activity.type !== filters.type) return false;
    if (filters.severity && activity.severity !== filters.severity) return false;
    if (filters.actor && activity.actor.id !== filters.actor) return false;
    if (filters.unreadOnly && activity.isRead) return false;
    if (filters.search && !activity.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateRange) {
      const activityDate = new Date(activity.timestamp);
      if (activityDate < filters.dateRange.start || activityDate > filters.dateRange.end) return false;
    }
    return true;
  });

  const displayedActivities = maxItems ? filteredActivities.slice(0, maxItems) : filteredActivities;

  const handleMarkAsRead = (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, isRead: true } : activity
    ));
  }

  const handleMarkAllAsRead = () => {
    setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })));
  }

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActivityDialog(true);
    handleMarkAsRead(activity.id);
  }

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    // Simulate export functionality
    const exportData = filteredActivities.map(activity => ({
      timestamp: activity.timestamp.toISOString(),
      actor: activity.actor.name,
      action: activity.action,
      target: activity.target?.name || '',
      description: activity.description,
      category: activity.category,
      severity: activity.severity,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-feed-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const unreadCount = activities.filter(a => !a.isRead).length;

  return (
    <div className="space-y-enterprise-4">
      {/* Header */}
      {Boolean(showFilters) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-3">
            <div>
              <h3 className="text-heading-sm font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-enterprise-2" />
                Activity Feed
                {unreadCount > 0 && (
                  <DaisyBadge className="ml-enterprise-2 text-caption px-enterprise-1 py-0 bg-blue-600" >
  {unreadCount}
</DaisyBadge>
                  </DaisyBadge>
                )}
              </h3>
              <p className="text-body-sm text-text-secondary mt-enterprise-1">
                Real-time activity updates and audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-enterprise-2">
            {/* Search */}
            <DaisyInput
              placeholder="Search activities..."
              value={filters.search || ''}
              onChange={(e) =>
setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-48" />

            {/* Filters */}
            <DaisyDropdownMenu >
                <DaisyDropdownMenuTrigger asChild >
                  <DaisyButton variant="outline" size="sm" >
  <Filter className="h-3 w-3 mr-enterprise-2" />
</DaisyInput>
                  Filter
                  <ChevronDown className="h-3 w-3 ml-enterprise-1" />
                </DaisyButton>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent >
                  <DaisyDropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}>
                  <Bell className="h-3 w-3 mr-enterprise-2" />
                  {filters.unreadOnly ? 'Show All' : 'Unread Only'}
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, severity: 'critical' }))}>
                  <DaisyAlertTriangle className="h-3 w-3 mr-enterprise-2" >
  Critical Only
</DaisyDropdownMenuItem>
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, category: 'risk_management' }))}>
                  <Target className="h-3 w-3 mr-enterprise-2" />
                  Risk Management
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => setFilters({})}>
                  Clear Filters
                </DaisyDropdownMenuItem>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>

            {/* Auto-refresh toggle */}
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={cn(isAutoRefresh && "bg-green-50 border-green-200")} />
              <RefreshCw className={cn("h-3 w-3 mr-enterprise-2", isAutoRefresh && "animate-spin")} />
              Auto-refresh
            </DaisyButton>

            {/* Export */}
            {Boolean(showExport) && (
              <DaisyDropdownMenu >
                  <DaisyDropdownMenuTrigger asChild >
                    <DaisyButton variant="outline" size="sm" >
  <Download className="h-3 w-3 mr-enterprise-2" />
</DaisyDropdownMenu>
                    Export
                    <ChevronDown className="h-3 w-3 ml-enterprise-1" />
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent >
                    <DaisyDropdownMenuItem onClick={() => handleExport('csv')} />
                    Export as CSV
                  </DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => handleExport('json')} />
                    Export as JSON
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem onClick={() => handleExport('pdf')} />
                    Export as PDF
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            )}

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}>
          Mark All Read

        </DaisyButton>
              </DaisyButton>
            )}
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className={cn(
        "space-y-enterprise-3",
        isCompact ? "max-h-96 overflow-y-auto" : "space-y-enterprise-4"
      )}>
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isCompact={isCompact}
              onMarkAsRead={handleMarkAsRead}
              onViewDetails={handleViewDetails} />
          ))
        ) : (
          <div className="text-center py-enterprise-8 text-text-secondary">
            <Activity className="h-12 w-12 mx-auto mb-enterprise-4 opacity-50" />
            <h4 className="text-body-base font-medium mb-enterprise-2">No activities found</h4>
            <p className="text-body-sm">No activities match your current filters.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {!isCompact && filteredActivities.length > (maxItems || 20) && (
        <div className="text-center">
          <DaisyButton variant="outline">
          Load More Activities

        </DaisyButton>
          </DaisyButton>
        </div>
      )}

      {/* Activity Details Dialog */}
      <DaisyDialog open={showActivityDialog} onOpenChange={setShowActivityDialog} >
          <DaisyDialogContent className="max-w-2xl" >
  <DaisyDialogHeader>
</DaisyDialog>
            <DaisyDialogTitle>Activity Details</DaisyDialogTitle>
          </DaisyDialogHeader>
          
          {Boolean(selectedActivity) && (
            <div className="space-y-enterprise-4">
              <ActivityItem
                activity={selectedActivity}
                showDetails={true}
                onMarkAsRead={handleMarkAsRead} />

              {/* Additional Details */}
              <div className="space-y-enterprise-3">
                <DaisySeparator />
<div className="grid grid-cols-2 gap-enterprise-4 text-body-sm">
                  <div>
                    <label className="font-medium">Activity ID</label>
                    <p className="text-text-secondary font-mono">{selectedActivity.id}</p>
                  </div>
                  
                  <div>
                    <label className="font-medium">Category</label>
                    <p className="text-text-secondary">{selectedActivity.category}</p>
                  </div>
                  
                  <div>
                    <label className="font-medium">Entity Type</label>
                    <p className="text-text-secondary">{selectedActivity.entityType || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="font-medium">Entity ID</label>
                    <p className="text-text-secondary font-mono">{selectedActivity.entityId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DaisySeparator>
      </DaisyDialog>
    </div>
  );
}

export default ActivityFeed;
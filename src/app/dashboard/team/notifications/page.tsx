'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import {
  DaisySelect,
  DaisySelectContent,
  DaisySelectItem,
  DaisySelectTrigger,
  DaisySelectValue,
} from '@/components/ui/DaisySelect';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Bell,
  BellRing,
  Settings,
  Filter,
  Search,
  CheckCircle2,
  Trash2,
  Archive,
  Star,
  Mail,
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Calendar,
  Target,
  TrendingUp,
  Zap,
  Phone,
  Video,
  Download,
  ExternalLink,
} from 'lucide-react';

// Types
interface Notification {
  id: string;
  type:
    | 'task_assigned'
    | 'task_completed'
    | 'mention'
    | 'deadline'
    | 'security_alert'
    | 'system'
    | 'compliance'
    | 'audit';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    taskId?: string;
    channelId?: string;
    documentId?: string;
    auditId?: string;
  };
}

interface NotificationPreferences {
  email: {
    taskAssignments: boolean;
    deadlineReminders: boolean;
    securityAlerts: boolean;
    mentions: boolean;
    systemUpdates: boolean;
    auditNotifications: boolean;
  };
  push: {
    taskAssignments: boolean;
    deadlineReminders: boolean;
    securityAlerts: boolean;
    mentions: boolean;
    systemUpdates: boolean;
    auditNotifications: boolean;
  };
  inApp: {
    taskAssignments: boolean;
    deadlineReminders: boolean;
    securityAlerts: boolean;
    mentions: boolean;
    systemUpdates: boolean;
    auditNotifications: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Sample data
const sampleNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'security_alert',
    title: 'Critical Security Alert',
    message: 'Unusual login activity detected from IP 192.168.1.100. Please review immediately.',
    timestamp: new Date('2024-01-30T16:45:00'),
    isRead: false,
    isStarred: true,
    priority: 'critical',
    category: 'Security',
    actionUrl: '/dashboard/security/alerts',
    actionLabel: 'Review Alert',
    sender: {
      id: 'system',
      name: 'Security System',
    },
  },
  {
    id: 'notif-2',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to complete the SOC 2 access control review by February 15th.',
    timestamp: new Date('2024-01-30T14:30:00'),
    isRead: false,
    isStarred: false,
    priority: 'high',
    category: 'Tasks',
    actionUrl: '/dashboard/team/delegate',
    actionLabel: 'View Task',
    sender: {
      id: 'user-1',
      name: 'Sarah Chen',
    },
    metadata: {
      taskId: 'TASK-001',
    },
  },
  {
    id: 'notif-3',
    type: 'deadline',
    title: 'Deadline Reminder',
    message: 'GDPR data processing assessment is due in 2 days. Current progress: 75%',
    timestamp: new Date('2024-01-30T13:15:00'),
    isRead: true,
    isStarred: false,
    priority: 'medium',
    category: 'Compliance',
    actionUrl: '/dashboard/compliance',
    actionLabel: 'Continue Work',
    metadata: {
      taskId: 'TASK-002',
    },
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'Mentioned in #compliance',
    message: '@you Can you review the updated privacy policy documentation?',
    timestamp: new Date('2024-01-30T11:20:00'),
    isRead: true,
    isStarred: false,
    priority: 'medium',
    category: 'Chat',
    actionUrl: '/dashboard/team/chat',
    actionLabel: 'View Message',
    sender: {
      id: 'user-2',
      name: 'Michael Rodriguez',
    },
    metadata: {
      channelId: 'compliance',
    },
  },
  {
    id: 'notif-5',
    type: 'audit',
    title: 'Audit Preparation Complete',
    message: 'All documentation for the SOC 2 audit has been prepared and reviewed.',
    timestamp: new Date('2024-01-30T10:45:00'),
    isRead: true,
    isStarred: false,
    priority: 'low',
    category: 'Audit',
    actionUrl: '/dashboard/compliance',
    actionLabel: 'View Details',
    sender: {
      id: 'user-3',
      name: 'Emma Johnson',
    },
  },
  {
    id: 'notif-6',
    type: 'compliance',
    title: 'Compliance Score Updated',
    message: 'Your SOC 2 compliance score has increased to 85%. Great progress!',
    timestamp: new Date('2024-01-30T09:30:00'),
    isRead: true,
    isStarred: true,
    priority: 'low',
    category: 'Compliance',
    actionUrl: '/dashboard/compliance',
    actionLabel: 'View Dashboard',
  },
];

const defaultPreferences: NotificationPreferences = {
  email: {
    taskAssignments: true,
    deadlineReminders: true,
    securityAlerts: true,
    mentions: true,
    systemUpdates: false,
    auditNotifications: true,
  },
  push: {
    taskAssignments: true,
    deadlineReminders: true,
    securityAlerts: true,
    mentions: true,
    systemUpdates: false,
    auditNotifications: false,
  },
  inApp: {
    taskAssignments: true,
    deadlineReminders: true,
    securityAlerts: true,
    mentions: true,
    systemUpdates: true,
    auditNotifications: true,
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

const getNotificationIcon = (type: string) => {
  const icons = {
    task_assigned: Target,
    task_completed: CheckCircle,
    mention: MessageSquare,
    deadline: Clock,
    security_alert: Shield,
    system: Settings,
    compliance: FileText,
    audit: Users,
  };
  return icons[type as keyof typeof icons] || Bell;
};

const getPriorityConfig = (priority: string) => {
  const configs = {
    critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  };
  return configs[priority as keyof typeof configs] || configs.medium;
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

export default function TeamNotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [notifications, setNotifications] = useState(sampleNotifications);

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' ||
      notification.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && !notification.isRead) ||
      (activeTab === 'starred' && notification.isStarred);

    return matchesSearch && matchesCategory && matchesPriority && matchesTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const starredCount = notifications.filter((n) => n.isStarred).length;
  const criticalCount = notifications.filter((n) => n.priority === 'critical').length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleToggleStar = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isStarred: !n.isStarred } : n))
    );
    toast.success('Notification starred');
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const handleArchiveNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.success('Notification archived');
  };

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      toast.success(`Navigating to ${notification.actionLabel}...`);
      handleMarkAsRead(notification.id);
    }
  };

  const handlePreferenceChange = (
    category: keyof NotificationPreferences['email'],
    type: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...((prev[type] as Record<string, boolean>) || {}),
        [category]: value,
      },
    }));
  };

  const handleSavePreferences = () => {
    toast.success('Notification preferences saved successfully!');
  };

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Notifications"
        subtitle="Stay updated with team activities and important alerts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Team', href: '/dashboard/team' },
          { label: 'Notifications', current: true },
        ]}
        primaryAction={{
          label: 'Mark All Read',
          onClick: handleMarkAllAsRead,
          icon: CheckCircle2,
          disabled: unreadCount === 0,
        }}
        secondaryActions={[
          {
            label: 'Settings',
            onClick: () => setActiveTab('settings'),
            icon: Settings,
            variant: 'outline',
          },
          {
            label: 'Export',
            onClick: () => toast.success('Exporting notifications...'),
            icon: Download,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'total notifications',
            value: notifications.length,
            variant: 'default',
          },
          {
            label: 'unread',
            value: unreadCount,
            variant: 'warning',
          },
          {
            label: 'starred',
            value: starredCount,
            variant: 'default',
          },
          {
            label: 'critical',
            value: criticalCount,
            variant: 'destructive',
          },
        ]}
        maxWidth="2xl"
      >
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <DaisyTabsList>
            <DaisyTabsTrigger value="all">
              All
              <DaisyBadge variant="outline" className="ml-2">
                {notifications.length}
              </DaisyBadge>
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="unread">
              Unread
              <DaisyBadge variant="error" className="ml-2">
                {unreadCount}
              </DaisyBadge>
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="starred">
              Starred
              <DaisyBadge variant="outline" className="ml-2">
                {starredCount}
              </DaisyBadge>
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="settings">Settings</DaisyTabsTrigger>
          </DaisyTabsList>
        </DaisyTabs>

        <DaisyTabsContent value="all" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DaisySelect value={filterCategory} onValueChange={setFilterCategory}>
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Category" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Categories</DaisySelectItem>
                <DaisySelectItem value="security">Security</DaisySelectItem>
                <DaisySelectItem value="tasks">Tasks</DaisySelectItem>
                <DaisySelectItem value="compliance">Compliance</DaisySelectItem>
                <DaisySelectItem value="chat">Chat</DaisySelectItem>
                <DaisySelectItem value="audit">Audit</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <DaisySelect value={filterPriority} onValueChange={setFilterPriority}>
              <DaisySelectTrigger className="w-32">
                <DaisySelectValue placeholder="Priority" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Priorities</DaisySelectItem>
                <DaisySelectItem value="critical">Critical</DaisySelectItem>
                <DaisySelectItem value="high">High</DaisySelectItem>
                <DaisySelectItem value="medium">Medium</DaisySelectItem>
                <DaisySelectItem value="low">Low</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>

            <div className="text-sm text-gray-600 ml-auto">
              {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(notification.type);
              const priorityConfig = getPriorityConfig(notification.priority);

              return (
                <DaisyCard
                  key={notification.id}
                  className={cn(
                    'transition-all hover:shadow-md cursor-pointer border-l-4',
                    !notification.isRead && 'bg-blue-50 border-blue-500',
                    notification.isRead && priorityConfig.border,
                    notification.priority === 'critical' && 'ring-2 ring-red-200'
                  )}
                  onClick={() => handleNotificationAction(notification)}
                >
                  <DaisyCardBody className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={cn('flex-shrink-0 p-2 rounded-full', priorityConfig.bg)}>
                        <NotificationIcon className={cn('h-4 w-4', priorityConfig.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3
                                className={cn(
                                  'font-medium text-sm',
                                  !notification.isRead && 'font-semibold'
                                )}
                              >
                                {notification.title}
                              </h3>
                              <DaisyBadge
                                variant="outline"
                                className={cn('text-xs', priorityConfig.color)}
                              >
                                {notification.priority}
                              </DaisyBadge>
                              <DaisyBadge variant="outline" className="text-xs">
                                {notification.category}
                              </DaisyBadge>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {notification.sender && (
                                <div className="flex items-center space-x-1">
                                  <DaisyAvatar className="h-4 w-4">
                                    <DaisyAvatarImage src={notification.sender.avatar} />
                                    <DaisyAvatarFallback className="text-xs">
                                      {notification.sender.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </DaisyAvatarFallback>
                                  </DaisyAvatar>
                                  <span>{notification.sender.name}</span>
                                </div>
                              )}
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {notification.timestamp.toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {notification.actionUrl && (
                              <DaisyButton
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationAction(notification);
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {notification.actionLabel}
                              </DaisyButton>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStar(notification.id);
                              }}
                            >
                              <Star
                                className={cn(
                                  'h-4 w-4',
                                  notification.isStarred
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400'
                                )}
                              />
                            </DaisyButton>
                            {!notification.isRead && (
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </DaisyButton>
                            )}
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveNotification(notification.id);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </DaisyButton>
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </DaisyButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              );
            })}

            {filteredNotifications.length === 0 && (
              <DaisyCard>
                <DaisyCardBody className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No notifications found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || filterCategory !== 'all' || filterPriority !== 'all'
                      ? 'Try adjusting your filters to see more notifications.'
                      : "You're all caught up! New notifications will appear here."}
                  </p>
                </DaisyCardBody>
              </DaisyCard>
            )}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="unread" className="space-y-6">
          <div className="space-y-3">
            {notifications
              .filter((n) => !n.isRead)
              .map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type);
                const priorityConfig = getPriorityConfig(notification.priority);

                return (
                  <DaisyCard
                    key={notification.id}
                    className={cn(
                      'transition-all hover:shadow-md cursor-pointer border-l-4 bg-blue-50 border-blue-500',
                      notification.priority === 'critical' && 'ring-2 ring-red-200'
                    )}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <DaisyCardBody className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={cn('flex-shrink-0 p-2 rounded-full', priorityConfig.bg)}>
                          <NotificationIcon className={cn('h-4 w-4', priorityConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-sm">{notification.title}</h3>
                            <DaisyBadge
                              variant="outline"
                              className={cn('text-xs', priorityConfig.color)}
                            >
                              {notification.priority}
                            </DaisyBadge>
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <DaisyButton
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Mark as Read
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

        <DaisyTabsContent value="starred" className="space-y-6">
          <div className="space-y-3">
            {notifications
              .filter((n) => n.isStarred)
              .map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type);
                const priorityConfig = getPriorityConfig(notification.priority);

                return (
                  <DaisyCard
                    key={notification.id}
                    className={cn(
                      'transition-all hover:shadow-md cursor-pointer border-l-4',
                      priorityConfig.border
                    )}
                    onClick={() => handleNotificationAction(notification)}
                  >
                    <DaisyCardBody className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={cn('flex-shrink-0 p-2 rounded-full', priorityConfig.bg)}>
                          <NotificationIcon className={cn('h-4 w-4', priorityConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <h3 className="font-medium text-sm">{notification.title}</h3>
                            <DaisyBadge
                              variant="outline"
                              className={cn('text-xs', priorityConfig.color)}
                            >
                              {notification.priority}
                            </DaisyBadge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </DaisyCardBody>
                  </DaisyCard>
                );
              })}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="settings" className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Notification Preferences</DaisyCardTitle>
              <DaisyCardDescription>
                Configure how and when you receive notifications
              </DaisyCardDescription>
            </DaisyCardBody>

            <DaisyCardBody className="space-y-6">
              {/* Notification Types */}
              <div>
                <h3 className="font-medium mb-4">Notification Types</h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'taskAssignments',
                      label: 'Task Assignments',
                      description: 'When tasks are assigned to you',
                    },
                    {
                      key: 'deadlineReminders',
                      label: 'Deadline Reminders',
                      description: 'Reminders for upcoming deadlines',
                    },
                    {
                      key: 'securityAlerts',
                      label: 'Security Alerts',
                      description: 'Critical security notifications',
                    },
                    {
                      key: 'mentions',
                      label: 'Mentions',
                      description: 'When you are mentioned in chat',
                    },
                    {
                      key: 'systemUpdates',
                      label: 'System Updates',
                      description: 'System maintenance and updates',
                    },
                    {
                      key: 'auditNotifications',
                      label: 'Audit Notifications',
                      description: 'Audit-related activities',
                    },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <DaisyLabel className="font-medium">{item.label}</DaisyLabel>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 ml-4">
                        <div className="flex items-center space-x-2">
                          <DaisySwitch
                            checked={preferences.email[item.key as keyof typeof preferences.email]}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(
                                item.key as keyof typeof preferences.email,
                                'email',
                                checked
                              )
                            }
                          />
                          <DaisyLabel className="text-sm">Email</DaisyLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DaisySwitch
                            checked={preferences.push[item.key as keyof typeof preferences.push]}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(
                                item.key as keyof typeof preferences.push,
                                'push',
                                checked
                              )
                            }
                          />
                          <DaisyLabel className="text-sm">Push</DaisyLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DaisySwitch
                            checked={preferences.inApp[item.key as keyof typeof preferences.inApp]}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(
                                item.key as keyof typeof preferences.inApp,
                                'inApp',
                                checked
                              )
                            }
                          />
                          <DaisyLabel className="text-sm">In-App</DaisyLabel>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DaisySeparator />

              {/* Frequency Settings */}
              <div>
                <h3 className="font-medium mb-4">Notification Frequency</h3>
                <div className="space-y-4">
                  <div>
                    <DaisyLabel>Email Digest Frequency</DaisyLabel>
                    <DaisySelect
                      value={preferences.frequency}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({ ...prev, frequency: value as any }))
                      }
                    >
                      <DaisySelectTrigger className="w-48 mt-1">
                        <DaisySelectValue />
                      </DaisySelectTrigger>
                      <DaisySelectContent>
                        <DaisySelectItem value="immediate">Immediate</DaisySelectItem>
                        <DaisySelectItem value="hourly">Hourly</DaisySelectItem>
                        <DaisySelectItem value="daily">Daily</DaisySelectItem>
                        <DaisySelectItem value="weekly">Weekly</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>
                </div>
              </div>

              <DaisySeparator />

              {/* Quiet Hours */}
              <div>
                <h3 className="font-medium mb-4">Quiet Hours</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <DaisySwitch
                      checked={preferences.quietHours.enabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, enabled: checked },
                        }))
                      }
                    />
                    <DaisyLabel>Enable quiet hours</DaisyLabel>
                  </div>
                  {preferences.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <DaisyLabel>Start Time</DaisyLabel>
                        <DaisyInput
                          type="time"
                          value={preferences.quietHours.start}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, start: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <DaisyLabel>End Time</DaisyLabel>
                        <DaisyInput
                          type="time"
                          value={preferences.quietHours.end}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, end: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <DaisyButton variant="outline">Reset to Default</DaisyButton>
                <DaisyButton onClick={handleSavePreferences}>Save Preferences</DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </MainContentArea>
    </ProtectedRoute>
  );
}

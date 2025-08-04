'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Eye,
  Clock,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Activity,
  Settings,
  Filter,
  Archive,
  Trash2,
  CheckCircle2,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileText,
  Server,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';

// Types
interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'prediction' | 'alert' | 'recommendation' | 'insight' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'risk' | 'control' | 'compliance' | 'security' | 'operational';
  aiGenerated: boolean;
  confidence?: number; // for AI-generated notifications
  source: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  actions?: NotificationAction[];
  metadata?: {
    riskId?: string;
    controlId?: string;
    complianceFramework?: string;
    affectedSystems?: string[];
    severity?: string;
    timeline?: string;
  };
  channels: NotificationChannel[];
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  action: string;
  url?: string;
}

interface NotificationChannel {
  type: 'web' | 'email' | 'sms' | 'slack' | 'teams';
  enabled: boolean;
  delivered: boolean;
  deliveredAt?: Date;
}

interface NotificationFilter {
  type?: string[];
  priority?: string[];
  category?: string[];
  aiGenerated?: boolean;
  read?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Sample Smart Notifications
const sampleNotifications: SmartNotification[] = [
  {
    id: 'NOTIF-001',
    title: 'Critical: Potential Data Breach Predicted',
    message: 'AI analysis indicates 89% probability of data breach attempt within next 72 hours based on unusual network activity patterns.',
    type: 'prediction',
    priority: 'critical',
    category: 'security',
    aiGenerated: true,
    confidence: 89,
    source: 'AI Risk Predictor',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    dismissed: false,
    actions: [
      {
        id: 'act-1',
        label: 'Activate Incident Response',
        type: 'primary',
        action: 'activate_ir',
      },
      {
        id: 'act-2',
        label: 'View Analysis',
        type: 'secondary',
        action: 'view_analysis',
        url: '/ai/predictions/001',
      },
    ],
    metadata: {
      riskId: 'RSK-001',
      affectedSystems: ['Customer Database', 'Payment Gateway'],
      severity: 'Critical',
      timeline: '24-72 hours',
    },
    channels: [
      { type: 'web', enabled: true, delivered: true, deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'email', enabled: true, delivered: true, deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { type: 'sms', enabled: true, delivered: true, deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'NOTIF-002',
    title: 'Control Testing Overdue',
    message: 'Access Control Management (CTL-001) testing is overdue by 5 days. AI recommends immediate testing to prevent compliance gaps.',
    type: 'alert',
    priority: 'high',
    category: 'control',
    aiGenerated: true,
    confidence: 95,
    source: 'Control Monitoring System',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    dismissed: false,
    actions: [
      {
        id: 'act-3',
        label: 'Schedule Testing',
        type: 'primary',
        action: 'schedule_test',
      },
      {
        id: 'act-4',
        label: 'View Control',
        type: 'secondary',
        action: 'view_control',
        url: '/controls/CTL-001',
      },
    ],
    metadata: {
      controlId: 'CTL-001',
      severity: 'High',
      timeline: 'Immediate',
    },
    channels: [
      { type: 'web', enabled: true, delivered: true },
      { type: 'email', enabled: true, delivered: true },
    ],
  },
  {
    id: 'NOTIF-003',
    title: 'Compliance Score Trending Down',
    message: 'SOC 2 compliance score has decreased by 8% over the last 30 days. AI analysis suggests proactive measures needed.',
    type: 'insight',
    priority: 'medium',
    category: 'compliance',
    aiGenerated: true,
    confidence: 76,
    source: 'Compliance Analytics',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    dismissed: false,
    actions: [
      {
        id: 'act-5',
        label: 'View Trend Analysis',
        type: 'primary',
        action: 'view_trends',
      },
      {
        id: 'act-6',
        label: 'Generate Report',
        type: 'secondary',
        action: 'generate_report',
      },
    ],
    metadata: {
      complianceFramework: 'SOC 2',
      severity: 'Medium',
      timeline: '30 days',
    },
    channels: [
      { type: 'web', enabled: true, delivered: true },
      { type: 'email', enabled: true, delivered: false },
    ],
  },
  {
    id: 'NOTIF-004',
    title: 'Recommended: Implement Multi-Factor Authentication',
    message: 'Based on recent threat intelligence, implementing MFA could reduce security risk by 75%. Estimated implementation time: 2 weeks.',
    type: 'recommendation',
    priority: 'medium',
    category: 'security',
    aiGenerated: true,
    confidence: 84,
    source: 'AI Security Advisor',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    dismissed: false,
    actions: [
      {
        id: 'act-7',
        label: 'Start Implementation',
        type: 'primary',
        action: 'start_impl',
      },
      {
        id: 'act-8',
        label: 'View Details',
        type: 'secondary',
        action: 'view_details',
      },
    ],
    metadata: {
      severity: 'Medium',
      timeline: '2 weeks',
    },
    channels: [
      { type: 'web', enabled: true, delivered: true },
    ],
  },
  {
    id: 'NOTIF-005',
    title: 'System Update: AI Model Retrained',
    message: 'Risk prediction model has been retrained with latest data. Improved accuracy by 12%. New predictions available.',
    type: 'system',
    priority: 'low',
    category: 'operational',
    aiGenerated: false,
    source: 'System Administrator',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    dismissed: false,
    channels: [
      { type: 'web', enabled: true, delivered: true },
    ],
  },
];

// Notification Card Component
const NotificationCard: React.FC<{
  notification: SmartNotification;
  onAction: (action: string, notification: SmartNotification) => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}> = ({ notification, onAction, onMarkRead, onDismiss }) => {
  const getTypeConfig = (type: string) => {
    const configs = {
      'prediction': { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
      'alert': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
      'recommendation': { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
      'insight': { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
      'system': { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
    };
    return configs[type as keyof typeof configs] || configs.system;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      'critical': { color: 'text-semantic-error', bg: 'bg-semantic-error/10', border: 'border-semantic-error' },
      'high': { color: 'text-semantic-warning', bg: 'bg-semantic-warning/10', border: 'border-semantic-warning' },
      'medium': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      'low': { color: 'text-semantic-success', bg: 'bg-semantic-success/10', border: 'border-semantic-success' },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const typeConfig = getTypeConfig(notification.type);
  const priorityConfig = getPriorityConfig(notification.priority);
  const TypeIcon = typeConfig.icon;

  const deliveredChannels = notification.channels.filter(c => c.delivered).length;
  const totalChannels = notification.channels.length;

  return (
    <DaisyCard className={cn(
      "transition-all duration-200 hover:shadow-notion-sm relative overflow-hidden",
      !notification.read && "bg-purple-50/30",
      notification.priority === 'critical' && "border-l-4 border-l-semantic-error"
    )} >
  {/* AI Accent for AI-generated notifications */}
</DaisyCard>
      {notification.aiGenerated && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
      )}

      <DaisyCardBody className="pb-enterprise-3" >
  <div className="flex items-start justify-between">
</DaisyCardBody>
          <div className="flex items-start space-x-enterprise-3 flex-1">
            <div className={cn("p-enterprise-2 rounded-lg", typeConfig.bg)}>
              <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
                <DaisyCardTitle className={cn(
                  "text-body-sm line-clamp-1",
                  !notification.read && "font-bold"
                )} >
  {notification.title}
</DaisyCardTitle>
                </DaisyCardTitle>
                <DaisyBadge variant="outline" className={cn("text-caption", priorityConfig.color)} >
  {notification.priority.toUpperCase()}
</DaisyBadge>
                </DaisyBadge>
                {notification.aiGenerated && notification.confidence && (
                  <div className="flex items-center space-x-enterprise-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-caption text-purple-600">{notification.confidence}%</span>
                  </div>
                )}
              </div>
              <DaisyCardDescription className="text-caption line-clamp-2" >
  {notification.message}
</DaisyCardDescription>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-enterprise-1 flex-shrink-0">
            {!notification.read && (
              <DaisyButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMarkRead(notification.id)} />
                <Eye className="h-3 w-3" />
              </DaisyButton>
            )}
            <DaisyButton
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onDismiss(notification.id)} />
              <X className="h-3 w-3" />
            </DaisyButton>
          </div>
        </div>
      

      <DaisyCardBody className="space-y-enterprise-3" >
  {/* Metadata */}
</DaisyCardBody>
        <div className="flex items-center justify-between text-caption text-text-secondary">
          <div className="flex items-center space-x-enterprise-4">
            <div className="flex items-center space-x-enterprise-1">
              <Clock className="h-3 w-3" />
              <span>{notification.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-enterprise-1">
              <span>Source:</span>
              <span className="font-medium">{notification.source}</span>
            </div>
          </div>
          <div className="flex items-center space-x-enterprise-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              deliveredChannels === totalChannels ? "bg-green-500" : "bg-yellow-500"
            )}></div>
            <span>{deliveredChannels}/{totalChannels} delivered</span>
          </div>
        </div>

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex items-center space-x-enterprise-2 pt-enterprise-2 border-t border-border">
            {notification.actions.map((action) => (
              <DaisyButton
                key={action.id}
                size="sm"
                variant={action.type === 'primary' ? 'primary' : 'outline'}
                className={cn(
                  "h-6 px-enterprise-2",
                  action.type === 'primary' && notification.aiGenerated && "bg-purple-600 hover:bg-purple-700"
                )}
                onClick={() => onAction(action.action, notification)} />
                {action.label}
                {action.url && <ExternalLink className="h-3 w-3 ml-enterprise-1" />}
              </DaisyButton>
            ))}
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Notification Settings Component
const NotificationSettings: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [channels, setChannels] = useState({
    web: { enabled: true, sound: true },
    email: { enabled: true, immediate: true, digest: false },
    sms: { enabled: false, critical: true },
    slack: { enabled: false, channel: '#alerts' },
    teams: { enabled: false, channel: 'Risk Management' },
  });

  const [categories, setCategories] = useState({
    security: { enabled: true, priority: 'medium' },
    compliance: { enabled: true, priority: 'medium' },
    control: { enabled: true, priority: 'medium' },
    risk: { enabled: true, priority: 'high' },
    operational: { enabled: false, priority: 'low' },
  });

  return (
    <DaisyDialog open={isOpen} onOpenChange={onClose} >
        <DaisyDialogContent className="max-w-2xl" >
  <DaisyDialogHeader>
</DaisyDialog>
          <DaisyDialogTitle>Smart Notification Settings</DaisyDialogTitle>
        </DaisyDialogHeader>

        <DaisyTabs defaultValue="channels" className="mt-enterprise-4" >
            <DaisyTabsList >
              <DaisyTabsTrigger value="channels">Channels</DaisyTabs>
            <DaisyTabsTrigger value="categories">Categories</DaisyTabsTrigger>
            <DaisyTabsTrigger value="ai">AI Settings</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value="channels" className="space-y-enterprise-4" >
              <div className="space-y-enterprise-4">
              {Object.entries(channels).map(([channel, settings]) => {
                const ChannelIcon = {
                  web: Bell,
                  email: Mail,
                  sms: Smartphone,
                  slack: MessageSquare,
                  teams: Users,
                }[channel] || Bell;

                return (
                  <div key={channel} className="flex items-center justify-between p-enterprise-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-enterprise-3">
                      <ChannelIcon className="h-4 w-4 text-text-secondary" />
                      <div>
                        <div className="font-medium capitalize">{channel}</div>
                        <div className="text-caption text-text-secondary">
                          {channel === 'web' && 'Browser notifications'}
                          {channel === 'email' && 'Email notifications'}
                          {channel === 'sms' && 'SMS alerts for critical issues'}
                          {channel === 'slack' && 'Slack channel notifications'}
                          {channel === 'teams' && 'Microsoft Teams notifications'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-enterprise-2">
                      <DaisyButton
                        variant={settings.enabled ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setChannels(prev => ({
                          ...prev,
                          [channel]: { ...prev[channel as keyof typeof prev], enabled: !settings.enabled }
                        }))}
                      >
                        {settings.enabled ? 'Enabled' : 'Disabled'}
                      </DaisyTabsContent>
                    </div>
                  </div>
                );
              })}
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="categories" className="space-y-enterprise-4" >
              <div className="space-y-enterprise-4">
              {Object.entries(categories).map(([category, settings]) => {
                const CategoryIcon = {
                  security: Shield,
                  compliance: Target,
                  control: Settings,
                  risk: AlertTriangle,
                  operational: Activity,
                }[category] || Info;

                return (
                  <div key={category} className="flex items-center justify-between p-enterprise-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-enterprise-3">
                      <CategoryIcon className="h-4 w-4 text-text-secondary" />
                      <div>
                        <div className="font-medium capitalize">{category}</div>
                        <div className="text-caption text-text-secondary">
                          {category === 'security' && 'Security threats and vulnerabilities'}
                          {category === 'compliance' && 'Compliance status and gaps'}
                          {category === 'control' && 'Control testing and effectiveness'}
                          {category === 'risk' && 'Risk assessments and predictions'}
                          {category === 'operational' && 'System and operational updates'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-enterprise-2">
                      <DaisyBadge variant="outline" className="capitalize">{settings.priority}</DaisyTabsContent>
                      <DaisyButton
                        variant={settings.enabled ? "primary" : "outline"}
                        size="sm"
                        onClick={() =>
          setCategories(prev => ({
                          ...prev,
                          [category]: { ...prev[category as keyof typeof prev], enabled: !settings.enabled }
                        }))}
                      >
                        {settings.enabled ? 'Enabled' : 'Disabled'}
                      
        </DaisyButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="ai" className="space-y-enterprise-4" >
              <div className="space-y-enterprise-4">
              <div className="p-enterprise-4 border border-border rounded-lg">
                <div className="flex items-center space-x-enterprise-2 mb-enterprise-3">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium">AI Prediction Settings</h4>
                </div>
                <div className="space-y-enterprise-3">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm">Minimum confidence threshold</span>
                    <DaisyBadge variant="outline">75%</DaisyTabsContent>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm">Auto-dismiss low confidence predictions</span>
                    <DaisyButton variant="outline" size="sm">
          Enabled
        </DaisyButton>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm">Smart notification frequency</span>
                    <DaisyBadge variant="outline">Adaptive</DaisyBadge>
                  </div>
                </div>
              </div>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>

        <div className="flex justify-end pt-enterprise-4 border-t border-border">
          <div className="flex space-x-enterprise-2">
            <DaisyButton variant="outline" onClick={onClose}>
          Cancel
        </DaisyButton>
            <DaisyButton className="bg-purple-600 hover:bg-purple-700">
          Save Settings
        </DaisyButton>
          </div>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};

// Main Smart Notifications Component
export const SmartNotifications: React.FC<{
  isPanel?: boolean;
  maxHeight?: string;
}> = ({ isPanel = false, maxHeight = "600px" }) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>(sampleNotifications);
  const [filter, setFilter] = useState<NotificationFilter>({});
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleAction = (action: string, notification: SmartNotification) => {
    console.log(`Action: ${action}`, notification);
    // Handle notification actions here
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, dismissed: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (n.dismissed) return false;
    
    if (activeTab === 'unread' && n.read) return false;
    if (activeTab === 'ai' && !n.aiGenerated) return false;
    if (activeTab === 'critical' && n.priority !== 'critical') return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.dismissed).length;
  const aiCount = notifications.filter(n => n.aiGenerated && !n.dismissed).length;

  if (isPanel) {
    return (
      <DaisyCard className="w-80" >
  <DaisyCardBody className="pb-enterprise-3" >
</DaisyCard>
          <div className="flex items-center justify-between">
            <DaisyCardTitle className="text-body-base">Smart Notifications</DaisyCardTitle>
            <div className="flex items-center space-x-enterprise-1">
              {unreadCount > 0 && (
                <DaisyBadge variant="error" className="text-caption" >
  {unreadCount}
</DaisyBadge>
                </DaisyBadge>
              )}
              <DaisyButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowSettings(true)} />
                <Settings className="h-3 w-3" />
              </DaisyButton>
            </div>
          </div>
        
        <DaisyCardBody className="p-0" >
  <DaisyScrollArea style={{ maxHeight }} className="px-enterprise-4">
</DaisyCardBody>
            <div className="space-y-enterprise-3 pb-enterprise-4">
              {filteredNotifications.slice(0, 5).map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onAction={handleAction}
                  onMarkRead={handleMarkRead}
                  onDismiss={handleDismiss} />
              ))}
              {filteredNotifications.length === 0 && (
                <div className="text-center py-enterprise-6 text-text-secondary">
                  <Bell className="h-8 w-8 mx-auto mb-enterprise-2 opacity-50" />
                  <p className="text-body-sm">No notifications</p>
                </div>
              )}
            </div>
          </DaisyScrollArea>
        </DaisyCardBody>
      </DaisyCard>
    );
  };

  return (
    <div className="space-y-enterprise-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-lg font-bold">Smart Notifications</h2>
          <p className="text-body-sm text-text-secondary mt-enterprise-1">
            AI-powered alerts and insights for risk and compliance management
          </p>
        </div>
        <div className="flex items-center space-x-enterprise-2">
          <DaisyButton variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0} >
  <CheckCircle className="h-4 w-4 mr-enterprise-2" />
</DaisyButton>
            Mark All Read
          </DaisyButton>
          <DaisyButton variant="outline" onClick={() => setShowSettings(true)} />
            <Settings className="h-4 w-4 mr-enterprise-2" />
            Settings
          </DaisyButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-enterprise-4">
        <DaisyCard >
  <DaisyCardBody className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardBody>
            <div className="flex items-center space-x-enterprise-2">
              <Bell className="h-4 w-4 text-text-secondary" />
              <div>
                <div className="text-heading-sm font-bold">{unreadCount}</div>
                <div className="text-caption text-text-secondary">Unread</div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard >
  <DaisyCardBody className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardBody>
            <div className="flex items-center space-x-enterprise-2">
              <DaisyAlertTriangle className="h-4 w-4 text-semantic-error" >
  <div>
</DaisyAlertTriangle>
                <div className="text-heading-sm font-bold text-semantic-error">{criticalCount}</div>
                <div className="text-caption text-text-secondary">Critical</div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard >
  <DaisyCardBody className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardBody>
            <div className="flex items-center space-x-enterprise-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-heading-sm font-bold text-purple-600">{aiCount}</div>
                <div className="text-caption text-text-secondary">AI Generated</div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard >
  <DaisyCardBody className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardBody>
            <div className="flex items-center space-x-enterprise-2">
              <Activity className="h-4 w-4 text-text-secondary" />
              <div>
                <div className="text-heading-sm font-bold">{notifications.filter(n => !n.dismissed).length}</div>
                <div className="text-caption text-text-secondary">Total Active</div>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Tabs */}
      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList >
            <DaisyTabsTrigger value="all">All</DaisyTabs>
          <DaisyTabsTrigger value="unread">Unread ({unreadCount})</DaisyTabsTrigger>
          <DaisyTabsTrigger value="ai">AI Generated</DaisyTabsTrigger>
          <DaisyTabsTrigger value="critical">Critical</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="all" className="space-y-enterprise-4" >
            <div className="space-y-enterprise-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAction={handleAction}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss} />
            ))}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="unread" className="space-y-enterprise-4" >
            <div className="space-y-enterprise-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAction={handleAction}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss} />
            ))}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="ai" className="space-y-enterprise-4" >
            <div className="space-y-enterprise-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAction={handleAction}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss} />
            ))}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="critical" className="space-y-enterprise-4" >
            <div className="space-y-enterprise-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onAction={handleAction}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss} />
            ))}
          </div>
        </DaisyTabsContent>
      </DaisyTabs>

      {/* Settings Dialog */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default SmartNotifications;
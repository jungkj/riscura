'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisySlider } from '@/components/ui/DaisySlider';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { 
  Settings, 
  Shield, 
  Bell, 
  Clock, 
  Key, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Info,
  Lock,
  Eye,
  Mail,
  Smartphone
} from 'lucide-react';

interface SecuritySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdated?: (settings: any) => void;
}

interface SecuritySettings {
  // Alert Settings
  alertSettings: {
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
    enablePushNotifications: boolean;
    alertThreshold: 'low' | 'medium' | 'high' | 'critical';
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
  
  // Monitoring Settings
  monitoring: {
    enableRealTimeMonitoring: boolean;
    enableAnomalyDetection: boolean;
    enableBehaviorAnalysis: boolean;
    monitoringInterval: number; // minutes
    retentionPeriod: number; // days
    enabledCategories: string[];
  };
  
  // Access Control
  accessControl: {
    enforceStrongPasswords: boolean;
    requireMFA: boolean;
    sessionTimeout: number; // minutes
    maxFailedAttempts: number;
    lockoutDuration: number; // minutes
    allowedIPRanges: string[];
  };
  
  // Compliance Settings
  compliance: {
    enableComplianceMonitoring: boolean;
    frameworks: string[];
    autoReporting: boolean;
    reportingFrequency: 'daily' | 'weekly' | 'monthly';
    enableAuditLogging: boolean;
  };
  
  // Integration Settings
  integrations: {
    enableSIEMIntegration: boolean;
    siemEndpoint: string;
    enableAPILogging: boolean;
    webhookUrl: string;
    enableThirdPartyScanning: boolean;
  };
}

const defaultSettings: SecuritySettings = {
  alertSettings: {
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    enablePushNotifications: true,
    alertThreshold: 'medium',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  },
  monitoring: {
    enableRealTimeMonitoring: true,
    enableAnomalyDetection: true,
    enableBehaviorAnalysis: false,
    monitoringInterval: 5,
    retentionPeriod: 90,
    enabledCategories: ['login', 'data-access', 'system-changes'],
  },
  accessControl: {
    enforceStrongPasswords: true,
    requireMFA: true,
    sessionTimeout: 30,
    maxFailedAttempts: 5,
    lockoutDuration: 15,
    allowedIPRanges: [],
  },
  compliance: {
    enableComplianceMonitoring: true,
    frameworks: ['SOC 2', 'ISO 27001'],
    autoReporting: true,
    reportingFrequency: 'weekly',
    enableAuditLogging: true,
  },
  integrations: {
    enableSIEMIntegration: false,
    siemEndpoint: '',
    enableAPILogging: true,
    webhookUrl: '',
    enableThirdPartyScanning: false,
  },
};

const alertThresholds = [
  { value: 'low', label: 'Low', description: 'Alert on all security events' },
  { value: 'medium', label: 'Medium', description: 'Alert on medium and high severity events' },
  { value: 'high', label: 'High', description: 'Alert only on high and critical events' },
  { value: 'critical', label: 'Critical', description: 'Alert only on critical events' },
];

const complianceFrameworks = [
  'SOC 2',
  'ISO 27001',
  'GDPR',
  'HIPAA',
  'PCI DSS',
  'NIST',
  'CCPA',
  'FedRAMP',
];

const monitoringCategories = [
  { id: 'login', label: 'Login Events', description: 'Monitor user authentication events' },
  { id: 'data-access', label: 'Data Access', description: 'Monitor access to sensitive data' },
  { id: 'system-changes', label: 'System Changes', description: 'Monitor configuration changes' },
  { id: 'file-operations', label: 'File Operations', description: 'Monitor file uploads/downloads' },
  { id: 'admin-actions', label: 'Admin Actions', description: 'Monitor administrative activities' },
  { id: 'api-calls', label: 'API Calls', description: 'Monitor API usage and calls' },
];

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  open,
  onOpenChange,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleFrameworkToggle = (framework: string) => {
    const currentFrameworks = settings.compliance.frameworks;
    const updatedFrameworks = currentFrameworks.includes(framework)
      ? currentFrameworks.filter(f => f !== framework)
      : [...currentFrameworks, framework];
    
    updateSettings('compliance.frameworks', updatedFrameworks);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = settings.monitoring.enabledCategories;
    const updatedCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId];
    
    updateSettings('monitoring.enabledCategories', updatedCategories);
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSettingsUpdated?.(settings);
      toast.success('Security settings updated successfully!');
      setHasChanges(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update security settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.success('Settings reset to defaults');
  };

  return (
    <DaisyDialog open={open} onOpenChange={onOpenChange}>
      <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Security Settings</span>
          </DaisyDialogTitle>
          <DaisyDialogDescription>
            Configure security monitoring, alerts, and compliance settings for your organization.
          </DaisyDialogDescription>
        </DaisyDialogHeader>

        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DaisyTabsList className="grid w-full grid-cols-5">
            <DaisyTabsTrigger value="alerts">Alerts</DaisyTabsTrigger>
            <DaisyTabsTrigger value="monitoring">Monitoring</DaisyTabsTrigger>
            <DaisyTabsTrigger value="access">Access Control</DaisyTabsTrigger>
            <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
            <DaisyTabsTrigger value="integrations">Integrations</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value="alerts" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Alert Configuration</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Configure how and when you receive security alerts
                </p>
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Alerts</span>
                      </DaisyLabel>
                      <p className="text-sm text-gray-500">Receive alerts via email</p>
                    </div>
                    <DaisySwitch
                      checked={settings.alertSettings.enableEmailAlerts}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enableEmailAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS Alerts</span>
                      </DaisyLabel>
                      <p className="text-sm text-gray-500">Receive alerts via SMS</p>
                    </div>
                    <DaisySwitch
                      checked={settings.alertSettings.enableSMSAlerts}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enableSMSAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span>Push Notifications</span>
                      </DaisyLabel>
                      <p className="text-sm text-gray-500">Browser notifications</p>
                    </div>
                    <DaisySwitch
                      checked={settings.alertSettings.enablePushNotifications}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enablePushNotifications', checked)}
                    />
                  </div>
                </div>

                <DaisySeparator />

                <div className="space-y-4">
                  <DaisyLabel>Alert Threshold</DaisyLabel>
                  <DaisySelect
                    value={settings.alertSettings.alertThreshold}
                    onValueChange={(value) => updateSettings('alertSettings.alertThreshold', value)}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue />
                    </SelectTrigger>
                    <DaisySelectContent>
                      {alertThresholds.map((threshold) => (
                        <DaisySelectItem key={threshold.value} value={threshold.value}>
                          <div>
                            <div className="font-medium">{threshold.label}</div>
                            <div className="text-sm text-gray-500">{threshold.description}</div>
                          </div>
                        </DaisySelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <DaisyLabel>Quiet Hours</DaisyLabel>
                    <DaisySwitch
                      checked={settings.alertSettings.quietHours.enabled}
                      onCheckedChange={(checked) => updateSettings('alertSettings.quietHours.enabled', checked)}
                    />
                  </div>
                  
                  {settings.alertSettings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <DaisyLabel>Start Time</DaisyLabel>
                        <DaisyInput
                          type="time"
                          value={settings.alertSettings.quietHours.startTime}
                          onChange={(e) => updateSettings('alertSettings.quietHours.startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <DaisyLabel>End Time</DaisyLabel>
                        <DaisyInput
                          type="time"
                          value={settings.alertSettings.quietHours.endTime}
                          onChange={(e) => updateSettings('alertSettings.quietHours.endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="monitoring" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Monitoring Configuration</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Configure security monitoring and detection settings
                </p>
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Real-time Monitoring</DaisyLabel>
                      <p className="text-sm text-gray-500">Monitor security events in real-time</p>
                    </div>
                    <DaisySwitch
                      checked={settings.monitoring.enableRealTimeMonitoring}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableRealTimeMonitoring', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Anomaly Detection</DaisyLabel>
                      <p className="text-sm text-gray-500">Detect unusual patterns</p>
                    </div>
                    <DaisySwitch
                      checked={settings.monitoring.enableAnomalyDetection}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableAnomalyDetection', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Behavior Analysis</DaisyLabel>
                      <p className="text-sm text-gray-500">Analyze user behavior patterns</p>
                    </div>
                    <DaisySwitch
                      checked={settings.monitoring.enableBehaviorAnalysis}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableBehaviorAnalysis', checked)}
                    />
                  </div>
                </div>

                <DaisySeparator />

                <div className="space-y-4">
                  <DaisyLabel>Monitoring Interval: {settings.monitoring.monitoringInterval} minutes</DaisyLabel>
                  <DaisySlider
                    value={[settings.monitoring.monitoringInterval]}
                    onValueChange={([value]) => updateSettings('monitoring.monitoringInterval', value)}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>1 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <DaisyLabel>Data Retention: {settings.monitoring.retentionPeriod} days</DaisyLabel>
                  <DaisySlider
                    value={[settings.monitoring.retentionPeriod]}
                    onValueChange={([value]) => updateSettings('monitoring.retentionPeriod', value)}
                    max={365}
                    min={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>30 days</span>
                    <span>365 days</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <DaisyLabel>Monitored Categories</DaisyLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {monitoringCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <DaisyCheckbox
                          id={category.id}
                          checked={settings.monitoring.enabledCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <div>
                          <DaisyLabel htmlFor={category.id} className="text-sm font-medium">
                            {category.label}
                          </DaisyLabel>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="access" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Access Control Settings</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Configure authentication and authorization policies
                </p>
                <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Strong Password Policy</DaisyLabel>
                      <p className="text-sm text-gray-500">Enforce complex passwords</p>
                    </div>
                    <DaisySwitch
                      checked={settings.accessControl.enforceStrongPasswords}
                      onCheckedChange={(checked) => updateSettings('accessControl.enforceStrongPasswords', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Multi-Factor Authentication</DaisyLabel>
                      <p className="text-sm text-gray-500">Require MFA for all users</p>
                    </div>
                    <DaisySwitch
                      checked={settings.accessControl.requireMFA}
                      onCheckedChange={(checked) => updateSettings('accessControl.requireMFA', checked)}
                    />
                  </div>
                </div>

                <DaisySeparator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <DaisyLabel>Session Timeout (minutes)</DaisyLabel>
                    <DaisyInput
                      type="number"
                      value={settings.accessControl.sessionTimeout}
                      onChange={(e) => updateSettings('accessControl.sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <DaisyLabel>Max Failed Attempts</DaisyLabel>
                    <DaisyInput
                      type="number"
                      value={settings.accessControl.maxFailedAttempts}
                      onChange={(e) => updateSettings('accessControl.maxFailedAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <DaisyLabel>Lockout Duration (minutes)</DaisyLabel>
                    <DaisyInput
                      type="number"
                      value={settings.accessControl.lockoutDuration}
                      onChange={(e) => updateSettings('accessControl.lockoutDuration', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <DaisyLabel>Allowed IP Ranges</DaisyLabel>
                  <DaisyTextarea
                    placeholder="Enter IP ranges (one per line)&#10;192.168.1.0/24&#10;10.0.0.0/8"
                    value={settings.accessControl.allowedIPRanges.join('\n')}
                    onChange={(e) => updateSettings('accessControl.allowedIPRanges', e.target.value.split('\n').filter(ip => ip.trim()))}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">Leave empty to allow all IP addresses</p>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="compliance" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Compliance Settings</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Configure compliance monitoring and reporting
                </p>
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <DaisyLabel>Enable Compliance Monitoring</DaisyLabel>
                    <p className="text-sm text-gray-500">Automatically monitor compliance status</p>
                  </div>
                  <DaisySwitch
                    checked={settings.compliance.enableComplianceMonitoring}
                    onCheckedChange={(checked) => updateSettings('compliance.enableComplianceMonitoring', checked)}
                  />
                </div>

                <div className="space-y-4">
                  <DaisyLabel>Compliance Frameworks</DaisyLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {complianceFrameworks.map((framework) => (
                      <div key={framework} className="flex items-center space-x-2">
                        <DaisyCheckbox
                          id={framework}
                          checked={settings.compliance.frameworks.includes(framework)}
                          onCheckedChange={() => handleFrameworkToggle(framework)}
                        />
                        <DaisyLabel htmlFor={framework} className="text-sm">
                          {framework}
                        </DaisyLabel>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Auto Reporting</DaisyLabel>
                      <p className="text-sm text-gray-500">Generate reports automatically</p>
                    </div>
                    <DaisySwitch
                      checked={settings.compliance.autoReporting}
                      onCheckedChange={(checked) => updateSettings('compliance.autoReporting', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Audit Logging</DaisyLabel>
                      <p className="text-sm text-gray-500">Enable detailed audit logs</p>
                    </div>
                    <DaisySwitch
                      checked={settings.compliance.enableAuditLogging}
                      onCheckedChange={(checked) => updateSettings('compliance.enableAuditLogging', checked)}
                    />
                  </div>
                </div>

                {settings.compliance.autoReporting && (
                  <div className="space-y-2">
                    <DaisyLabel>Reporting Frequency</DaisyLabel>
                    <DaisySelect
                      value={settings.compliance.reportingFrequency}
                      onValueChange={(value) => updateSettings('compliance.reportingFrequency', value)}
                    >
                      <DaisySelectTrigger>
                        <DaisySelectValue />
                      </SelectTrigger>
                      <DaisySelectContent>
                        <DaisySelectItem value="daily">Daily</DaisySelectItem>
                        <DaisySelectItem value="weekly">Weekly</DaisySelectItem>
                        <DaisySelectItem value="monthly">Monthly</DaisySelectItem>
                      </SelectContent>
                    </DaisySelect>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="integrations" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Integration Settings</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mb-4">
                  Configure external security tool integrations
                </p>
                <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>SIEM Integration</DaisyLabel>
                      <p className="text-sm text-gray-500">Send events to SIEM system</p>
                    </div>
                    <DaisySwitch
                      checked={settings.integrations.enableSIEMIntegration}
                      onCheckedChange={(checked) => updateSettings('integrations.enableSIEMIntegration', checked)}
                    />
                  </div>

                  {settings.integrations.enableSIEMIntegration && (
                    <div className="space-y-2">
                      <DaisyLabel>SIEM Endpoint URL</DaisyLabel>
                      <DaisyInput
                        placeholder="https://siem.company.com/api/events"
                        value={settings.integrations.siemEndpoint}
                        onChange={(e) => updateSettings('integrations.siemEndpoint', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <DaisySeparator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <DaisyLabel>API Logging</DaisyLabel>
                    <p className="text-sm text-gray-500">Log all API requests and responses</p>
                  </div>
                  <DaisySwitch
                    checked={settings.integrations.enableAPILogging}
                    onCheckedChange={(checked) => updateSettings('integrations.enableAPILogging', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <DaisyLabel>Webhook URL</DaisyLabel>
                  <DaisyInput
                    placeholder="https://your-system.com/webhook"
                    value={settings.integrations.webhookUrl}
                    onChange={(e) => updateSettings('integrations.webhookUrl', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Receive security events via webhook</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <DaisyLabel>Third-party Scanning</DaisyLabel>
                    <p className="text-sm text-gray-500">Enable external vulnerability scanning</p>
                  </div>
                  <DaisySwitch
                    checked={settings.integrations.enableThirdPartyScanning}
                    onCheckedChange={(checked) => updateSettings('integrations.enableThirdPartyScanning', checked)}
                  />
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>
        </DaisyTabs>

        {hasChanges && (
          <DaisyAlert>
            <Info className="h-4 w-4" />
            <DaisyAlertDescription>
              You have unsaved changes. Click "Save Settings" to apply your changes.
            
          </DaisyAlert>
        )}

        <div className="flex justify-between pt-4 border-t">
          <DaisyButton
            variant="outline"
            onClick={handleResetSettings}
            disabled={isSubmitting}
          >
            Reset to Defaults
          </DaisyButton>
          
          <div className="flex space-x-2">
            <DaisyButton
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </DaisyButton>
            <DaisyButton
              onClick={handleSaveSettings}
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </DaisyButton>
          </div>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
}; 
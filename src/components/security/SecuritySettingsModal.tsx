'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Security Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure security monitoring, alerts, and compliance settings for your organization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Alert Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive security alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Alerts</span>
                      </Label>
                      <p className="text-sm text-gray-500">Receive alerts via email</p>
                    </div>
                    <Switch
                      checked={settings.alertSettings.enableEmailAlerts}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enableEmailAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>SMS Alerts</span>
                      </Label>
                      <p className="text-sm text-gray-500">Receive alerts via SMS</p>
                    </div>
                    <Switch
                      checked={settings.alertSettings.enableSMSAlerts}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enableSMSAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span>Push Notifications</span>
                      </Label>
                      <p className="text-sm text-gray-500">Browser notifications</p>
                    </div>
                    <Switch
                      checked={settings.alertSettings.enablePushNotifications}
                      onCheckedChange={(checked) => updateSettings('alertSettings.enablePushNotifications', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Alert Threshold</Label>
                  <Select
                    value={settings.alertSettings.alertThreshold}
                    onValueChange={(value) => updateSettings('alertSettings.alertThreshold', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alertThresholds.map((threshold) => (
                        <SelectItem key={threshold.value} value={threshold.value}>
                          <div>
                            <div className="font-medium">{threshold.label}</div>
                            <div className="text-sm text-gray-500">{threshold.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Quiet Hours</Label>
                    <Switch
                      checked={settings.alertSettings.quietHours.enabled}
                      onCheckedChange={(checked) => updateSettings('alertSettings.quietHours.enabled', checked)}
                    />
                  </div>
                  
                  {settings.alertSettings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={settings.alertSettings.quietHours.startTime}
                          onChange={(e) => updateSettings('alertSettings.quietHours.startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={settings.alertSettings.quietHours.endTime}
                          onChange={(e) => updateSettings('alertSettings.quietHours.endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Monitoring Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure security monitoring and detection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Real-time Monitoring</Label>
                      <p className="text-sm text-gray-500">Monitor security events in real-time</p>
                    </div>
                    <Switch
                      checked={settings.monitoring.enableRealTimeMonitoring}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableRealTimeMonitoring', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Anomaly Detection</Label>
                      <p className="text-sm text-gray-500">Detect unusual patterns</p>
                    </div>
                    <Switch
                      checked={settings.monitoring.enableAnomalyDetection}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableAnomalyDetection', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Behavior Analysis</Label>
                      <p className="text-sm text-gray-500">Analyze user behavior patterns</p>
                    </div>
                    <Switch
                      checked={settings.monitoring.enableBehaviorAnalysis}
                      onCheckedChange={(checked) => updateSettings('monitoring.enableBehaviorAnalysis', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Monitoring Interval: {settings.monitoring.monitoringInterval} minutes</Label>
                  <Slider
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
                  <Label>Data Retention: {settings.monitoring.retentionPeriod} days</Label>
                  <Slider
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
                  <Label>Monitored Categories</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {monitoringCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={settings.monitoring.enabledCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <div>
                          <Label htmlFor={category.id} className="text-sm font-medium">
                            {category.label}
                          </Label>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Access Control Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure authentication and authorization policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Strong Password Policy</Label>
                      <p className="text-sm text-gray-500">Enforce complex passwords</p>
                    </div>
                    <Switch
                      checked={settings.accessControl.enforceStrongPasswords}
                      onCheckedChange={(checked) => updateSettings('accessControl.enforceStrongPasswords', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Multi-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Require MFA for all users</p>
                    </div>
                    <Switch
                      checked={settings.accessControl.requireMFA}
                      onCheckedChange={(checked) => updateSettings('accessControl.requireMFA', checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={settings.accessControl.sessionTimeout}
                      onChange={(e) => updateSettings('accessControl.sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Failed Attempts</Label>
                    <Input
                      type="number"
                      value={settings.accessControl.maxFailedAttempts}
                      onChange={(e) => updateSettings('accessControl.maxFailedAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Lockout Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={settings.accessControl.lockoutDuration}
                      onChange={(e) => updateSettings('accessControl.lockoutDuration', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allowed IP Ranges</Label>
                  <Textarea
                    placeholder="Enter IP ranges (one per line)&#10;192.168.1.0/24&#10;10.0.0.0/8"
                    value={settings.accessControl.allowedIPRanges.join('\n')}
                    onChange={(e) => updateSettings('accessControl.allowedIPRanges', e.target.value.split('\n').filter(ip => ip.trim()))}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">Leave empty to allow all IP addresses</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Compliance Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure compliance monitoring and reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Compliance Monitoring</Label>
                    <p className="text-sm text-gray-500">Automatically monitor compliance status</p>
                  </div>
                  <Switch
                    checked={settings.compliance.enableComplianceMonitoring}
                    onCheckedChange={(checked) => updateSettings('compliance.enableComplianceMonitoring', checked)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Compliance Frameworks</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {complianceFrameworks.map((framework) => (
                      <div key={framework} className="flex items-center space-x-2">
                        <Checkbox
                          id={framework}
                          checked={settings.compliance.frameworks.includes(framework)}
                          onCheckedChange={() => handleFrameworkToggle(framework)}
                        />
                        <Label htmlFor={framework} className="text-sm">
                          {framework}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Reporting</Label>
                      <p className="text-sm text-gray-500">Generate reports automatically</p>
                    </div>
                    <Switch
                      checked={settings.compliance.autoReporting}
                      onCheckedChange={(checked) => updateSettings('compliance.autoReporting', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audit Logging</Label>
                      <p className="text-sm text-gray-500">Enable detailed audit logs</p>
                    </div>
                    <Switch
                      checked={settings.compliance.enableAuditLogging}
                      onCheckedChange={(checked) => updateSettings('compliance.enableAuditLogging', checked)}
                    />
                  </div>
                </div>

                {settings.compliance.autoReporting && (
                  <div className="space-y-2">
                    <Label>Reporting Frequency</Label>
                    <Select
                      value={settings.compliance.reportingFrequency}
                      onValueChange={(value) => updateSettings('compliance.reportingFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Integration Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure external security tool integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SIEM Integration</Label>
                      <p className="text-sm text-gray-500">Send events to SIEM system</p>
                    </div>
                    <Switch
                      checked={settings.integrations.enableSIEMIntegration}
                      onCheckedChange={(checked) => updateSettings('integrations.enableSIEMIntegration', checked)}
                    />
                  </div>

                  {settings.integrations.enableSIEMIntegration && (
                    <div className="space-y-2">
                      <Label>SIEM Endpoint URL</Label>
                      <Input
                        placeholder="https://siem.company.com/api/events"
                        value={settings.integrations.siemEndpoint}
                        onChange={(e) => updateSettings('integrations.siemEndpoint', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Logging</Label>
                    <p className="text-sm text-gray-500">Log all API requests and responses</p>
                  </div>
                  <Switch
                    checked={settings.integrations.enableAPILogging}
                    onCheckedChange={(checked) => updateSettings('integrations.enableAPILogging', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://your-system.com/webhook"
                    value={settings.integrations.webhookUrl}
                    onChange={(e) => updateSettings('integrations.webhookUrl', e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Receive security events via webhook</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Third-party Scanning</Label>
                    <p className="text-sm text-gray-500">Enable external vulnerability scanning</p>
                  </div>
                  <Switch
                    checked={settings.integrations.enableThirdPartyScanning}
                    onCheckedChange={(checked) => updateSettings('integrations.enableThirdPartyScanning', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Click "Save Settings" to apply your changes.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={isSubmitting}
          >
            Reset to Defaults
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
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
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
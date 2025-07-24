'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Settings, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  parameters: string[];
  preview: string;
}

interface ReportConfig {
  name: string;
  type: string;
  template: string;
  format: string[];
  filters: {
    dateRange?: DateRange;
    categories?: string[];
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    departments?: string[];
  };
  parameters: Record<string, any>;
  recipients: string[];
  isScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    enabled: boolean;
  };
}

interface ReportBuilderProps {
  onGenerate: (config: ReportConfig) => Promise<void>;
  onSchedule?: (config: ReportConfig) => Promise<void>;
  isGenerating?: boolean;
}

export default function ReportBuilder({ onGenerate, onSchedule, isGenerating = false }: ReportBuilderProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    type: '',
    template: '',
    format: ['pdf'],
    filters: {},
    parameters: {},
    recipients: [],
    isScheduled: false,
  });
  const [emailInput, setEmailInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/reports/generate');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load report templates',
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setConfig(prev => ({
        ...prev,
        name: template.name,
        type: template.type,
        template: template.id,
      }));
    }
  };

  const handleFormatChange = (format: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      format: checked 
        ? [...prev.format, format]
        : prev.format.filter(f => f !== format),
    }));
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: value,
      },
    }));
  };

  const handleParameterChange = (param: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value,
      },
    }));
  };

  const addRecipient = () => {
    if (emailInput && isValidEmail(emailInput)) {
      if (!config.recipients.includes(emailInput)) {
        setConfig(prev => ({
          ...prev,
          recipients: [...prev.recipients, emailInput],
        }));
        setEmailInput('');
      } else {
        toast({
          title: 'Warning',
          description: 'Email already added',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
    }
  };

  const removeRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];

    if (!config.name.trim()) errors.push('Report name is required');
    if (!config.template) errors.push('Template selection is required');
    if (config.format.length === 0) errors.push('At least one format must be selected');
    
    if (config.isScheduled) {
      if (!config.schedule?.frequency) errors.push('Schedule frequency is required');
      if (!config.schedule?.time) errors.push('Schedule time is required');
    }

    return errors;
  };

  const handleGenerate = async () => {
    const errors = validateConfig();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before generating the report',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onGenerate(config);
      toast({
        title: 'Success',
        description: 'Report generation started successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const handleSchedule = async () => {
    if (!onSchedule) return;

    const errors = validateConfig();
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before scheduling the report',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSchedule({ ...config, isScheduled: true });
      toast({
        title: 'Success',
        description: 'Report scheduled successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule report',
        variant: 'destructive',
      });
    }
  };

  const generatePreview = async () => {
    try {
      // Mock preview data - in real implementation, this would call a preview API
      setPreviewData({
        summary: {
          totalRisks: 45,
          criticalRisks: 8,
          averageRiskScore: 6.7,
        },
        sampleData: [
          { name: 'Data Breach Risk', category: 'Security', score: 8.5 },
          { name: 'Compliance Violation', category: 'Regulatory', score: 7.2 },
          { name: 'System Outage', category: 'Operational', score: 6.8 },
        ],
      });

      toast({
        title: 'Preview Generated',
        description: 'Report preview is ready',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <DaisyAlert variant="error">
          <DaisyAlertCircle className="h-4 w-4" />
          <DaisyAlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          
        </DaisyAlert>
      )}

      <DaisyTabs defaultValue="configuration" className="w-full">
        <DaisyTabsList className="grid w-full grid-cols-4">
          <DaisyTabsTrigger value="configuration">Configuration</DaisyTabsTrigger>
          <DaisyTabsTrigger value="filters">Filters</DaisyTabsTrigger>
          <DaisyTabsTrigger value="delivery">Delivery</DaisyTabsTrigger>
          <DaisyTabsTrigger value="preview">Preview</DaisyTabsTrigger>
        </DaisyTabsList>

        {/* Configuration Tab */}
        <DaisyTabsContent value="configuration" className="space-y-6">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <DaisyLabel htmlFor="template">Report Template</DaisyLabel>
                <DaisySelect onValueChange={handleTemplateSelect}>
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {templates.map(template => (
                      <DaisySelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-sm text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
              </div>

              {/* Report Name */}
              <div className="space-y-2">
                <DaisyLabel htmlFor="reportName">Report Name</DaisyLabel>
                <DaisyInput
                  id="reportName"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>

              {/* Output Formats */}
              <div className="space-y-2">
                <DaisyLabel>Output Formats</DaisyLabel>
                <div className="flex gap-4">
                  {['pdf', 'excel', 'csv'].map(format => (
                    <div key={format} className="flex items-center space-x-2">
                      <DaisyCheckbox
                        id={format}
                        checked={config.format.includes(format)}
                        onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                      />
                      <DaisyLabel htmlFor={format} className="capitalize">{format}</DaisyLabel>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Parameters */}
              {selectedTemplate && selectedTemplate.parameters.length > 0 && (
                <div className="space-y-2">
                  <DaisyLabel>Template Parameters</DaisyLabel>
                  <div className="space-y-3">
                    {selectedTemplate.parameters.map(param => (
                      <div key={param} className="flex items-center space-x-2">
                        <DaisyCheckbox
                          id={param}
                          checked={config.parameters[param] || false}
                          onCheckedChange={(checked) => handleParameterChange(param, checked)}
                        />
                        <DaisyLabel htmlFor={param} className="capitalize">
                          {param.replace(/([A-Z])/g, ' $1').trim()}
                        </DaisyLabel>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Filters Tab */}
        <DaisyTabsContent value="filters" className="space-y-6">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Report Filters
              </DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <DaisyLabel>Date Range</DaisyLabel>
                {/* <DatePickerWithRange
                  date={config.filters.dateRange}
                  onDateChange={(range) => handleFilterChange('dateRange', range)}
                /> */}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <DaisyLabel>Categories</DaisyLabel>
                <DaisySelect onValueChange={(value) => handleFilterChange('categories', [value])}>
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="security">Security</SelectItem>
                    <DaisySelectItem value="operational">Operational</SelectItem>
                    <DaisySelectItem value="financial">Financial</SelectItem>
                    <DaisySelectItem value="regulatory">Regulatory</SelectItem>
                    <DaisySelectItem value="strategic">Strategic</SelectItem>
                  </SelectContent>
                </DaisySelect>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <DaisyLabel>Status</DaisyLabel>
                <DaisySelect onValueChange={(value) => handleFilterChange('status', [value])}>
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="active">Active</SelectItem>
                    <DaisySelectItem value="mitigated">Mitigated</SelectItem>
                    <DaisySelectItem value="closed">Closed</SelectItem>
                    <DaisySelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </DaisySelect>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <DaisyLabel>Priority</DaisyLabel>
                <DaisySelect onValueChange={(value) => handleFilterChange('priority', [value])}>
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="critical">Critical</SelectItem>
                    <DaisySelectItem value="high">High</SelectItem>
                    <DaisySelectItem value="medium">Medium</SelectItem>
                    <DaisySelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </DaisySelect>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Delivery Tab */}
        <DaisyTabsContent value="delivery" className="space-y-6">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Delivery Options
              </DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              {/* Email Recipients */}
              <div className="space-y-2">
                <DaisyLabel>Email Recipients</DaisyLabel>
                <div className="flex gap-2">
                  <DaisyInput
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address"
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <DaisyButton onClick={addRecipient} variant="outline">
                    Add
                  </DaisyButton>
                </div>
                {config.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.recipients.map(email => (
                      <DaisyBadge key={email} variant="secondary" className="cursor-pointer" onClick={() => removeRecipient(email)}>
                        {email} ×
                      </DaisyBadge>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DaisyCheckbox
                    id="scheduled"
                    checked={config.isScheduled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isScheduled: checked as boolean }))}
                  />
                  <DaisyLabel htmlFor="scheduled" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule this report
                  </DaisyLabel>
                </div>

                {config.isScheduled && (
                  <div className="space-y-3 pl-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <DaisyLabel>Frequency</DaisyLabel>
                        <DaisySelect 
                          onValueChange={(value) => 
                            setConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, frequency: value as any, time: prev.schedule?.time || '', timezone: prev.schedule?.timezone || 'UTC', enabled: prev.schedule?.enabled || false }
                            }))
                          }
                        >
                          <DaisySelectTrigger>
                            <DaisySelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <DaisySelectContent>
                            <DaisySelectItem value="daily">Daily</SelectItem>
                            <DaisySelectItem value="weekly">Weekly</SelectItem>
                            <DaisySelectItem value="monthly">Monthly</SelectItem>
                            <DaisySelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </DaisySelect>
                      </div>

                      <div>
                        <DaisyLabel>Time</DaisyLabel>
                        <DaisyInput
                          type="time"
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value, frequency: prev.schedule?.frequency || 'daily', timezone: prev.schedule?.timezone || 'UTC', enabled: prev.schedule?.enabled || false }
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <DaisyLabel>Timezone</DaisyLabel>
                      <DaisySelect 
                        onValueChange={(value) => 
                          setConfig(prev => ({
                            ...prev,
                            schedule: { 
                              ...(prev.schedule || { frequency: 'daily', time: '', timezone: 'UTC', enabled: false }), 
                              timezone: value 
                            }
                          }))
                        }
                      >
                        <DaisySelectTrigger>
                          <DaisySelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <DaisySelectContent>
                          <DaisySelectItem value="UTC">UTC</SelectItem>
                          <DaisySelectItem value="America/New_York">Eastern Time</SelectItem>
                          <DaisySelectItem value="America/Chicago">Central Time</SelectItem>
                          <DaisySelectItem value="America/Denver">Mountain Time</SelectItem>
                          <DaisySelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </DaisySelect>
                    </div>
                  </div>
                )}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        {/* Preview Tab */}
        <DaisyTabsContent value="preview" className="space-y-6">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Report Preview
              </DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              <DaisyButton onClick={generatePreview} variant="outline" className="w-full">
                Generate Preview
              </DaisyButton>

              {previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{previewData.summary.totalRisks}</div>
                      <div className="text-sm text-muted-foreground">Total Risks</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{previewData.summary.criticalRisks}</div>
                      <div className="text-sm text-muted-foreground">Critical Risks</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{previewData.summary.averageRiskScore}</div>
                      <div className="text-sm text-muted-foreground">Avg Risk Score</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Sample Data</h4>
                    <div className="space-y-2">
                      {previewData.sampleData.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.category}</div>
                          </div>
                          <DaisyBadge variant={item.score > 8 ? 'destructive' : item.score > 6 ? 'default' : 'secondary'}>
                            {item.score}
                          </DaisyBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <DaisyButton 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </DaisyButton>

        {onSchedule && (
          <DaisyButton 
            onClick={handleSchedule} 
            variant="outline"
            disabled={isGenerating}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </DaisyButton>
        )}
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Report Template</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-sm text-muted-foreground">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report Name */}
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>

              {/* Output Formats */}
              <div className="space-y-2">
                <Label>Output Formats</Label>
                <div className="flex gap-4">
                  {['pdf', 'excel', 'csv'].map(format => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format}
                        checked={config.format.includes(format)}
                        onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                      />
                      <Label htmlFor={format} className="capitalize">{format}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Parameters */}
              {selectedTemplate && selectedTemplate.parameters.length > 0 && (
                <div className="space-y-2">
                  <Label>Template Parameters</Label>
                  <div className="space-y-3">
                    {selectedTemplate.parameters.map(param => (
                      <div key={param} className="flex items-center space-x-2">
                        <Checkbox
                          id={param}
                          checked={config.parameters[param] || false}
                          onCheckedChange={(checked) => handleParameterChange(param, checked)}
                        />
                        <Label htmlFor={param} className="capitalize">
                          {param.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={config.filters.dateRange}
                  onDateChange={(range) => handleFilterChange('dateRange', range)}
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <Select onValueChange={(value) => handleFilterChange('categories', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value) => handleFilterChange('status', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select onValueChange={(value) => handleFilterChange('priority', [value])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Delivery Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Recipients */}
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address"
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <Button onClick={addRecipient} variant="outline">
                    Add
                  </Button>
                </div>
                {config.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.recipients.map(email => (
                      <Badge key={email} variant="secondary" className="cursor-pointer" onClick={() => removeRecipient(email)}>
                        {email} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scheduled"
                    checked={config.isScheduled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isScheduled: checked as boolean }))}
                  />
                  <Label htmlFor="scheduled" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule this report
                  </Label>
                </div>

                {config.isScheduled && (
                  <div className="space-y-3 pl-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Frequency</Label>
                        <Select 
                          onValueChange={(value) => 
                            setConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, frequency: value as any }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          onChange={(e) => 
                            setConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Timezone</Label>
                      <Select 
                        onValueChange={(value) => 
                          setConfig(prev => ({
                            ...prev,
                            schedule: { ...prev.schedule, timezone: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generatePreview} variant="outline" className="w-full">
                Generate Preview
              </Button>

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
                          <Badge variant={item.score > 8 ? 'destructive' : item.score > 6 ? 'default' : 'secondary'}>
                            {item.score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
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
        </Button>

        {onSchedule && (
          <Button 
            onClick={handleSchedule} 
            variant="outline"
            disabled={isGenerating}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
        )}
      </div>
    </div>
  );
} 
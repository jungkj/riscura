'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { Textarea } from '@/components/ui/textarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { Switch } from '@/components/ui/switch';
import { Shield, Calendar, Target, Users, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface CreateControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onControlCreated: (control: any) => void;
}

interface ControlFormData {
  title: string;
  description: string;
  category: string;
  owner: string;
  testingFrequency: string;
  nextTestingDate: Date | null;
  framework: string[];
  priority: string;
  controlType: string;
  implementation: string;
  automationLevel: string;
  businessUnit: string;
  department: string;
  evidenceRequired: boolean;
  continuousMonitoring: boolean;
  customFields: Record<string, any>;
}

const initialFormData: ControlFormData = {
  title: '',
  description: '',
  category: '',
  owner: '',
  testingFrequency: 'quarterly',
  nextTestingDate: null,
  framework: [],
  priority: 'medium',
  controlType: 'preventive',
  implementation: 'manual',
  automationLevel: 'none',
  businessUnit: '',
  department: '',
  evidenceRequired: true,
  continuousMonitoring: false,
  customFields: {},
};

const controlCategories = [
  'Access Control',
  'Data Protection',
  'Network Security',
  'Endpoint Security',
  'Incident Management',
  'Business Continuity',
  'Physical Security',
  'Change Management',
  'Vendor Management',
  'Compliance',
  'Monitoring & Logging',
  'Identity Management',
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

const testingFrequencies = [
  { value: 'monthly', label: 'Monthly', description: 'Test every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Test every 3 months' },
  { value: 'semi-annual', label: 'Semi-Annual', description: 'Test every 6 months' },
  { value: 'annual', label: 'Annual', description: 'Test once per year' },
];

const priorityLevels = [
  { value: 'critical', label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
];

const controlTypes = [
  { value: 'preventive', label: 'Preventive', description: 'Prevents incidents from occurring' },
  { value: 'detective', label: 'Detective', description: 'Detects incidents when they occur' },
  { value: 'corrective', label: 'Corrective', description: 'Corrects incidents after they occur' },
  { value: 'compensating', label: 'Compensating', description: 'Provides alternative protection' },
];

const implementationTypes = [
  { value: 'manual', label: 'Manual', description: 'Performed manually by staff' },
  { value: 'automated', label: 'Automated', description: 'Fully automated system control' },
  { value: 'hybrid', label: 'Hybrid', description: 'Combination of manual and automated' },
];

const automationLevels = [
  { value: 'none', label: 'No Automation', description: 'Fully manual process' },
  { value: 'partial', label: 'Partial Automation', description: 'Some automated components' },
  { value: 'full', label: 'Full Automation', description: 'Completely automated' },
];

const businessUnits = [
  'Engineering',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Legal',
  'Operations',
  'Customer Success',
  'Product',
  'Security',
];

export const CreateControlModal: React.FC<CreateControlModalProps> = ({
  open,
  onOpenChange,
  onControlCreated,
}) => {
  const [formData, setFormData] = useState<ControlFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Control title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Control description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Control category is required';
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Control owner is required';
    }

    if (!formData.nextTestingDate) {
      newErrors.nextTestingDate = 'Next testing date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNextTestingDate = (frequency: string, fromDate: Date = new Date()): Date => {
    const date = new Date(fromDate);
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semi-annual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 3);
    }
    return date;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const newControl = {
        id: `CTL-${Date.now()}`,
        ...formData,
        status: 'draft',
        effectiveness: 'not-tested',
        effectivenessScore: 0,
        lastTested: null,
        evidenceCount: 0,
        risks: [],
        testingHistory: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        compliance: {
          soc2: formData.framework.includes('SOC 2'),
          iso27001: formData.framework.includes('ISO 27001'),
          gdpr: formData.framework.includes('GDPR'),
          nist: formData.framework.includes('NIST'),
        },
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onControlCreated(newControl);
      toast.success('Control created successfully!');
      
      // Reset form
      setFormData(initialFormData);
      setActiveTab('basic');
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating control:', error);
      toast.error('Failed to create control. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrameworkToggle = (framework: string) => {
    setFormData(prev => ({
      ...prev,
      framework: prev.framework.includes(framework)
        ? prev.framework.filter(f => f !== framework)
        : [...prev.framework, framework],
    }));
  };

  const handleFrequencyChange = (frequency: string) => {
    const nextDate = calculateNextTestingDate(frequency);
    setFormData(prev => ({
      ...prev,
      testingFrequency: frequency,
      nextTestingDate: nextDate,
    }));
  };

  const getPriorityConfig = (priority: string) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[2];
  };

  const currentPriorityConfig = getPriorityConfig(formData.priority);

  return (
    <DaisyDialog open={open} onOpenChange={onOpenChange}>
      <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Create New Control</span>
          </DaisyDialogTitle>
          <DaisyDialogDescription>
            Define a new control to manage and mitigate risks in your organization.
          </DaisyDialogDescription>
        </DaisyDialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="title">Control Title *</DaisyLabel>
                <DaisyInput
                  id="title"
                  placeholder="Enter control title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="category">Category *</DaisyLabel>
                <DaisySelect
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <DaisySelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <DaisySelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {controlCategories.map((category) => (
                      <DaisySelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="description">Description *</DaisyLabel>
              <Textarea
                id="description"
                placeholder="Describe the control in detail"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="owner">Control Owner *</DaisyLabel>
                <DaisyInput
                  id="owner"
                  placeholder="Enter control owner name"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  className={errors.owner ? 'border-red-500' : ''}
                />
                {errors.owner && <p className="text-sm text-red-600">{errors.owner}</p>}
              </div>

              <div className="space-y-2">
                <DaisyLabel>Priority Level</DaisyLabel>
                <DaisySelect
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {priorityLevels.map((priority) => (
                      <DaisySelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center space-x-2">
                          <DaisyBadge className={`${priority.color} ${priority.bg}`}>
                            {priority.label}
                          </DaisyBadge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel>Control Type</DaisyLabel>
                <DaisySelect
                  value={formData.controlType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, controlType: value }))}
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {controlTypes.map((type) => (
                      <DaisySelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
              </div>

              <div className="space-y-2">
                <DaisyLabel>Implementation</DaisyLabel>
                <DaisySelect
                  value={formData.implementation}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, implementation: value }))}
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {implementationTypes.map((type) => (
                      <DaisySelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Testing Configuration</span>
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Configure how and when this control will be tested
                </CardDescription>
              
              <DaisyCardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <DaisyLabel>Testing Frequency</DaisyLabel>
                    <DaisySelect
                      value={formData.testingFrequency}
                      onValueChange={handleFrequencyChange}
                    >
                      <DaisySelectTrigger>
                        <DaisySelectValue />
                      </SelectTrigger>
                      <DaisySelectContent>
                        {testingFrequencies.map((freq) => (
                          <DaisySelectItem key={freq.value} value={freq.value}>
                            <div>
                              <div className="font-medium">{freq.label}</div>
                              <div className="text-sm text-gray-500">{freq.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </DaisySelect>
                  </div>

                  <div className="space-y-2">
                    <DaisyLabel htmlFor="nextTestingDate">Next Testing Date *</DaisyLabel>
                    <DatePicker
                      value={formData.nextTestingDate}
                      onChange={(date) => setFormData(prev => ({ ...prev, nextTestingDate: date }))}
                      placeholder="Select testing date"
                      className={errors.nextTestingDate ? 'border-red-500' : ''}
                    />
                    {errors.nextTestingDate && <p className="text-sm text-red-600">{errors.nextTestingDate}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Evidence Required</DaisyLabel>
                      <p className="text-sm text-gray-500">
                        Require evidence documentation for testing
                      </p>
                    </div>
                    <Switch
                      checked={formData.evidenceRequired}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, evidenceRequired: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel>Continuous Monitoring</DaisyLabel>
                      <p className="text-sm text-gray-500">
                        Enable continuous monitoring for this control
                      </p>
                    </div>
                    <Switch
                      checked={formData.continuousMonitoring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, continuousMonitoring: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <DaisyLabel>Automation Level</DaisyLabel>
                  <DaisySelect
                    value={formData.automationLevel}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, automationLevel: value }))}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue />
                    </SelectTrigger>
                    <DaisySelectContent>
                      {automationLevels.map((level) => (
                        <DaisySelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-500">{level.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Compliance Frameworks</span>
                </DaisyCardTitle>
                <DaisyCardDescription>
                  Select applicable compliance frameworks for this control
                </CardDescription>
              
              <DaisyCardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {complianceFrameworks.map((framework) => (
                    <div key={framework} className="flex items-center space-x-2">
                      <DaisyCheckbox
                        id={framework}
                        checked={formData.framework.includes(framework)}
                        onCheckedChange={() => handleFrameworkToggle(framework)}
                      />
                      <DaisyLabel htmlFor={framework} className="text-sm">
                        {framework}
                      </DaisyLabel>
                    </div>
                  ))}
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="businessUnit">Business Unit</DaisyLabel>
                <DaisySelect
                  value={formData.businessUnit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessUnit: value }))}
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select business unit" />
                  </SelectTrigger>
                  <DaisySelectContent>
                    {businessUnits.map((unit) => (
                      <DaisySelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </DaisySelect>
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="department">Department</DaisyLabel>
                <DaisyInput
                  id="department"
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>

            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Control Summary</DaisyCardTitle>
                <DaisyCardDescription>
                  Review your control configuration
                </CardDescription>
              
              <DaisyCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Priority:</span>
                    <DaisyBadge className={`ml-2 ${currentPriorityConfig.color} ${currentPriorityConfig.bg}`}>
                      {currentPriorityConfig.label}
                    </DaisyBadge>
                  </div>
                  <div>
                    <span className="font-medium">Testing:</span>
                    <span className="ml-2">{testingFrequencies.find(f => f.value === formData.testingFrequency)?.label}</span>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 capitalize">{formData.controlType}</span>
                  </div>
                  <div>
                    <span className="font-medium">Implementation:</span>
                    <span className="ml-2 capitalize">{formData.implementation}</span>
                  </div>
                </div>
                
                {formData.framework.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Frameworks:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.framework.map((fw) => (
                        <DaisyBadge key={fw} variant="outline" className="text-xs">
                          {fw}
                        </DaisyBadge>
                      ))}
                    </div>
                  </div>
                )}
              </DaisyCardBody>
            </DaisyCard>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <DaisyButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </DaisyButton>
          <DaisyButton
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Control'
            )}
          </DaisyButton>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
}; 
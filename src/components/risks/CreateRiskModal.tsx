'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  DaisyDialog,
  DaisyDialogContent,
  DaisyDialogDescription,
  DaisyDialogHeader,
  DaisyDialogTitle,
} from '@/components/ui/DaisyDialog';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import {
  DaisySelect,
  DaisySelectContent,
  DaisySelectItem,
  DaisySelectTrigger,
  DaisySelectValue,
} from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import {
  DaisyTabs,
  DaisyTabsContent,
  DaisyTabsList,
  DaisyTabsTrigger,
} from '@/components/ui/DaisyTabs';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DatePicker } from '@/components/ui/date-picker';
import { DaisySlider } from '@/components/ui/DaisySlider';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { AlertTriangle, Calendar, Shield, Target, Users, FileText, Loader2 } from 'lucide-react';

interface CreateRiskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRiskCreated: (risk: any) => void;
}

interface RiskFormData {
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  owner: string;
  dueDate: Date | null;
  framework: string[];
  treatment: string;
  tags: string[];
  businessUnit: string;
  department: string;
  customFields: Record<string, any>;
}

const initialFormData: RiskFormData = {
  title: '',
  description: '',
  category: '',
  likelihood: 3,
  impact: 3,
  owner: '',
  dueDate: null,
  framework: [],
  treatment: 'mitigate',
  tags: [],
  businessUnit: '',
  department: '',
  customFields: {},
};

const riskCategories = [
  'Cyber Security',
  'Data Privacy',
  'Operational',
  'Financial',
  'Regulatory',
  'Strategic',
  'Reputational',
  'Third Party',
  'Physical Security',
  'Human Resources',
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

const treatmentOptions = [
  { value: 'accept', label: 'Accept', description: 'Accept the risk as is' },
  { value: 'mitigate', label: 'Mitigate', description: 'Reduce the risk through controls' },
  { value: 'transfer', label: 'Transfer', description: 'Transfer risk to third party' },
  { value: 'avoid', label: 'Avoid', description: 'Eliminate the risk entirely' },
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

export const CreateRiskModal: React.FC<CreateRiskModalProps> = ({
  open,
  onOpenChange,
  onRiskCreated,
}) => {
  const [formData, setFormData] = useState<RiskFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const calculateRiskScore = (likelihood: number, impact: number) => {
    return likelihood * impact;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 20) return { level: 'critical', color: 'text-red-600', bg: 'bg-red-50' };
    if (score >= 15) return { level: 'high', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (score >= 10) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'low', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Risk title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Risk description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Risk category is required';
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Risk owner is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const riskScore = calculateRiskScore(formData.likelihood, formData.impact);
      const riskLevel = getRiskLevel(riskScore);

      const newRisk = {
        id: `RSK-${Date.now()}`,
        ...formData,
        riskScore,
        riskLevel: riskLevel.level,
        status: 'open',
        createdAt: new Date(),
        lastUpdated: new Date(),
        controls: 0,
        progress: 0,
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onRiskCreated(newRisk);
      toast.success('Risk created successfully!');

      // Reset form
      setFormData(initialFormData);
      setActiveTab('basic');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating risk:', error);
      toast.error('Failed to create risk. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrameworkToggle = (framework: string) => {
    setFormData((prev) => ({
      ...prev,
      framework: prev.framework.includes(framework)
        ? prev.framework.filter((f) => f !== framework)
        : [...prev.framework, framework],
    }));
  };

  const currentRiskScore = calculateRiskScore(formData.likelihood, formData.impact);
  const currentRiskLevel = getRiskLevel(currentRiskScore);

  return (
    <DaisyDialog open={open} onOpenChange={onOpenChange}>
      <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Create New Risk</span>
          </DaisyDialogTitle>
          <DaisyDialogDescription>
            Define a new risk and its characteristics for assessment and management.
          </DaisyDialogDescription>
        </DaisyDialogHeader>

        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DaisyTabsList className="grid w-full grid-cols-4">
            <DaisyTabsTrigger value="basic">Basic Info</DaisyTabsTrigger>
            <DaisyTabsTrigger value="assessment">Assessment</DaisyTabsTrigger>
            <DaisyTabsTrigger value="compliance">Compliance</DaisyTabsTrigger>
            <DaisyTabsTrigger value="additional">Additional</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="title">Risk Title *</DaisyLabel>
                <DaisyInput
                  id="title"
                  placeholder="Enter risk title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="category">Category *</DaisyLabel>
                <DaisySelect
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <DaisySelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <DaisySelectValue placeholder="Select category" />
                  </DaisySelectTrigger>
                  <DaisySelectContent>
                    {riskCategories.map((category) => (
                      <DaisySelectItem key={category} value={category}>
                        {category}
                      </DaisySelectItem>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <DaisyLabel htmlFor="description">Description *</DaisyLabel>
              <DaisyTextarea
                id="description"
                placeholder="Describe the risk in detail"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className={errors.description ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="owner">Risk Owner *</DaisyLabel>
                <DaisyInput
                  id="owner"
                  placeholder="Enter risk owner name"
                  value={formData.owner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, owner: e.target.value }))}
                  className={errors.owner ? 'border-red-500' : ''}
                />
                {errors.owner && <p className="text-sm text-red-600">{errors.owner}</p>}
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="dueDate">Due Date *</DaisyLabel>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) => setFormData((prev) => ({ ...prev, dueDate: date }))}
                  placeholder="Select due date"
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate}</p>}
              </div>
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="assessment" className="space-y-6">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Risk Assessment</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Evaluate the likelihood and impact of this risk
                </p>

                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <DaisyLabel>Likelihood: {formData.likelihood}</DaisyLabel>
                      <DaisySlider
                        value={[formData.likelihood]}
                        onValueChange={([value]) =>
                          setFormData((prev) => ({ ...prev, likelihood: value }))
                        }
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Very Low</span>
                        <span>Very High</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <DaisyLabel>Impact: {formData.impact}</DaisyLabel>
                      <DaisySlider
                        value={[formData.impact]}
                        onValueChange={([value]) =>
                          setFormData((prev) => ({ ...prev, impact: value }))
                        }
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Minimal</span>
                        <span>Catastrophic</span>
                      </div>
                    </div>
                  </div>

                  <DaisySeparator />

                  <div className="text-center">
                    <div className="inline-flex items-center space-x-4">
                      <div className="text-sm text-gray-600">Risk Score:</div>
                      <div className="text-2xl font-bold">{currentRiskScore}</div>
                      <DaisyBadge className={`${currentRiskLevel.color} ${currentRiskLevel.bg}`}>
                        {currentRiskLevel.level.toUpperCase()}
                      </DaisyBadge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <DaisyLabel>Risk Treatment Strategy</DaisyLabel>
                    <DaisySelect
                      value={formData.treatment}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, treatment: value }))
                      }
                    >
                      <DaisySelectTrigger>
                        <DaisySelectValue />
                      </DaisySelectTrigger>
                      <DaisySelectContent>
                        {treatmentOptions.map((option) => (
                          <DaisySelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </DaisySelectItem>
                        ))}
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          <DaisyTabsContent value="compliance" className="space-y-4">
            <DaisyCard>
              <DaisyCardBody>
                <DaisyCardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Compliance Frameworks</span>
                </DaisyCardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Select applicable compliance frameworks for this risk
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
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
          </DaisyTabsContent>

          <DaisyTabsContent value="additional" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="businessUnit">Business Unit</DaisyLabel>
                <DaisySelect
                  value={formData.businessUnit}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, businessUnit: value }))
                  }
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue placeholder="Select business unit" />
                  </DaisySelectTrigger>
                  <DaisySelectContent>
                    {businessUnits.map((unit) => (
                      <DaisySelectItem key={unit} value={unit}>
                        {unit}
                      </DaisySelectItem>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="department">Department</DaisyLabel>
                <DaisyInput
                  id="department"
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <DaisyButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </DaisyButton>
          <DaisyButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Risk'
            )}
          </DaisyButton>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};

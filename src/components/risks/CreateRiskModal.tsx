'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    setFormData(prev => ({
      ...prev,
      framework: prev.framework.includes(framework)
        ? prev.framework.filter(f => f !== framework)
        : [...prev.framework, framework],
    }));
  };

  const currentRiskScore = calculateRiskScore(formData.likelihood, formData.impact);
  const currentRiskLevel = getRiskLevel(currentRiskScore);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Create New Risk</span>
          </DialogTitle>
          <DialogDescription>
            Define a new risk and its characteristics for assessment and management.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Risk Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter risk title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the risk in detail"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={errors.description ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Risk Owner *</Label>
                <Input
                  id="owner"
                  placeholder="Enter risk owner name"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  className={errors.owner ? 'border-red-500' : ''}
                />
                {errors.owner && <p className="text-sm text-red-600">{errors.owner}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  placeholder="Select due date"
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate}</p>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Risk Assessment</span>
                </CardTitle>
                <CardDescription>
                  Evaluate the likelihood and impact of this risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Likelihood: {formData.likelihood}</Label>
                    <Slider
                      value={[formData.likelihood]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, likelihood: value }))}
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
                    <Label>Impact: {formData.impact}</Label>
                    <Slider
                      value={[formData.impact]}
                      onValueChange={([value]) => setFormData(prev => ({ ...prev, impact: value }))}
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

                <Separator />

                <div className="text-center">
                  <div className="inline-flex items-center space-x-4">
                    <div className="text-sm text-gray-600">Risk Score:</div>
                    <div className="text-2xl font-bold">{currentRiskScore}</div>
                    <Badge className={`${currentRiskLevel.color} ${currentRiskLevel.bg}`}>
                      {currentRiskLevel.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Risk Treatment Strategy</Label>
                  <Select
                    value={formData.treatment}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, treatment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Compliance Frameworks</span>
                </CardTitle>
                <CardDescription>
                  Select applicable compliance frameworks for this risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {complianceFrameworks.map((framework) => (
                    <div key={framework} className="flex items-center space-x-2">
                      <Checkbox
                        id={framework}
                        checked={formData.framework.includes(framework)}
                        onCheckedChange={() => handleFrameworkToggle(framework)}
                      />
                      <Label htmlFor={framework} className="text-sm">
                        {framework}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessUnit">Business Unit</Label>
                <Select
                  value={formData.businessUnit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessUnit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Risk'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Calendar,
  Users,
  Target,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function NewAssessmentPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Pending',
    priority: 'Medium',
    assignee: '',
    dueDate: '',
    objectives: [''],
    assessmentType: '',
    framework: '',
    includeThirdParty: false,
    includeCompliance: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      objectives: newObjectives
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Assessment title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.assignee) {
      newErrors.assignee = 'Assignee is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (!formData.assessmentType) {
      newErrors.assessmentType = 'Assessment type is required';
    }
    if (formData.objectives.every(obj => !obj.trim())) {
      newErrors.objectives = 'At least one objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Creating new assessment:', formData);
      
      // Generate a mock ID and redirect to the new assessment
      const newAssessmentId = Math.floor(Math.random() * 1000) + 1;
      router.push(`/dashboard/risks/assessment/${newAssessmentId}`);
    } catch (error) {
      console.error('Error creating assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/risks/assessment');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Risk Assessment</h1>
            <p className="text-gray-600">Create a comprehensive risk assessment for your organization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Creating...' : 'Create Assessment'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Assessment Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Annual Security Risk Assessment 2025"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the assessment scope, purpose, and key areas to be evaluated..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessmentType">Assessment Type *</Label>
                  <Select
                    value={formData.assessmentType}
                    onValueChange={(value) => handleInputChange('assessmentType', value)}
                  >
                    <SelectTrigger className={errors.assessmentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security Assessment</SelectItem>
                      <SelectItem value="operational">Operational Risk Assessment</SelectItem>
                      <SelectItem value="compliance">Compliance Assessment</SelectItem>
                      <SelectItem value="third-party">Third-Party Risk Assessment</SelectItem>
                      <SelectItem value="business-continuity">Business Continuity Assessment</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Risk Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.assessmentType && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.assessmentType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework">Framework (Optional)</Label>
                  <Select
                    value={formData.framework}
                    onValueChange={(value) => handleInputChange('framework', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso27001">ISO 27001</SelectItem>
                      <SelectItem value="nist">NIST Cybersecurity Framework</SelectItem>
                      <SelectItem value="coso">COSO Framework</SelectItem>
                      <SelectItem value="sox">SOX Compliance</SelectItem>
                      <SelectItem value="gdpr">GDPR</SelectItem>
                      <SelectItem value="hipaa">HIPAA</SelectItem>
                      <SelectItem value="custom">Custom Framework</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee *</Label>
                  <Select
                    value={formData.assignee}
                    onValueChange={(value) => handleInputChange('assignee', value)}
                  >
                    <SelectTrigger className={errors.assignee ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Security Team">Security Team</SelectItem>
                      <SelectItem value="Risk Team">Risk Team</SelectItem>
                      <SelectItem value="Compliance Team">Compliance Team</SelectItem>
                      <SelectItem value="IT Team">IT Team</SelectItem>
                      <SelectItem value="Internal Audit">Internal Audit</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.assignee && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.assignee}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className={errors.dueDate ? 'border-red-500' : ''}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Assessment Options */}
              <div className="space-y-3">
                <Label>Assessment Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeThirdParty"
                      checked={formData.includeThirdParty}
                      onCheckedChange={(checked) => handleInputChange('includeThirdParty', checked as boolean)}
                    />
                    <Label htmlFor="includeThirdParty" className="text-sm font-normal">
                      Include third-party vendor assessment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCompliance"
                      checked={formData.includeCompliance}
                      onCheckedChange={(checked) => handleInputChange('includeCompliance', checked as boolean)}
                    />
                    <Label htmlFor="includeCompliance" className="text-sm font-normal">
                      Include compliance requirements evaluation
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectives */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assessment Objectives *</CardTitle>
                <Button onClick={addObjective} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <Input
                    value={objective}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                    placeholder="Enter assessment objective"
                    className="flex-1"
                  />
                  {formData.objectives.length > 1 && (
                    <Button
                      onClick={() => removeObjective(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.objectives && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.objectives}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Title</span>
                <p className="text-sm">{formData.title || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Type</span>
                <p className="text-sm">{formData.assessmentType || 'Not selected'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Priority</span>
                <p className="text-sm">{formData.priority}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Assignee</span>
                <p className="text-sm">{formData.assignee || 'Not assigned'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Due Date</span>
                <p className="text-sm">{formData.dueDate || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <FileCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>Define clear objectives for your assessment</p>
              </div>
              <div className="flex items-start space-x-2">
                <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>Assign the right team or individual</p>
              </div>
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>Set realistic timelines for completion</p>
              </div>
              <div className="flex items-start space-x-2">
                <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>Choose appropriate frameworks and standards</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyCardTitle, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue } from '@/components/ui/daisy-components';
// import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Calendar,
  Users,
  Target,
  FileCheck,
  AlertCircle,
} from 'lucide-react'

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
    includeCompliance: false,
  })

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const handleObjectiveChange = (_index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData((prev) => ({
      ...prev,
      objectives: newObjectives,
    }));
  }

  const addObjective = () => {
    setFormData((prev) => ({
      ...prev,
      objectives: [...prev.objectives, ''],
    }));
  }

  const removeObjective = (_index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      objectives: newObjectives,
    }));
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

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
    if (formData.objectives.every((obj) => !obj.trim())) {
      newErrors.objectives = 'At least one objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // console.log('Creating new assessment:', formData)

      // Generate a mock ID and redirect to the new assessment
      const newAssessmentId = Math.floor(Math.random() * 1000) + 1
      router.push(`/dashboard/risks/assessment/${newAssessmentId}`);
    } catch (error) {
      // console.error('Error creating assessment:', error)
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/risks/assessment');
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <DaisyButton variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </DaisyButton>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Risk Assessment</h1>
            <p className="text-gray-600">
              Create a comprehensive risk assessment for your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DaisyButton variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </DaisyButton>
          <DaisyButton onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Creating...' : 'Create Assessment'}
          </DaisyButton>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Basic Information</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="title">Assessment Title *</DaisyLabel>
                <DaisyInput
                  id="title"
                  value={formData.title}
                  onChange={(e) = />
handleInputChange('title', e.target.value)}
                  placeholder="e.g., Annual Security Risk Assessment 2025"
                  className={errors.title ? 'border-red-500' : ''} />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <DaisyLabel htmlFor="description">Description *</DaisyLabel>
                <DaisyTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) = />
handleInputChange('description', e.target.value)}
                  placeholder="Describe the assessment scope, purpose, and key areas to be evaluated..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''} />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DaisyLabel htmlFor="assessmentType">Assessment Type *</DaisyLabel>
                  <DaisySelect
                    value={formData.assessmentType}
                    onValueChange={(value) => handleInputChange('assessmentType', value)}
                  >
                    <DaisySelectTrigger className={errors.assessmentType ? 'border-red-500' : ''}>
                      <DaisySelectValue placeholder="Select assessment type" />
                    <DaisySelectContent>
                      <DaisySelectItem value="security">Security Assessment</DaisySelectItem>
                      <DaisySelectItem value="operational">
                        Operational Risk Assessment
                      </DaisySelectItem>
                      <DaisySelectItem value="compliance">Compliance Assessment</DaisySelectItem>
                      <DaisySelectItem value="third-party">
                        Third-Party Risk Assessment
                      </DaisySelectItem>
                      <DaisySelectItem value="business-continuity">
                        Business Continuity Assessment
                      </DaisySelectItem>
                      <DaisySelectItem value="comprehensive">
                        Comprehensive Risk Assessment
                      </DaisySelectItem>
                    </DaisySelectContent>
                  </DaisySelect>
                  {errors.assessmentType && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.assessmentType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <DaisyLabel htmlFor="framework">Framework (Optional)</DaisyLabel>
                  <DaisySelect
                    value={formData.framework}
                    onValueChange={(value) => handleInputChange('framework', value)}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select framework" />
                    <DaisySelectContent>
                      <DaisySelectItem value="iso27001">ISO 27001</DaisySelectItem>
                      <DaisySelectItem value="nist">NIST Cybersecurity Framework</DaisySelectItem>
                      <DaisySelectItem value="coso">COSO Framework</DaisySelectItem>
                      <DaisySelectItem value="sox">SOX Compliance</DaisySelectItem>
                      <DaisySelectItem value="gdpr">GDPR</DaisySelectItem>
                      <DaisySelectItem value="hipaa">HIPAA</DaisySelectItem>
                      <DaisySelectItem value="custom">Custom Framework</DaisySelectItem>
                    </DaisySelectContent>
                  </DaisySelect>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <DaisyLabel htmlFor="priority">Priority</DaisyLabel>
                  <DaisySelect
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select priority" />
                    <DaisySelectContent>
                      <DaisySelectItem value="Low">Low</DaisySelectItem>
                      <DaisySelectItem value="Medium">Medium</DaisySelectItem>
                      <DaisySelectItem value="High">High</DaisySelectItem>
                      <DaisySelectItem value="Critical">Critical</DaisySelectItem>
                    </DaisySelectContent>
                  </DaisySelect>
                </div>

                <div className="space-y-2">
                  <DaisyLabel htmlFor="assignee">Assignee *</DaisyLabel>
                  <DaisySelect
                    value={formData.assignee}
                    onValueChange={(value) => handleInputChange('assignee', value)}
                  >
                    <DaisySelectTrigger className={errors.assignee ? 'border-red-500' : ''}>
                      <DaisySelectValue placeholder="Select assignee" />
                    <DaisySelectContent>
                      <DaisySelectItem value="Security Team">Security Team</DaisySelectItem>
                      <DaisySelectItem value="Risk Team">Risk Team</DaisySelectItem>
                      <DaisySelectItem value="Compliance Team">Compliance Team</DaisySelectItem>
                      <DaisySelectItem value="IT Team">IT Team</DaisySelectItem>
                      <DaisySelectItem value="Internal Audit">Internal Audit</DaisySelectItem>
                    </DaisySelectContent>
                  </DaisySelect>
                  {errors.assignee && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.assignee}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <DaisyLabel htmlFor="dueDate">Due Date *</DaisyLabel>
                  <DaisyInput
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) = />
handleInputChange('dueDate', e.target.value)}
                    className={errors.dueDate ? 'border-red-500' : ''} />
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
                <DaisyLabel>Assessment Options</DaisyLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DaisyCheckbox
                      id="includeThirdParty"
                      checked={formData.includeThirdParty}
                      onCheckedChange={(checked) = />
handleInputChange('includeThirdParty', checked as boolean)
                      } />
                    <DaisyLabel htmlFor="includeThirdParty" className="text-sm font-normal">
                      Include third-party vendor assessment
                    </DaisyLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DaisyCheckbox
                      id="includeCompliance"
                      checked={formData.includeCompliance}
                      onCheckedChange={(checked) = />
handleInputChange('includeCompliance', checked as boolean)
                      } />
                    <DaisyLabel htmlFor="includeCompliance" className="text-sm font-normal">
                      Include compliance requirements evaluation
                    </DaisyLabel>
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Objectives */}
          <DaisyCard>
            <DaisyCardBody>
              <div className="flex items-center justify-between">
                <DaisyCardTitle>Assessment Objectives *</DaisyCardTitle>
                <DaisyButton onClick={addObjective} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </DaisyButton>
              </div>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-3">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <DaisyInput
                    value={objective}
                    onChange={(e) = />
handleObjectiveChange(index, e.target.value)}
                    placeholder="Enter assessment objective"
                    className="flex-1" />
                  {formData.objectives.length > 1 && (
                    <DaisyButton
                      onClick={() => removeObjective(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </DaisyButton>
                  )}
                </div>
              ))}
              {errors.objectives && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.objectives}
                </p>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Assessment Preview</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-4">
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
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Getting Started</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-3 text-sm text-gray-600">
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
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </div>
    </div>
  );
}

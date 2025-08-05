'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCardTitle, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue } from '@/components/ui/daisy-components';
// import { ArrowLeft, Save, X, Plus, Trash2, Calendar, Users, Target } from 'lucide-react';

export default function EditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id;

  // Mock form state
  const [formData, setFormData] = useState({
    title: 'Annual Security Assessment',
    description:
      'Comprehensive annual security risk assessment covering all critical business processes, systems, and third-party integrations.',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Security Team',
    dueDate: '2025-02-15',
    objectives: [
      'Identify and assess security vulnerabilities',
      'Evaluate current security controls effectiveness',
      'Recommend improvements and remediation actions',
      'Ensure compliance with security frameworks',
    ],
  })

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // console.log('Saving assessment:', formData)
      router.push(`/dashboard/risks/assessment/${assessmentId}`);
    } catch (error) {
      // console.error('Error saving assessment:', error)
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    router.back();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <DaisyButton variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </DaisyButton>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Assessment</h1>
            <p className="text-gray-600">Assessment ID: {assessmentId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DaisyButton variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </DaisyButton>
          <DaisyButton onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <DaisyLabel htmlFor="title">Assessment Title</DaisyLabel>
                  <DaisyInput
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
handleInputChange('title', e.target.value)}
                    placeholder="Enter assessment title" />
                </div>

                <div className="space-y-2">
                  <DaisyLabel htmlFor="description">Description</DaisyLabel>
                  <DaisyTextarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
handleInputChange('description', e.target.value)}
                    placeholder="Describe the assessment scope and purpose"
                    rows={4} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <DaisyLabel htmlFor="status">Status</DaisyLabel>
                    <DaisySelect
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <DaisySelectTrigger>
                        <DaisySelectValue placeholder="Select status" />
                      <DaisySelectContent>
                        <DaisySelectItem value="Pending">Pending</DaisySelectItem>
                        <DaisySelectItem value="In Progress">In Progress</DaisySelectItem>
                        <DaisySelectItem value="Completed">Completed</DaisySelectItem>
                        <DaisySelectItem value="On Hold">On Hold</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <DaisyLabel htmlFor="assignee">Assignee</DaisyLabel>
                    <DaisySelect
                      value={formData.assignee}
                      onValueChange={(value) => handleInputChange('assignee', value)}
                    >
                      <DaisySelectTrigger>
                        <DaisySelectValue placeholder="Select assignee" />
                      <DaisySelectContent>
                        <DaisySelectItem value="Security Team">Security Team</DaisySelectItem>
                        <DaisySelectItem value="Risk Team">Risk Team</DaisySelectItem>
                        <DaisySelectItem value="Compliance Team">Compliance Team</DaisySelectItem>
                        <DaisySelectItem value="IT Team">IT Team</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  <div className="space-y-2">
                    <DaisyLabel htmlFor="dueDate">Due Date</DaisyLabel>
                    <DaisyInput
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
handleInputChange('dueDate', e.target.value)} />
                  </div>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Objectives */}
          <DaisyCard>
            <DaisyCardBody>
              <div className="flex items-center justify-between">
                <DaisyCardTitle>Assessment Objectives</DaisyCardTitle>
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
                    onChange={(e) =>
handleObjectiveChange(index, e.target.value)}
                    placeholder="Enter objective"
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
            </DaisyCardBody>
          </DaisyCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Assessment Status</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status</span>
                <DaisyBadge
                  className={
                    formData.status === 'Completed'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : formData.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : formData.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                >
                  {formData.status}
                </DaisyBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <DaisyBadge
                  className={
                    formData.priority === 'High' || formData.priority === 'Critical'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : formData.priority === 'Medium'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                  }
                >
                  {formData.priority}
                </DaisyBadge>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{formData.assignee}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Due: {formData.dueDate}</span>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Quick Actions</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody className="space-y-2">
              <DaisyButton variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                View Assessment Details
              </DaisyButton>
              <DaisyButton variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Assign Team Members
              </DaisyButton>
              <DaisyButton variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Review
              </DaisyButton>
            </DaisyCardBody>
          </DaisyCard>

          <DaisyCard>
            <DaisyCardBody>
              <DaisyCardTitle>Assessment Progress</DaisyCardTitle>
            </DaisyCardBody>
            <DaisyCardBody>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-gray-900">65%</div>
                <p className="text-sm text-gray-600">Completion Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </div>
    </div>
  );
}

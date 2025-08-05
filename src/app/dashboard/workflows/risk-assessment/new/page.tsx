'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
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
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  AlertTriangle,
  Save,
  CheckCircle,
  Circle,
  ChevronRight,
} from 'lucide-react';

interface RiskFormData {
  title: string;
  description: string;
  category: string;
  likelihood: string;
  impact: string;
  owner: string;
  department: string;
  detectionMethod: string;
  existingControls: string;
  proposedMitigation: string;
}

export default function NewRiskAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    category: '',
    likelihood: '',
    impact: '',
    owner: '',
    department: '',
    detectionMethod: '',
    existingControls: '',
    proposedMitigation: '',
  });

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Risk details and category' },
    { id: 2, title: 'Risk Analysis', description: 'Likelihood and impact assessment' },
    { id: 3, title: 'Controls & Mitigation', description: 'Current and proposed controls' },
    { id: 4, title: 'Review & Submit', description: 'Final review before submission' },
  ];

  const handleInputChange = (field: keyof RiskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'active',
          riskScore: calculateRiskScore(formData.likelihood, formData.impact),
        }),
      });

      if (!response.ok) throw new Error('Failed to create risk');

      toast({
        title: 'Success',
        description: 'Risk assessment created successfully',
      });

      router.push('/dashboard/risks');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create risk assessment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const calculateRiskScore = (likelihood: string, impact: string): string => {
    const scores: { [key: string]: number } = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    }

    const score = (scores[likelihood] || 0) * (scores[impact] || 0);
    if (score >= 9) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category);
      case 2:
        return !!(formData.likelihood && formData.impact && formData.owner);
      case 3:
        return !!(formData.existingControls && formData.proposedMitigation);
      case 4:
        return true;
      default:
        return false;
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <DaisyButton
              variant="ghost"
              onClick={() => router.push('/dashboard/quick-actions')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quick Actions
            </DaisyButton>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">New Risk Assessment</h1>
                <p className="text-gray-600 mt-1">Document and assess a new organizational risk</p>
              </div>
              <DaisyBadge variant="outline" className="text-sm">
                <Shield className="h-4 w-4 mr-1" />
                15-20 min
              </DaisyBadge>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        currentStep > step.id
                          ? 'bg-green-600 border-green-600 text-white'
                          : currentStep === step.id
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${
                          currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-colors ${
                        currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <DaisyCard>
            <DaisyCardBody className="p-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <DaisyLabel htmlFor="title">Risk Title *</DaisyLabel>
                    <DaisyInput
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
handleInputChange('title', e.target.value)}
                      placeholder="Enter a descriptive title for this risk"
                      className="mt-1" />
                  </div>

                  <div>
                    <DaisyLabel htmlFor="description">Risk Description *</DaisyLabel>
                    <DaisyTextarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed description of the risk"
                      rows={4}
                      className="mt-1" />
                  </div>

                  <div>
                    <DaisyLabel htmlFor="category">Risk Category *</DaisyLabel>
                    <DaisySelect
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <DaisySelectTrigger className="mt-1">
                        <DaisySelectValue placeholder="Select risk category" />
                      <DaisySelectContent>
                        <DaisySelectItem value="operational">Operational</DaisySelectItem>
                        <DaisySelectItem value="financial">Financial</DaisySelectItem>
                        <DaisySelectItem value="compliance">Compliance</DaisySelectItem>
                        <DaisySelectItem value="strategic">Strategic</DaisySelectItem>
                        <DaisySelectItem value="cybersecurity">Cybersecurity</DaisySelectItem>
                        <DaisySelectItem value="reputational">Reputational</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel htmlFor="department">Department</DaisyLabel>
                    <DaisyInput
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
handleInputChange('department', e.target.value)}
                      placeholder="Enter the affected department"
                      className="mt-1" />
                  </div>
                </div>
              )}

              {/* Step 2: Risk Analysis */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <DaisyLabel htmlFor="likelihood">Likelihood *</DaisyLabel>
                    <DaisySelect
                      value={formData.likelihood}
                      onValueChange={(value) => handleInputChange('likelihood', value)}
                    >
                      <DaisySelectTrigger className="mt-1">
                        <DaisySelectValue placeholder="Select likelihood level" />
                      <DaisySelectContent>
                        <DaisySelectItem value="low">Low - Unlikely to occur</DaisySelectItem>
                        <DaisySelectItem value="medium">
                          Medium - Possible occurrence
                        </DaisySelectItem>
                        <DaisySelectItem value="high">High - Likely to occur</DaisySelectItem>
                        <DaisySelectItem value="critical">
                          Critical - Almost certain
                        </DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  <div>
                    <DaisyLabel htmlFor="impact">Impact *</DaisyLabel>
                    <DaisySelect
                      value={formData.impact}
                      onValueChange={(value) => handleInputChange('impact', value)}
                    >
                      <DaisySelectTrigger className="mt-1">
                        <DaisySelectValue placeholder="Select impact level" />
                      <DaisySelectContent>
                        <DaisySelectItem value="low">Low - Minimal impact</DaisySelectItem>
                        <DaisySelectItem value="medium">Medium - Moderate impact</DaisySelectItem>
                        <DaisySelectItem value="high">High - Significant impact</DaisySelectItem>
                        <DaisySelectItem value="critical">Critical - Severe impact</DaisySelectItem>
                      </DaisySelectContent>
                    </DaisySelect>
                  </div>

                  {formData.likelihood && formData.impact && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Calculated Risk Score</p>
                      <div className="mt-2 flex items-center gap-2">
                        <DaisyBadge
                          className={`
                            ${calculateRiskScore(formData.likelihood, formData.impact) === 'critical' ? 'bg-red-100 text-red-800' : ''}
                            ${calculateRiskScore(formData.likelihood, formData.impact) === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                            ${calculateRiskScore(formData.likelihood, formData.impact) === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${calculateRiskScore(formData.likelihood, formData.impact) === 'low' ? 'bg-green-100 text-green-800' : ''}
                          `}
                        >
                          {calculateRiskScore(formData.likelihood, formData.impact).toUpperCase()}
                        </DaisyBadge>
                        <span className="text-sm text-gray-600">
                          ({formData.likelihood} likelihood × {formData.impact} impact)
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <DaisyLabel htmlFor="owner">Risk Owner *</DaisyLabel>
                    <DaisyInput
                      id="owner"
                      value={formData.owner}
                      onChange={(e) =>
handleInputChange('owner', e.target.value)}
                      placeholder="Enter the name of the risk owner"
                      className="mt-1" />
                  </div>

                  <div>
                    <DaisyLabel htmlFor="detectionMethod">Detection Method</DaisyLabel>
                    <DaisyTextarea
                      id="detectionMethod"
                      value={formData.detectionMethod}
                      onChange={(e) =>
handleInputChange('detectionMethod', e.target.value)}
                      placeholder="How was this risk identified?"
                      rows={3}
                      className="mt-1" />
                  </div>
                </div>
              )}

              {/* Step 3: Controls & Mitigation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <DaisyLabel htmlFor="existingControls">Existing Controls *</DaisyLabel>
                    <DaisyTextarea
                      id="existingControls"
                      value={formData.existingControls}
                      onChange={(e) =>
handleInputChange('existingControls', e.target.value)}
                      placeholder="Describe current controls in place to manage this risk"
                      rows={4}
                      className="mt-1" />
                  </div>

                  <div>
                    <DaisyLabel htmlFor="proposedMitigation">
                      Proposed Mitigation Strategy *
                    </DaisyLabel>
                    <DaisyTextarea
                      id="proposedMitigation"
                      value={formData.proposedMitigation}
                      onChange={(e) =>
handleInputChange('proposedMitigation', e.target.value)}
                      placeholder="Describe proposed actions to mitigate this risk"
                      rows={4}
                      className="mt-1" />
                  </div>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Review Risk Assessment</h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Title:</span> {formData.title}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {formData.category}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span>{' '}
                          {formData.department || 'Not specified'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Risk Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Likelihood:</span> {formData.likelihood}
                        </div>
                        <div>
                          <span className="font-medium">Impact:</span> {formData.impact}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Risk Score:</span>
                          <DaisyBadge
                            className={`
                              ${calculateRiskScore(formData.likelihood, formData.impact) === 'critical' ? 'bg-red-100 text-red-800' : ''}
                              ${calculateRiskScore(formData.likelihood, formData.impact) === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                              ${calculateRiskScore(formData.likelihood, formData.impact) === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${calculateRiskScore(formData.likelihood, formData.impact) === 'low' ? 'bg-green-100 text-green-800' : ''}
                            `}
                          >
                            {calculateRiskScore(formData.likelihood, formData.impact).toUpperCase()}
                          </DaisyBadge>
                        </div>
                        <div>
                          <span className="font-medium">Owner:</span> {formData.owner}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Controls & Mitigation</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Existing Controls:</span>
                          <p className="mt-1 text-gray-600">{formData.existingControls}</p>
                        </div>
                        <div>
                          <span className="font-medium">Proposed Mitigation:</span>
                          <p className="mt-1 text-gray-600">{formData.proposedMitigation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between">
                <DaisyButton
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </DaisyButton>

                {currentStep < steps.length ? (
                  <DaisyButton onClick={handleNext} disabled={!isStepValid(currentStep)}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </DaisyButton>
                ) : (
                  <DaisyButton
                    onClick={handleSubmit}
                    disabled={loading || !isStepValid(3)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Submit Risk Assessment
                      </>
                    )}
                  </DaisyButton>
                )}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </div>
    </ProtectedRoute>
  );
}

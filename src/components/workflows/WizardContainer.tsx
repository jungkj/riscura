'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import {
  ActionIcons,
  StatusIcons,
  NavigationIcons,
  TimeIcons,
} from '@/components/icons/IconLibrary';
import { LoadingStates } from '@/components/states/LoadingState';

// Wizard types and interfaces
interface WizardStep {
  id: string
  title: string;
  description?: string;
  component: React.ComponentType<WizardStepProps>;
  validation?: (_data: any) => Promise<ValidationResult>;
  optional?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<any>;
}

interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
  warnings?: Record<string, string>;
}

interface WizardStepProps {
  data: any;
  onDataChange: (_data: any) => void;
  onValidationChange: (result: ValidationResult) => void;
  isActive: boolean;
  isCompleted: boolean;
  wizardContext: WizardContext;
}

interface WizardContext {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  submitWizard: () => void;
}

interface WizardContainerProps {
  steps: WizardStep[];
  initialData?: any;
  onComplete: (_data: any) => Promise<void>;
  onSave?: (_data: any) => Promise<void>;
  onCancel?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  allowStepSkipping?: boolean;
  showProgress?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  steps,
  initialData = {},
  onComplete,
  onSave,
  onCancel,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  allowStepSkipping = false,
  showProgress = true,
  title,
  description,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState(initialData);
  const [stepValidations, setStepValidations] = useState<Record<number, ValidationResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveDataRef = useRef(initialData);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!onSave || !hasUnsavedChanges) return

    setAutoSaveStatus({ status: 'saving' });
    try {
      await onSave(wizardData);
      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
      });
      setHasUnsavedChanges(false);
      lastSaveDataRef.current = wizardData;
    } catch (error) {
      setAutoSaveStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Auto-save failed',
      });
    }
  }, [wizardData, hasUnsavedChanges, onSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (!autoSave || !onSave) return

    const interval = setInterval(performAutoSave, autoSaveInterval);
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, performAutoSave, onSave]);

  // Debounced auto-save on data changes
  useEffect(() => {
    if (!autoSave || !onSave) return

    // Check if data actually changed
    const dataChanged = JSON.stringify(wizardData) !== JSON.stringify(lastSaveDataRef.current)
    if (!dataChanged) return;

    setHasUnsavedChanges(true);
    setAutoSaveStatus({ status: 'idle' });

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(performAutoSave, 5000); // 5 second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    }
  }, [wizardData, autoSave, onSave, performAutoSave]);

  // Handle data changes from steps
  const handleDataChange = useCallback((stepData: any) => {
    setWizardData((prev) => ({
      ...prev,
      ...stepData,
    }))
  }, []);

  // Handle validation changes from steps
  const handleValidationChange = useCallback((stepIndex: number, validation: ValidationResult) => {
    setStepValidations((prev) => ({
      ...prev,
      [stepIndex]: validation,
    }))
  }, []);

  // Navigation functions
  const canGoNext = useCallback(() => {
    if (currentStep >= steps.length - 1) return false

    const currentValidation = stepValidations[currentStep];
    if (!allowStepSkipping && currentValidation && !currentValidation.isValid) {
      return false;
    }

    return true;
  }, [currentStep, steps.length, stepValidations, allowStepSkipping]);

  const canGoPrevious = useCallback(() => {
    return currentStep > 0;
  }, [currentStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      // If step skipping is not allowed, validate all previous steps
      if (!allowStepSkipping) {
        for (let i = 0; i < stepIndex; i++) {
          const validation = stepValidations[i];
          if (validation && !validation.isValid) {
            return; // Cannot skip to this step
          }
        }
      }

      setCurrentStep(stepIndex);
    },
    [steps.length, stepValidations, allowStepSkipping]
  );

  const nextStep = useCallback(() => {
    if (canGoNext()) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canGoNext]);

  const previousStep = useCallback(() => {
    if (canGoPrevious()) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [canGoPrevious]);

  const submitWizard = useCallback(async () => {
    // Validate all steps before submission
    const allValid = Object.values(stepValidations).every((validation) => validation.isValid)
    if (!allValid) {
      // Find first invalid step and navigate to it
      const firstInvalidStep = Object.entries(stepValidations).find(
        ([_, validation]) => !validation.isValid
      )
      if (firstInvalidStep) {
        goToStep(parseInt(firstInvalidStep[0]));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(wizardData);
    } catch (error) {
      // console.error('Wizard submission failed:', error)
    } finally {
      setIsSubmitting(false);
    }
  }, [stepValidations, wizardData, onComplete, goToStep]);

  // Create wizard context
  const wizardContext: WizardContext = {
    currentStep,
    totalSteps: steps.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    canGoNext: canGoNext(),
    canGoPrevious: canGoPrevious(),
    goToStep,
    nextStep,
    previousStep,
    submitWizard,
  }

  // Get step completion status
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  }

  const getStepValidationStatus = (stepIndex: number) => {
    const validation = stepValidations[stepIndex];
    if (!validation) return 'unknown';
    if (validation.isValid) return 'valid';
    if (validation.errors && Object.keys(validation.errors).length > 0) return 'invalid';
    if (validation.warnings && Object.keys(validation.warnings).length > 0) return 'warning';
    return 'unknown';
  }

  // Prevent navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {Boolean(title) && <h1 className="text-xl font-semibold text-gray-900 mb-1">{title}</h1>}
            {Boolean(description) && <p className="text-sm text-gray-600">{description}</p>}
          </div>

          {/* Auto-save status */}
          {Boolean(autoSave) && onSave && (
            <div className="flex items-center space-x-2 text-sm">
              {autoSaveStatus.status === 'saving' && (
                <>
                  <LoadingStates.Spinner size="xs" />
                  <span className="text-gray-500">Saving...</span>
                </>
              )}
              {autoSaveStatus.status === 'saved' && autoSaveStatus.lastSaved && (
                <>
                  <StatusIcons.CheckCircle size="xs" color="success" />
                  <span className="text-green-600">
                    Saved {autoSaveStatus.lastSaved.toLocaleTimeString()}
                  </span>
                </>
              )}
              {autoSaveStatus.status === 'error' && (
                <>
                  <StatusIcons.AlertCircle size="xs" color="danger" />
                  <span className="text-red-600">Save failed</span>
                </>
              )}
              {Boolean(hasUnsavedChanges) && autoSaveStatus.status === 'idle' && (
                <>
                  <StatusIcons.Clock size="xs" color="secondary" />
                  <span className="text-gray-500">Unsaved changes</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {Boolean(showProgress) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const validationStatus = getStepValidationStatus(index);

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  disabled={!allowStepSkipping && index > currentStep}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-md transition-colors ${
                    allowStepSkipping || index <= currentStep
                      ? 'hover:bg-gray-100 cursor-pointer'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                      status === 'completed'
                        ? validationStatus === 'valid'
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : status === 'current'
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {status === 'completed' ? (
                      validationStatus === 'valid' ? (
                        <StatusIcons.Check size="xs" />
                      ) : (
                        <StatusIcons.AlertTriangle size="xs" />
                      )
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium max-w-20 text-center leading-tight ${
                      status === 'current' ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">{currentStepData.title}</h2>
          {currentStepData.description && (
            <p className="text-sm text-gray-600">{currentStepData.description}</p>
          )}
        </div>

        {/* Current Step Component */}
        <CurrentStepComponent
          data={wizardData}
          onDataChange={handleDataChange}
          onValidationChange={(validation) => handleValidationChange(currentStep, validation)}
          isActive={true}
          isCompleted={getStepStatus(currentStep) === 'completed'}
          wizardContext={wizardContext}
        />

        {/* Validation Messages */}
        {stepValidations[currentStep] && (
          <div className="mt-4 space-y-2">
            {stepValidations[currentStep].errors &&
              Object.entries(stepValidations[currentStep].errors!).map(([field, error]) => (
                <div key={field} className="flex items-center space-x-2 text-sm text-red-600">
                  <StatusIcons.AlertCircle size="xs" />
                  <span>{error}</span>
                </div>
              ))}
            {stepValidations[currentStep].warnings &&
              Object.entries(stepValidations[currentStep].warnings!).map(([field, warning]) => (
                <div key={field} className="flex items-center space-x-2 text-sm text-yellow-600">
                  <StatusIcons.AlertTriangle size="xs" />
                  <span>{warning}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Boolean(onCancel) && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={previousStep}
              disabled={!canGoPrevious()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <NavigationIcons.ChevronLeft size="xs" className="mr-1" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={!canGoNext()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <NavigationIcons.ChevronRight size="xs" className="ml-1" />
              </button>
            ) : (
              <button
                onClick={submitWizard}
                disabled={isSubmitting || !Object.values(stepValidations).every((v) => v.isValid)}
                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <LoadingStates.Spinner size="xs" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <StatusIcons.Check size="xs" className="mr-2" />
                    Complete
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardContainer;

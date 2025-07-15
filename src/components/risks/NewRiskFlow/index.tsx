'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RiskFlowProvider, RiskFlowStep } from './RiskFlowContext';
import { StepIndicator } from './StepIndicator';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { RiskMatrixStep } from './steps/RiskMatrixStep';
import { DetailsStep } from './steps/DetailsStep';
import { ReviewStep } from './steps/ReviewStep';
import { useRiskFlow } from './RiskFlowContext';

interface NewRiskFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const steps: Array<{ id: RiskFlowStep; label: string; icon: string }> = [
  { id: 'basic', label: 'Basic Info', icon: '📝' },
  { id: 'matrix', label: 'Risk Assessment', icon: '🎯' },
  { id: 'details', label: 'Details', icon: '📋' },
  { id: 'review', label: 'Review', icon: '✅' },
];

function RiskFlowContent({ onOpenChange, onSuccess }: Omit<NewRiskFlowProps, 'open'>) {
  const { currentStep, setCurrentStep, isSubmitting } = useRiskFlow();
  
  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-semibold">Create New Risk</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the steps to identify and assess a new risk
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentStep === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <BasicInfoStep onNext={handleNext} />
            </motion.div>
          )}
          
          {currentStep === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <RiskMatrixStep onNext={handleNext} onBack={handleBack} />
            </motion.div>
          )}
          
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DetailsStep onNext={handleNext} onBack={handleBack} />
            </motion.div>
          )}
          
          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <ReviewStep 
                onBack={handleBack} 
                onSuccess={() => {
                  onSuccess?.();
                  onOpenChange(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function NewRiskFlow({ open, onOpenChange, onSuccess }: NewRiskFlowProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <RiskFlowProvider>
          <RiskFlowContent onOpenChange={onOpenChange} onSuccess={onSuccess} />
        </RiskFlowProvider>
      </DialogContent>
    </Dialog>
  );
}
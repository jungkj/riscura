'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RiskCategory, RiskStatus, TreatmentStrategy } from '@/types';

interface RiskData {
  // Basic Info
  title: string;
  description: string;
  category: RiskCategory | null;
  
  // Risk Assessment
  likelihood: number;
  impact: number;
  riskScore?: number;
  
  // Details
  owner: string;
  status: RiskStatus;
  treatmentStrategy: TreatmentStrategy | null;
  controlMeasures: string;
  dateIdentified: Date;
  nextReview?: Date;
  
  // Compliance
  frameworkIds: string[];
  tags: string[];
}

interface RiskFlowContextType {
  riskData: RiskData;
  updateRiskData: (data: Partial<RiskData>) => void;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const RiskFlowContext = createContext<RiskFlowContextType | undefined>(undefined);

export function RiskFlowProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [riskData, setRiskData] = useState<RiskData>({
    title: '',
    description: '',
    category: null,
    likelihood: 3,
    impact: 3,
    owner: '',
    status: 'IDENTIFIED',
    treatmentStrategy: null,
    controlMeasures: '',
    dateIdentified: new Date(),
    frameworkIds: [],
    tags: [],
  });

  const updateRiskData = (data: Partial<RiskData>) => {
    setRiskData(prev => {
      const updated = { ...prev, ...data };
      // Auto-calculate risk score
      if ('likelihood' in data || 'impact' in data) {
        updated.riskScore = updated.likelihood * updated.impact;
      }
      return updated;
    });
  };

  return (
    <RiskFlowContext.Provider 
      value={{
        riskData,
        updateRiskData,
        currentStep,
        setCurrentStep,
        isSubmitting,
        setIsSubmitting,
      }}
    >
      {children}
    </RiskFlowContext.Provider>
  );
}

export function useRiskFlow() {
  const context = useContext(RiskFlowContext);
  if (!context) {
    throw new Error('useRiskFlow must be used within RiskFlowProvider');
  }
  return context;
}
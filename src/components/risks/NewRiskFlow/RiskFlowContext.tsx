'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RiskCategory, RiskStatus } from '@/types/rcsa.types';

// Define TreatmentStrategy enum since it's not exported from rcsa.types
export enum TreatmentStrategy {
  ACCEPT = 'ACCEPT',
  MITIGATE = 'MITIGATE',
  TRANSFER = 'TRANSFER',
  AVOID = 'AVOID',
}

// Define valid step names as a union type
export type RiskFlowStep = 'basic' | 'matrix' | 'details' | 'review';

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
  currentStep: RiskFlowStep;
  setCurrentStep: (step: RiskFlowStep) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

const RiskFlowContext = createContext<RiskFlowContextType | undefined>(undefined);

export const RiskFlowProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<RiskFlowStep>('basic');
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
    setRiskData((prev) => {
      // Create a copy for validation
      const validated: Partial<RiskData> = {};

      // Validate likelihood (1-5)
      if ('likelihood' in data && data.likelihood !== undefined) {
        const likelihood = Number(data.likelihood);
        if (!isNaN(likelihood) && likelihood >= 1 && likelihood <= 5) {
          validated.likelihood = Math.round(likelihood);
        } else {
          console.warn(`Invalid likelihood value: ${data.likelihood}. Must be between 1-5.`);
        }
      }

      // Validate impact (1-5)
      if ('impact' in data && data.impact !== undefined) {
        const impact = Number(data.impact);
        if (!isNaN(impact) && impact >= 1 && impact <= 5) {
          validated.impact = Math.round(impact);
        } else {
          console.warn(`Invalid impact value: ${data.impact}. Must be between 1-5.`);
        }
      }

      // Validate string fields (non-empty for required fields)
      if ('title' in data && typeof data.title === 'string') {
        validated.title = data.title.trim();
      }

      if ('description' in data && typeof data.description === 'string') {
        validated.description = data.description.trim();
      }

      if ('owner' in data && typeof data.owner === 'string') {
        validated.owner = data.owner.trim();
      }

      if ('controlMeasures' in data && typeof data.controlMeasures === 'string') {
        validated.controlMeasures = data.controlMeasures.trim();
      }

      // Validate enum fields
      if (
        'category' in data &&
        (data.category === null ||
          Object.values(RiskCategory).includes(data.category as RiskCategory))
      ) {
        validated.category = data.category;
      }

      if ('status' in data && Object.values(RiskStatus).includes(data.status as RiskStatus)) {
        validated.status = data.status;
      }

      if (
        'treatmentStrategy' in data &&
        (data.treatmentStrategy === null ||
          Object.values(TreatmentStrategy).includes(data.treatmentStrategy as TreatmentStrategy))
      ) {
        validated.treatmentStrategy = data.treatmentStrategy;
      }

      // Validate dates
      if ('dateIdentified' in data) {
        if (data.dateIdentified instanceof Date && !isNaN(data.dateIdentified.getTime())) {
          validated.dateIdentified = data.dateIdentified;
        } else if (typeof data.dateIdentified === 'string') {
          const date = new Date(data.dateIdentified);
          if (!isNaN(date.getTime())) {
            validated.dateIdentified = date;
          }
        }
      }

      if ('nextReview' in data) {
        if (data.nextReview === undefined || data.nextReview === null) {
          validated.nextReview = undefined;
        } else if (data.nextReview instanceof Date && !isNaN(data.nextReview.getTime())) {
          validated.nextReview = data.nextReview;
        } else if (typeof data.nextReview === 'string') {
          const date = new Date(data.nextReview);
          if (!isNaN(date.getTime())) {
            validated.nextReview = date;
          }
        }
      }

      // Validate arrays
      if ('frameworkIds' in data && Array.isArray(data.frameworkIds)) {
        validated.frameworkIds = data.frameworkIds.filter((id) => typeof id === 'string');
      }

      if ('tags' in data && Array.isArray(data.tags)) {
        validated.tags = data.tags.filter((tag) => typeof tag === 'string');
      }

      // Merge validated data
      const updated = { ...prev, ...validated };

      // Auto-calculate risk score if likelihood or impact changed
      if ('likelihood' in validated || 'impact' in validated) {
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
};

export function useRiskFlow() {
  const context = useContext(RiskFlowContext);
  if (!context) {
    throw new Error('useRiskFlow must be used within RiskFlowProvider');
  }
  return context;
}

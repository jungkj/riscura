'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import type { Risk } from '@/types';

interface ExecutiveSummaryProps {
  data: any;
  risks: Risk[];
  viewMode: string;
}

export function ExecutiveSummary({ data, risks, viewMode }: ExecutiveSummaryProps) {
  return (
    <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
      <DaisyCardHeader>
        <DaisyCardTitle className="text-lg font-semibold text-[#191919] font-inter">
          Executive Summary
        </DaisyCardTitle>
      
      <DaisyCardContent>
        <p className="text-sm text-[#A8A8A8] font-inter">
          Your personalized risk management summary will appear here.
        </p>
      </DaisyCardBody>
    </DaisyCard>
  );
} 
'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import type { Risk } from '@/types';

interface InteractiveRiskLandscapeProps {
  risks: Risk[];
  controls: any[];
}

export function InteractiveRiskLandscape({ risks, controls }: InteractiveRiskLandscapeProps) {
  return (
    <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]">
      <DaisyCardHeader>
        <DaisyCardTitle className="text-lg font-semibold text-[#191919] font-inter">
          Interactive Risk Landscape
        </DaisyCardTitle>
      
      <DaisyCardContent>
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-[#D8C3A5] rounded-lg">
          <p className="text-[#A8A8A8] font-inter">
            3D Risk Visualization coming soon...
          </p>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
} 
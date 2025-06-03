'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Risk } from '@/types';

interface InteractiveRiskLandscapeProps {
  risks: Risk[];
  controls: any[];
}

export function InteractiveRiskLandscape({ risks, controls }: InteractiveRiskLandscapeProps) {
  return (
    <Card className="bg-[#FAFAFA] border-[#D8C3A5]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#191919] font-inter">
          Interactive Risk Landscape
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-[#D8C3A5] rounded-lg">
          <p className="text-[#A8A8A8] font-inter">
            3D Risk Visualization coming soon...
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 
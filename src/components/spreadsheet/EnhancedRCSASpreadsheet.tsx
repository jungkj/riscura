'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardHeader, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';

interface EnhancedRCSASpreadsheetProps {
  data?: any[];
  onDataChange?: (data: any[]) => void;
  className?: string;
}

export default function EnhancedRCSASpreadsheet({ 
  data = [], 
  onDataChange,
  className = '' 
}: EnhancedRCSASpreadsheetProps) {
  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Enhanced RCSA Spreadsheet</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardBody>
          <p>RCSA Spreadsheet component temporarily simplified for emergency deployment.</p>
          <p>Data count: {data.length}</p>
          <DaisyButton onClick={() => onDataChange?.([])} className="mt-4">
            Reset Data
          </DaisyButton>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}
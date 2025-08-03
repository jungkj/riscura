'use client';

import React from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

interface RCSASpreadsheetProps {
  data?: any[];
  className?: string;
}

export default function RCSASpreadsheet({ data = [], className = '' }: RCSASpreadsheetProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle>RCSA Spreadsheet</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <p>RCSA Spreadsheet component temporarily simplified for emergency deployment.</p>
          <p>Data count: {data.length}</p>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

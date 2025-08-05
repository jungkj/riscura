'use client';

import React from 'react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

export default function DragDropImport({ organizationId, userId }: any) {
  return (
    <div className="space-y-6">
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle>Import Data</DaisyCardTitle>
          <p>File import functionality is temporarily disabled while we resolve build issues.</p>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

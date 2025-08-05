'use client';

import React from 'react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

export default function WorkflowPage() {
  return (
    <div className="p-6">
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle>Workflows</DaisyCardTitle>
          <p>Workflow functionality is temporarily disabled while we resolve build issues.</p>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

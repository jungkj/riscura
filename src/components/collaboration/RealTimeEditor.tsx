'use client';

import React from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { Edit3 } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

// Simplified version for testing
interface RealTimeEditorProps {
  content: string
  onChange: (_content: string) => void;
  currentUser: any;
  className?: string;
}

export function RealTimeEditor({ content, onChange, currentUser, className }: RealTimeEditorProps) {
  return (
    <div className={`relative ${className}`}>
      <DaisyCard>
        <DaisyCardBody>
          <DaisyCardTitle className="flex items-center">
            <Edit3 className="w-5 h-5 mr-2" />
            Real-time Editor
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody>
          <div className="text-center py-8 text-gray-500">
            <p>Real-time editor temporarily simplified for build testing</p>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
}

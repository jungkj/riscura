'use client';

import React from 'react';
import { DaisyCard, DaisyCardHeader, DaisyCardContent, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { Edit3 } from 'lucide-react';

// Simplified version for testing
interface RealTimeEditorProps {
  content: string;
  onChange: (content: string) => void;
  currentUser: any;
  className?: string;
}

export function RealTimeEditor({
  content,
  onChange,
  currentUser,
  className
}: RealTimeEditorProps) {
  return (
    <div className={`relative ${className}`}>
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle className="flex items-center">
            <Edit3 className="w-5 h-5 mr-2" />
            Real-time Editor
          </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Real-time editor temporarily simplified for build testing</p>
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </div>
  );
}
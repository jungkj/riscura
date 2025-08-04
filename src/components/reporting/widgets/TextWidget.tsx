'use client';

import React from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Copy, Trash2 } from 'lucide-react';
import { ReportWidget } from '@/lib/reporting/engine';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

interface TextWidgetProps {
  widget: ReportWidget;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportWidget>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function TextWidget({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: TextWidgetProps) {
  const content = widget.dataSource.source || 'Click to edit text content...';

  return (
    <DaisyCard 
      className={`h-full ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <DaisyCardBody className="pb-2 flex flex-row items-center justify-between" >
  <DaisyCardTitle className="text-sm font-medium">
</DaisyCard>{widget.title}</DaisyCardTitle>
        <div className="flex items-center space-x-1">
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
          </DaisyButton>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </DaisyButton>
        </div>
      
      <DaisyCardBody className="pt-0" >
  <div className="text-sm text-gray-700 whitespace-pre-wrap">
</DaisyCardBody>
          {content}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
} 
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { ReportWidget } from '@/lib/reporting/engine';

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
    <Card 
      className={`h-full ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {content}
        </div>
      </CardContent>
    </Card>
  );
} 
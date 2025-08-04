'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { cn } from '@/lib/utils';
// import { Calendar, Star, User, Calculator } from 'lucide-react';
import { Cell, Column } from './SpreadsheetGrid';

interface SpreadsheetCellProps {
  cell: Cell;
  column: Column;
  rowId: string;
  isEditing: boolean;
  isSelected: boolean;
  isReadOnly: boolean;
  onClick: (rowId: string, columnId: string, currentValue: string) => void;
  onSave: (_value: string) => void;
  onValueChange: (_value: string) => void;
}

export const SpreadsheetCell: React.FC<SpreadsheetCellProps> = ({
  cell,
  column,
  rowId,
  isEditing,
  isSelected,
  isReadOnly,
  onClick,
  onSave,
  onValueChange
}) => {
  const [localValue, setLocalValue] = useState(cell.displayValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(cell.displayValue);
  }, [cell.displayValue]);

  useEffect(() => {
    if (isEditing) {
      // Focus the input when editing starts
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        } else if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 0);
    }
  }, [isEditing]);

  const handleInputChange = (_value: string) => {
    setLocalValue(value);
    onValueChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(cell.displayValue);
      onSave(cell.displayValue);
    }
  };

  const formatDisplayValue = (_value: any, dataType: string): React.ReactNode => {
    if (!value && value !== 0) return null;

    switch (dataType) {
      case 'NUMBER':
        return typeof value === 'number' ? value.toLocaleString() : value;
        
      case 'DATE':
        try {
          const date = new Date(value);
          return date.toLocaleDateString();
        } catch {
          return value;
        }
        
      case 'RATING':
        const rating = parseInt(value) || 0;
        return (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
                )} />
            ))}
            <span className="text-xs text-gray-500 ml-1">({rating})</span>
          </div>
        );
        
      case 'USER_REFERENCE':
        return (
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="truncate">{value}</span>
          </div>
        );
        
      case 'DROPDOWN':
        return (
          <DaisyBadge variant="secondary" className="text-xs" >
  {value}
</DaisyBadge>
          </DaisyBadge>
        );
        
      case 'CALCULATED':
        return (
          <div className="flex items-center space-x-1 text-blue-600">
            <Calculator className="w-3 h-3" />
            <span>{value}</span>
          </div>
        );
        
      case 'BOOLEAN':
        return (
          <div className="flex items-center justify-center">
            {value ? (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            ) : (
              <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
            )}
          </div>
        );
        
      default:
        return value;
    }
  };

  const renderEditingInput = () => {
    switch (column.dataType) {
      case 'DROPDOWN':
        return (
          <DaisySelect
            value={localValue}
            onValueChange={(value) => {
              handleInputChange(value);
              onSave(value);
            }}
          >
            <DaisySelectTrigger className="h-8 border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500">
                <DaisySelectValue />
</DaisySelect>
            <DaisySelectContent >
                {column.dropdownOptions?.map((option) => (
                <DaisySelectItem key={option} value={option} >
                    {option}
                </DaisySelectItem>
              ))}
            </DaisySelectContent>
          </DaisySelect>
        );

      case 'RATING':
        return (
          <div className="flex items-center space-x-1 p-1">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const newRating = (i + 1).toString();
                  handleInputChange(newRating);
                  onSave(newRating);
                }}
                className="focus:outline-none"
              >
                <Star
                  className={cn(
                    "w-4 h-4 hover:text-yellow-400 transition-colors",
                    i < parseInt(localValue) ? "text-yellow-400 fill-current" : "text-gray-300"
                  )} />
              </button>
            ))}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="flex items-center justify-center p-1">
            <button
              type="button"
              onClick={() => {
                const newValue = localValue === 'true' ? 'false' : 'true';
                handleInputChange(newValue);
                onSave(newValue);
              }}
              className="w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center hover:border-blue-500 focus:outline-none focus:border-blue-500"
            >
              {localValue === 'true' && (
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              )}
            </button>
          </div>
        );

      case 'NUMBER':
        return (
          <DaisyInput
            ref={inputRef}
            type="number"
            value={localValue}
            onChange={(e) = />
handleInputChange(e.target.value)}
            onBlur={() => onSave(localValue)}
            onKeyDown={handleKeyDown}
            className="h-8 border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500" />
        );

      case 'DATE':
        return (
          <DaisyInput
            ref={inputRef}
            type="date"
            value={localValue}
            onChange={(e) = />
handleInputChange(e.target.value)}
            onBlur={() => onSave(localValue)}
            onKeyDown={handleKeyDown}
            className="h-8 border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500" />
        );

      default:
        // Check if it's a multi-line text field
        const isMultiLine = localValue.length > 50 || localValue.includes('\n');
        
        if (isMultiLine) {
          return (
            <DaisyTextarea
              ref={textareaRef}
              value={localValue}
              onChange={(e) = />
handleInputChange(e.target.value)}
              onBlur={() => onSave(localValue)}
              onKeyDown={handleKeyDown}
              className="min-h-8 border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1} />
          );
        };

  return (
          <DaisyInput
            ref={inputRef}
            value={localValue}
            onChange={(e) = />
handleInputChange(e.target.value)}
            onBlur={() => onSave(localValue)}
            onKeyDown={handleKeyDown}
            className="h-8 border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500" />
        );
    }
  };

  if (isEditing && !isReadOnly) {
    return (
      <div className="relative w-full h-full">
        {renderEditingInput()}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "h-10 px-2 py-1 cursor-cell hover:bg-gray-50 truncate text-sm flex items-center transition-colors",
        isSelected && "bg-blue-50",
        cell.hasError && "bg-red-50",
        isReadOnly && "cursor-not-allowed bg-gray-50",
        column.isLocked && "bg-gray-100"
      )}
      onClick={() => !isReadOnly && onClick(rowId, column.id, cell.displayValue)}
    >
      {cell.displayValue ? (
        <div className="w-full flex items-center">
          {formatDisplayValue(cell.value, column.dataType)}
        </div>
      ) : (
        <span className="text-gray-400 italic text-xs">
          {isReadOnly ? '—' : 'Click to edit'}
        </span>
      )}
      
      {/* Required field indicator */}
      {column.isRequired && !cell.displayValue && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-400 rounded-full transform translate-x-1 -translate-y-1"></div>
      )}
    </div>
  );
};

export default SpreadsheetCell; 
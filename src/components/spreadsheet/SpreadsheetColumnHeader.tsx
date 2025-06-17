'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  ChevronDown, 
  Type, 
  Hash, 
  Calendar, 
  List, 
  Star, 
  User, 
  Calculator, 
  ToggleLeft,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Column } from './SpreadsheetGrid';

interface SpreadsheetColumnHeaderProps {
  column: Column;
  onResize: (width: number) => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onSort?: (direction: 'asc' | 'desc') => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const dataTypeIcons = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  DROPDOWN: List,
  RATING: Star,
  USER_REFERENCE: User,
  CALCULATED: Calculator,
  BOOLEAN: ToggleLeft
};

export const SpreadsheetColumnHeader: React.FC<SpreadsheetColumnHeaderProps> = ({
  column,
  onResize,
  onInsertLeft,
  onInsertRight,
  onDelete,
  onHide,
  onSort,
  isDragging,
  onDragStart,
  onDragEnd
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) return; // Only resize from the resize handle
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(column.width);
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + (e.clientX - startX));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [column.width, onResize, startX, startWidth]);

  const IconComponent = dataTypeIcons[column.dataType] || Type;

  return (
    <div
      ref={headerRef}
      className={cn(
        "group relative bg-gray-50 border-r flex items-center font-medium text-sm text-gray-700 h-10 select-none",
        isDragging && "opacity-50",
        isResizing && "cursor-col-resize"
      )}
      style={{ width: column.width }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Main header content */}
      <div className="flex items-center px-3 w-full min-w-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Data type icon */}
          <IconComponent className="w-3 h-3 text-gray-500 flex-shrink-0" />
          
          {/* Column name */}
          <span className="truncate font-medium">{column.name}</span>
          
          {/* Required indicator */}
          {column.isRequired && (
            <span className="text-red-500 text-xs flex-shrink-0">*</span>
          )}
          
          {/* Locked indicator */}
          {column.isLocked && (
            <div className="w-3 h-3 bg-gray-400 rounded-sm flex-shrink-0" title="Locked column" />
          )}
        </div>

        {/* Column menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {/* Sorting */}
            {onSort && (
              <>
                <DropdownMenuItem onClick={() => onSort('asc')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Sort A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort('desc')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Sort Z-A
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Insert columns */}
            <DropdownMenuItem onClick={onInsertLeft}>
              <Plus className="h-4 w-4 mr-2" />
              Insert column left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onInsertRight}>
              <Plus className="h-4 w-4 mr-2" />
              Insert column right
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Column properties */}
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Column properties
            </DropdownMenuItem>
            
            {/* Hide/Show */}
            {onHide && (
              <DropdownMenuItem onClick={onHide}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide column
              </DropdownMenuItem>
            )}
            
            {/* Delete */}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete column
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
        title="Drag to resize column"
      />
      
      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500" />
      )}
    </div>
  );
};

export default SpreadsheetColumnHeader; 
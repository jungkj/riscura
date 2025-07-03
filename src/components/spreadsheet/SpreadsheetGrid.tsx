'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { SpreadsheetCell } from './SpreadsheetCell';
import { SpreadsheetColumnHeader } from './SpreadsheetColumnHeader';

export interface Column {
  id: string;
  name: string;
  position: number;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'RATING' | 'USER_REFERENCE' | 'CALCULATED' | 'BOOLEAN';
  isRequired?: boolean;
  width: number;
  dropdownOptions?: string[];
  validationRules?: any;
  formatSettings?: any;
  isLocked?: boolean;
}

export interface Row {
  id: string;
  position: number;
  cells: Cell[];
  isHidden?: boolean;
  linkedRiskId?: string;
  linkedControlId?: string;
}

export interface Cell {
  id: string;
  columnId: string;
  value: any;
  displayValue: string;
  isLocked?: boolean;
  hasError?: boolean;
  comments?: Comment[];
}

export interface SpreadsheetGridProps {
  columns: Column[];
  rows: Row[];
  onCellEdit: (rowId: string, columnId: string, value: any) => void;
  onColumnResize: (columnId: string, width: number) => void;
  onRowInsert: (position: number) => void;
  onColumnInsert: (position: number) => void;
  isReadOnly?: boolean;
  selectedCells?: string[];
  onCellSelect?: (cellIds: string[]) => void;
  className?: string;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  columns,
  rows,
  onCellEdit,
  onColumnResize,
  onRowInsert,
  onColumnInsert,
  isReadOnly = false,
  selectedCells = [],
  onCellSelect,
  className
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string; value: string } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  // Virtual scrolling for columns (if needed for large datasets)
  const columnVirtualizer = useVirtualizer({
    count: columns.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => columns[index]?.width || 150,
    overscan: 3,
    horizontal: true,
  });

  const handleCellClick = useCallback((rowId: string, columnId: string, currentValue: string) => {
    if (isReadOnly) return;
    
    const column = columns.find(c => c.id === columnId);
    if (column?.isLocked) return;

    setEditingCell({ rowId, columnId, value: currentValue });
  }, [columns, isReadOnly]);

  const handleCellSave = useCallback((newValue: string) => {
    if (!editingCell) return;

    onCellEdit(editingCell.rowId, editingCell.columnId, newValue);
    setEditingCell(null);
  }, [editingCell, onCellEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(editingCell.value);
      
      // Move to next row
      const currentRowIndex = rows.findIndex(r => r.id === editingCell.rowId);
      const nextRow = rows[currentRowIndex + 1];
      if (nextRow) {
        setEditingCell({ 
          rowId: nextRow.id, 
          columnId: editingCell.columnId, 
          value: getCellValue(nextRow.id, editingCell.columnId) 
        });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSave(editingCell.value);
      
      // Move to next column
      const currentColumnIndex = columns.findIndex(c => c.id === editingCell.columnId);
      const nextColumn = columns[currentColumnIndex + (e.shiftKey ? -1 : 1)];
      if (nextColumn) {
        setEditingCell({ 
          rowId: editingCell.rowId, 
          columnId: nextColumn.id, 
          value: getCellValue(editingCell.rowId, nextColumn.id) 
        });
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  }, [editingCell, rows, columns, handleCellSave]);

  const getCellValue = (rowId: string, columnId: string): string => {
    const row = rows.find(r => r.id === rowId);
    const cell = row?.cells.find(c => c.columnId === columnId);
    return cell?.displayValue || '';
  };

  const getCell = (rowId: string, columnId: string): Cell | undefined => {
    const row = rows.find(r => r.id === rowId);
    return row?.cells.find(c => c.columnId === columnId);
  };

  // Calculate total width for horizontal scrolling
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0) + 60; // +60 for row numbers

  return (
    <div 
      ref={parentRef}
      className={cn("spreadsheet-grid relative overflow-auto border rounded-lg bg-white", className)}
      style={{ height: '600px' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        ref={scrollElementRef}
        className="overflow-auto h-full w-full"
        style={{ contain: 'strict' }}
      >
        <div style={{ width: totalWidth, height: rowVirtualizer.getTotalSize() + 40 }}>
          {/* Column Headers */}
          <div className="sticky top-0 z-20 bg-gray-50 border-b flex" style={{ height: 40 }}>
            {/* Row number header */}
            <div className="w-12 h-10 border-r bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 sticky left-0 z-30">
              #
            </div>
            
            {/* Column headers */}
            {columns.map((column, index) => (
              <SpreadsheetColumnHeader
                key={column.id}
                column={column}
                onResize={(width) => onColumnResize(column.id, width)}
                onInsertLeft={() => onColumnInsert(index)}
                onInsertRight={() => onColumnInsert(index + 1)}
                isDragging={draggedColumn === column.id}
                onDragStart={() => setDraggedColumn(column.id)}
                onDragEnd={() => setDraggedColumn(null)}
              />
            ))}
          </div>

          {/* Virtualized Rows */}
          <div className="relative">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <div
                  key={row.id}
                  className="absolute left-0 right-0 flex border-b hover:bg-gray-50 group"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Row number */}
                  <div className="w-12 h-10 border-r bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-500 sticky left-0 z-10">
                    {virtualRow.index + 1}
                  </div>

                  {/* Row cells */}
                  {columns.map((column) => {
                    const cell = getCell(row.id, column.id);
                    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
                    const isSelected = selectedCells.includes(`${row.id}-${column.id}`);

                    return (
                      <div
                        key={`${row.id}-${column.id}`}
                        className={cn(
                          "border-r relative",
                          isSelected && "bg-blue-50",
                          cell?.hasError && "bg-red-50"
                        )}
                        style={{ width: column.width }}
                      >
                        <SpreadsheetCell
                          cell={cell || {
                            id: `${row.id}-${column.id}`,
                            columnId: column.id,
                            value: '',
                            displayValue: ''
                          }}
                          column={column}
                          rowId={row.id}
                          isEditing={isEditing || false}
                          isSelected={isSelected}
                          isReadOnly={isReadOnly || column.isLocked}
                          onClick={handleCellClick}
                          onSave={handleCellSave}
                          onValueChange={(value) => 
                            setEditingCell(prev => prev ? { ...prev, value } : null)
                          }
                        />
                        
                        {/* Cell comment indicator */}
                        {cell?.comments && cell.comments.length > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-400 rounded-full transform translate-x-1 -translate-y-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Add Row Button */}
          <div 
            className="flex border-b sticky bottom-0 bg-white z-10"
            style={{ 
              transform: `translateY(${rowVirtualizer.getTotalSize()}px)`,
              height: 40
            }}
          >
            <div className="w-12 h-10 border-r bg-gray-50"></div>
            <div className="flex-1 h-10 flex items-center px-3">
              <button
                onClick={() => onRowInsert(rows.length)}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 transition-colors"
                disabled={isReadOnly}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {rows.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No data yet</p>
            <p className="text-sm text-gray-400 mt-1">Start by adding your first row</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadsheetGrid; 
'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
import { DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyDialogTitle } from '@/components/ui/daisy-components';
  MoreHorizontal, 
  Plus, 
  Sparkles, 
  Calendar,
  User,
  Hash,
  Type,
  ChevronDown,
  Maximize2,
  Bot,
  Zap,
  Minus,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger, DaisyDropdownMenuSeparator } from '@/components/ui/DaisyDropdown';
import { cn } from '@/lib/utils';

export interface Column {
  id: string;
  name: string;
  position: number;
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'RATING' | 'USER_REFERENCE' | 'CALCULATED' | 'BOOLEAN';
  isRequired?: boolean;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  autoResize?: boolean;
  dropdownOptions?: string[];
  validationRules?: any;
  formatSettings?: any;
  isLocked?: boolean;
  section: string;
}

export interface Row {
  id: string;
  position: number;
  cells: Cell[];
  isHidden?: boolean;
  linkedRiskId?: string;
  linkedControlId?: string;
  height?: number;
  autoHeight?: boolean;
}

export interface Cell {
  id: string;
  columnId: string;
  value: any;
  displayValue: string;
  isLocked?: boolean;
  hasError?: boolean;
  comments?: any[];
}

interface CellModalData {
  cell: Cell;
  column: Column;
  rowId: string;
  rowIndex: number;
}

export interface NotionLikeSpreadsheetProps {
  columns: Column[];
  rows: Row[];
  onCellEdit: (rowId: string, columnId: string, value: any) => void;
  onColumnResize: (columnId: string, width: number) => void;
  onRowInsert: (position: number) => void;
  onColumnInsert: (position: number) => void;
  onRowDelete?: (rowId: string) => void;
  onColumnDelete?: (columnId: string) => void;
  isReadOnly?: boolean;
  selectedCells?: string[];
  onCellSelect?: (cellIds: string[]) => void;
  className?: string;
  autoResize?: boolean;
  minRowHeight?: number;
  maxRowHeight?: number;
  spreadsheetId: string;
}

export const NotionLikeSpreadsheet: React.FC<NotionLikeSpreadsheetProps> = ({
  columns,
  rows,
  onCellEdit,
  onColumnResize,
  onRowInsert,
  onColumnInsert,
  onRowDelete,
  onColumnDelete,
  isReadOnly = false,
  selectedCells = [],
  onCellSelect,
  className,
  autoResize = true,
  minRowHeight = 40,
  maxRowHeight = 200,
  spreadsheetId
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string; value: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [cellModal, setCellModal] = useState<CellModalData | null>(null);
  const [aiInsightModal, setAiInsightModal] = useState<{ cell: Cell; column: Column; insight: string } | null>(null);
  const [resizingColumn, setResizingColumn] = useState<{ columnId: string; startX: number; startWidth: number } | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });
  const [data, setData] = useState(rows.map(row => row.cells.map(cell => ({ ...cell, id: `${row.id}-${cell.columnId}` }))));
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initialWidths: Record<string, number> = {}
    columns.forEach(col => {
      initialWidths[col.id] = col.width;
    });
    return initialWidths;
  });
  
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: string} | null>(null);
  const [aiInsightCell, setAiInsightCell] = useState<{row: number, col: string} | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');

  const gridRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Calculate optimal column widths based on content
  const calculateOptimalColumnWidth = useCallback((column: Column, rows: Row[]) => {
    const minWidth = column.minWidth || 80
    const maxWidth = column.maxWidth || 400;
    
    // Calculate content width for header
    const headerLength = column.name.length * 8 + 60; // Approximate character width + padding
    
    // Calculate content width for cells
    const cellWidths = rows.map(row => {
      const cell = row.cells.find(c => c.columnId === column.id)
      if (!cell) return minWidth;
      
      const contentLength = String(cell.displayValue || '').length * 7 + 40; // Character width + padding
      return Math.min(Math.max(contentLength, minWidth), maxWidth);
    });
    
    const optimalWidth = Math.max(headerLength, ...cellWidths);
    return Math.min(Math.max(optimalWidth, minWidth), maxWidth);
  }, []);

  // Auto-resize columns based on content
  const autoResizeColumns = useCallback(() => {
    if (!autoResize) return
    
    columns.forEach(column => {
      if (column.autoResize !== false) {
        const optimalWidth = calculateOptimalColumnWidth(column, rows);
        if (Math.abs(optimalWidth - column.width) > 10) { // Only resize if significant difference
          onColumnResize(column.id, optimalWidth);
        }
      }
    });
  }, [columns, rows, autoResize, calculateOptimalColumnWidth, onColumnResize]);

  // Calculate dynamic row height based on content
  const calculateRowHeight = useCallback((row: Row) => {
    if (!autoResize || row.autoHeight === false) {
      return row.height || minRowHeight
    }

    let maxHeight = minRowHeight;
    
    row.cells.forEach(cell => {
      const column = columns.find(c => c.id === cell.columnId);
      if (!column) return;
      
      const content = String(cell.displayValue || '');
      const lines = Math.ceil(content.length / (column.width / 8)); // Approximate characters per line
      const contentHeight = Math.max(minRowHeight, lines * 20 + 20); // Line height + padding
      
      maxHeight = Math.max(maxHeight, Math.min(contentHeight, maxRowHeight));
    });
    
    return maxHeight;
  }, [columns, autoResize, minRowHeight, maxRowHeight]);

  // Calculate responsive grid layout
  const gridLayout = useMemo(() => {
    const totalColumns = columns.length
    const totalRows = rows.length;
    const availableWidth = viewportSize.width - 48; // Account for row numbers
    const availableHeight = viewportSize.height - 120; // Account for header/toolbar
    
    // Calculate if we need to adjust column sizes for viewport
    const totalColumnWidth = columns.reduce((sum, col) => sum + col.width, 0)
    const needsHorizontalScaling = totalColumnWidth > availableWidth;
    
    // Calculate scaling factors
    const horizontalScale = needsHorizontalScaling ? availableWidth / totalColumnWidth : 1
    const minCellSize = 80;
    
    return {
      totalColumns,
      totalRows,
      availableWidth,
      availableHeight,
      horizontalScale: Math.max(horizontalScale, minCellSize / Math.max(...columns.map(c => c.width))),
      needsHorizontalScaling,
      estimatedRowsVisible: Math.floor(availableHeight / minRowHeight),
      estimatedColumnsVisible: Math.floor(availableWidth / 150) // Average column width
    }
  }, [viewportSize, columns, rows, minRowHeight]);

  // Update viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect()
        setViewportSize({ width: rect.width, height: rect.height });
      }
    }

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Auto-resize columns when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      autoResizeColumns()
    }, 100); // Debounce
    
    return () => clearTimeout(timer);
  }, [rows, autoResizeColumns]);

  // Handle column resizing
  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string, currentWidth: number) => {
    e.preventDefault()
    setResizingColumn({
      columnId,
      startX: e.clientX,
      startWidth: currentWidth
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return;
      
      const diff = e.clientX - resizingColumn.startX;
      const column = columns.find(c => c.id === resizingColumn.columnId);
      const minWidth = column?.minWidth || 80;
      const maxWidth = column?.maxWidth || 600;
      const newWidth = Math.min(Math.max(resizingColumn.startWidth + diff, minWidth), maxWidth);
      
      onColumnResize(resizingColumn.columnId, newWidth);
    }

    const handleMouseUp = () => {
      setResizingColumn(null);
    }

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

  return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [resizingColumn, onColumnResize, columns]);

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

  const handleCellDoubleClick = useCallback((cell: Cell, column: Column, rowId: string, rowIndex: number) => {
    setCellModal({ cell, column, rowId, rowIndex });
  }, []);

  const handleAIInsight = async (_rowIndex: number, columnKey: string) => {
    setAiInsightCell({ row: rowIndex, col: columnKey });
    
    // Simulate AI analysis
    const insights = [
      "This risk shows high inherent rating due to manual processes. Consider implementing automated controls to reduce likelihood.",
      "The control frequency appears adequate, but evidence documentation could be strengthened for better audit trail.",
      "Risk materiality classification aligns with impact assessment. Monitor for changes in business environment.",
      "Control effectiveness rating is positive, but operating effectiveness needs validation through testing.",
      "Consider implementing continuous monitoring for this high-impact risk area."
    ]
    
    setTimeout(() => {
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
    }, 1500);
  }

  return (
    <div className={cn("notion-spreadsheet bg-white h-full flex flex-col", className)}>
      {/* Enhanced Toolbar */}
      <div className="border-b bg-gray-50/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">Risk Assessment Matrix</h3>
            <DaisyBadge variant="outline" className="text-xs" >
  {rows.length} rows × {columns.length} cols
</DaisyBadge>
            </DaisyBadge>
            <DaisyBadge variant="secondary" className="text-xs" >
  {gridLayout.estimatedRowsVisible} visible
</DaisyBadge>
            </DaisyBadge>
          </div>
          <div className="flex items-center space-x-2">
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              onClick={handleAutoFitColumns}
              title="Auto-fit all columns" >
  <RotateCcw className="h-4 w-4 mr-1" />
</DaisyButton>
              Auto-fit
            </DaisyButton>
            <DaisyButton variant="ghost" size="sm" onClick={() => onRowInsert(rows.length)} />
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </DaisyButton>
            <DaisyButton variant="ghost" size="sm" onClick={() => onColumnInsert(columns.length)} />
              <Plus className="h-4 w-4 mr-1" />
              Add Column
            </DaisyButton>
          </div>
        </div>
        
        {/* Grid Statistics */}
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <span>Grid: {gridLayout.totalColumns}×{gridLayout.totalRows}</span>
          <span>Viewport: {Math.round(viewportSize.width)}×{Math.round(viewportSize.height)}</span>
          {gridLayout.needsHorizontalScaling && (
            <DaisyBadge variant="outline" className="text-xs text-orange-600" >
  Scaled {Math.round(gridLayout.horizontalScale * 100)}%
</DaisyBadge>
            </DaisyBadge>
          )}
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div ref={gridRef} className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full border-collapse">
          {/* Section Headers */}
          <thead>
            <tr className="bg-gray-50 border-b">
              {Object.entries(columnSections).map(([sectionName, columns]) => (
                <th
                  key={sectionName}
                  colSpan={columns.length}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200"
                  style={{ 
                    minWidth: columns.reduce((sum, col) => sum + columnWidths[col.id], 0) * scalingFactor 
                  }}
                >
                  {sectionName}
                </th>
              ))}
            </tr>
            
            {/* Column Headers */}
            <tr className="bg-white border-b-2 border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="relative px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50"
                  style={{ 
                    width: columnWidths[column.id] * scalingFactor,
                    minWidth: columnWidths[column.id] * scalingFactor 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2" title={column.name}>
                      {column.name}
                    </span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                  
                  {/* Resize Handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-200 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, column.id, columnWidths[column.id])} />
                </th>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td
                  className="w-12 border-r border-gray-200 bg-gray-50/30 text-center text-xs font-medium text-gray-500 group-hover:bg-gray-100"
                  style={{ height: calculateRowHeight(row) }}
                >
                  <div className="flex items-center justify-center h-full">
                    {rowIndex + 1}
                  </div>
                </td>
                {columns.map((column) => {
                  const cell = getCell(row.id, column.id);
                  const cellId = `${row.id}-${column.id}`;
                  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
                  const isHovered = hoveredCell === cellId;
                  const scaledWidth = autoResize && gridLayout.needsHorizontalScaling 
                    ? column.width * gridLayout.horizontalScale 
                    : column.width;

                  return (
                    <td
                      key={cellId}
                      className="relative border-r border-gray-200 p-0 group/cell"
                      style={{ 
                        width: scaledWidth, 
                        minWidth: columnWidths[column.id] * scalingFactor,
                        height: calculateRowHeight(row)
                      }}
                      onMouseEnter={() => setHoveredCell(cellId)}
                      onMouseLeave={() => setHoveredCell(null)}
                      ref={(el) => {
                        if (el) cellRefs.current.set(cellId, el);
                      }}
                    >
                      {isEditing ? (
                        <div className="p-2 h-full">
                          {column.dataType === 'DROPDOWN' ? (
                            <DaisySelect
                              value={editingCell.value}
                              onValueChange={(value) => {
                                setEditingCell(prev => prev ? { ...prev, value } : null);
                                handleCellSave(value);
                              }}
                            >
                              <DaisySelectTrigger className="h-8 border-0 focus:ring-2 focus:ring-blue-500">
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
                          ) : (
                            <DaisyTextarea
                              value={editingCell.value}
                              onChange={(e) =>
setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                              onBlur={() => handleCellSave(editingCell.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCellSave(editingCell.value);
                                }
                                if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="min-h-[32px] max-h-[160px] border-0 focus:ring-2 focus:ring-blue-500 resize-none"
                              style={{ height: Math.min(calculateRowHeight(row) - 16, 160) }}
                              autoFocus />
                          )}
                        </div>
                      ) : (
                        <div
                          className="relative px-3 py-2 cursor-pointer flex items-center justify-between group/content hover:bg-blue-50/50 transition-colors h-full"
                          onClick={() => handleCellClick(row.id, column.id, cell?.displayValue || '')}
                          onDoubleClick={() => cell && handleCellDoubleClick(cell, column, row.id, rowIndex)}
                        >
                          <div className="flex-1 min-w-0 overflow-hidden">
                            {formatCellValue(cell?.value, column.id)}
                          </div>
                          
                          {/* Cell Actions */}
                          {Boolean(isHovered) && (
                            <div className="flex items-center space-x-1 opacity-0 group-hover/content:opacity-100 transition-opacity ml-2">
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cell && handleCellDoubleClick(rowIndex, column.id);
                                }}
                              >
                                <Maximize2 className="h-3 w-3" />
                              </DaisyTextarea>
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cell && handleAIInsight(rowIndex, column.id);
                                }}
                              >
                                <Sparkles className="h-3 w-3" />
                              </DaisyButton>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Add Row */}
            <tr className="group hover:bg-gray-50/50">
              <td className="w-12 h-10 border-r border-gray-200 bg-gray-50/30"></td>
              <td colSpan={columns.length} className="border-r border-gray-200">
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start text-gray-500 hover:text-gray-700"
                  onClick={() => onRowInsert(rows.length)} />
                  <Plus className="h-4 w-4 mr-2" />
                  Add row
                </DaisyButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cell Detail Modal */}
      <DaisyDialog open={!!cellModal} onOpenChange={() => setCellModal(null)} />
        <DaisyDialogContent className="max-w-2xl" >
  <DaisyDialogHeader>
</DaisyDialog>
            <DaisyDialogTitle className="flex items-center space-x-2" >
  <div className="text-gray-500">
</DaisyDialogTitle>
                {Boolean(cellModal) && getDataTypeIcon(cellModal.column.dataType)}
              </div>
              <span>{cellModal?.column.name}</span>
              <DaisyBadge variant="outline">Row {(cellModal?.rowIndex || 0) + 1}</DaisyBadge>
            </DaisyDialogTitle>
          </DaisyDialogHeader>
          
          {Boolean(cellModal) && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Value
                </label>
                <DaisyTextarea
                  value={cellModal.cell.displayValue}
                  onChange={(e) =>
{
                    const updatedCell = { ...cellModal.cell, displayValue: e.target.value, value: e.target.value }
                    setCellModal({ ...cellModal, cell: updatedCell });
                  }}
                  className="min-h-[100px]"
                  placeholder="Enter value..." />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <DaisyButton
                    variant="outline"
                    size="sm"
                    onClick={() => cellModal && generateAIInsight(cellModal.cell, cellModal.column)}
                    disabled={generatingInsight}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50" />
                    {generatingInsight ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Insights
                      </>
                    )}
                  </DaisyTextarea>
                  <DaisyBadge variant="secondary" className="text-xs" >
  <Zap className="h-3 w-3 mr-1" />
</DaisyBadge>
                    1 Credit
                  </DaisyBadge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DaisyButton variant="outline" onClick={() =>
          setCellModal(null)} />
                    Cancel
                  
        </DaisyButton>
                  <DaisyButton
                    onClick={() =>
          {
                      if (cellModal) {
                        onCellEdit(cellModal.rowId, cellModal.column.id, cellModal.cell.value);
                        setCellModal(null);
                      }
                    }}
                  >
                    Save Changes
                  
        </DaisyButton>
                </div>
              </div>
            </div>
          )}
        </DaisyDialogContent>
      </DaisyDialog>

      {/* AI Insight Modal */}
      <DaisyDialog open={!!aiInsightCell} onOpenChange={() => setAiInsightCell(null)} />
        <DaisyDialogContent className="max-w-xl" >
  <DaisyDialogHeader>
</DaisyDialog>
            <DaisyDialogTitle className="flex items-center gap-2" >
  <Sparkles className="w-5 h-5 text-purple-600" />
</DaisyDialogTitle>
              AI Risk Insights
              <DaisyBadge variant="secondary" className="bg-purple-100 text-purple-700" >
  1 Credit
</DaisyBadge>
              </DaisyBadge>
            </DaisyDialogTitle>
          </DaisyDialogHeader>
          <div className="space-y-4">
            {aiInsight ? (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700">{aiInsight}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-sm text-gray-600">Analyzing risk data...</span>
              </div>
            )}
            <div className="flex justify-end">
              <DaisyButton onClick={() =>
          {
                setAiInsightCell(null);
                setAiInsight('');
              }}>
                Close
              
        </DaisyButton>
            </div>
          </div>
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
} 
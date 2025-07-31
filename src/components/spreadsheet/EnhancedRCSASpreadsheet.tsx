'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { VariableSizeGrid as Grid } from 'react-window';
import { 
  Save,
  Loader2,
  Plus,
  Filter,
  Download,
  ChevronDown,
  Shield,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Hash,
  Sparkles,
  FileSpreadsheet,
  Eye,
  Edit3,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { useRCSA } from '@/context/RCSAContext';
import { rcsaApiClient } from '@/lib/api/rcsa-client';
import { 
  Risk, 
  Control,
  RiskLevel,
  RiskStatus,
  ControlStatus,
  RiskCategory,
  ControlType,
  ControlCategory,
  AutomationLevel,
  EffectivenessRating,
  Priority
} from '@/types/rcsa.types';

// Column definitions for the spreadsheet
interface Column {
  id: string;
  label: string;
  width: number;
  minWidth?: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'select' | 'date' | 'multiline';
  options?: { value: string; label: string }[];
  format?: (value: any) => string;
}

// Cell position interface
interface CellPosition {
  row: number;
  col: number;
}

// Enhanced row data structure
interface SpreadsheetRow {
  id: string;
  type: 'risk' | 'control';
  data: Risk | Control;
  cells: Record<string, any>;
  isDirty?: boolean;
  isNew?: boolean;
}

const RISK_COLUMNS: Column[] = [
  { id: 'id', label: 'ID', width: 100, editable: false },
  { id: 'title', label: 'Risk Title', width: 300, editable: true, type: 'text' },
  { id: 'description', label: 'Description', width: 400, editable: true, type: 'multiline' },
  { id: 'category', label: 'Category', width: 150, editable: true, type: 'select', 
    options: Object.values(RiskCategory).map(v => ({ value: v, label: v }))
  },
  { id: 'likelihood', label: 'Likelihood', width: 100, editable: true, type: 'number' },
  { id: 'impact', label: 'Impact', width: 100, editable: true, type: 'number' },
  { id: 'riskScore', label: 'Risk Score', width: 100, editable: false,
    format: (row: SpreadsheetRow) => {
      const likelihood = row.cells.likelihood || 0;
      const impact = row.cells.impact || 0;
      return (likelihood * impact).toString();
    }
  },
  { id: 'riskLevel', label: 'Risk Level', width: 120, editable: false,
    format: (row: SpreadsheetRow) => {
      const score = (row.cells.likelihood || 0) * (row.cells.impact || 0);
      if (score <= 6) return 'LOW';
      if (score <= 12) return 'MEDIUM';
      if (score <= 20) return 'HIGH';
      return 'CRITICAL';
    }
  },
  { id: 'status', label: 'Status', width: 150, editable: true, type: 'select',
    options: Object.values(RiskStatus).map(v => ({ value: v, label: v }))
  },
  { id: 'owner', label: 'Risk Owner', width: 200, editable: true, type: 'text' },
  { id: 'dateIdentified', label: 'Date Identified', width: 150, editable: true, type: 'date' },
  { id: 'controls', label: 'Controls', width: 100, editable: false,
    format: (row: SpreadsheetRow) => {
      const risk = row.data as Risk;
      return risk.controls?.length?.toString() || '0';
    }
  }
];

const CONTROL_COLUMNS: Column[] = [
  { id: 'id', label: 'ID', width: 100, editable: false },
  { id: 'title', label: 'Control Title', width: 300, editable: true, type: 'text' },
  { id: 'description', label: 'Description', width: 400, editable: true, type: 'multiline' },
  { id: 'type', label: 'Type', width: 150, editable: true, type: 'select',
    options: Object.values(ControlType).map(v => ({ value: v, label: v }))
  },
  { id: 'category', label: 'Category', width: 150, editable: true, type: 'select',
    options: Object.values(ControlCategory).map(v => ({ value: v, label: v }))
  },
  { id: 'frequency', label: 'Frequency', width: 150, editable: true, type: 'text' },
  { id: 'automationLevel', label: 'Automation', width: 150, editable: true, type: 'select',
    options: Object.values(AutomationLevel).map(v => ({ value: v, label: v }))
  },
  { id: 'effectivenessRating', label: 'Effectiveness', width: 150, editable: true, type: 'select',
    options: Object.values(EffectivenessRating).map(v => ({ value: v, label: v }))
  },
  { id: 'status', label: 'Status', width: 150, editable: true, type: 'select',
    options: Object.values(ControlStatus).map(v => ({ value: v, label: v }))
  },
  { id: 'owner', label: 'Control Owner', width: 200, editable: true, type: 'text' },
  { id: 'risks', label: 'Linked Risks', width: 100, editable: false,
    format: (row: SpreadsheetRow) => {
      const control = row.data as Control;
      return control.risks?.length?.toString() || '0';
    }
  }
];

export default function EnhancedRCSASpreadsheet() {
  const router = useRouter();
  const { risks, controls, refreshData } = useRCSA();
  const gridRef = useRef<Grid>(null);
  
  // State
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [viewMode, setViewMode] = useState<'risks' | 'controls' | 'combined'>('combined');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [gridDimensions, setGridDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 200 : 600
  });
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get columns based on view mode
  const columns = useMemo(() => {
    if (viewMode === 'risks') return RISK_COLUMNS;
    if (viewMode === 'controls') return CONTROL_COLUMNS;
    // Combined view - show both with a type indicator
    return [
      { id: 'type', label: 'Type', width: 80, editable: false },
      ...RISK_COLUMNS.filter(c => !['id'].includes(c.id)),
      ...CONTROL_COLUMNS.filter(c => !['id', 'title', 'description', 'status', 'owner'].includes(c.id))
    ];
  }, [viewMode]);

  // Initialize rows from risks and controls
  useEffect(() => {
    const riskRows: SpreadsheetRow[] = risks.map(risk => ({
      id: `risk-${risk.id}`,
      type: 'risk' as const,
      data: risk,
      cells: {
        id: risk.id,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        likelihood: risk.likelihood,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        status: risk.status,
        owner: risk.owner,
        dateIdentified: risk.dateIdentified,
        controls: risk.controls?.length || 0
      }
    }));

    const controlRows: SpreadsheetRow[] = controls.map(control => ({
      id: `control-${control.id}`,
      type: 'control' as const,
      data: control,
      cells: {
        id: control.id,
        title: control.title,
        description: control.description,
        type: control.type,
        category: control.category,
        frequency: control.frequency,
        automationLevel: control.automationLevel,
        effectivenessRating: control.effectivenessRating,
        status: control.status,
        owner: control.owner,
        risks: control.risks?.length || 0
      }
    }));

    let allRows: SpreadsheetRow[] = [];
    if (viewMode === 'risks') {
      allRows = riskRows;
    } else if (viewMode === 'controls') {
      allRows = controlRows;
    } else {
      // Combined view - interleave risks and their controls
      allRows = [];
      riskRows.forEach(riskRow => {
        allRows.push(riskRow);
        const risk = riskRow.data as Risk;
        const relatedControls = controlRows.filter(cr => {
          const control = cr.data as Control;
          return control.risks?.some(r => r.riskId === risk.id);
        });
        allRows.push(...relatedControls);
      });
      // Add orphaned controls
      const orphanedControls = controlRows.filter(cr => {
        const control = cr.data as Control;
        return !control.risks || control.risks.length === 0;
      });
      allRows.push(...orphanedControls);
    }

    setRows(allRows);
  }, [risks, controls, viewMode]);

  // Filter rows based on search and filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Search filter
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const matchesSearch = 
          row.cells.title?.toLowerCase().includes(searchLower) ||
          row.cells.description?.toLowerCase().includes(searchLower) ||
          row.cells.owner?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== 'all' && row.cells.status !== filterStatus) {
        return false;
      }

      // Risk level filter (only for risks)
      if (filterRiskLevel !== 'all' && row.type === 'risk') {
        const riskLevel = row.cells.riskLevel || 
          (row.cells.likelihood * row.cells.impact <= 6 ? 'LOW' :
           row.cells.likelihood * row.cells.impact <= 12 ? 'MEDIUM' :
           row.cells.likelihood * row.cells.impact <= 20 ? 'HIGH' : 'CRITICAL');
        if (riskLevel !== filterRiskLevel) return false;
      }

      return true;
    });
  }, [rows, debouncedSearchQuery, filterStatus, filterRiskLevel]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { row, col } = activeCell;
    const numRows = filteredRows.length;
    const numCols = columns.length;

    if (editingCell) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveCell();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
        setEditValue('');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSaveCell();
        // Move to next cell
        const nextColEdit = e.shiftKey ? col - 1 : col + 1;
        if (nextColEdit >= 0 && nextColEdit < numCols) {
          setActiveCell({ row, col: nextColEdit });
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) {
          setActiveCell({ row: row - 1, col });
          scrollToCellIfNeeded(row - 1, col);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < numRows - 1) {
          setActiveCell({ row: row + 1, col });
          scrollToCellIfNeeded(row + 1, col);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) {
          setActiveCell({ row, col: col - 1 });
          scrollToCellIfNeeded(row, col - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < numCols - 1) {
          setActiveCell({ row, col: col + 1 });
          scrollToCellIfNeeded(row, col + 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (columns[col].editable) {
          startEditing();
        }
        break;
      case 'F2':
        e.preventDefault();
        if (columns[col].editable) {
          startEditing();
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (columns[col].editable && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          startEditing('');
        }
        break;
      case 'Tab': {
        e.preventDefault();
        const nextCol = e.shiftKey ? col - 1 : col + 1;
        if (nextCol >= 0 && nextCol < numCols) {
          setActiveCell({ row, col: nextCol });
          scrollToCellIfNeeded(row, nextCol);
        }
        break;
      }
      default:
        // Start typing in editable cells
        if (columns[col].editable && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          startEditing(e.key);
        }
    }
  }, [activeCell, editingCell, filteredRows.length, columns]);

  // Scroll to cell if needed
  const scrollToCellIfNeeded = (row: number, col: number) => {
    gridRef.current?.scrollToItem({ rowIndex: row, columnIndex: col, align: 'smart' });
  };

  // Start editing a cell
  const startEditing = (initialValue?: string) => {
    const { row, col } = activeCell;
    const column = columns[col];
    if (!column.editable) return;

    const rowData = filteredRows[row];
    const currentValue = rowData.cells[column.id] || '';
    
    setEditingCell({ row, col });
    setEditValue(initialValue !== undefined ? initialValue : currentValue.toString());
  };

  // Save cell value
  const handleSaveCell = async () => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const column = columns[col];
    const rowData = filteredRows[row];
    
    // Update local state
    const updatedRow = {
      ...rowData,
      cells: {
        ...rowData.cells,
        [column.id]: editValue
      },
      isDirty: true
    };

    // Update rows
    setRows(prev => prev.map(r => r.id === rowData.id ? updatedRow : r));
    
    // Clear editing state
    setEditingCell(null);
    setEditValue('');

    // Auto-save after a short delay
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges(updatedRow);
    }, 1000);
  };

  // Save changes to database
  const saveChanges = async (row: SpreadsheetRow) => {
    setIsAutoSaving(true);
    
    try {
      if (row.type === 'risk') {
        const risk = row.data as Risk;
        await rcsaApiClient.updateRisk(risk.id, {
          title: row.cells.title,
          description: row.cells.description,
          category: row.cells.category,
          likelihood: parseInt(row.cells.likelihood),
          impact: parseInt(row.cells.impact),
          status: row.cells.status,
          owner: row.cells.owner
        });
      } else {
        const control = row.data as Control;
        await rcsaApiClient.updateControl(control.id, {
          title: row.cells.title,
          description: row.cells.description,
          type: row.cells.type,
          category: row.cells.category,
          frequency: row.cells.frequency,
          automationLevel: row.cells.automationLevel,
          effectivenessRating: row.cells.effectivenessRating,
          status: row.cells.status,
          owner: row.cells.owner
        });
      }
      
      // Update dirty flag
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, isDirty: false } : r));
      
      toast.success('Changes saved');
      await refreshData();
    } catch (error) {
      toast.error('Failed to save changes');
      console.error('Save error:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Add new row
  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    const newRow: SpreadsheetRow = {
      id: newId,
      type: viewMode === 'controls' ? 'control' : 'risk',
      data: {} as any,
      cells: {
        id: newId,
        title: 'New ' + (viewMode === 'controls' ? 'Control' : 'Risk'),
        description: '',
        status: viewMode === 'controls' ? ControlStatus.PLANNED : RiskStatus.IDENTIFIED,
        likelihood: 1,
        impact: 1
      },
      isNew: true,
      isDirty: true
    };
    
    setRows(prevRows => {
      const updatedRows = [...prevRows, newRow];
      
      // Focus on the new row after state update
      setTimeout(() => {
        // Calculate the index of the new row in filtered rows
        const newRowIndex = updatedRows.filter(row => {
          // Apply the same filtering logic as filteredRows
          if (debouncedSearchQuery) {
            const searchLower = debouncedSearchQuery.toLowerCase();
            const matchesSearch = 
              row.cells.title?.toLowerCase().includes(searchLower) ||
              row.cells.description?.toLowerCase().includes(searchLower) ||
              row.cells.owner?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }
          if (filterStatus !== 'all' && row.cells.status !== filterStatus) return false;
          if (filterRiskLevel !== 'all' && row.type === 'risk') {
            const riskLevel = row.cells.riskLevel || 
              (row.cells.likelihood * row.cells.impact <= 6 ? 'LOW' :
               row.cells.likelihood * row.cells.impact <= 12 ? 'MEDIUM' :
               row.cells.likelihood * row.cells.impact <= 20 ? 'HIGH' : 'CRITICAL');
            if (riskLevel !== filterRiskLevel) return false;
          }
          return true;
        }).findIndex(r => r.id === newId);
        
        if (newRowIndex !== -1) {
          setActiveCell({ row: newRowIndex, col: 1 });
          startEditing();
        }
      }, 100);
      
      return updatedRows;
    });
  };

  // Export to Excel
  const handleExport = () => {
    // TODO: Implement Excel export
    toast.info('Export functionality coming soon');
  };

  // Setup keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setGridDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 200 // Adjust for header height
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const column = columns[columnIndex];
    const row = filteredRows[rowIndex];
    if (!row) return null;

    const isActive = activeCell.row === rowIndex && activeCell.col === columnIndex;
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === columnIndex;
    const isSelected = selectedRows.has(row.id);
    
    let cellValue = row.cells[column.id];
    if (column.format) {
      cellValue = column.format(row);
    }

    const getCellStyle = () => {
      let className = cn(
        'border-r border-b border-gray-200 px-2 py-1 text-sm',
        'focus:outline-none transition-colors duration-100'
      );

      if (isActive) {
        className += ' ring-2 ring-blue-500 ring-inset bg-blue-50';
      } else if (isSelected) {
        className += ' bg-gray-50';
      } else {
        className += ' hover:bg-gray-50';
      }

      if (row.isDirty) {
        className += ' bg-yellow-50';
      }

      if (row.type === 'control' && viewMode === 'combined') {
        className += ' bg-green-50/30';
      }

      return className;
    };

    const renderCellContent = () => {
      if (isEditing) {
        if (column.type === 'multiline') {

  return (
    <DaisyTextarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveCell}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveCell();
                }
              }}
              className="w-full h-full resize-none border-0 p-0 focus:ring-0"
              autoFocus
            />
          );
        } else if (column.type === 'select' && column.options) {
          return (
            <DaisySelect value={editValue} onValueChange={setEditValue} />
              <DaisySelectTrigger className="h-full border-0 p-0 focus:ring-0" />
                <DaisySelectValue /></DaisyTextarea>
              <DaisySelectContent />
                {column.options.map(opt => (
                  <DaisySelectItem key={opt.value} value={opt.value} />
                    {opt.label}
                  </DaisySelectContent>
                ))}
              </DaisySelectContent>
            </DaisySelect>
          );
        } else {
          return (
            <DaisyInput
              type={column.type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveCell}
              className="w-full h-full border-0 p-0 focus:ring-0"
              autoFocus
            />
          );
        }
      }

      // Special rendering for certain columns
      if (column.id === 'type') {
        return (
          <DaisyBadge variant="outline" className="text-xs" >
  {row.type === 'risk' ? (
</DaisyInput>
              <><Shield className="w-3 h-3 mr-1" /> Risk</>
            ) : (
              <><CheckCircle className="w-3 h-3 mr-1" /> Control</>
            )}
          </DaisyBadge>
        );
      }

      if (column.id === 'riskLevel' && row.type === 'risk') {
        const level = cellValue || 'LOW';
        const colors = {
          LOW: 'bg-green-100 text-green-800',
          MEDIUM: 'bg-yellow-100 text-yellow-800',
          HIGH: 'bg-orange-100 text-orange-800',
          CRITICAL: 'bg-red-100 text-red-800'
        };
        return (
          <DaisyBadge className={cn('text-xs', colors[level as keyof typeof colors])} >
  {level}
</DaisyBadge>
          </DaisyBadge>
        );
      }

      if (column.id === 'status') {
        return (
          <DaisyBadge variant="outline" className="text-xs" >
  {cellValue}
</DaisyBadge>
          </DaisyBadge>
        );
      }

      if (column.id === 'effectivenessRating') {
        const rating = cellValue || 'NOT_TESTED';
        const colors = {
          EFFECTIVE: 'text-green-600',
          PARTIALLY_EFFECTIVE: 'text-yellow-600',
          NOT_EFFECTIVE: 'text-red-600',
          NOT_TESTED: 'text-gray-600'
        };
        return (
          <span className={cn('font-medium', colors[rating as keyof typeof colors])}>
            {rating.replace(/_/g, ' ')}
          </span>
        );
      }

      return <div className="truncate">{cellValue}</div>;
    };

    return (
      <div
        style={style}
        className={getCellStyle()}
        onClick={() => setActiveCell({ row: rowIndex, col: columnIndex })}
        onDoubleClick={() => column.editable && startEditing()}
      >
        {renderCellContent()}
      </div>
    );
  };

  // Column header renderer
  const ColumnHeader = ({ index, style }: any) => {
    const column = columns[index];
    
    return (
      <div
        style={style}
        className="border-r border-b border-gray-300 bg-gray-100 px-2 py-2 font-medium text-sm flex items-center justify-between group"
      >
        <span className="truncate">{column.label}</span>
        <div
          className="w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 transition-opacity"
          onMouseDown={(e) => {
            // TODO: Implement column resizing
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            RCSA Spreadsheet
          </h1>
          
          {/* View mode selector */}
          <DaisySelect value={viewMode} onValueChange={(v: any) => setViewMode(v)} />
            <DaisySelectTrigger className="w-40" />
              <DaisySelectValue /></DaisySelect>
            <DaisySelectContent />
              <DaisySelectItem value="combined">Combined View</DaisySelectContent>
              <DaisySelectItem value="risks">Risks Only</DaisySelectItem>
              <DaisySelectItem value="controls">Controls Only</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>

          {/* Status indicator */}
          {isAutoSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
          
          {rows.some(r => r.isDirty) && !isAutoSaving && (
            <DaisyBadge variant="outline" className="text-xs" >
  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
</DaisyBadge>
              Unsaved changes
            </DaisyBadge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <DaisyInput
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />

          {/* Filters */}
          <DaisySelect value={filterStatus} onValueChange={setFilterStatus} />
            <DaisySelectTrigger className="w-40" />
              <DaisySelectValue placeholder="All Status" /></DaisyInput>
            <DaisySelectContent />
              <DaisySelectItem value="all">All Status</DaisySelectContent>
              {viewMode !== 'controls' && (
                <>
                  <DaisySelectItem value={RiskStatus.IDENTIFIED}>Identified</DaisySelectItem>
                  <DaisySelectItem value={RiskStatus.ASSESSED}>Assessed</DaisySelectItem>
                  <DaisySelectItem value={RiskStatus.MITIGATED}>Mitigated</DaisySelectItem>
                  <DaisySelectItem value={RiskStatus.ACCEPTED}>Accepted</DaisySelectItem>
                </>
              )}
              {viewMode !== 'risks' && (
                <>
                  <DaisySelectItem value={ControlStatus.PLANNED}>Planned</DaisySelectItem>
                  <DaisySelectItem value={ControlStatus.IMPLEMENTED}>Implemented</DaisySelectItem>
                  <DaisySelectItem value={ControlStatus.TESTED}>Tested</DaisySelectItem>
                  <DaisySelectItem value={ControlStatus.EFFECTIVE}>Effective</DaisySelectItem>
                </>
              )}
            </DaisySelectContent>
          </DaisySelect>

          {viewMode !== 'controls' && (
            <DaisySelect value={filterRiskLevel} onValueChange={setFilterRiskLevel} />
              <DaisySelectTrigger className="w-40" />
                <DaisySelectValue placeholder="All Risk Levels" /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="all">All Risk Levels</DaisySelectContent>
                <DaisySelectItem value="LOW">Low</DaisySelectItem>
                <DaisySelectItem value="MEDIUM">Medium</DaisySelectItem>
                <DaisySelectItem value="HIGH">High</DaisySelectItem>
                <DaisySelectItem value="CRITICAL">Critical</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          )}

          {/* Actions */}
          <DaisyButton
            variant="outline"
            size="sm"
            onClick={handleAddRow} >
  <Plus className="w-4 h-4 mr-1" />
</DaisyButton>
            Add {viewMode === 'controls' ? 'Control' : 'Risk'}
          </DaisyButton>

          <DaisyButton
            variant="outline"
            size="sm"
            onClick={handleExport} >
  <Download className="w-4 h-4 mr-1" />
</DaisyButton>
            Export
          </DaisyButton>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 relative">
        <Grid
          ref={gridRef}
          columnCount={columns.length}
          columnWidth={(index) => columns[index].width}
          height={gridDimensions.height}
          rowCount={filteredRows.length}
          rowHeight={() => 36}
          width={gridDimensions.width}
          className="border-l border-t border-gray-300"
          overscanRowCount={10}
          overscanColumnCount={3}
        >
          {Cell}
        </Grid>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>{filteredRows.length} rows</span>
          <span>Cell: {String.fromCharCode(65 + activeCell.col)}{activeCell.row + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>AI-Enhanced</span>
        </div>
      </div>
    </div>
  );
}
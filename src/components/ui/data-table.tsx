'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  MoreVertical,
  Download,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Plus,
  Bookmark,
  Share,
  Settings,
  RefreshCw,
} from 'lucide-react';

// ========== INTERFACES ==========

export interface ColumnDefinition<T = any> {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status-badge' | 'user-avatar' | 'actions' | 'custom';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  resizable?: boolean;
  pinnable?: boolean;
  hidden?: boolean;
  render?: (value: any, row: T, column: ColumnDefinition<T>) => React.ReactNode;
  filterOptions?: Array<{ label: string; value: any }>;
  colorMapping?: Record<string, string>;
  accessor?: (row: T) => any;
  aggregation?: 'count' | 'sum' | 'average' | 'min' | 'max';
}

export interface FilterState {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between' | 'in';
  value: any;
  values?: any[];
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface ViewState {
  id: string;
  name: string;
  columns: string[];
  filters: FilterState[];
  sorts: SortState[];
  groupBy?: string[];
  isDefault?: boolean;
  isShared?: boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (sorts: SortState[]) => void;
  onFilter?: (filters: FilterState[]) => void;
  onSearch?: (query: string) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  onColumnReorder?: (columns: ColumnDefinition<T>[]) => void;
  onViewSave?: (view: ViewState) => void;
  onViewLoad?: (view: ViewState) => void;
  bulkActions?: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<any>;
    action: (selectedRows: T[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  enableVirtualization?: boolean;
  enableInlineEditing?: boolean;
  enableRealTimeUpdates?: boolean;
  className?: string;
}

// ========== CELL RENDERERS ==========

const StatusBadgeCell: React.FC<{ value: any; colorMapping?: Record<string, string> }> = ({ 
  value, 
  colorMapping = {} 
}) => {
  const getVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('high') || statusLower.includes('critical') || statusLower.includes('severe')) {
      return 'destructive';
    }
    if (statusLower.includes('medium') || statusLower.includes('warning') || statusLower.includes('moderate')) {
      return 'warning';
    }
    if (statusLower.includes('low') || statusLower.includes('success') || statusLower.includes('completed')) {
      return 'success';
    }
    return 'secondary';
  };

  const customColor = colorMapping[value];
  
  return (
    <Badge 
      variant={getVariant(value) as any}
      className={cn(
        "text-xs font-medium",
        customColor && `bg-${customColor} text-white`
      )}
    >
      {value}
    </Badge>
  );
};

const UserAvatarCell: React.FC<{ value: any }> = ({ value }) => {
  if (!value) return <span className="text-text-tertiary">—</span>;
  
  const user = typeof value === 'string' ? { name: value } : value;
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('') || '?';
  
  return (
    <div className="flex items-center space-x-enterprise-2">
      <Avatar className="w-6 h-6">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-body-sm text-text-primary truncate">{user.name}</span>
    </div>
  );
};

const DateCell: React.FC<{ value: any }> = ({ value }) => {
  if (!value) return <span className="text-text-tertiary">—</span>;
  
  const date = new Date(value);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getRelativeTime = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center space-x-enterprise-1 text-body-sm">
          <Calendar className="h-3 w-3 text-text-tertiary" />
          <span className="text-text-primary">{getRelativeTime(diffDays)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{formatDate(date)}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// ========== MAIN COMPONENT ==========

export const EnterpriseDataTable = <T extends Record<string, any>>({
  data,
  columns: initialColumns,
  loading = false,
  error,
  totalCount,
  pageSize = 50,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onSort,
  onFilter,
  onSearch,
  onRowSelect,
  onRowClick,
  onColumnReorder,
  onViewSave,
  onViewLoad,
  bulkActions = [],
  enableVirtualization = true,
  enableInlineEditing = false,
  enableRealTimeUpdates = false,
  className,
}: DataTableProps<T>) => {
  // ========== STATE ==========
  const [columns, setColumns] = useState<ColumnDefinition<T>[]>(initialColumns);
  const [sorts, setSorts] = useState<SortState[]>([]);
  const [filters, setFilters] = useState<FilterState[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [savedViews, setSavedViews] = useState<ViewState[]>([]);
  const [activeView, setActiveView] = useState<ViewState | null>(null);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const virtualRef = useRef<HTMLDivElement>(null);
  
  // ========== MEMOIZED VALUES ==========
  const visibleColumns = useMemo(() => 
    columns.filter(col => !col.hidden), 
    [columns]
  );
  
  const filteredData = useMemo(() => {
    let result = [...data];
    
    // Apply search
    if (searchQuery) {
      result = result.filter(row => 
        visibleColumns.some(col => {
          if (!col.searchable) return false;
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }
    
    // Apply filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.column];
        switch (filter.operator) {
          case 'equals': return value === filter.value;
          case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith': return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith': return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'gt': return Number(value) > Number(filter.value);
          case 'lt': return Number(value) < Number(filter.value);
          case 'in': return filter.values?.includes(value);
          default: return true;
        }
      });
    });
    
    // Apply sorting
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const aValue = a[sort.column];
          const bValue = b[sort.column];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }
    
    return result;
  }, [data, searchQuery, filters, sorts, visibleColumns]);
  
  // ========== EVENT HANDLERS ==========
  const handleSort = useCallback((columnKey: string) => {
    setSorts(prev => {
      const existing = prev.find(s => s.column === columnKey);
      let newSorts: SortState[];
      
      if (existing) {
        if (existing.direction === 'asc') {
          newSorts = prev.map(s => 
            s.column === columnKey ? { ...s, direction: 'desc' as const } : s
          );
        } else {
          newSorts = prev.filter(s => s.column !== columnKey);
        }
      } else {
        newSorts = [...prev, { column: columnKey, direction: 'asc' as const }];
      }
      
      onSort?.(newSorts);
      return newSorts;
    });
  }, [onSort]);
  
  const handleFilter = useCallback((columnKey: string, operator: FilterState['operator'], value: any) => {
    setFilters(prev => {
      const newFilters = prev.filter(f => f.column !== columnKey);
      if (value !== null && value !== undefined && value !== '') {
        newFilters.push({ column: columnKey, operator, value });
      }
      onFilter?.(newFilters);
      return newFilters;
    });
  }, [onFilter]);
  
  const handleRowSelect = useCallback((rowIndex: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(rowIndex);
      } else {
        newSelection.delete(rowIndex);
      }
      
      const selectedData = Array.from(newSelection).map(index => filteredData[index]);
      onRowSelect?.(selectedData);
      
      return newSelection;
    });
  }, [filteredData, onRowSelect]);
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIndices = filteredData.map((_, index) => index);
      setSelectedRows(new Set(allIndices));
      onRowSelect?.(filteredData);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  }, [filteredData, onRowSelect]);
  
  const toggleColumnPin = useCallback((columnKey: string) => {
    setPinnedColumns(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(columnKey)) {
        newPinned.delete(columnKey);
      } else {
        newPinned.add(columnKey);
      }
      return newPinned;
    });
  }, []);
  
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, hidden: !col.hidden } : col
      )
    );
  }, []);
  
  // ========== RENDER HELPERS ==========
  const renderCell = useCallback((column: ColumnDefinition<T>, row: T, rowIndex: number) => {
    const value = column.accessor ? column.accessor(row) : row[column.key];
    
    if (column.render) {
      return column.render(value, row, column);
    }
    
    switch (column.type) {
      case 'status-badge':
        return <StatusBadgeCell value={value} colorMapping={column.colorMapping} />;
      case 'user-avatar':
        return <UserAvatarCell value={value} />;
      case 'date':
        return <DateCell value={value} />;
      case 'actions':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRowClick?.(row)}>
                <Eye className="h-3 w-3 mr-enterprise-1" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-3 w-3 mr-enterprise-1" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <X className="h-3 w-3 mr-enterprise-1" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        return (
          <span className="text-body-sm text-text-primary truncate">
            {value === null || value === undefined ? '—' : String(value)}
          </span>
        );
    }
  }, [onRowClick]);
  
  const getSortIcon = useCallback((columnKey: string) => {
    const sort = sorts.find(s => s.column === columnKey);
    if (!sort) return <ArrowUpDown className="h-3 w-3 text-text-tertiary" />;
    return sort.direction === 'asc' 
      ? <SortAsc className="h-3 w-3 text-interactive-primary" />
      : <SortDesc className="h-3 w-3 text-interactive-primary" />;
  }, [sorts]);
  
  // ========== LOADING & ERROR STATES ==========
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-primary rounded-lg border border-border">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-semantic-error mx-auto mb-enterprise-2" />
          <div className="text-heading-sm text-text-primary mb-enterprise-1">Error loading data</div>
          <div className="text-body-sm text-text-secondary">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("enterprise-data-table bg-surface-primary", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-enterprise-4 border-b border-border">
        <div className="flex items-center space-x-enterprise-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search across all columns..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="pl-10 w-80 text-body-sm"
            />
          </div>
          
          {/* Bulk Actions */}
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-enterprise-2">
              <span className="text-body-sm text-text-secondary">
                {selectedRows.size} selected
              </span>
              {bulkActions.map(action => (
                <Button
                  key={action.key}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const selectedData = Array.from(selectedRows).map(index => filteredData[index]);
                    action.action(selectedData);
                  }}
                  className="text-button"
                >
                  {action.icon && <action.icon className="h-3 w-3 mr-enterprise-1" />}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-enterprise-2">
          {/* View Management */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-button">
                <Bookmark className="h-3 w-3 mr-enterprise-1" />
                Views
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
              {savedViews.map(view => (
                <DropdownMenuItem key={view.id} onClick={() => setActiveView(view)}>
                  {view.name}
                  {view.isDefault && <Badge variant="secondary" className="ml-auto text-xs">Default</Badge>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-3 w-3 mr-enterprise-1" />
                Save Current View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Column Settings */}
          <DropdownMenu open={showColumnSettings} onOpenChange={setShowColumnSettings}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-button">
                <Settings className="h-3 w-3 mr-enterprise-1" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
              {columns.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={!column.hidden}
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Export */}
          <Button variant="outline" size="sm" className="text-button">
            <Download className="h-3 w-3 mr-enterprise-1" />
            Export
          </Button>
          
          {/* Refresh */}
          <Button variant="outline" size="sm" className="text-button">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex items-center space-x-enterprise-2 p-enterprise-3 bg-surface-secondary border-b border-border">
          <span className="text-body-sm text-text-secondary">Active filters:</span>
          {filters.map((filter, index) => {
            const column = columns.find(c => c.key === filter.column);
            return (
              <Badge key={index} variant="outline" className="text-caption">
                {column?.label}: {String(filter.value)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilter(filter.column, filter.operator, null)}
                  className="ml-enterprise-1 h-3 w-3 p-0 hover:bg-destructive hover:text-white"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters([])}
            className="text-caption text-text-tertiary hover:text-destructive"
          >
            Clear all
          </Button>
        </div>
      )}
      
      {/* Table Container */}
      <div className="overflow-auto" ref={tableRef}>
        <table className="w-full">
          {/* Header */}
          <thead className="bg-surface-secondary border-b border-border sticky top-0 z-10">
            <tr>
              {/* Select All Checkbox */}
              <th className="w-12 p-enterprise-3 text-left">
                <Checkbox
                  checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "p-enterprise-3 text-left border-r border-border/50 last:border-r-0",
                    column.sortable && "cursor-pointer hover:bg-surface-tertiary transition-colors",
                    pinnedColumns.has(column.key) && "bg-surface-tertiary sticky left-0 z-20"
                  )}
                  style={{ 
                    width: columnWidths[column.key] || column.width || 'auto',
                    minWidth: column.minWidth || 120,
                    maxWidth: column.maxWidth || 'none'
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between group">
                    <span className="text-label text-text-primary font-semibold truncate">
                      {column.label}
                    </span>
                    
                    <div className="flex items-center space-x-enterprise-1">
                      {column.sortable && getSortIcon(column.key)}
                      
                      {/* Column Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {column.sortable && (
                            <>
                              <DropdownMenuItem onClick={() => handleSort(column.key)}>
                                <SortAsc className="h-3 w-3 mr-enterprise-1" />
                                Sort Ascending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSort(column.key)}>
                                <SortDesc className="h-3 w-3 mr-enterprise-1" />
                                Sort Descending
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          
                          {column.pinnable && (
                            <DropdownMenuItem onClick={() => toggleColumnPin(column.key)}>
                              {pinnedColumns.has(column.key) ? (
                                <PinOff className="h-3 w-3 mr-enterprise-1" />
                              ) : (
                                <Pin className="h-3 w-3 mr-enterprise-1" />
                              )}
                              {pinnedColumns.has(column.key) ? 'Unpin' : 'Pin'} Column
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => toggleColumnVisibility(column.key)}>
                            <EyeOff className="h-3 w-3 mr-enterprise-1" />
                            Hide Column
                          </DropdownMenuItem>
                          
                          {column.filterable && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Filter className="h-3 w-3 mr-enterprise-1" />
                                Add Filter
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-enterprise-8 text-center">
                  <div className="flex items-center justify-center space-x-enterprise-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-text-tertiary" />
                    <span className="text-body-sm text-text-secondary">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-enterprise-8 text-center">
                  <div className="text-center">
                    <Search className="h-8 w-8 text-text-tertiary mx-auto mb-enterprise-2" />
                    <div className="text-heading-sm text-text-primary mb-enterprise-1">No results found</div>
                    <div className="text-body-sm text-text-secondary">
                      {searchQuery || filters.length > 0 
                        ? 'Try adjusting your search or filters'
                        : 'No data available'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border hover:bg-surface-secondary transition-colors cursor-pointer",
                    selectedRows.has(rowIndex) && "bg-interactive-primary/5 border-interactive-primary/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Select Checkbox */}
                  <td className="w-12 p-enterprise-3">
                    <Checkbox
                      checked={selectedRows.has(rowIndex)}
                      onCheckedChange={(checked) => handleRowSelect(rowIndex, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </td>
                  
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "p-enterprise-3 border-r border-border/50 last:border-r-0",
                        pinnedColumns.has(column.key) && "bg-surface-primary sticky left-0"
                      )}
                      style={{ 
                        width: columnWidths[column.key] || column.width || 'auto',
                        minWidth: column.minWidth || 120,
                        maxWidth: column.maxWidth || 'none'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderCell(column, row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination */}
      {totalCount && totalCount > pageSize && (
        <div className="flex items-center justify-between p-enterprise-4 border-t border-border bg-surface-secondary">
          <div className="flex items-center space-x-enterprise-4">
            <span className="text-body-sm text-text-secondary">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </span>
            
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange?.(Number(value))}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-enterprise-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="text-button"
            >
              Previous
            </Button>
            
            <span className="text-body-sm text-text-primary px-enterprise-2">
              Page {currentPage} of {Math.ceil(totalCount / pageSize)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              className="text-button"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDataTable; 
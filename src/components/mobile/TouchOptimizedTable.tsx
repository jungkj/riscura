'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/DaisySheet';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'status' | 'priority';
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

interface TouchOptimizedTableProps {
  columns: TableColumn[];
  data: TableRow[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: TableRow) => void;
  onRowSelect?: (selectedRows: TableRow[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  emptyMessage?: string;
  pullToRefresh?: boolean;
}

interface FilterState {
  [key: string]: string;
}

export default function TouchOptimizedTable({
  columns,
  data,
  loading = false,
  searchable = true,
  filterable = true,
  selectable = false,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onRowSelect,
  onSort,
  onFilter,
  onRefresh,
  onExport,
  className = '',
  emptyMessage = 'No data available',
  pullToRefresh = true
}: TouchOptimizedTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Pull to refresh gesture
  const pullToRefreshBind = useGesture({
    onDrag: ({ movement: [, my], velocity: [, vy], direction: [, dy], cancel }) => {
      if (!pullToRefresh || !onRefresh) return;
      
      // Only trigger on downward swipe from top
      if (dy > 0 && my > 80 && vy > 0.5 && scrollRef.current?.scrollTop === 0) {
        setIsRefreshing(true);
        onRefresh();
        cancel();
        
        // Reset refreshing state after animation
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  });
  
  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(row =>
        columns.some(column =>
          String(row[column.key] || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key] || '').toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    
    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    return result;
  }, [data, searchQuery, filters, sortColumn, sortDirection, columns]);
  
  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;
  
  // Handle row selection
  const handleRowSelect = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    
    if (onRowSelect) {
      const selectedData = data.filter(row => newSelected.has(row.id));
      onRowSelect(selectedData);
    }
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allIds);
      if (onRowSelect) {
        onRowSelect(paginatedData);
      }
    } else {
      setSelectedRows(new Set());
      if (onRowSelect) {
        onRowSelect([]);
      }
    }
  };
  
  // Handle sorting
  const handleSort = (column: string) => {
    if (!sortable) return;
    
    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortColumn === column && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    
    setSortColumn(column);
    setSortDirection(newDirection);
    
    if (onSort) {
      onSort(column, newDirection);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
    
    if (onFilter) {
      onFilter({});
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      inactive: { variant: 'secondary' as const, label: 'Inactive' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      completed: { variant: 'default' as const, label: 'Completed' },
      high: { variant: 'destructive' as const, label: 'High' },
      medium: { variant: 'outline' as const, label: 'Medium' },
      low: { variant: 'secondary' as const, label: 'Low' }
    };
    
    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || 
                  { variant: 'secondary' as const, label: status };

  return (
    <DaisyBadge variant={config.variant} className="text-xs" >
  {config.label}
</DaisyBadge>
      </DaisyBadge>
    );
  };
  
  // Render cell content
  const renderCellContent = (column: TableColumn, row: TableRow) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    switch (column.type) {
      case 'status':
      case 'priority':
        return renderStatusBadge(value);
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return value || '-';
    }
  };
  
  // Render mobile card view
  const renderMobileCard = (row: TableRow) => {
    const isSelected = selectedRows.has(row.id);
    const isExpanded = expandedRow === row.id;
    
    return (
      <DaisyCard 
        key={row.id} 
        className={`mb-3 transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        } ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}`}
        onClick={() => {
          if (onRowClick) {
            onRowClick(row);
          } else {
            setExpandedRow(isExpanded ? null : row.id);
          }
        }}
      >
        <DaisyCardBody className="p-4" >
  <div className="flex items-start justify-between">
</DaisyCard>
            <div className="flex-1 min-w-0">
              {/* Primary column (first column) */}
              <div className="flex items-center space-x-3 mb-2">
                {selectable && (
                  <DaisyCheckbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${row[columns[0]?.key]}`}
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {renderCellContent(columns[0], row)}
                  </h4>
                  {columns[1] && (
                    <p className="text-sm text-gray-500 truncate">
                      {renderCellContent(columns[1], row)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Show first few columns in compact view */}
              {!isExpanded && columns.slice(2, 4).map(column => (
                <div key={column.key} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {column.label}
                  </span>
                  <span className="text-sm font-medium">
                    {renderCellContent(column, row)}
                  </span>
                </div>
              ))}
              
              {/* Expanded view - show all columns */}
              {isExpanded && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                  {columns.slice(2).map(column => (
                    <div key={column.key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {column.label}
                      </span>
                      <span className="text-sm font-medium">
                        {renderCellContent(column, row)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action menu */}
            <DaisyDropdownMenu />
              <DaisyDropdownMenuTrigger asChild />
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Row actions" />
                  <MoreVertical className="w-4 h-4" />
                </DaisyCheckbox>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent align="end" className="w-48" />
                <DaisyDropdownMenuItem onClick={(e) => e.stopPropagation()} />
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={(e) => e.stopPropagation()} />
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuSeparator />
                <DaisyDropdownMenuItem 
                  className="text-red-600"
                  onClick={(e) => e.stopPropagation()} />
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DaisyDropdownMenuSeparator>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
          </div>
          
          {/* Expand/collapse indicator */}
          {columns.length > 4 && (
            <div className="flex justify-center mt-3 pt-2 border-t border-gray-100">
              <DaisyButton
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedRow(isExpanded ? null : row.id);
                }}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </DaisyButton>
            </div>
          )}
        </DaisyCardBody>
      </DaisyCard>
    );
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Header with search and actions */}
      <div className="flex flex-col space-y-4 mb-4">
        {/* Search and actions row */}
        <div className="flex items-center space-x-2">
          {searchable && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <DaisyInput
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search table data"
              />
            </div>
          )}
          
          {filterable && (
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <DaisyButton variant="outline" size="sm" className="whitespace-nowrap" >
  <Filter className="w-4 h-4 mr-2" />
</DaisyInput>
                  Filter
                  {Object.values(filters).filter(Boolean).length > 0 && (
                    <DaisyBadge variant="secondary" className="ml-2 text-xs" >
  {Object.values(filters).filter(Boolean).length}
</DaisyBadge>
                    </DaisyBadge>
                  )}
                </DaisyButton>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filter Data</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {columns.filter(col => col.filterable !== false).map(column => (
                    <div key={column.key}>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {column.label}
                      </label>
                      <DaisyInput
                        type="text"
                        placeholder={`Filter by ${column.label.toLowerCase()}...`}
                        value={filters[column.key] || ''}
                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      />
                    </div>
                  ))}
                  
                  <div className="flex space-x-2 pt-4">
                    <DaisyButton onClick={clearFilters} variant="outline" className="flex-1" >
  Clear All
</DaisyInput>
                    </DaisyButton>
                    <DaisyButton onClick={() => setIsFilterOpen(false)} className="flex-1" />
                      Apply
                    </DaisyButton>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {onRefresh && (
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading || isRefreshing}
              aria-label="Refresh data" >
  <RefreshCw className={`w-4 h-4 ${loading || isRefreshing ? 'animate-spin' : ''}`} />
</DaisyButton>
            </DaisyButton>
          )}
          
          {onExport && (
            <DaisyButton variant="outline" size="sm" onClick={onExport} >
  <Download className="w-4 h-4" />
</DaisyButton>
            </DaisyButton>
          )}
        </div>
        
        {/* Selection info */}
        {selectable && selectedRows.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRows(new Set())}
              className="text-blue-700 hover:text-blue-800" />
              Clear Selection
            </DaisyButton>
          </div>
        )}
        
        {/* Active filters */}
        {(searchQuery || Object.values(filters).some(Boolean)) && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <DaisyBadge variant="secondary" className="flex items-center gap-1" >
  Search: {searchQuery}
</DaisyBadge>
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setSearchQuery('')}
                />
              </DaisyBadge>
            )}
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <DaisyBadge key={key} variant="secondary" className="flex items-center gap-1" >
  {columns.find(col => col.key === key)?.label}: {value}
</DaisyBadge>
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange(key, '')}
                  />
                </DaisyBadge>
              )
            )}
          </div>
        )}
      </div>
      
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </div>
        </div>
      )}
      
      {/* Table content */}
      <div 
        ref={scrollRef}
        className="space-y-2"
        {...pullToRefreshBind()}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">{emptyMessage}</p>
            {(searchQuery || Object.values(filters).some(Boolean)) && (
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-2" >
  Clear Filters
</DaisyButton>
              </DaisyButton>
            )}
          </div>
        ) : (
          <>
            {/* Select all (mobile) */}
            {selectable && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3">
                <DaisyCheckbox
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all visible rows"
                />
                <span className="text-sm text-gray-600 ml-3">
                  Select all {paginatedData.length} items
                </span>
              </div>
            )}
            
            {/* Mobile card list */}
            <div className="space-y-2">
              {paginatedData.map(row => renderMobileCard(row))}
            </div>
          </>
        )}
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of{' '}
            {processedData.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page" />
              <ChevronLeft className="w-4 h-4" />
            </DaisyCheckbox>
            
            <span className="text-sm font-medium px-3">
              {currentPage} of {totalPages}
            </span>
            
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page" />
              <ChevronRight className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
      )}
    </div>
  );
} 
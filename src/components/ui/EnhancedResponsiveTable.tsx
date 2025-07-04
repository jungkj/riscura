/**
 * Enhanced Responsive Table Component
 * Provides enterprise-grade responsive table functionality with mobile optimization
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  X,
  RefreshCw,
  Grid,
  List,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from 'lucide-react';

import {
  useDeviceInfo,
  useAdaptiveColumns,
  TouchOptimizedButton,
  MobileOptimized,
  useA11yAnnouncement,
} from '@/lib/responsive/mobile-optimization-framework';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  hiddenOnMobile?: boolean;
  renderCell?: (value: any, row: T, column: TableColumn<T>) => React.ReactNode;
  renderMobileCard?: (row: T) => React.ReactNode;
  accessor?: (row: T) => any;
  className?: string;
  headerClassName?: string;
  priority?: 'high' | 'medium' | 'low'; // For responsive column hiding
}

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  error?: string;
  emptyState?: React.ReactNode;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  onRefresh?: () => void;
  onExport?: () => void;
  getRowId?: (row: T) => string | number;
  className?: string;
  mobileCardComponent?: React.ComponentType<{ row: T; columns: TableColumn<T>[]; actions?: TableAction<T>[] }>;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface FilterState {
  [key: string]: any;
}

// ============================================================================
// DEFAULT MOBILE CARD COMPONENT
// ============================================================================

function DefaultMobileCard<T>({ 
  row, 
  columns, 
  actions = [] 
}: { 
  row: T; 
  columns: TableColumn<T>[]; 
  actions?: TableAction<T>[] 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const device = useDeviceInfo();

  const visibleColumns = columns.filter(col => !col.hiddenOnMobile);
  const hiddenColumns = columns.filter(col => col.hiddenOnMobile);
  const visibleActions = actions.filter(action => !action.hidden?.(row));

  const primaryColumn = visibleColumns.find(col => col.priority === 'high') || visibleColumns[0];
  const secondaryColumns = visibleColumns.filter(col => col !== primaryColumn).slice(0, 2);

  const getValue = (column: TableColumn<T>, row: T) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    return (row as any)[column.key];
  };

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-3"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Primary Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Main Title */}
          <div className="flex items-center space-x-2 mb-2">
            {primaryColumn.renderCell ? (
              primaryColumn.renderCell(getValue(primaryColumn, row), row, primaryColumn)
            ) : (
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {getValue(primaryColumn, row)}
              </h3>
            )}
          </div>

          {/* Secondary Info */}
          <div className="space-y-1">
            {secondaryColumns.map(column => (
              <div key={column.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{column.label}:</span>
                <span className="text-sm text-gray-900 font-medium">
                  {column.renderCell 
                    ? column.renderCell(getValue(column, row), row, column)
                    : getValue(column, row)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Button */}
        {visibleActions.length > 0 && (
          <div className="relative ml-3">
            <TouchOptimizedButton
              onClick={() => setShowActions(!showActions)}
              variant="ghost"
              size="sm"
              aria-label="Show actions"
            >
              <MoreVertical className="w-4 h-4" />
            </TouchOptimizedButton>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px] z-10"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  {visibleActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => {
                        setShowActions(false);
                        action.onClick(row);
                      }}
                      disabled={action.disabled?.(row)}
                      className={cn(
                        'w-full flex items-center space-x-2 px-3 py-2 text-left text-sm',
                        'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
                        action.variant === 'danger' && 'text-red-600 hover:bg-red-50'
                      )}
                    >
                      {action.icon && <action.icon className="w-4 h-4" />}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {hiddenColumns.length > 0 && (
        <>
          <TouchOptimizedButton
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="w-full mt-3 justify-between"
          >
            <span className="text-sm text-gray-600">
              {isExpanded ? 'Show Less' : 'Show More'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </TouchOptimizedButton>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="mt-3 pt-3 border-t border-gray-100 space-y-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {hiddenColumns.map(column => (
                  <div key={column.key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{column.label}:</span>
                    <span className="text-sm text-gray-900">
                      {column.renderCell 
                        ? column.renderCell(getValue(column, row), row, column)
                        : getValue(column, row)
                      }
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ============================================================================
// ENHANCED RESPONSIVE TABLE COMPONENT
// ============================================================================

export function EnhancedResponsiveTable<T = any>({
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  emptyState,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  sortable = true,
  filterable = true,
  searchable = true,
  pagination,
  onRefresh,
  onExport,
  getRowId = (row: T, index: number) => index,
  className = '',
  mobileCardComponent: MobileCard = DefaultMobileCard,
}: TableProps<T>) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const device = useDeviceInfo();
  const announce = useA11yAnnouncement();
  const tableRef = useRef<HTMLDivElement>(null);

  // Automatically switch to card view on mobile
  useEffect(() => {
    if (device.type === 'mobile') {
      setViewMode('cards');
    } else {
      setViewMode('table');
    }
  }, [device.type]);

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = column.accessor ? column.accessor(row) : (row as any)[column.key];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue !== undefined && filterValue !== '') {
        result = result.filter(row => {
          const column = columns.find(col => col.key === columnKey);
          const value = column?.accessor ? column.accessor(row) : (row as any)[columnKey];
          
          if (Array.isArray(filterValue)) {
            return filterValue.includes(value);
          }
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortState.column && sortState.direction) {
      const column = columns.find(col => col.key === sortState.column);
      result.sort((a, b) => {
        const aValue = column?.accessor ? column.accessor(a) : (a as any)[sortState.column!];
        const bValue = column?.accessor ? column.accessor(b) : (b as any)[sortState.column!];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        return sortState.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortState, columns]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return;

    setSortState(prev => {
      if (prev.column === columnKey) {
        if (prev.direction === 'asc') return { column: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column: columnKey, direction: 'asc' };
    });

    announce(
      `Sorted by ${columns.find(col => col.key === columnKey)?.label} ${
        sortState.direction === 'asc' ? 'descending' : 'ascending'
      }`,
      'polite'
    );
  }, [sortable, columns, announce, sortState.direction]);

  const handleSelectAll = useCallback(() => {
    if (!selectable || !onSelectionChange) return;

    const allIds = processedData.map((row, index) => getRowId(row, index));
    const isAllSelected = allIds.every(id => selectedRows.has(id));

    if (isAllSelected) {
      onSelectionChange(new Set());
      announce('All rows deselected', 'polite');
    } else {
      onSelectionChange(new Set(allIds));
      announce(`All ${allIds.length} rows selected`, 'polite');
    }
  }, [selectable, onSelectionChange, processedData, getRowId, selectedRows, announce]);

  const handleSelectRow = useCallback((rowId: string | number) => {
    if (!selectable || !onSelectionChange) return;

    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    onSelectionChange(newSelection);
  }, [selectable, onSelectionChange, selectedRows]);

  const handleFilterChange = useCallback((columnKey: string, value: any) => {
    setFilters(prev => ({ ...prev, [columnKey]: value }));
  }, []);

  // ============================================================================
  // RESPONSIVE COLUMNS
  // ============================================================================

  const visibleColumns = useMemo(() => {
    if (device.type === 'mobile') {
      return columns.filter(col => !col.hiddenOnMobile);
    }
    if (device.type === 'tablet') {
      return columns.filter(col => col.priority !== 'low');
    }
    return columns;
  }, [columns, device.type]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        {selectable && (
          <th className="w-12 px-4 py-3">
            <input
              type="checkbox"
              checked={processedData.length > 0 && processedData.every((row, index) => selectedRows.has(getRowId(row, index)))}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label="Select all rows"
            />
          </th>
        )}
        {visibleColumns.map(column => (
          <th
            key={column.key}
            className={cn(
              'px-4 py-3 text-left text-sm font-medium text-gray-700',
              column.headerClassName,
              sortable && column.sortable !== false && 'cursor-pointer hover:bg-gray-100'
            )}
            style={{ width: column.width, minWidth: column.minWidth }}
            onClick={() => column.sortable !== false && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {sortable && column.sortable !== false && (
                <div className="flex flex-col">
                  {sortState.column === column.key ? (
                    sortState.direction === 'asc' ? (
                      <SortAsc className="w-3 h-3" />
                    ) : (
                      <SortDesc className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  )}
                </div>
              )}
            </div>
          </th>
        ))}
        {actions.length > 0 && (
          <th className="w-20 px-4 py-3 text-center text-sm font-medium text-gray-700">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );

  const renderTableRow = (row: T, index: number) => {
    const rowId = getRowId(row, index);
    const isSelected = selectedRows.has(rowId);

    return (
      <tr
        key={rowId}
        className={cn(
          'hover:bg-gray-50 transition-colors',
          isSelected && 'bg-blue-50 border-blue-200'
        )}
      >
        {selectable && (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectRow(rowId)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={`Select row ${index + 1}`}
            />
          </td>
        )}
        {visibleColumns.map(column => (
          <td
            key={column.key}
            className={cn('px-4 py-3 text-sm text-gray-900', column.className)}
          >
            {column.renderCell
              ? column.renderCell(
                  column.accessor ? column.accessor(row) : (row as any)[column.key],
                  row,
                  column
                )
              : column.accessor
              ? column.accessor(row)
              : (row as any)[column.key]}
          </td>
        ))}
        {actions.length > 0 && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-center space-x-1">
              {actions
                .filter(action => !action.hidden?.(row))
                .slice(0, 3)
                .map(action => (
                  <TouchOptimizedButton
                    key={action.id}
                    onClick={() => action.onClick(row)}
                    disabled={action.disabled?.(row)}
                    variant={action.variant === 'danger' ? 'secondary' : 'ghost'}
                    size="sm"
                    aria-label={action.label}
                  >
                    {action.icon && <action.icon className="w-4 h-4" />}
                  </TouchOptimizedButton>
                ))}
            </div>
          </td>
        )}
      </tr>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        {onRefresh && (
          <TouchOptimizedButton
            onClick={onRefresh}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </TouchOptimizedButton>
        )}
      </div>
    );
  }

  return (
    <MobileOptimized className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-2">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Filter Toggle */}
          {filterable && (
            <TouchOptimizedButton
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'secondary'}
              size="md"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </TouchOptimizedButton>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <TouchOptimizedButton
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              size="sm"
              className="rounded-none"
            >
              <Grid className="w-4 h-4" />
            </TouchOptimizedButton>
            <TouchOptimizedButton
              onClick={() => setViewMode('cards')}
              variant={viewMode === 'cards' ? 'primary' : 'ghost'}
              size="sm"
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </TouchOptimizedButton>
          </div>

          {/* Export */}
          {onExport && (
            <TouchOptimizedButton
              onClick={onExport}
              variant="secondary"
              size="md"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </TouchOptimizedButton>
          )}

          {/* Refresh */}
          {onRefresh && (
            <TouchOptimizedButton
              onClick={onRefresh}
              variant="ghost"
              size="md"
            >
              <RefreshCw className="w-4 h-4" />
            </TouchOptimizedButton>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns
                .filter(col => col.filterable !== false)
                .map(column => (
                  <div key={column.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {column.label}
                    </label>
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={filters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table/Cards Content */}
      <div ref={tableRef}>
        {processedData.length === 0 ? (
          emptyState || (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
              <p className="text-gray-500">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'No items to display'}
              </p>
            </div>
          )
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
            <AnimatePresence>
              {processedData.map((row, index) => (
                <MobileCard
                  key={getRowId(row, index)}
                  row={row}
                  columns={columns}
                  actions={actions}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              {renderTableHeader()}
              <tbody className="divide-y divide-gray-200">
                {processedData.map((row, index) => renderTableRow(row, index))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && processedData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <TouchOptimizedButton
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </TouchOptimizedButton>
            <span className="text-sm text-gray-700">
              Page {pagination.page}
            </span>
            <TouchOptimizedButton
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              variant="secondary"
              size="sm"
            >
              Next
            </TouchOptimizedButton>
          </div>
        </div>
      )}
    </MobileOptimized>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default EnhancedResponsiveTable;
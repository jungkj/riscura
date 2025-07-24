'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { 
  SwipeableCard, 
  TouchButton, 
  TouchActionMenu,
  TouchChip 
} from './TouchElements';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Clock,
  User,
  Target,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpDown,
  Columns,
  Grid,
  List,
  Maximize,
  Minimize,
  ExternalLink,
  Copy,
  Share2,
  Archive,
  Flag,
  Bookmark,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Phone,
  Mail,
  Link,
  Hash,
  DollarSign,
  Percent,
  Calendar as CalendarIcon,
} from 'lucide-react';

// Types
interface Column<T = any> {
  id: string;
  header: string;
  accessor: keyof T | ((item: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  cellRenderer?: (value: any, item: T, index: number) => React.ReactNode;
  headerRenderer?: () => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  priority?: number; // For responsive display priority (1 = highest)
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'user' | 'progress' | 'actions';
  searchable?: boolean;
  exportable?: boolean;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  expandable?: boolean;
  exportable?: boolean;
  onRowClick?: (item: T, index: number) => void;
  onRowSelect?: (selectedItems: T[]) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (query: string) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  emptyState?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'comfortable';
  mobileLayout?: 'cards' | 'list' | 'grid';
}

interface Device {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  isTouchDevice: boolean;
}

// Custom Hooks
const useDevice = (): Device => {
  const [device, setDevice] = useState<Device>({
    type: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDevice = () => {
      const width = window.innerWidth;
      let type: Device['type'] = 'desktop';

      if (width < 768) {
        type = 'mobile';
      } else if (width < 1024) {
        type = 'tablet';
      }

      setDevice({
        type,
        width,
        isTouchDevice: 'ontouchstart' in window,
      });
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return device;
};

// Helper Functions
const getCellValue = <T,>(item: T, column: Column<T>) => {
  if (typeof column.accessor === 'function') {
    return column.accessor(item);
  }
  return item[column.accessor];
};

const formatCellValue = (value: any, type?: string) => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
};

// Default Cell Renderers
const defaultCellRenderers = {
  badge: (value: any) => (
    <DaisyBadge variant={value?.variant || 'default'} className="capitalize">
      {value?.label || value}
    </DaisyBadge>
  ),
  user: (value: any) => (
    <div className="flex items-center space-x-2">
      <DaisyAvatar className="h-6 w-6">
        <DaisyAvatarImage src={value?.avatar} />
        <DaisyAvatarFallback className="text-xs">
          {value?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
        </DaisyAvatarFallback>
      </DaisyAvatar>
      <span className="truncate">{value?.name || value}</span>
    </div>
  ),
  progress: (value: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{value?.label || 'Progress'}</span>
        <span>{value?.value || value}%</span>
      </div>
      <DaisyProgress value={value?.value || value} className="h-1" />
    </div>
  ),
  actions: (value: any, item: any) => (
    <TouchActionMenu
      items={[
        {
          id: 'view',
          label: 'View',
          icon: <Eye className="h-4 w-4" />,
          onClick: () => console.log('View', item),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: <Edit className="h-4 w-4" />,
          onClick: () => console.log('Edit', item),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => console.log('Delete', item),
          variant: 'destructive' as const,
        },
      ]}
    />
  ),
};

// Mobile Card Layout
const MobileCardLayout: React.FC<{
  data: any[];
  columns: Column[];
  selectedItems: any[];
  onRowClick?: (item: any, index: number) => void;
  onRowSelect?: (item: any, selected: boolean) => void;
  selectable?: boolean;
}> = ({ data, columns, selectedItems, onRowClick, onRowSelect, selectable }) => {
  const priorityColumns = columns
    .filter(col => col.priority && col.priority <= 3)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  return (
    <div className="space-y-enterprise-3">
      {data.map((item, index) => {
        const isSelected = selectedItems.includes(item);
        
        return (
          <SwipeableCard
            key={index}
            leftAction={{
              icon: <Star className="h-4 w-4" />,
              label: 'Favorite',
              color: 'bg-yellow-500',
            }}
            rightAction={{
              icon: <Archive className="h-4 w-4" />,
              label: 'Archive',
              color: 'bg-red-500',
            }}
            onSwipeLeft={() => console.log('Archive', item)}
            onSwipeRight={() => console.log('Favorite', item)}
          >
            <DaisyCardContent className="p-enterprise-4">
              <div className="space-y-enterprise-3">
                {/* Header with selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-enterprise-2">
                    {selectable && (
                      <DaisyCheckbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onRowSelect?.(item, checked as boolean)}
                      />
                    )}
                    <div className="font-medium text-body-sm">
                      {priorityColumns[0] && formatCellValue(
                        getCellValue(item, priorityColumns[0]),
                        priorityColumns[0].type
                      )}
                    </div>
                  </div>
                  <TouchActionMenu
                    items={[
                      {
                        id: 'view',
                        label: 'View Details',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => onRowClick?.(item, index),
                      },
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: <Edit className="h-4 w-4" />,
                        onClick: () => console.log('Edit', item),
                      },
                      {
                        id: 'share',
                        label: 'Share',
                        icon: <Share2 className="h-4 w-4" />,
                        onClick: () => console.log('Share', item),
                      },
                    ]}
                  />
                </div>

                {/* Main content */}
                <div className="space-y-enterprise-2">
                  {priorityColumns.slice(1, 4).map((column) => {
                    const value = getCellValue(item, column);
                    return (
                      <div key={column.id} className="flex justify-between items-center">
                        <span className="text-caption text-text-secondary">
                          {column.header}
                        </span>
                        <div className="text-body-sm">
                          {column.cellRenderer 
                            ? column.cellRenderer(value, item, index)
                            : column.type && defaultCellRenderers[column.type as keyof typeof defaultCellRenderers]
                              ? defaultCellRenderers[column.type as keyof typeof defaultCellRenderers](value, item)
                              : formatCellValue(value, column.type)
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tags/Chips */}
                <div className="flex flex-wrap gap-enterprise-1 pt-enterprise-2">
                  {priorityColumns.slice(4).map((column) => {
                    const value = getCellValue(item, column);
                    if (!value) return null;
                    
                    return (
                      <TouchChip
                        key={column.id}
                        size="sm"
                        variant="secondary"
                      >
                        {formatCellValue(value, column.type)}
                      </TouchChip>
                    );
                  })}
                </div>
              </div>
            </DaisyCardBody>
          </SwipeableCard>
        );
      })}
    </div>
  );
};

// Tablet List Layout
const TabletListLayout: React.FC<{
  data: any[];
  columns: Column[];
  selectedItems: any[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: any, index: number) => void;
  onRowSelect?: (item: any, selected: boolean) => void;
  onSort?: (columnId: string) => void;
  selectable?: boolean;
}> = ({ 
  data, 
  columns, 
  selectedItems, 
  sortColumn, 
  sortDirection,
  onRowClick, 
  onRowSelect, 
  onSort,
  selectable 
}) => {
  const visibleColumns = columns.filter(col => !col.priority || col.priority <= 5);

  return (
    <DaisyCard>
      <DaisyCardContent className="p-0">
        {/* Header */}
        <div className="grid gap-enterprise-3 p-enterprise-4 border-b border-border bg-surface-secondary">
          <div className="grid grid-cols-12 gap-enterprise-3 items-center text-caption font-medium text-text-secondary uppercase tracking-wide">
            {selectable && (
              <div className="col-span-1">
                <DaisyCheckbox />
              </div>
            )}
            {visibleColumns.map((column, index) => (
              <div
                key={column.id}
                className={cn(
                  "flex items-center space-x-1",
                  index === 0 ? "col-span-4" : index === 1 ? "col-span-3" : "col-span-2",
                  column.align === 'center' && "justify-center",
                  column.align === 'right' && "justify-end"
                )}
              >
                <span className="truncate">{column.header}</span>
                {column.sortable && onSort && (
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onSort(column.id)}
                  >
                    {sortColumn === column.id ? (
                      sortDirection === 'asc' ? (
                        <SortAsc className="h-3 w-3" />
                      ) : (
                        <SortDesc className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </TouchButton>
                )}
              </div>
            ))}
            <div className="col-span-1" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {data.map((item, index) => {
            const isSelected = selectedItems.includes(item);
            
            return (
              <div
                key={index}
                className={cn(
                  "grid grid-cols-12 gap-enterprise-3 p-enterprise-4 items-center hover:bg-surface-secondary transition-colors cursor-pointer",
                  isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {selectable && (
                  <div className="col-span-1">
                    <DaisyCheckbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        onRowSelect?.(item, checked as boolean);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                {visibleColumns.map((column, colIndex) => {
                  const value = getCellValue(item, column);
                  return (
                    <div
                      key={column.id}
                      className={cn(
                        "truncate",
                        colIndex === 0 ? "col-span-4" : colIndex === 1 ? "col-span-3" : "col-span-2",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right"
                      )}
                    >
                      {column.cellRenderer 
                        ? column.cellRenderer(value, item, index)
                        : column.type && defaultCellRenderers[column.type as keyof typeof defaultCellRenderers]
                          ? defaultCellRenderers[column.type as keyof typeof defaultCellRenderers](value, item)
                          : formatCellValue(value, column.type)
                      }
                    </div>
                  );
                })}
                
                <div className="col-span-1 flex justify-end">
                  <TouchActionMenu
                    items={[
                      {
                        id: 'view',
                        label: 'View',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: () => console.log('View', item),
                      },
                      {
                        id: 'edit',
                        label: 'Edit',
                        icon: <Edit className="h-4 w-4" />,
                        onClick: () => console.log('Edit', item),
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Desktop Table Layout
const DesktopTableLayout: React.FC<{
  data: any[];
  columns: Column[];
  selectedItems: any[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (item: any, index: number) => void;
  onRowSelect?: (item: any, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onSort?: (columnId: string) => void;
  selectable?: boolean;
  variant?: 'default' | 'compact' | 'comfortable';
}> = ({ 
  data, 
  columns, 
  selectedItems,
  sortColumn,
  sortDirection,
  onRowClick, 
  onRowSelect, 
  onSelectAll,
  onSort,
  selectable,
  variant = 'default'
}) => {
  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const variantClasses = {
    default: 'py-enterprise-4',
    compact: 'py-enterprise-2',
    comfortable: 'py-enterprise-6',
  };

  return (
    <DaisyCard>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              {selectable && (
                <th className="w-12 px-enterprise-4 py-enterprise-3">
                  <DaisyCheckbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onCheckedChange={onSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-enterprise-4 py-enterprise-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wide",
                    column.width && `w-[${column.width}]`,
                    column.minWidth && `min-w-[${column.minWidth}]`,
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right"
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                >
                  <div className="flex items-center space-x-enterprise-2">
                    {column.headerRenderer ? column.headerRenderer() : column.header}
                    {column.sortable && onSort && (
                      <TouchButton
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-surface-primary"
                        onClick={() => onSort(column.id)}
                        aria-label={`Sort by ${column.header}`}
                      >
                        {sortColumn === column.id ? (
                          sortDirection === 'asc' ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </TouchButton>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, index) => {
              const isSelected = selectedItems.includes(item);
              
              return (
                <tr
                  key={index}
                  className={cn(
                    "hover:bg-surface-secondary transition-colors cursor-pointer group",
                    isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                  )}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {selectable && (
                    <td className="px-enterprise-4 py-enterprise-3">
                      <DaisyCheckbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onRowSelect?.(item, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getCellValue(item, column);
                    return (
                      <td
                        key={column.id}
                        className={cn(
                          "px-enterprise-4 text-body-sm",
                          variantClasses[variant],
                          column.className,
                          column.align === 'center' && "text-center",
                          column.align === 'right' && "text-right"
                        )}
                      >
                        {column.cellRenderer 
                          ? column.cellRenderer(value, item, index)
                          : column.type && defaultCellRenderers[column.type as keyof typeof defaultCellRenderers]
                            ? defaultCellRenderers[column.type as keyof typeof defaultCellRenderers](value, item)
                            : formatCellValue(value, column.type)
                        }
                      </td>
                    );
                  })}
                  <td className="px-enterprise-4 py-enterprise-3">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <TouchActionMenu
                        items={[
                          {
                            id: 'view',
                            label: 'View Details',
                            icon: <Eye className="h-4 w-4" />,
                            onClick: () => console.log('View', item),
                          },
                          {
                            id: 'edit',
                            label: 'Edit',
                            icon: <Edit className="h-4 w-4" />,
                            onClick: () => console.log('Edit', item),
                          },
                          {
                            id: 'duplicate',
                            label: 'Duplicate',
                            icon: <Copy className="h-4 w-4" />,
                            onClick: () => console.log('Duplicate', item),
                          },
                          {
                            id: 'delete',
                            label: 'Delete',
                            icon: <Trash2 className="h-4 w-4" />,
                            onClick: () => console.log('Delete', item),
                            variant: 'destructive' as const,
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DaisyCard>
  );
};

// Main Data Table Component
export const ResponsiveDataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = false,
  sortable = true,
  pagination = true,
  pageSize = 10,
  selectable = false,
  expandable = false,
  exportable = false,
  onRowClick,
  onRowSelect,
  onSort,
  onFilter,
  onSearch,
  onExport,
  emptyState,
  className,
  variant = 'default',
  mobileLayout = 'cards',
}) => {
  const device = useDevice();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle row selection
  const handleRowSelect = (item: any, selected: boolean) => {
    const newSelection = selected
      ? [...selectedItems, item]
      : selectedItems.filter(selectedItem => selectedItem !== item);
    
    setSelectedItems(newSelection);
    onRowSelect?.(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = selected ? [...data] : [];
    setSelectedItems(newSelection);
    onRowSelect?.(newSelection);
  };

  // Handle sorting
  const handleSort = (columnId: string) => {
    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSort?.(columnId, newDirection);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  // Filter and paginate data
  const filteredData = searchQuery
    ? data.filter(item =>
        columns.some(column => {
          if (!column.searchable) return false;
          const value = getCellValue(item, column);
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  if (loading) {
    return (
      <DaisyCard className={className}>
        <DaisyCardContent className="p-enterprise-6">
          <div className="space-y-enterprise-4">
            <div className="animate-pulse space-y-enterprise-3">
              <div className="h-4 bg-surface-secondary rounded w-1/4" />
              <div className="space-y-enterprise-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-3 bg-surface-secondary rounded" />
                ))}
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  if (filteredData.length === 0) {
    return (
      <DaisyCard className={className}>
        <DaisyCardContent className="p-enterprise-6">
          {emptyState || (
            <div className="text-center space-y-enterprise-4">
              <div className="w-16 h-16 mx-auto bg-surface-secondary rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-text-secondary" />
              </div>
              <div>
                <h3 className="text-heading-sm font-medium">No data found</h3>
                <p className="text-body-sm text-text-secondary mt-enterprise-1">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding some data.'}
                </p>
              </div>
              {!searchQuery && (
                <TouchButton onClick={() => console.log('Add data')}>
                  <Plus className="h-4 w-4 mr-enterprise-1" />
                  Add Data
                </TouchButton>
              )}
            </div>
          )}
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return (
    <div className={cn("space-y-enterprise-4", className)}>
      {/* Toolbar */}
      <DaisyCard>
        <DaisyCardContent className="p-enterprise-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-enterprise-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-enterprise-2 sm:space-y-0 sm:space-x-enterprise-3">
              {/* Search */}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <DaisyInput
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              )}

              {/* Filters */}
              {filterable && (
                <TouchButton variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-enterprise-1" />
                  Filters
                </TouchButton>
              )}

              {/* Selected count */}
              {selectable && selectedItems.length > 0 && (
                <div className="flex items-center space-x-enterprise-2">
                  <DaisyBadge variant="secondary">
                    {selectedItems.length} selected
                  </DaisyBadge>
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear
                  </TouchButton>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-enterprise-2">
              {/* Export */}
              {exportable && (
                <TouchButton variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-enterprise-1" />
                  Export
                </TouchButton>
              )}

              {/* Refresh */}
              <TouchButton variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </TouchButton>

              {/* View options - Desktop only */}
              {device.type === 'desktop' && (
                <TouchButton variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </TouchButton>
              )}
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Data Display */}
      {device.type === 'mobile' && mobileLayout === 'cards' && (
        <MobileCardLayout
          data={paginatedData}
          columns={columns}
          selectedItems={selectedItems}
          onRowClick={onRowClick}
          onRowSelect={handleRowSelect}
          selectable={selectable}
        />
      )}

      {device.type === 'tablet' && (
        <DaisyTabletListLayout
          data={paginatedData}
          columns={columns}
          selectedItems={selectedItems}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onRowClick={onRowClick}
          onRowSelect={handleRowSelect}
          onSort={handleSort}
          selectable={selectable}
        />
      )}

      {device.type === 'desktop' && (
        <DesktopTableLayout
          data={paginatedData}
          columns={columns}
          selectedItems={selectedItems}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onRowClick={onRowClick}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          onSort={handleSort}
          selectable={selectable}
          variant={variant}
        />
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <DaisyCard>
          <DaisyCardContent className="p-enterprise-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-enterprise-2 sm:space-y-0">
              <div className="text-body-sm text-text-secondary">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
                {filteredData.length} results
              </div>
              
              <div className="flex items-center space-x-enterprise-2">
                <TouchButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </TouchButton>
                
                <div className="flex items-center space-x-enterprise-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 
                      ? i + 1 
                      : currentPage > totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;
                    
                    return (
                      <TouchButton
                        key={page}
                        variant={page === currentPage ? 'default' : 'ghost'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </TouchButton>
                    );
                  })}
                </div>
                
                <TouchButton
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </TouchButton>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
};

export default ResponsiveDataTable;
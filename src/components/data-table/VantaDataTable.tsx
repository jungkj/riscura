'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  X,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Archive,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Shield,
} from 'lucide-react';

// Types
export interface DataTableColumn<T = any> {
  key: string;
  title: string;
  type: 'text' | 'status' | 'progress' | 'date' | 'user' | 'risk' | 'actions';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
  filterOptions?: Array<{ label: string; value: string }>;
}

export interface DataTableProps<T = any> {
  title?: string;
  subtitle?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  searchable?: boolean;
  selectable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  onRowAction?: (action: string, row: T) => void;
  onBulkAction?: (action: string, rows: T[]) => void;
  className?: string;
}

interface FilterState {
  [key: string]: string | string[];
}

interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

// Sample data interface
interface RiskRecord {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'mitigated' | 'closed' | 'monitoring';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  owner: {
    name: string;
    avatar: string;
    email: string;
  };
  progress: number;
  dueDate: Date;
}

// Column renderers
const StatusBadgeCell: React.FC<{ value: string }> = ({ value }) => {
  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType }> = {
    'open': { variant: 'destructive', icon: AlertTriangle },
    'mitigated': { variant: 'secondary', icon: Shield },
    'closed': { variant: 'default', icon: CheckCircle },
    'monitoring': { variant: 'outline', icon: Eye },
  };

  const config = statusConfig[value] || statusConfig['open'];
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="text-caption">
      <IconComponent className="h-3 w-3 mr-enterprise-1" />
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Badge>
  );
};

const RiskLevelCell: React.FC<{ value: string }> = ({ value }) => {
  const riskConfig: Record<string, { color: string, bg: string, text: string }> = {
    'critical': { color: 'border-semantic-error', bg: 'bg-semantic-error/10', text: 'text-semantic-error' },
    'high': { color: 'border-semantic-warning', bg: 'bg-semantic-warning/10', text: 'text-semantic-warning' },
    'medium': { color: 'border-interactive-primary', bg: 'bg-interactive-primary/10', text: 'text-interactive-primary' },
    'low': { color: 'border-semantic-success', bg: 'bg-semantic-success/10', text: 'text-semantic-success' },
  };

  const config = riskConfig[value] || riskConfig['medium'];

  return (
    <div className={cn("inline-flex items-center px-enterprise-2 py-enterprise-1 rounded-full border text-caption font-medium", config.color, config.bg, config.text)}>
      <div className={cn("h-2 w-2 rounded-full mr-enterprise-1", config.text.replace('text-', 'bg-'))} />
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </div>
  );
};

const UserAvatarCell: React.FC<{ value: { name: string; email: string } }> = ({ value }) => {
  return (
    <div className="flex items-center space-x-enterprise-2">
      <div className="h-6 w-6 rounded-full bg-surface-secondary flex items-center justify-center">
        <User className="h-3 w-3 text-text-tertiary" />
      </div>
      <div className="flex flex-col">
        <span className="text-body-sm font-medium text-text-primary">{value.name}</span>
        <span className="text-caption text-text-secondary">{value.email}</span>
      </div>
    </div>
  );
};

const ProgressCell: React.FC<{ value: number }> = ({ value }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-semantic-success';
    if (progress >= 50) return 'bg-semantic-warning';
    return 'bg-semantic-error';
  };

  return (
    <div className="flex items-center space-x-enterprise-2">
      <div className="flex-1 bg-surface-secondary rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-caption text-text-secondary font-medium min-w-8">
        {value}%
      </span>
    </div>
  );
};

const DateCell: React.FC<{ value: Date }> = ({ value }) => {
  const isOverdue = value < new Date();
  const isUpcoming = value < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex items-center space-x-enterprise-1">
      <Calendar className={cn("h-3 w-3", 
        isOverdue ? 'text-semantic-error' : 
        isUpcoming ? 'text-semantic-warning' : 
        'text-text-tertiary'
      )} />
      <span className={cn("text-caption",
        isOverdue ? 'text-semantic-error font-medium' : 
        isUpcoming ? 'text-semantic-warning' : 
        'text-text-secondary'
      )}>
        {value.toLocaleDateString()}
      </span>
    </div>
  );
};

const ActionsCell: React.FC<{ row: any, onAction: (action: string, row: any) => void }> = ({ row, onAction }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onAction('view', row)}>
          <Eye className="h-3 w-3 mr-enterprise-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', row)}>
          <Edit className="h-3 w-3 mr-enterprise-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('duplicate', row)}>
          <Copy className="h-3 w-3 mr-enterprise-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction('archive', row)}>
          <Archive className="h-3 w-3 mr-enterprise-2" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onAction('delete', row)}
          className="text-semantic-error focus:text-semantic-error"
        >
          <Trash2 className="h-3 w-3 mr-enterprise-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Advanced Filters Component
const AdvancedFilters: React.FC<{
  columns: DataTableColumn[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}> = ({ columns, filters, onFiltersChange, onClearFilters }) => {
  const filterableColumns = columns.filter(col => col.filterable);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-3 w-3 mr-enterprise-1" />
          Filters
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-interactive-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-enterprise-4" align="start">
        <div className="space-y-enterprise-4">
          <div className="flex items-center justify-between">
            <h4 className="text-body-sm font-semibold text-text-primary">Advanced Filters</h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {filterableColumns.map((column) => (
            <div key={column.key} className="space-y-enterprise-2">
              <label className="text-caption font-medium text-text-primary">
                {column.title}
              </label>
              {column.filterOptions ? (
                <Select
                  value={filters[column.key] as string || ''}
                  onValueChange={(value) => {
                    const newFilters = { ...filters };
                    if (value) {
                      newFilters[column.key] = value;
                    } else {
                      delete newFilters[column.key];
                    }
                    onFiltersChange(newFilters);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={`Filter by ${column.title.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {column.filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={`Filter by ${column.title.toLowerCase()}`}
                  value={filters[column.key] as string || ''}
                  onChange={(e) => {
                    const newFilters = { ...filters };
                    if (e.target.value) {
                      newFilters[column.key] = e.target.value;
                    } else {
                      delete newFilters[column.key];
                    }
                    onFiltersChange(newFilters);
                  }}
                  className="h-8"
                />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Main Data Table Component
export const VantaDataTable: React.FC<DataTableProps> = ({
  title,
  subtitle,
  columns,
  data,
  searchable = true,
  selectable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  onRowAction,
  onBulkAction,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => {
          const rowValue = row[key as keyof typeof row];
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sort.column && sort.direction) {
      result.sort((a, b) => {
        const aValue = a[sort.column as keyof typeof a];
        const bValue = b[sort.column as keyof typeof b];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination 
    ? filteredData.slice(startIndex, startIndex + pageSize)
    : filteredData;

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSort(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, rowId]);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sort.column !== columnKey) return <ChevronsUpDown className="h-3 w-3" />;
    return sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const renderCell = (column: DataTableColumn, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'status':
        return <StatusBadgeCell value={value} />;
      case 'risk':
        return <RiskLevelCell value={value} />;
      case 'user':
        return <UserAvatarCell value={value} />;
      case 'progress':
        return <ProgressCell value={value} />;
      case 'date':
        return <DateCell value={new Date(value)} />;
      case 'actions':
        return <ActionsCell row={row} onAction={onRowAction || (() => {})} />;
      default:
        return <span className="text-body-sm text-text-primary">{String(value)}</span>;
    }
  };

  return (
    <div className={cn("space-y-enterprise-4", className)}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="space-y-enterprise-1">
          {title && (
            <h2 className="text-heading-base font-semibold text-text-primary">{title}</h2>
          )}
          {subtitle && (
            <p className="text-body-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between space-x-enterprise-4">
        <div className="flex items-center space-x-enterprise-2">
          {/* Search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-enterprise-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-text-tertiary" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-enterprise-8 w-64"
              />
            </div>
          )}

          {/* Advanced Filters */}
          {filterable && (
            <AdvancedFilters
              columns={columns}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
          )}

          {/* Active Filter Indicators */}
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="text-caption">
              {columns.find(col => col.key === key)?.title}: {String(value)}
              <Button
                variant="ghost"
                size="sm"
                className="h-3 w-3 p-0 ml-enterprise-1"
                onClick={() => {
                  const newFilters = { ...filters };
                  delete newFilters[key];
                  setFilters(newFilters);
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="flex items-center space-x-enterprise-2">
          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="flex items-center space-x-enterprise-2">
              <Badge variant="outline" className="text-caption">
                {selectedRows.length} selected
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                    <ChevronDown className="h-3 w-3 ml-enterprise-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onBulkAction?.('export', selectedRows.map(id => data.find(row => row.id === id)!))}>
                    <Download className="h-3 w-3 mr-enterprise-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction?.('archive', selectedRows.map(id => data.find(row => row.id === id)!))}>
                    <Archive className="h-3 w-3 mr-enterprise-2" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onBulkAction?.('delete', selectedRows.map(id => data.find(row => row.id === id)!))}
                    className="text-semantic-error focus:text-semantic-error"
                  >
                    <Trash2 className="h-3 w-3 mr-enterprise-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Table Actions */}
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-enterprise-1" />
            Refresh
          </Button>
          
          {exportable && (
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-enterprise-1" />
              Export
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Settings className="h-3 w-3 mr-enterprise-1" />
            Columns
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-surface-secondary/30 border-b border-border">
              <tr>
                {selectable && (
                  <th className="w-12 px-enterprise-3 py-enterprise-3">
                    <Checkbox
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-enterprise-3 py-enterprise-3 text-left",
                      column.sortable && "cursor-pointer hover:bg-surface-secondary/50 transition-colors",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-enterprise-1">
                      <span className="text-caption font-semibold text-text-primary">
                        {column.title}
                      </span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-enterprise-3 py-enterprise-8">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-interactive-primary" />
                      <p className="text-body-sm text-text-secondary mt-enterprise-2">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-enterprise-3 py-enterprise-8">
                    <div className="text-center">
                      <p className="text-body-sm text-text-secondary">No data available</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="border-b border-border hover:bg-surface-secondary/30 transition-colors"
                  >
                    {selectable && (
                      <td className="px-enterprise-3 py-enterprise-3">
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-enterprise-3 py-enterprise-3",
                          column.align === 'center' && "text-center",
                          column.align === 'right' && "text-right"
                        )}
                      >
                        {renderCell(column, row[column.key], row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-enterprise-4 py-enterprise-3 border-t border-border bg-surface-secondary/30">
            <div className="text-caption text-text-secondary">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
            </div>
            
            <div className="flex items-center space-x-enterprise-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-enterprise-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VantaDataTable; 
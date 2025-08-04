'use client';

// High-Performance Virtualized Table for Large Datasets
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { debounce } from 'lodash-es';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard } from '@/components/ui/DaisyCard'
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import {
import { DaisyTableHeader } from '@/components/ui/daisy-components';
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface VirtualizedTableColumn<T = any> {
  key: string;
  title: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  render?: (_value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface VirtualizedTableProps<T = any> {
  data: T[];
  columns: VirtualizedTableColumn<T>[];
  height?: number;
  rowHeight?: number | ((_index: number) => number);
  headerHeight?: number;
  overscanCount?: number;
  loading?: boolean;
  className?: string;
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (_filters: Record<string, any>) => void;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
  selectedRows?: Set<number>;
  onRowSelect?: (_index: number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showSelectColumn?: boolean;
  stickyHeader?: boolean;
  enableColumnReorder?: boolean;
  enableColumnResize?: boolean;
  virtualizationType?: 'fixed' | 'variable' | 'grid';
  estimatedRowHeight?: number;
  bufferSize?: number;
  scrollToIndex?: number;
  scrollToAlignment?: 'auto' | 'smart' | 'center' | 'end' | 'start';
  hasNextPage?: boolean;
  loadMore?: () => Promise<void>;
  searchable?: boolean;
  searchValue?: string;
  onSearch?: (_value: string) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  emptyMessage?: string;
  loadingMessage?: string;
  threshold?: number;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    columns: VirtualizedTableColumn[];
    rows: any[];
    onRowClick?: (record: any, index: number) => void;
    onRowDoubleClick?: (record: any, index: number) => void;
    selectedRows?: Set<number>;
    onRowSelect?: (_index: number, selected: boolean) => void;
  }
}

interface RowProps extends ListChildComponentProps {
  data: {
    columns: VirtualizedTableColumn[];
    rows: any[];
    onRowClick?: (record: any, index: number) => void;
    onRowDoubleClick?: (record: any, index: number) => void;
    selectedRows?: Set<number>;
    onRowSelect?: (_index: number, selected: boolean) => void;
  }
}

const VirtualizedTable = <T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  rowHeight = 40,
  headerHeight = 48,
  overscanCount = 5,
  loading = false,
  className,
  onRowClick,
  onRowDoubleClick,
  onSort,
  onFilter,
  onScroll,
  sortBy,
  sortDirection,
  filters = {},
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  showSelectColumn = false,
  stickyHeader = true,
  enableColumnReorder = false,
  enableColumnResize = true,
  virtualizationType = 'fixed',
  estimatedRowHeight = 40,
  bufferSize = 10,
  scrollToIndex,
  scrollToAlignment = 'auto',
  hasNextPage = false,
  loadMore,
  searchable = false,
  searchValue = '',
  onSearch,
  rowClassName,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  threshold = 15,
}: VirtualizedTableProps<T>) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {}
    columns.forEach((col) => {
      widths[col.key] = col.width;
    });
    return widths;
  });

  const [sortState, setSortState] = useState({
    key: sortBy,
    direction: sortDirection,
  });

  const [filterState, setFilterState] = useState(filters);
  const [resizing, setResizing] = useState<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const listRef = useRef<any>(null);
  const gridRef = useRef<any>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoized processed data
  const processedData = useMemo(() => {
    let _result = [...data]

    // Apply filters
    Object.entries(filterState).forEach(([key, value]) => {
      if (value && value !== '') {
        result = result.filter((item) => {
          const itemValue = item[key]
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortState.key && sortState.direction) {
      result.sort((a, b) => {
        const aValue = a[sortState.key!]
        const bValue = b[sortState.key!];

        if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filterState, sortState]);

  // Memoized columns with select column
  const finalColumns = useMemo(() => {
    const cols = [...columns]

    if (showSelectColumn) {
      cols.unshift({
        key: '__select__',
        title: '',
        width: 48,
        render: (_, __, index) => (
          <input
            type="checkbox"
            checked={selectedRows.has(index)}
            onChange={(e) => onRowSelect?.(index, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        ),
        align: 'center' as const,
      });
    }

    return cols;
  }, [columns, showSelectColumn, selectedRows, onRowSelect]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return finalColumns.reduce((sum, col) => sum + (columnWidths[col.key] || col.width), 0)
  }, [finalColumns, columnWidths]);

  // Handle column sort
  const handleSort = useCallback(
    (key: string) => {
      if (!onSort) return

      const newDirection = sortState.key === key && sortState.direction === 'asc' ? 'desc' : 'asc';
      setSortState({ key, direction: newDirection });
      onSort(key, newDirection);
    },
    [sortState, onSort]
  );

  // Handle column filter
  const debouncedFilter = useCallback(
    debounce((key: string, value: any) => {
      const newFilters = { ...filterState, [key]: value }
      setFilterState(newFilters);
      onFilter?.(newFilters);
    }, 300),
    [filterState, onFilter]
  );

  // Handle column resize
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, key: string) => {
      if (!enableColumnResize) return

      e.preventDefault();
      setResizing({
        key,
        startX: e.clientX,
        startWidth: columnWidths[key],
      });
    },
    [columnWidths, enableColumnResize]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);

      setColumnWidths((prev) => ({
        ...prev,
        [resizing.key]: newWidth,
      }));
    },
    [resizing]
  );

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  // Set up resize event listeners
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Scroll synchronization
  const handleScroll = useCallback(
    ({ scrollLeft, scrollTop }: any) => {
      if (headerRef.current) {
        headerRef.current.scrollLeft = scrollLeft
      }
      onScroll?.(scrollTop, scrollLeft);
    },
    [onScroll]
  );

  // Grid cell renderer
  const GridCell = ({ columnIndex, rowIndex, style, data: gridData }: CellProps) => {
    const column = gridData.columns[columnIndex]
    const record = gridData.rows[rowIndex];
    const value = record[column.key];
    const isSelected = gridData.selectedRows?.has(rowIndex);

    return (
      <div
        style={style}
        className={cn(
          'flex items-center px-3 border-b border-r border-gray-200',
          'hover:bg-gray-50 cursor-pointer',
          isSelected && 'bg-blue-50',
          column.align === 'center' && 'justify-center',
          column.align === 'right' && 'justify-end',
          column.className
        )}
        onClick={() => gridData.onRowClick?.(record, rowIndex)}
        onDoubleClick={() => gridData.onRowDoubleClick?.(record, rowIndex)}
      >
        {column.render ? column.render(value, record, rowIndex) : value}
      </div>
    );
  }

  // List row renderer
  const ListRow = ({ index, style, data: listData }: RowProps) => {
    const record = listData.rows[index]
    const isSelected = listData.selectedRows?.has(index);

    return (
      <div
        style={style}
        className={cn(
          'flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer',
          isSelected && 'bg-blue-50'
        )}
        onClick={() => listData.onRowClick?.(record, index)}
        onDoubleClick={() => listData.onRowDoubleClick?.(record, index)}
      >
        {listData.columns.map((column, colIndex) => {
          const value = record[column.key];
          return (
            <div
              key={column.key}
              style={{ width: columnWidths[column.key] || column.width }}
              className={cn(
                'flex items-center px-3 border-r border-gray-200',
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end',
                column.className
              )}
            >
              {column.render ? column.render(value, record, index) : value}
            </div>
          );
        })}
      </div>
    );
  }

  // Variable row height calculator
  const getRowHeight = useCallback(
    (_index: number) => {
      if (typeof rowHeight === 'function') {
        return rowHeight(index)
      }
      return rowHeight;
    },
    [rowHeight]
  );

  // Header component
  const TableHeader = () => (
    <div
      ref={headerRef}
      className={cn(
        'flex border-b-2 border-gray-300 bg-gray-50 font-semibold',
        stickyHeader && 'sticky top-0 z-10'
      )}
      style={{ height: headerHeight }}
    >
      {Boolean(showSelectColumn) && (
        <div
          style={{ width: 48 }}
          className="flex items-center justify-center px-3 border-r border-gray-300"
        >
          <input
            type="checkbox"
            checked={selectedRows.size === processedData.length && processedData.length > 0}
            onChange={(e) => onSelectAll?.(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        </div>
      )}

      {finalColumns.map((column) => {
        if (column.key === '__select__') return null

        return (
          <div
            key={column.key}
            style={{ width: columnWidths[column.key] || column.width }}
            className={cn(
              'flex items-center px-3 border-r border-gray-300 relative',
              column.sortable && 'cursor-pointer hover:bg-gray-100',
              column.headerClassName
            )}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <span className="truncate">{column.title}</span>

            {column.sortable && sortState.key === column.key && (
              <span className="ml-1">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
            )}

            {column.filterable && (
              <input
                type="text"
                placeholder="Filter..."
                className="ml-2 px-1 py-0.5 text-xs border rounded"
                onChange={(e) => debouncedFilter(column.key, e.target.value)}
                onClick={(e) => e.stopPropagation()} />
            )}

            {Boolean(enableColumnResize) && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500"
                onMouseDown={(e) => handleMouseDown(e, column.key)} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Loading component
  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)} style={{ height }}>
        <DaisyTableHeader >
          <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  // Empty state
  if (processedData.length === 0) {
    return (
      <div className={cn('border rounded-lg', className)} style={{ height }}>
        <DaisyTableHeader >
          <div className="flex items-center justify-center h-full text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  const itemData = {
    columns: finalColumns,
    rows: processedData,
    onRowClick,
    onRowDoubleClick,
    selectedRows,
    onRowSelect,
  }

  return (
    <div ref={containerRef} className={cn('border rounded-lg overflow-hidden', className)}>
      <DaisyTableHeader >
        <div style={{ height: height - headerHeight }}>
        <AutoSizer>
          {({ height: autoHeight, width: autoWidth }) => {
            if (virtualizationType === 'grid') {
              return (
                <Grid
                  ref={gridRef}
                  columnCount={finalColumns.length}
                  columnWidth={(index) =>
                    columnWidths[finalColumns[index].key] || finalColumns[index].width
                  }
                  height={autoHeight}
                  rowCount={processedData.length}
                  rowHeight={typeof rowHeight === 'number' ? rowHeight : estimatedRowHeight}
                  width={autoWidth}
                  itemData={itemData}
                  onScroll={handleScroll}
                  overscanRowCount={overscanCount}
                  overscanColumnCount={2}
                  initialScrollToRow={scrollToIndex}
                  initialScrollToColumn={0}
                >
                  {GridCell}
                </Grid>
              );
            }

            if (virtualizationType === 'variable') {
              return (
                <VariableSizeList
                  ref={listRef}
                  height={autoHeight}
                  itemCount={processedData.length}
                  itemSize={getRowHeight}
                  itemData={itemData}
                  onScroll={handleScroll}
                  overscanCount={overscanCount}
                  estimatedItemSize={estimatedRowHeight}
                  itemKey={(_index: number) => processedData[index].id || index}
                  width={autoWidth}
                >
                  {ListRow}
                </VariableSizeList>
              );
            }

            return (
              <List
                ref={listRef}
                height={autoHeight}
                itemCount={processedData.length}
                itemSize={typeof rowHeight === 'number' ? rowHeight : estimatedRowHeight}
                itemData={itemData}
                onScroll={handleScroll}
                overscanCount={overscanCount}
                itemKey={(_index: number) => processedData[index].id || index}
                width={autoWidth}
              >
                {ListRow}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
}

export default VirtualizedTable;

// Utility hook for table state management
export const useVirtualizedTable = <T extends Record<string, any>>(
  initialData: T[],
  initialColumns: VirtualizedTableColumn<T>[]
) => {
  const [data, setData] = useState(initialData)
  const [columns, setColumns] = useState(initialColumns);
  const [sortBy, setSortBy] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortDirection(direction);
  }, []);

  const handleFilter = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const handleRowSelect = useCallback((_index: number, selected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedRows(new Set(data.map((_, index) => index)));
      } else {
        setSelectedRows(new Set());
      }
    },
    [data]
  );

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const getSelectedData = useCallback(() => {
    return Array.from(selectedRows).map((index) => data[index]);
  }, [selectedRows, data]);

  return {
    data,
    setData,
    columns,
    setColumns,
    sortBy,
    sortDirection,
    filters,
    selectedRows,
    loading,
    setLoading,
    handleSort,
    handleFilter,
    handleRowSelect,
    handleSelectAll,
    clearSelection,
    getSelectedData,
  }
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedDataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    title: string;
    width?: number;
    render?: (_value: any, item: T) => React.ReactNode;
  }>;
  height?: number;
  itemHeight?: number;
  onItemClick?: (item: T, index: number) => void;
  searchable?: boolean;
  sortable?: boolean;
  className?: string;
}

export const VirtualizedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  onItemClick,
  searchable = true,
  sortable = true,
  className = '',
}: VirtualizedDataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Search filter
    if (searchTerm && searchable) {
      filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Sort
    if (sortConfig && sortable) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, searchable, sortable]);

  const handleSort = useCallback(
    (key: keyof T) => {
      if (!sortable) return;

      setSortConfig((current) => {
        if (current?.key === key) {
          return {
            key,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
          }
        }
        return { key, direction: 'asc' }
      });
    },
    [sortable]
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = processedData[index];
      const isEven = index % 2 === 0;

      return (
        <div
          style={style}
          className={`flex items-center border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
            isEven ? 'bg-white' : 'bg-gray-50'
          }`}
          onClick={() => onItemClick?.(item, index)}
        >
          {columns.map((column, colIndex) => {
            const value = item[column.key];
            const cellContent = column.render ? column.render(value, item) : String(value);

            return (
              <div
                key={String(column.key)}
                className="flex-1 px-4 py-2 text-sm truncate"
                style={{ width: column.width }}
              >
                {cellContent}
              </div>
            );
          })}
        </div>
      );
    },
    [processedData, columns, onItemClick]
  );

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Search Input */}
      {Boolean(searchable) && (
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center bg-gray-100 border-b border-gray-300">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className={`flex-1 px-4 py-3 text-sm font-medium text-gray-700 ${
              sortable ? 'cursor-pointer hover:bg-gray-200' : ''
            }`}
            style={{ width: column.width }}
            onClick={() => handleSort(column.key)}
          >
            <div className="flex items-center justify-between">
              {column.title}
              {Boolean(sortable) && sortConfig?.key === column.key && (
                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual List */}
      <div style={{ height }}>
        <List
          height={height}
          itemCount={processedData.length}
          itemSize={itemHeight}
          itemData={processedData}
          width="100%"
        >
          {Row}
        </List>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        Showing {processedData.length} of {data.length} items
        {Boolean(searchTerm) && ` (filtered by "${searchTerm}")`}
      </div>
    </div>
  );
}

// Performance optimized list item component
export const MemoizedListItem = React.memo<{
  item: any
  columns: any[];
  onClick?: (item: any) => void;
}>(({ item, columns, onClick }) => (
  <div
    className="flex items-center border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
    onClick={() => onClick?.(item)}
  >
    {columns.map((column) => (
      <div
        key={column.key}
        className="flex-1 px-4 py-2 text-sm truncate"
        style={{ width: column.width }}
      >
        {column.render ? column.render(item[column.key], item) : String(item[column.key])}
      </div>
    ))}
  </div>
));

MemoizedListItem.displayName = 'MemoizedListItem';

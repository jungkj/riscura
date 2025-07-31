'use client';

import React from 'react';
import { designTokens } from '@/lib/design-system/tokens';

// Base skeleton component with animation
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

const BaseSkeleton: React.FC<DaisySkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = true,
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`bg-gray-200 ${roundedClasses[rounded]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
};

// Text skeleton with multiple lines
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
  lastLineWidth?: string;
}

const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 3,
  className = '',
  lineHeight = '1rem',
  lastLineWidth = '75%',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <BaseSkeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

// Card skeleton for dashboard widgets
interface CardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}

const CardSkeleton: React.FC<DaisyCardSkeletonProps> = ({
  className = '',
  showHeader = true,
  showFooter = false,
  contentLines = 4,
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 xs:p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BaseSkeleton width={24} height={24} rounded="md" />
            <BaseSkeleton width="120px" height="1.25rem" />
          </div>
          <BaseSkeleton width={20} height={20} rounded="sm" />
        </div>
      )}

      <div className="space-y-3">
        <TextSkeleton lines={contentLines} />
      </div>

      {showFooter && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <BaseSkeleton width="80px" height="0.875rem" />
            <BaseSkeleton width="60px" height="2rem" rounded="md" />
          </div>
        </div>
      )}
    </div>
  );
};

// Table skeleton for data tables
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

const TableSkeleton: React.FC<DaisyTableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true,
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="bg-gray-50 px-4 xs:px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <BaseSkeleton key={index} height="1rem" width="80%" />
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 xs:px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <BaseSkeleton key={colIndex} height="1rem" width={colIndex === 0 ? '90%' : '70%'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// List skeleton for activity feeds
interface ListSkeletonProps {
  items?: number;
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  className = '',
  showAvatar = true,
  showActions = false,
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 ${className}`}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 xs:p-6">
          <div className="flex items-start space-x-3 xs:space-x-4">
            {showAvatar && (
              <BaseSkeleton width={40} height={40} rounded="full" className="flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <BaseSkeleton width="120px" height="1rem" />
                <BaseSkeleton width="60px" height="0.875rem" />
              </div>
              <TextSkeleton lines={2} lineHeight="0.875rem" lastLineWidth="85%" />
            </div>

            {showActions && (
              <div className="flex-shrink-0">
                <BaseSkeleton width={24} height={24} rounded="sm" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart skeleton for analytics
interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
  showLegend?: boolean;
  height?: string;
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  className = '',
  showLegend = true,
  height = '300px',
}) => {
  const renderChartContent = () => {
    switch (type) {
      case 'bar':
        return (
          <div className="flex items-end justify-between space-x-2 h-full">
            {Array.from({ length: 8 }).map((_, index) => (
              <BaseSkeleton
                key={index}
                width="100%"
                height={`${Math.random() * 60 + 40}%`}
                rounded="sm"
              />
            ))}
          </div>
        );

      case 'line':
      case 'area':
        return (
          <div className="relative h-full">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="50%" stopColor="#f3f4f6" />
                  <stop offset="100%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 Q100,100 200,120 T400,80"
                stroke="url(#skeleton-gradient)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              {type === 'area' && (
                <path
                  d="M0,150 Q100,100 200,120 T400,80 L400,200 L0,200 Z"
                  fill="url(#skeleton-gradient)"
                  opacity="0.3"
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        );

      case 'pie':
        return (
          <div className="flex items-center justify-center h-full">
            <BaseSkeleton width={200} height={200} rounded="full" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 xs:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <BaseSkeleton width="150px" height="1.25rem" />
        <BaseSkeleton width="80px" height="2rem" rounded="md" />
      </div>

      <div style={{ height }} className="mb-4">
        {renderChartContent()}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-4 justify-center">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <BaseSkeleton width={12} height={12} rounded="sm" />
              <BaseSkeleton width="60px" height="0.875rem" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Form skeleton for wizards and forms
interface FormSkeletonProps {
  fields?: number;
  className?: string;
  showButtons?: boolean;
  columns?: 1 | 2;
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 6,
  className = '',
  showButtons = true,
  columns = 1,
}) => {
  const gridCols = columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 xs:p-6 ${className}`}>
      <div className="mb-6">
        <BaseSkeleton width="200px" height="1.5rem" className="mb-2" />
        <BaseSkeleton width="300px" height="1rem" />
      </div>

      <div className={`grid ${gridCols} gap-4 xs:gap-6 mb-6`}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <BaseSkeleton width="120px" height="1rem" />
            <BaseSkeleton height="2.5rem" rounded="md" />
          </div>
        ))}
      </div>

      {showButtons && (
        <div className="flex flex-col xs:flex-row gap-3 xs:justify-end">
          <BaseSkeleton width="100px" height="2.5rem" rounded="md" />
          <BaseSkeleton width="120px" height="2.5rem" rounded="md" />
        </div>
      )}
    </div>
  );
};

// Dashboard skeleton for full page loading
interface DashboardSkeletonProps {
  className?: string;
}

const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 xs:p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4">
        <div>
          <BaseSkeleton width="250px" height="2rem" className="mb-2" />
          <BaseSkeleton width="180px" height="1rem" />
        </div>
        <div className="flex gap-3">
          <BaseSkeleton width="100px" height="2.5rem" rounded="md" />
          <BaseSkeleton width="120px" height="2.5rem" rounded="md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 xs:p-6">
            <div className="flex items-center justify-between mb-3">
              <BaseSkeleton width="80px" height="1rem" />
              <BaseSkeleton width={24} height={24} rounded="md" />
            </div>
            <BaseSkeleton width="60px" height="2rem" className="mb-2" />
            <BaseSkeleton width="100px" height="0.875rem" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart */}
        <div className="lg:col-span-2">
          <ChartSkeleton type="area" height="400px" />
        </div>

        {/* Activity List */}
        <div>
          <ListSkeleton items={6} showAvatar={true} />
        </div>
      </div>

      {/* Data Table */}
      <DaisyTableSkeleton rows={8} columns={5} />
    </div>
  );
};

// Progressive loading skeleton for infinite scroll
interface ProgressiveSkeletonProps {
  itemCount?: number;
  itemHeight?: string;
  className?: string;
}

const ProgressiveSkeleton: React.FC<DaisyProgressiveSkeletonProps> = ({
  itemCount = 3,
  itemHeight = '80px',
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg p-4 xs:p-6"
          style={{ height: itemHeight }}
        >
          <div className="flex items-start space-x-4 h-full">
            <BaseSkeleton width={48} height={48} rounded="lg" className="flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <BaseSkeleton width="70%" height="1.25rem" />
              <BaseSkeleton width="90%" height="1rem" />
              <BaseSkeleton width="50%" height="0.875rem" />
            </div>
            <BaseSkeleton width={80} height={32} rounded="md" className="flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Export all skeleton components
export const SkeletonLoader = {
  Base: BaseSkeleton,
  Text: TextSkeleton,
  Card: CardSkeleton,
  Table: TableSkeleton,
  List: ListSkeleton,
  Chart: ChartSkeleton,
  Form: FormSkeleton,
  Dashboard: DashboardSkeleton,
  Progressive: ProgressiveSkeleton,
};

export default SkeletonLoader;

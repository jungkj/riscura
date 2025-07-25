'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';

// Animation variants for skeletons
type SkeletonVariant = 'pulse' | 'wave' | 'shimmer';

// Base skeleton component with animation variants
interface BaseSkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  children?: React.ReactNode;
}

const BaseSkeleton: React.FC<BaseSkeletonProps> = ({ 
  className, 
  variant = 'pulse',
  children 
}) => {
  const getAnimationClasses = () => {
    switch (variant) {
      case 'pulse':
        return 'animate-pulse bg-gray-200 dark:bg-gray-700';
      case 'wave':
        return 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[wave_1.5s_ease-in-out_infinite]';
      case 'shimmer':
        return 'relative overflow-hidden bg-gray-200 dark:bg-gray-700 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';
      default:
        return 'animate-pulse bg-gray-200 dark:bg-gray-700';
    }
  };

  return (
    <div 
      className={cn('rounded-md', getAnimationClasses(), className)}
      data-testid="loading-skeleton"
    >
      {children}
    </div>
  );
};

// Text skeleton component
interface TextSkeletonProps extends BaseSkeletonProps {
  lines?: number;
  lineHeight?: 'sm' | 'md' | 'lg';
  lastLineWidth?: string;
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 1,
  lineHeight = 'md',
  lastLineWidth = '75%',
  variant = 'pulse',
  className
}) => {
  const heightClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5'
  };

  if (lines === 1) {
    return (
      <BaseSkeleton 
        variant={variant}
        className={cn(heightClasses[lineHeight], 'w-full', className)}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <BaseSkeleton
          key={index}
          variant={variant}
          className={cn(
            heightClasses[lineHeight],
            index === lines - 1 ? `w-[${lastLineWidth}]` : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

// Card skeleton component
interface CardSkeletonProps extends BaseSkeletonProps {
  hasImage?: boolean;
  hasHeader?: boolean;
  hasActions?: boolean;
  textLines?: number;
  width?: string;
  height?: string;
}

export const CardSkeleton: React.FC<DaisyCardSkeletonProps> = ({
  hasImage = false,
  hasHeader = true,
  hasActions = false,
  textLines = 3,
  width = 'w-full',
  height,
  variant = 'pulse',
  className
}) => {
  return (
    <DaisyCard className={cn(width, height, className)}>
      {hasImage && (
        <BaseSkeleton 
          variant={variant}
          className="h-48 w-full rounded-t-lg rounded-b-none"
        />
      )}
      
      <DaisyCardHeader className={cn(!hasImage && 'rounded-t-lg')}>
        {hasHeader && (
          <div className="space-y-2">
            <BaseSkeleton variant={variant} className="h-6 w-3/4" />
            <BaseSkeleton variant={variant} className="h-4 w-1/2" />
          </div>
        )}
      
      
      <DaisyCardContent className="space-y-3">
        <TextSkeleton 
          lines={textLines} 
          variant={variant}
          lineHeight="md"
        />
        
        {hasActions && (
          <div className="flex gap-2 pt-4">
            <BaseSkeleton variant={variant} className="h-9 w-20" />
            <BaseSkeleton variant={variant} className="h-9 w-16" />
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Table skeleton component
interface TableSkeletonProps extends BaseSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
  showCheckboxes?: boolean;
}

export const TableSkeleton: React.FC<DaisyTableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  hasHeader = true,
  hasActions = true,
  showCheckboxes = false,
  variant = 'pulse',
  className
}) => {
  const totalColumns = columns + (hasActions ? 1 : 0) + (showCheckboxes ? 1 : 0);

  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-md border">
        {/* Table Header */}
        {hasHeader && (
          <div className="border-b bg-muted/50">
            <div className="flex">
              {showCheckboxes && (
                <div className="w-12 p-4">
                  <BaseSkeleton variant={variant} className="h-4 w-4" />
                </div>
              )}
              {Array.from({ length: columns }).map((_, index) => (
                <div key={index} className="flex-1 p-4">
                  <BaseSkeleton variant={variant} className="h-4 w-24" />
                </div>
              ))}
              {hasActions && (
                <div className="w-24 p-4">
                  <BaseSkeleton variant={variant} className="h-4 w-16" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {showCheckboxes && (
                <div className="w-12 p-4">
                  <BaseSkeleton variant={variant} className="h-4 w-4" />
                </div>
              )}
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 p-4">
                  <BaseSkeleton 
                    variant={variant} 
                    className={cn(
                      'h-4',
                      colIndex === 0 ? 'w-32' : 'w-20'
                    )}
                  />
                </div>
              ))}
              {hasActions && (
                <div className="w-24 p-4">
                  <div className="flex gap-1">
                    <BaseSkeleton variant={variant} className="h-6 w-6" />
                    <BaseSkeleton variant={variant} className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dashboard skeleton component
interface DashboardSkeletonProps extends BaseSkeletonProps {
  statsCards?: number;
  hasChart?: boolean;
  hasTable?: boolean;
  hasActivity?: boolean;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  statsCards = 4,
  hasChart = true,
  hasTable = true,
  hasActivity = true,
  variant = 'pulse',
  className
}) => {
  return (
    <div className={cn('space-y-6', className)} data-testid="dashboard-skeleton">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: statsCards }).map((_, index) => (
          <DaisyCard key={index}>
            <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <BaseSkeleton variant={variant} className="h-4 w-24" />
              <BaseSkeleton variant={variant} className="h-4 w-4" />
            
            <DaisyCardContent>
              <BaseSkeleton variant={variant} className="h-8 w-20 mb-2" />
              <BaseSkeleton variant={variant} className="h-3 w-32" />
            </DaisyCardBody>
          </DaisyCard>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Section */}
        {hasChart && (
          <DaisyCard className="col-span-4">
            <DaisyCardHeader>
              <BaseSkeleton variant={variant} className="h-6 w-48" />
              <BaseSkeleton variant={variant} className="h-4 w-32" />
            
            <DaisyCardContent>
              <BaseSkeleton variant={variant} className="h-80 w-full" />
            </DaisyCardBody>
          </DaisyCard>
        )}

        {/* Activity Feed */}
        {hasActivity && (
          <DaisyCard className="col-span-3">
            <DaisyCardHeader>
              <BaseSkeleton variant={variant} className="h-6 w-32" />
            
            <DaisyCardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <BaseSkeleton variant={variant} className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <BaseSkeleton variant={variant} className="h-4 w-3/4" />
                      <BaseSkeleton variant={variant} className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </DaisyCardBody>
          </DaisyCard>
        )}
      </div>

      {/* Table Section */}
      {hasTable && (
        <DaisyCard>
          <DaisyCardHeader>
            <div className="flex items-center justify-between">
              <BaseSkeleton variant={variant} className="h-6 w-40" />
              <BaseSkeleton variant={variant} className="h-9 w-24" />
            </div>
          
          <DaisyCardContent>
            <DaisyTableSkeleton 
              variant={variant}
              rows={8}
              columns={5}
              hasActions={true}
              showCheckboxes={true}
            />
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
};

// List skeleton component
interface ListSkeletonProps extends BaseSkeletonProps {
  items?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
  showDividers?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  hasAvatar = true,
  hasActions = true,
  showDividers = true,
  variant = 'pulse',
  className
}) => {
  return (
    <div className={cn('space-y-0', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index}>
          <div className="flex items-center space-x-4 p-4">
            {hasAvatar && (
              <BaseSkeleton variant={variant} className="h-10 w-10 rounded-full" />
            )}
            <div className="flex-1 space-y-2">
              <BaseSkeleton variant={variant} className="h-4 w-1/2" />
              <BaseSkeleton variant={variant} className="h-3 w-3/4" />
            </div>
            {hasActions && (
              <div className="flex space-x-2">
                <BaseSkeleton variant={variant} className="h-8 w-8" />
                <BaseSkeleton variant={variant} className="h-8 w-8" />
              </div>
            )}
          </div>
          {showDividers && index < items - 1 && (
            <div className="border-b border-gray-200 dark:border-gray-700" />
          )}
        </div>
      ))}
    </div>
  );
};

// Form skeleton component
interface FormSkeletonProps extends BaseSkeletonProps {
  fields?: number;
  hasTextarea?: boolean;
  hasSelect?: boolean;
  hasCheckboxes?: boolean;
  hasButtons?: boolean;
  layout?: 'single' | 'two-column';
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  hasTextarea = true,
  hasSelect = true,
  hasCheckboxes = true,
  hasButtons = true,
  layout = 'single',
  variant = 'pulse',
  className
}) => {
  const gridClasses = layout === 'two-column' ? 'grid grid-cols-2 gap-4' : 'space-y-4';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Form Fields */}
      <div className={gridClasses}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <BaseSkeleton variant={variant} className="h-4 w-24" />
            <BaseSkeleton variant={variant} className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Select Field */}
      {hasSelect && (
        <div className="space-y-2">
          <BaseSkeleton variant={variant} className="h-4 w-32" />
          <BaseSkeleton variant={variant} className="h-10 w-full" />
        </div>
      )}

      {/* Textarea */}
      {hasTextarea && (
        <div className="space-y-2">
          <BaseSkeleton variant={variant} className="h-4 w-28" />
          <BaseSkeleton variant={variant} className="h-24 w-full" />
        </div>
      )}

      {/* Checkboxes */}
      {hasCheckboxes && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <BaseSkeleton variant={variant} className="h-4 w-4" />
              <BaseSkeleton variant={variant} className="h-4 w-40" />
            </div>
          ))}
        </div>
      )}

      {/* Form Buttons */}
      {hasButtons && (
        <div className="flex justify-end space-x-3 pt-4">
          <BaseSkeleton variant={variant} className="h-10 w-20" />
          <BaseSkeleton variant={variant} className="h-10 w-24" />
        </div>
      )}
    </div>
  );
};

// Chart skeleton component
interface ChartSkeletonProps extends BaseSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  showLegend?: boolean;
  showAxes?: boolean;
  height?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  showLegend = true,
  showAxes = true,
  height = 'h-80',
  variant = 'pulse',
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart Title */}
      <div className="flex items-center justify-between">
        <BaseSkeleton variant={variant} className="h-6 w-48" />
        <BaseSkeleton variant={variant} className="h-8 w-24" />
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex space-x-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <BaseSkeleton variant={variant} className="h-3 w-3 rounded-full" />
              <BaseSkeleton variant={variant} className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Chart Area */}
      <div className={cn('relative', height)}>
        {/* Y-Axis */}
        {showAxes && (
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <BaseSkeleton key={index} variant={variant} className="h-3 w-8" />
            ))}
          </div>
        )}

        {/* Chart Content */}
        <div className={cn('ml-12 mr-4', height)}>
          {type === 'bar' && (
            <div className="flex items-end justify-between h-full pb-8">
              {Array.from({ length: 12 }).map((_, index) => (
                <BaseSkeleton 
                  key={index} 
                  variant={variant} 
                  className={cn(
                    'w-6',
                    `h-${Math.floor(Math.random() * 60) + 20}`
                  )}
                />
              ))}
            </div>
          )}

          {type === 'line' && (
            <BaseSkeleton variant={variant} className="h-full w-full pb-8" />
          )}

          {type === 'pie' && (
            <div className="flex items-center justify-center h-full">
              <BaseSkeleton variant={variant} className="h-48 w-48 rounded-full" />
            </div>
          )}

          {type === 'area' && (
            <BaseSkeleton variant={variant} className="h-full w-full pb-8" />
          )}
        </div>

        {/* X-Axis */}
        {showAxes && (
          <div className="absolute bottom-0 left-12 right-4 h-8 flex justify-between items-end">
            {Array.from({ length: 6 }).map((_, index) => (
              <BaseSkeleton key={index} variant={variant} className="h-3 w-12" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Full page loading skeletons
export const PageSkeletons = {
  // Dashboard page skeleton
  Dashboard: () => (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <BaseSkeleton className="h-8 w-48" />
        <BaseSkeleton className="h-10 w-32" />
      </div>
      <DashboardSkeleton />
    </div>
  ),

  // Form page skeleton
  Form: () => (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <BaseSkeleton className="h-8 w-64" />
        <DaisyCard>
          <DaisyCardHeader>
            <BaseSkeleton className="h-6 w-48" />
            <BaseSkeleton className="h-4 w-96" />
          
          <DaisyCardContent>
            <FormSkeleton fields={6} layout="two-column" />
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  ),

  // List page skeleton
  List: () => (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-8 w-48" />
          <div className="flex space-x-3">
            <BaseSkeleton className="h-10 w-24" />
            <BaseSkeleton className="h-10 w-32" />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4">
          <BaseSkeleton className="h-10 w-48" />
          <BaseSkeleton className="h-10 w-32" />
          <BaseSkeleton className="h-10 w-28" />
        </div>

        {/* Content */}
        <DaisyCard>
          <DaisyCardContent>
            <DaisyTableSkeleton rows={10} columns={6} hasActions showCheckboxes />
          </DaisyCardBody>
        </DaisyCard>
      </div>
    </div>
  ),

  // Detail page skeleton
  Detail: () => (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <BaseSkeleton className="h-8 w-64" />
            <BaseSkeleton className="h-4 w-48" />
          </div>
          <div className="flex space-x-3">
            <BaseSkeleton className="h-10 w-20" />
            <BaseSkeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <DaisyCardSkeleton hasHeader textLines={5} />
            <DaisyCardSkeleton hasHeader textLines={3} />
          </div>
          <div className="space-y-6">
            <DaisyCardSkeleton hasHeader textLines={4} />
            <DaisyCardSkeleton hasHeader hasActions textLines={2} />
          </div>
        </div>
      </div>
    </div>
  )
};

// Animated skeleton wrapper with staggered loading
interface AnimatedSkeletonProps {
  children: React.ReactNode;
  stagger?: boolean;
  delay?: number;
}

export const AnimatedSkeleton: React.FC<AnimatedSkeletonProps> = ({
  children,
  stagger = true,
  delay = 100
}) => {
  if (!stagger) {
    return <>{children}</>;
  }

  return (
    <div className="animate-in fade-in-0 duration-500">
      {children}
    </div>
  );
};

// Custom CSS for additional animations (to be added to globals.css)
export const skeletonAnimations = `
@keyframes wave {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-wave {
  animation: wave 1.5s ease-in-out infinite;
}

.animate-shimmer::before {
  animation: shimmer 2s infinite;
}
`;

export default BaseSkeleton; 
// Comprehensive Loading States and Skeletons
'use client';

import React from 'react';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from './progress';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';

// Base Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'text-primary',
    secondary: 'text-muted-foreground',
    destructive: 'text-destructive'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
};

// Skeleton Components
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    >
      {children}
    </div>
  );
};

// Skeleton Variants
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-3/4' : 'w-full' // Last line shorter
        )}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
};

export const SkeletonButton: React.FC<{ variant?: 'default' | 'wide' }> = ({ 
  variant = 'default' 
}) => (
  <Skeleton 
    className={cn(
      'h-10 rounded-md',
      variant === 'wide' ? 'w-full' : 'w-24'
    )}
  />
);

// Complex Loading States
interface LoadingCardProps {
  title?: boolean;
  description?: boolean;
  content?: boolean;
  actions?: boolean;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = true,
  description = true,
  content = true,
  actions = true,
  className
}) => (
  <Card className={className}>
    {(title || description) && (
      <CardHeader>
        {title && <Skeleton className="h-6 w-1/2 mb-2" />}
        {description && <Skeleton className="h-4 w-3/4" />}
      </CardHeader>
    )}
    {content && (
      <CardContent className="space-y-3">
        <SkeletonText lines={3} />
        {actions && (
          <div className="flex gap-2 pt-2">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        )}
      </CardContent>
    )}
  </Card>
);

// Table Loading Skeleton
interface LoadingTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}) => (
  <div className={cn('w-full', className)}>
    {showHeader && (
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
    )}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                'h-4 flex-1',
                colIndex === 0 ? 'w-1/4' : '', // First column narrower
                colIndex === columns - 1 ? 'w-20' : '' // Last column for actions
              )}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Chart Loading Skeleton
export const LoadingChart: React.FC<{ 
  type?: 'line' | 'bar' | 'pie' | 'area';
  className?: string;
}> = ({ type = 'line', className }) => (
  <div className={cn('w-full h-64 p-4', className)}>
    <div className="h-full relative">
      {type === 'pie' ? (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
      ) : (
        <>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-right pr-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
          
          {/* Chart area */}
          <div className="ml-12 mb-8 h-full relative">
            {type === 'line' || type === 'area' ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <div className="flex items-end justify-between h-full gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="flex-1 rounded-t"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* X-axis labels */}
          <div className="ml-12 flex justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);

// Dashboard Loading State
export const LoadingDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <LoadingChart type="area" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <LoadingChart type="bar" />
        </CardContent>
      </Card>
    </div>

    {/* Data Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <LoadingTable rows={8} columns={5} />
      </CardContent>
    </Card>
  </div>
);

// List Loading State
interface LoadingListProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({
  items = 5,
  showAvatar = true,
  showActions = true,
  className
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
        {showAvatar && <SkeletonAvatar />}
        <div className="flex-1">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        )}
      </div>
    ))}
  </div>
);

// Form Loading State
export const LoadingForm: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <SkeletonButton variant="wide" />
      <SkeletonButton />
    </div>
  </div>
);

// Progress Loading States
interface LoadingProgressProps {
  label?: string;
  progress?: number;
  indeterminate?: boolean;
  className?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  label,
  progress,
  indeterminate = false,
  className
}) => (
  <div className={cn('space-y-2', className)}>
    {label && (
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        {!indeterminate && progress !== undefined && (
          <span>{progress}%</span>
        )}
      </div>
    )}
    <Progress 
      value={indeterminate ? undefined : progress} 
      className={indeterminate ? 'animate-pulse' : ''}
    />
  </div>
);

// Network Status Loading
interface NetworkLoadingProps {
  status?: 'online' | 'offline' | 'reconnecting';
  message?: string;
}

export const NetworkLoading: React.FC<NetworkLoadingProps> = ({
  status = 'reconnecting',
  message
}) => {
  const getIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'reconnecting':
        return <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'offline':
        return 'Offline';
      case 'reconnecting':
        return 'Reconnecting...';
    }
  };

  const getVariant = () => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'destructive';
      case 'reconnecting':
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Badge variant={getVariant() as any} className="flex items-center gap-2">
        {getIcon()}
        <span>{message || getStatusText()}</span>
      </Badge>
    </div>
  );
};

// Overlay Loading States
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  blur = true
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
        blur ? 'backdrop-blur-sm' : ''
      )}>
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// Suspense Fallbacks
export const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto py-8">
      <LoadingDashboard />
    </div>
  </div>
);

export const ComponentLoadingFallback: React.FC<{ height?: string }> = ({ 
  height = 'h-32' 
}) => (
  <div className={cn('flex items-center justify-center', height)}>
    <LoadingSpinner />
  </div>
);

// Lazy Loading States
interface LazyLoadingProps {
  isVisible: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string;
}

export const LazyLoading: React.FC<LazyLoadingProps> = ({
  isVisible,
  children,
  fallback,
  height = 'h-32'
}) => {
  if (!isVisible) {
    return fallback || <ComponentLoadingFallback height={height} />;
  }

  return <>{children}</>;
};

// Infinite Scroll Loading
export const InfiniteScrollLoading: React.FC<{ 
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
}> = ({ hasMore, isLoading, error, onRetry }) => {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-2">Failed to load more items</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary hover:underline text-sm"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No more items to load
      </div>
    );
  }

  return null;
};

// Export all components
export {
  LoadingSpinner as Spinner,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  LoadingCard,
  LoadingTable,
  LoadingChart,
  LoadingDashboard,
  LoadingList,
  LoadingForm,
  LoadingProgress,
  NetworkLoading,
  LoadingOverlay,
  PageLoadingFallback,
  ComponentLoadingFallback,
  LazyLoading,
  InfiniteScrollLoading
}; 
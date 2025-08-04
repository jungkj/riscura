'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySkeleton } from '@/components/ui/daisy-components';
// import { 
  Loader2, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  FileText,
  Search,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react'

// Skeleton Loader Components
interface SkeletonProps {
  className?: string
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<DaisySkeletonProps> = ({ 
  className, 
  width,
  height = '1rem'
}) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3,
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <DaisySkeleton 
          key={index}
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
        >
        ))}
    </div>
  );
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("p-4 border border-gray-200 rounded-lg space-y-3", className)}>
      <div className="flex items-center space-x-3">
        <DaisySkeleton width={40} height={40} className="rounded-full" >
          <div className="space-y-2 flex-1">
          <DaisySkeleton height={16} width="60%" >
            <DaisySkeleton height={14} width="40%" >
          </div>
      </div>
      <DaisySkeletonText lines={2} >
      </div>
  );
}

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  className 
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-3">
        {Array.from({ length: columns }).map((_, index) => (
          <DaisySkeleton key={`header-${index}`} height={20} className="flex-1" >
          ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <DaisySkeleton key={`cell-${rowIndex}-${colIndex}`} height={16} className="flex-1" >
            ))}
        </div>
      ))}
    </div>
  );
}

// Loading Spinners
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-[#199BEC]', sizeClasses[size])} />
      {Boolean(text) && (
        <span className="text-sm text-gray-600 font-inter" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
}

export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ 
  text = 'Loading...' 
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 font-inter">{text}</p>
    </div>
  </div>
);

// Progress Indicators
interface ProgressBarProps {
  value: number
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<DaisyProgressBarProps />= ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {Boolean(label) && (
            <span className="text-sm font-medium text-gray-700 font-inter">
              {label}
            </span>
          )}
          {Boolean(showPercentage) && (
            <span className="text-sm text-gray-500 font-inter">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#199BEC] h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progress indicator'} />
      </div>
    </div>
  );
}

export const CircularProgress: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}> = ({
  value,
  size = 40,
  strokeWidth = 4,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-[#199BEC] transition-all duration-300 ease-in-out"
          strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-700">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

// Error States
interface ErrorStateProps {
  title?: string
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryText = 'Try again',
  className
}) => {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <DaisyAlertTriangle className="w-8 h-8 text-red-600" >
  </div>
</DaisySkeletonProps>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 font-inter">
            {title}
          </h3>
          <p className="text-sm text-gray-600 font-inter">
            {message}
          </p>
        </div>
        {Boolean(onRetry) && (
          <DaisyButton onClick={onRetry} className="gap-2" >
  <RefreshCw className="w-4 h-4" />
</DaisyButton>
            {retryText}
          </DaisyButton>
        )}
      </div>
    </div>
  );
}

export const NetworkErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
          {isOnline ? (
            <Wifi className="w-8 h-8 text-orange-600" />
          ) : (
            <WifiOff className="w-8 h-8 text-orange-600" />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 font-inter">
            {isOnline ? 'Connection Problem' : 'No Internet Connection'}
          </h3>
          <p className="text-sm text-gray-600 font-inter">
            {isOnline 
              ? 'Unable to connect to our servers. Please check your connection.'
              : 'Please check your internet connection and try again.'
            }
          </p>
        </div>
        {Boolean(onRetry) && (
          <DaisyButton onClick={onRetry} variant="secondary" className="gap-2" >
  <RefreshCw className="w-4 h-4" />
</DaisyButton>
            Try again
          </DaisyButton>
        )}
      </div>
    </div>
  );
}

// Empty States
interface EmptyStateProps {
  icon?: React.ElementType
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  }
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title = 'No data found',
  message = 'There are no items to display at the moment.',
  action,
  className
}) => {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 font-inter">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-inter">
            {message}
          </p>
        </div>
        {Boolean(action) && (
          <DaisyButton onClick={action.onClick}>
          {action.label}

        </DaisyButton>
          </DaisyButton>
        )}
      </div>
    </div>
  );
}

export const SearchEmptyState: React.FC<{ 
  searchTerm?: string;
  onClearSearch?: () => void;
}> = ({ 
  searchTerm,
  onClearSearch 
}) => {
  return (
    <EmptyState
      icon={Search}
      title={searchTerm ? `No results for "${searchTerm}"` : 'No search results'}
      message="Try adjusting your search criteria or browse all items."
      action={onClearSearch ? {
        label: 'Clear search',
        onClick: onClearSearch
      } : undefined} />
  );
}

export const DataEmptyState: React.FC<{ 
  entityName?: string;
  onCreateNew?: () => void;
}> = ({ 
  entityName = 'items',
  onCreateNew 
}) => {
  return (
    <EmptyState
      icon={Database}
      title={`No ${entityName} yet`}
      message={`Get started by creating your first ${entityName.slice(0, -1)}.`}
      action={onCreateNew ? {
        label: `Create ${entityName.slice(0, -1)}`,
        onClick: onCreateNew
      } : undefined} />
  );
}

// Success State
export const SuccessState: React.FC<{
  title?: string
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  }
  className?: string;
}> = ({
  title = 'Success!',
  message = 'Your action has been completed successfully.',
  action,
  className
}) => {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 font-inter">
            {title}
          </h3>
          <p className="text-sm text-gray-600 font-inter">
            {message}
          </p>
        </div>
        {Boolean(action) && (
          <DaisyButton onClick={action.onClick}>
          {action.label}

        </DaisyButton>
          </DaisyButton>
        )}
      </div>
    </div>
  );
}

// Loading Overlay
export const LoadingOverlay: React.FC<{
  isLoading: boolean
  children: React.ReactNode;
  message?: string;
}> = ({ isLoading, children, message = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {Boolean(isLoading) && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 font-inter">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import React from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import { ActionIcons } from '@/components/icons/IconLibrary';

// Loading spinner component
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Pulse loading animation
interface PulseProps {
  className?: string;
  children?: React.ReactNode;
}

export const Pulse: React.FC<PulseProps> = ({ className = '', children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Skeleton loading components
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
};

// Skeleton text lines
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={16}
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

// Card skeleton
export const SkeletonCard: React.FC<{
  showAvatar?: boolean;
  showImage?: boolean;
  className?: string;
}> = ({ showAvatar = false, showImage = false, className = '' }) => (
  <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
    {showImage && (
      <Skeleton height={200} className="mb-4" />
    )}
    
    <div className="space-y-4">
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <Skeleton width={40} height={40} rounded />
          <div className="space-y-2 flex-1">
            <Skeleton height={16} width="40%" />
            <Skeleton height={14} width="60%" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Skeleton height={20} width="80%" />
        <SkeletonText lines={2} />
      </div>
      
      <div className="flex space-x-2">
        <Skeleton height={32} width={80} />
        <Skeleton height={32} width={100} />
      </div>
    </div>
  </div>
);

// Table skeleton
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height={16} width="60%" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} height={16} width="80%" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className = ''
}) => (
  <div className={`relative ${className}`}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// Progress bar
interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || `${Math.round(clampedProgress)}% complete`}
        />
      </div>
    </div>
  );
};

// Dots loading animation
export const DotsLoading: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}> = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white'
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Loading button state
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  onClick
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {isLoading ? (
      <>
        <Spinner size="sm" color="white" className="mr-2" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);

// Page loading component
export const PageLoading: React.FC<{
  message?: string;
  showLogo?: boolean;
  className?: string;
}> = ({ 
  message = 'Loading page...', 
  showLogo = false,
  className = '' 
}) => (
  <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
    <div className="text-center">
      {showLogo && (
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Riscura</h1>
        </div>
      )}
      <Spinner size="xl" />
      <p className="mt-4 text-lg text-gray-600">{message}</p>
    </div>
  </div>
);

// Section loading component
export const SectionLoading: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({ 
  title = 'Loading...', 
  description,
  className = '' 
}) => (
  <div className={`text-center py-12 ${className}`}>
    <Spinner size="lg" className="mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-gray-600">{description}</p>
    )}
  </div>
);

// Inline loading component
export const InlineLoading: React.FC<{
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ 
  text = 'Loading...', 
  size = 'sm',
  className = '' 
}) => (
  <div className={`inline-flex items-center ${className}`}>
    <Spinner size={size} className="mr-2" />
    <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} text-gray-600`}>
      {text}
    </span>
  </div>
);

// Loading states for specific components
export const LoadingStates = {
  // Dashboard loading
  Dashboard: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard showImage />
        <SkeletonCard showImage />
      </div>
    </div>
  ),

  // Table loading
  Table: ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
    <SkeletonTable rows={rows} columns={columns} />
  ),

  // Form loading
  Form: () => (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={16} width="25%" />
          <Skeleton height={40} />
        </div>
      ))}
      <div className="flex space-x-3">
        <Skeleton height={40} width={100} />
        <Skeleton height={40} width={80} />
      </div>
    </div>
  ),

  // List loading
  List: ({ items = 5 }: { items?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
          <Skeleton width={40} height={40} rounded />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton height={32} width={80} />
        </div>
      ))}
    </div>
  ),

  // Chart loading
  Chart: () => (
    <div className="p-6 border border-gray-200 rounded-lg">
      <div className="space-y-4">
        <Skeleton height={20} width="40%" />
        <Skeleton height={300} />
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton width={12} height={12} />
              <Skeleton height={14} width={60} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
};

export default {
  Spinner,
  Pulse,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  LoadingOverlay,
  ProgressBar,
  DotsLoading,
  LoadingButton,
  PageLoading,
  SectionLoading,
  InlineLoading,
  LoadingStates
}; 
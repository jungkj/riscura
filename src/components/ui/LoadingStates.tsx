import React from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader } from './card';
import { Button } from './button';
import { Progress } from './progress';
import { Alert, AlertDescription } from './alert';

// Basic loading spinner
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )} 
    />
  );
};

// Skeleton loader components
export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  width, 
  height, 
  rounded = false,
  animate = true 
}) => {
  return (
    <div
      className={cn(
        'bg-muted',
        rounded ? 'rounded-full' : 'rounded',
        animate && 'animate-pulse',
        className
      )}
      style={{ width, height }}
    />
  );
};

// Text skeleton
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{
  showHeader?: boolean;
  className?: string;
}> = ({ showHeader = true, className }) => {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton height="1.5rem" width="60%" />
          <Skeleton height="1rem" width="80%" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <TextSkeleton lines={3} />
        <div className="flex gap-2">
          <Skeleton height="2rem" width="5rem" />
          <Skeleton height="2rem" width="5rem" />
        </div>
      </CardContent>
    </Card>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 p-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1rem" width="8rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height="1rem" width="8rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton height="1rem" width="6rem" />
          <Skeleton height="2.5rem" width="100%" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton height="2.5rem" width="5rem" />
        <Skeleton height="2.5rem" width="5rem" />
      </div>
    </div>
  );
};

// Loading overlay
export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  children: React.ReactNode;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  className,
  children,
  blur = true
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
          !blur && 'backdrop-blur-none'
        )}>
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Progress loading
export interface ProgressLoadingProps {
  progress: number;
  message?: string;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  message,
  className,
  showPercentage = true
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <Progress value={progress} className="w-full" />
      {showPercentage && (
        <p className="text-xs text-right text-muted-foreground">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

// Status indicators
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error' | 'warning';

export interface StatusIndicatorProps {
  status: LoadingStatus;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner size={size} />;
      case 'success':
        return <CheckCircle className={cn(sizeClasses[size], 'text-green-500')} />;
      case 'error':
        return <AlertCircle className={cn(sizeClasses[size], 'text-red-500')} />;
      case 'warning':
        return <AlertCircle className={cn(sizeClasses[size], 'text-yellow-500')} />;
      default:
        return <Clock className={cn(sizeClasses[size], 'text-muted-foreground')} />;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getIcon()}
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
};

// Network status indicator
export interface NetworkStatusProps {
  isOnline: boolean;
  className?: string;
  showText?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  className,
  showText = true
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      {showText && (
        <span className={cn(
          'text-sm',
          isOnline ? 'text-green-600' : 'text-red-600'
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

// Auto-save indicator
export interface AutoSaveIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'pending';
  lastSaved?: Date;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  className
}) => {
  const getMessage = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved 
          ? `Saved ${lastSaved.toLocaleTimeString()}`
          : 'Saved';
      case 'error':
        return 'Save failed';
      case 'pending':
        return 'Changes pending';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <LoadingSpinner size="sm" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      {getIcon()}
      <span>{getMessage()}</span>
    </div>
  );
};

// Full page loading
export const FullPageLoading: React.FC<{
  message?: string;
  progress?: number;
}> = ({ message = 'Loading...', progress }) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center space-y-4 max-w-sm">
        <LoadingSpinner size="lg" />
        <p className="text-lg font-medium">{message}</p>
        {progress !== undefined && (
          <ProgressLoading progress={progress} showPercentage />
        )}
      </div>
    </div>
  );
};

// Button loading state
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
};

// Retry component
export interface RetryProps {
  onRetry: () => void;
  message?: string;
  isLoading?: boolean;
  className?: string;
}

export const Retry: React.FC<RetryProps> = ({
  onRetry,
  message = 'Something went wrong. Please try again.',
  isLoading = false,
  className
}) => {
  return (
    <Alert className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
};

// Loading state hook
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export function useLoadingState(initialState: Partial<LoadingState> = {}) {
  const [state, setState] = React.useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: undefined,
    ...initialState
  });

  const setLoading = React.useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: null }));
  }, []);

  const setError = React.useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setProgress = React.useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const reset = React.useCallback(() => {
    setState({ isLoading: false, error: null, progress: undefined });
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setProgress,
    reset
  };
} 
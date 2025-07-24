import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  className,
}) => {
  const handleReportError = () => {
    // In a real app, this would send error details to a logging service
    console.error('Error reported:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
    
    alert('Error reported successfully. Thank you for helping us improve!');
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className={cn('min-h-[400px] flex items-center justify-center p-4', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <DaisyCard className="border-red-200 dark:border-red-800">
          <DaisyCardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center"
            >
              <DaisyAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <DaisyCardTitle className="text-red-900 dark:text-red-100">
              Something went wrong
            </DaisyCardTitle>
            <DaisyCardDescription className="text-red-700 dark:text-red-300">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
          
          <DaisyCardContent className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <span className="inline-flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Technical Details
                  <motion.span
                    className="inline-block"
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    ▼
                  </motion.span>
                </span>
              </summary>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32"
              >
                {error.message}
              </motion.div>
            </details>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <DaisyButton
                onClick={resetErrorBoundary}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </DaisyButton>
              <DaisyButton
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </DaisyButton>
            </div>
            
            <DaisyButton
              onClick={handleReportError}
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              Report this error
            </DaisyButton>
          </DaisyCardBody>
        </DaisyCard>
      </motion.div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent = ErrorFallback,
  onError,
  className,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    onError?.(error, errorInfo);
    
    // In production, you would send this to your error reporting service
    // Example: Sentry, LogRocket, Bugsnag, etc.
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={(props) => (
        <FallbackComponent {...props} className={className} />
      )}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// Specialized error boundaries for different sections
export const DashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Dashboard Error:', error);
        // Track dashboard-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export const FormErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Form Error:', error);
        // Track form-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export const DataErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Data Loading Error:', error);
        // Track data loading errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  };

  return { reportError };
}; 
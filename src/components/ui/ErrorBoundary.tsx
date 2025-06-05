import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: '',
    retryCount: 0,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // This would typically send to your error monitoring service
    console.error('Error Report:', errorReport);

    // Store error locally for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('riscura_errors') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('riscura_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        copied: false
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private copyErrorDetails = async () => {
    const errorDetails = this.getErrorDetails();
    
    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  private getErrorDetails = (): string => {
    const { error, errorInfo, errorId } = this.state;
    
    return `
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
    `.trim();
  };

  private renderErrorDetails = () => {
    if (!this.props.showDetails) return null;

    const { error, errorInfo, errorId } = this.state;

    return (
      <Card className="mt-4 border-red-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Error Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Error ID</p>
            <code className="text-xs bg-muted p-1 rounded">{errorId}</code>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Message</p>
            <code className="text-xs bg-muted p-2 rounded block">{error?.message}</code>
          </div>

          {error?.stack && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stack Trace</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Component Stack</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={this.copyErrorDetails}
            className="w-full"
          >
            {this.state.copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Error Details
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. This has been logged and we'll look into it.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.state.retryCount > 0 && (
                <Alert>
                  <AlertDescription>
                    Retry attempt {this.state.retryCount} of {this.maxRetries}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                {this.props.enableRecovery && this.state.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {this.renderErrorDetails()}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  // Throw error to be caught by ErrorBoundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'PermissionError';
  }
}

// Error utility functions
export const errorUtils = {
  isNetworkError: (error: unknown): error is NetworkError => {
    return error instanceof NetworkError;
  },

  isValidationError: (error: unknown): error is ValidationError => {
    return error instanceof ValidationError;
  },

  isAuthError: (error: unknown): error is AuthenticationError => {
    return error instanceof AuthenticationError;
  },

  isPermissionError: (error: unknown): error is PermissionError => {
    return error instanceof PermissionError;
  },

  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  },

  formatError: (error: unknown): {
    message: string;
    type: string;
    recoverable: boolean;
  } => {
    if (error instanceof ValidationError) {
      return {
        message: error.message,
        type: 'Validation Error',
        recoverable: true
      };
    }

    if (error instanceof NetworkError) {
      return {
        message: error.message,
        type: 'Network Error',
        recoverable: true
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        message: error.message,
        type: 'Authentication Error',
        recoverable: false
      };
    }

    if (error instanceof PermissionError) {
      return {
        message: error.message,
        type: 'Permission Error',
        recoverable: false
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        type: 'Application Error',
        recoverable: true
      };
    }

    return {
      message: String(error),
      type: 'Unknown Error',
      recoverable: true
    };
  }
}; 
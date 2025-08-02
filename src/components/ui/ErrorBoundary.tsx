'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
  reportSent: boolean;
  showDetails: boolean;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  maxRetries?: number;
  level?: 'page' | 'component' | 'critical';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false,
      reportSent: false,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-report critical errors
    if (this.props.level === 'critical') {
      this.reportError();
    }

    // Track error in analytics
    this.trackError(error, errorInfo);
  }

  componentWillUnmount() {
    // Clear any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private trackError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: this.props.level === 'critical',
          error_id: this.state.errorId
        });
      }

      // Send to monitoring service (e.g., Sentry)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', true);
          scope.setTag('level', this.props.level || 'component');
          scope.setExtra('componentStack', errorInfo.componentStack);
          scope.setExtra('errorId', this.state.errorId);
          (window as any).Sentry.captureException(error);
        });
      }
    } catch (trackingError) {
      console.warn('Failed to track error:', trackingError);
    }
  };

  private reportError = async () => {
    if (this.state.isReporting || this.state.reportSent) return;

    this.setState({ isReporting: true });

    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        level: this.props.level || 'component',
        retryCount: this.state.retryCount
      };

      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.setState({ reportSent: true, isReporting: false });
      } else {
        // Log the error but don't throw to prevent cascading errors
        console.warn('Error report failed with status:', response.status);
        this.setState({ isReporting: false });
      }
    } catch (reportError) {
      // Silently handle reporting errors to prevent error cascades
      console.warn('Error reporting failed:', reportError instanceof Error ? reportError.message : 'Unknown error');
      this.setState({ isReporting: false });
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    // Exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        showDetails: false
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  private getErrorMessage = (): string => {
    const { error } = this.state;
    const { level } = this.props;

    if (!error) return 'An unexpected error occurred';

    // Provide user-friendly messages for common errors
    if (error.message.includes('ChunkLoadError')) {
      return 'Failed to load application resources. This usually happens after an update.';
    }

    if (error.message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.message.includes('Permission denied')) {
      return 'You don\'t have permission to access this resource.';
    }

    if (level === 'critical') {
      return 'A critical error occurred that prevented the application from working properly.';
    }

    return error.message || 'An unexpected error occurred';
  };

  private getErrorSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
    const { level } = this.props;
    const { error } = this.state;

    if (level === 'critical') return 'critical';
    
    if (error?.message.includes('ChunkLoadError') || 
        error?.message.includes('Network Error')) {
      return 'high';
    }

    if (error?.message.includes('Permission denied') || 
        error?.message.includes('Unauthorized')) {
      return 'medium';
    }

    return 'low';
  };

  private getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  private getRecoveryActions = () => {
    const { error, retryCount } = this.state;
    const { maxRetries = 3, level } = this.props;
    const severity = this.getErrorSeverity();

    const actions = [];

    // Retry action (if not at max retries)
    if (retryCount < maxRetries && severity !== 'critical') {
      actions.push(
        <DaisyButton
          key="retry"
          onClick={this.handleRetry}
          variant="primary"
          className="min-w-[120px]" >
  <RefreshCw className="w-4 h-4 mr-2" />
</DaisyButton>
          Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
        </DaisyButton>
      );
    }

    // Reload page action
    if (error?.message.includes('ChunkLoadError') || severity === 'high') {
      actions.push(
        <DaisyButton
          key="reload"
          onClick={this.handleReload}
          variant="outline"
          className="min-w-[120px]" >
  <RefreshCw className="w-4 h-4 mr-2" />
</DaisyButton>
          Reload Page
        </DaisyButton>
      );
    }

    // Go to home action
    if (level === 'page' || severity === 'high') {
      actions.push(
        <DaisyButton
          key="home"
          onClick={this.handleGoHome}
          variant="outline"
          className="min-w-[120px]" >
  <Home className="w-4 h-4 mr-2" />
</DaisyButton>
          Go to Dashboard
        </DaisyButton>
      );
    }

    return actions;
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const severity = this.getErrorSeverity();
    const errorMessage = this.getErrorMessage();
    const recoveryActions = this.getRecoveryActions();

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <DaisyCard className="w-full max-w-2xl" >
  <DaisyCardBody className="text-center" />
</DaisyCard>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <DaisyAlertTriangle className="w-8 h-8 text-destructive" >
  </div>
</DaisyAlertTriangle>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <DaisyCardTitle className="text-xl">Something went wrong</DaisyCardTitle>
              <DaisyBadge variant={this.getSeverityColor(severity) as any} >
  {severity}
</DaisyBadge>
              </DaisyBadge>
            </div>
            
            <DaisyCardDescription className="text-base" >
  {errorMessage}
</DaisyCardDescription>
            </p>
          

          <DaisyCardBody className="space-y-6" >
  {/* Error ID for support */}
</DaisyCardBody>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Error ID: <code className="text-xs bg-muted px-2 py-1 rounded">{this.state.errorId}</code>
              </p>
            </div>

            {/* Recovery Actions */}
            {recoveryActions.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {recoveryActions}
              </div>
            )}

            {/* Report Error Button */}
            {this.props.showReportButton !== false && (
              <div className="text-center">
                {!this.state.reportSent ? (
                  <DaisyButton
                    onClick={this.reportError}
                    disabled={this.state.isReporting}
                    variant="outline"
                    size="sm" >
  <Bug className="w-4 h-4 mr-2" />
</DaisyButton>
                    {this.state.isReporting ? 'Sending Report...' : 'Report This Error'}
                  </DaisyButton>
                ) : (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Error report sent successfully
                  </p>
                )}
              </div>
            )}

            {/* Technical Details (Collapsible) */}
            {process.env.NODE_ENV === 'development' && (
              <Collapsible>
                <CollapsibleTrigger
                  onClick={this.toggleDetails}
                  className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Technical Details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    {this.state.error && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Error Message:</h4>
                        <pre className="text-xs bg-background p-2 rounded border overflow-auto">
                          {this.state.error.message}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.error?.stack && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Stack Trace:</h4>
                        <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Component Stack:</h4>
                        <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>
    );
  }
}

// Higher-order component for wrapping specific components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" showReportButton={true} maxRetries={2}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ErrorBoundary 
    level="component" 
    showReportButton={false} 
    maxRetries={3}
    fallback={fallback || (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
        <div className="flex items-center gap-2 text-destructive">
          <DaisyAlertTriangle className="w-4 h-4" >
  <span className="text-sm font-medium">
</DaisyAlertTriangle>Component Error</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          This component failed to load. Please refresh the page.
        </p>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical" showReportButton={true} maxRetries={0}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary; 
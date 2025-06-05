import React from 'react';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useAnimation } from '../../lib/animations/AnimationUtils';
import { AriaUtils } from '../../lib/accessibility/AccessibilityUtils';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error types
export interface ErrorInfo {
  title: string;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  timestamp?: Date;
  context?: Record<string, any>;
  recoveryOptions?: RecoveryOption[];
}

export interface RecoveryOption {
  label: string;
  action: () => void | Promise<void>;
  type: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

// Error state props
export interface ErrorStateProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  animated?: boolean;
}

// Enhanced error display component
export const EnhancedErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  showDetails = false,
  animated = true
}) => {
  const { getColor, getSpacing, getBorderRadius, getShadow } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const animationRef = useAnimation('fadeInUp', animated) as React.RefObject<HTMLDivElement>;
  const errorId = React.useMemo(() => AriaUtils.generateId('error'), []);

  const severityConfig = {
    low: {
      bg: getColor('semantic.info'),
      border: getColor('border.primary'),
      icon: '🔵',
      priority: 'polite' as const
    },
    medium: {
      bg: getColor('semantic.warning'),
      border: getColor('semantic.warning'),
      icon: '⚠️',
      priority: 'polite' as const
    },
    high: {
      bg: getColor('semantic.error'),
      border: getColor('semantic.error'),
      icon: '❌',
      priority: 'assertive' as const
    },
    critical: {
      bg: '#DC2626',
      border: '#DC2626',
      icon: '🚨',
      priority: 'assertive' as const
    }
  };

  const config = severityConfig[error.severity];

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRecoveryAction = async (action: () => void | Promise<void>) => {
    try {
      await action();
    } catch (err) {
      console.error('Recovery action failed:', err);
    }
  };

  const styles = {
    container: {
      backgroundColor: getColor('background.card'),
      border: `2px solid ${config.border}`,
      borderRadius: getBorderRadius('lg'),
      padding: getSpacing('lg'),
      boxShadow: getShadow('md'),
      maxWidth: '600px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: getSpacing('md'),
      marginBottom: getSpacing('md')
    },
    icon: {
      fontSize: '24px',
      flexShrink: 0
    },
    content: {
      flex: 1
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: getColor('text.primary'),
      margin: 0,
      marginBottom: getSpacing('sm')
    },
    message: {
      fontSize: '14px',
      color: getColor('text.secondary'),
      lineHeight: '1.5',
      margin: 0
    },
    actions: {
      display: 'flex',
      gap: getSpacing('sm'),
      marginTop: getSpacing('md'),
      flexWrap: 'wrap' as const
    },
    button: {
      padding: `${getSpacing('sm')} ${getSpacing('md')}`,
      borderRadius: getBorderRadius('md'),
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: getSpacing('xs')
    },
    primaryButton: {
      backgroundColor: getColor('primary.500'),
      color: getColor('text.inverse')
    },
    secondaryButton: {
      backgroundColor: getColor('background.secondary'),
      color: getColor('text.primary'),
      border: `1px solid ${getColor('border.primary')}`
    },
    dangerButton: {
      backgroundColor: getColor('semantic.error'),
      color: getColor('text.inverse')
    },
    details: {
      marginTop: getSpacing('md'),
      padding: getSpacing('md'),
      backgroundColor: getColor('background.secondary'),
      borderRadius: getBorderRadius('md'),
      fontSize: '12px',
      fontFamily: 'monospace'
    },
    detailsToggle: {
      background: 'none',
      border: 'none',
      color: getColor('primary.500'),
      cursor: 'pointer',
      fontSize: '12px',
      textDecoration: 'underline',
      marginTop: getSpacing('sm')
    }
  };

  return (
    <div
      ref={animationRef}
      className={className}
      style={styles.container}
      role="alert"
      aria-live={config.priority}
      aria-labelledby={`${errorId}-title`}
      aria-describedby={`${errorId}-message`}
    >
      <div style={styles.header}>
        <span style={styles.icon} aria-hidden="true">
          {config.icon}
        </span>
        <div style={styles.content}>
          <h3 id={`${errorId}-title`} style={styles.title}>
            {error.title}
          </h3>
          <p id={`${errorId}-message`} style={styles.message}>
            {error.message}
          </p>
          {error.code && (
            <p style={{ ...styles.message, marginTop: getSpacing('xs') }}>
              Error Code: {error.code}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: getColor('text.muted'),
              padding: getSpacing('xs')
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>

      <div style={styles.actions}>
        {onRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: isRetrying ? 0.7 : 1
            }}
            aria-label="Retry the failed operation"
          >
            {isRetrying ? (
              <>
                <span>🔄</span>
                Retrying...
              </>
            ) : (
              <>
                <span>↻</span>
                Retry
              </>
            )}
          </button>
        )}

        {error.recoveryOptions?.map((option, index) => (
          <button
            key={index}
            onClick={() => handleRecoveryAction(option.action)}
            style={{
              ...styles.button,
              ...(option.type === 'primary' ? styles.primaryButton :
                  option.type === 'danger' ? styles.dangerButton :
                  styles.secondaryButton)
            }}
            aria-label={`Recovery option: ${option.label}`}
          >
            {option.icon && <span>{option.icon}</span>}
            {option.label}
          </button>
        ))}

        {(showDetails || error.context || error.timestamp) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={styles.detailsToggle}
            aria-expanded={isExpanded}
            aria-controls={`${errorId}-details`}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {isExpanded && (
        <div id={`${errorId}-details`} style={styles.details}>
          {error.timestamp && (
            <div>
              <strong>Timestamp:</strong> {error.timestamp.toISOString()}
            </div>
          )}
          {error.context && (
            <div style={{ marginTop: getSpacing('sm') }}>
              <strong>Context:</strong>
              <pre style={{ margin: getSpacing('xs'), whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Network error component
export interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  message = "Unable to connect to the server. Please check your internet connection.",
  className
}) => {
  const error: ErrorInfo = {
    title: "Connection Error",
    message,
    severity: 'medium',
    timestamp: new Date(),
    recoveryOptions: [
      {
        label: "Check Network",
        action: () => {
          window.open("https://www.google.com", "_blank");
        },
        type: 'secondary',
        icon: '🌐'
      }
    ]
  };

  return (
    <EnhancedErrorState
      error={error}
      onRetry={onRetry}
      className={className}
      showDetails
    />
  );
};

// Permission error component
export interface PermissionErrorProps {
  resource: string;
  requiredPermission: string;
  onRequestAccess?: () => void;
  className?: string;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({
  resource,
  requiredPermission,
  onRequestAccess,
  className
}) => {
  const error: ErrorInfo = {
    title: "Access Denied",
    message: `You don't have permission to access ${resource}. Required permission: ${requiredPermission}`,
    severity: 'high',
    timestamp: new Date(),
    recoveryOptions: onRequestAccess ? [
      {
        label: "Request Access",
        action: onRequestAccess,
        type: 'primary',
        icon: '🔑'
      }
    ] : []
  };

  return (
    <EnhancedErrorState
      error={error}
      className={className}
      showDetails
    />
  );
};

// Validation error component
export interface ValidationErrorProps {
  errors: Array<{ field: string; message: string }>;
  onEdit?: () => void;
  className?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  errors,
  onEdit,
  className
}) => {
  const errorMessage = errors.length === 1 
    ? errors[0].message
    : `There are ${errors.length} validation errors that need to be fixed.`;

  const error: ErrorInfo = {
    title: "Validation Failed",
    message: errorMessage,
    severity: 'medium',
    timestamp: new Date(),
    context: { validationErrors: errors },
    recoveryOptions: onEdit ? [
      {
        label: "Edit Form",
        action: onEdit,
        type: 'primary',
        icon: '✏️'
      }
    ] : []
  };

  return (
    <EnhancedErrorState
      error={error}
      className={className}
      showDetails
    />
  );
};

// Loading timeout error
export interface LoadingTimeoutErrorProps {
  timeout: number;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const LoadingTimeoutError: React.FC<LoadingTimeoutErrorProps> = ({
  timeout,
  onRetry,
  onCancel,
  className
}) => {
  const error: ErrorInfo = {
    title: "Request Timed Out",
    message: `The operation took longer than expected (${timeout / 1000}s). This might be due to slow network or server issues.`,
    severity: 'medium',
    timestamp: new Date(),
    recoveryOptions: [
      ...(onRetry ? [{
        label: "Try Again",
        action: onRetry,
        type: 'primary' as const,
        icon: '↻'
      }] : []),
      ...(onCancel ? [{
        label: "Cancel",
        action: onCancel,
        type: 'secondary' as const,
        icon: '×'
      }] : [])
    ]
  };

  return (
    <EnhancedErrorState
      error={error}
      className={className}
    />
  );
};

// Error list component for multiple errors
export interface ErrorListProps {
  errors: ErrorInfo[];
  onRetryAll?: () => void;
  onDismissAll?: () => void;
  className?: string;
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  onRetryAll,
  onDismissAll,
  className = ''
}) => {
  const { getSpacing } = useTheme();
  
  if (errors.length === 0) return null;

  return (
    <div className={className}>
      {errors.length > 1 && (
        <div style={{ 
          marginBottom: getSpacing('lg'),
          display: 'flex',
          gap: getSpacing('sm'),
          justifyContent: 'center'
        }}>
          {onRetryAll && (
            <button
              onClick={onRetryAll}
              style={{
                padding: `${getSpacing('sm')} ${getSpacing('md')}`,
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry All ({errors.length})
            </button>
          )}
          {onDismissAll && (
            <button
              onClick={onDismissAll}
              style={{
                padding: `${getSpacing('sm')} ${getSpacing('md')}`,
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Dismiss All
            </button>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: getSpacing('md') }}>
        {errors.map((error, index) => (
          <EnhancedErrorState
            key={index}
            error={error}
            animated={false}
          />
        ))}
      </div>
    </div>
  );
}; 
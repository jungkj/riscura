import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Shield,
  Zap,
  Info,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ConnectionStatus } from '@/services/AIService';

interface EnhancedError {
  type: string;
  message: string;
  code?: string;
  retryable: boolean;
  severity?: string;
  userMessage?: string;
  retryAfter?: Date;
}

interface ErrorDisplayProps {
  error: EnhancedError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss, 
  compact = false 
}) => {
  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityVariant = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (compact) {
    return (
      <Alert variant={getSeverityVariant()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon()}
            <div>
              <AlertTitle className="text-sm">{error.type.replace('_', ' ').toUpperCase()}</AlertTitle>
              <AlertDescription className="text-xs">
                {error.userMessage || error.message}
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {error.retryable && onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Alert variant={getSeverityVariant()}>
        {getSeverityIcon()}
        <AlertTitle>{error.type.replace('_', ' ').toUpperCase()}</AlertTitle>
        <AlertDescription>
          <div className="space-y-3">
            <p>{error.userMessage || error.message}</p>
            
            {error.retryAfter && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Retry available after: {error.retryAfter.toLocaleTimeString()}</span>
              </div>
            )}
            
            {error.code && (
              <Badge variant="outline" className="text-xs">
                Error Code: {error.code}
              </Badge>
            )}
            
            <div className="flex space-x-2">
              {error.retryable && onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

interface ConnectionStatusDisplayProps {
  status: ConnectionStatus;
  isReconnecting?: boolean;
  lastSuccessfulConnection?: Date;
  onReconnect?: () => void;
}

export const ConnectionStatusDisplay: React.FC<ConnectionStatusDisplayProps> = ({
  status,
  isReconnecting = false,
  lastSuccessfulConnection,
  onReconnect
}) => {
  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <Wifi className="h-4 w-4 text-green-500" />;
      case ConnectionStatus.DISCONNECTED:
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case ConnectionStatus.DEGRADED:
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case ConnectionStatus.RECONNECTING:
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isReconnecting) return 'Reconnecting...';
    
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.DEGRADED:
        return 'Connection Issues';
      case ConnectionStatus.RECONNECTING:
        return 'Reconnecting...';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (isReconnecting) return 'text-blue-600';
    
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'text-green-600';
      case ConnectionStatus.DISCONNECTED:
        return 'text-red-600';
      case ConnectionStatus.DEGRADED:
        return 'text-yellow-600';
      case ConnectionStatus.RECONNECTING:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <div className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {lastSuccessfulConnection && status !== ConnectionStatus.CONNECTED && (
            <div className="text-xs text-muted-foreground">
              Last connected: {lastSuccessfulConnection.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {status === ConnectionStatus.DISCONNECTED && onReconnect && !isReconnecting && (
        <Button size="sm" variant="outline" onClick={onReconnect}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reconnect
        </Button>
      )}
    </div>
  );
};

interface FallbackModeDisplayProps {
  isActive: boolean;
  fallbackReason?: string;
  onDismiss?: () => void;
}

export const FallbackModeDisplay: React.FC<FallbackModeDisplayProps> = ({
  isActive,
  fallbackReason,
  onDismiss
}) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Fallback Mode Active</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>
              AI services are temporarily unavailable. I'm operating in fallback mode 
              with limited functionality.
            </p>
            {fallbackReason && (
              <p className="text-sm text-muted-foreground">
                Reason: {fallbackReason}
              </p>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Basic responses and manual processes are still available</span>
            </div>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Understood
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

interface RetryCountdownProps {
  retryAfter: Date;
  onRetryAvailable?: () => void;
}

export const RetryCountdown: React.FC<RetryCountdownProps> = ({
  retryAfter,
  onRetryAvailable
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  React.useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const retryTime = retryAfter.getTime();
      const diff = Math.max(0, Math.ceil((retryTime - now) / 1000));
      
      setSecondsLeft(diff);
      
      if (diff === 0 && onRetryAvailable) {
        onRetryAvailable();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [retryAfter, onRetryAvailable]);

  if (secondsLeft === 0) return null;

  const progress = Math.max(0, 100 - (secondsLeft / 60) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Retry available in:</span>
        <span className="font-mono">{secondsLeft}s</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

interface CircuitBreakerStatusProps {
  state: string;
  failures: number;
  nextAttempt?: number;
  onReset?: () => void;
}

export const CircuitBreakerStatus: React.FC<CircuitBreakerStatusProps> = ({
  state,
  failures,
  nextAttempt,
  onReset
}) => {
  const getStateColor = () => {
    switch (state) {
      case 'CLOSED':
        return 'text-green-600 bg-green-50';
      case 'HALF_OPEN':
        return 'text-yellow-600 bg-yellow-50';
      case 'OPEN':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Circuit Breaker Status</span>
          <Badge variant="outline" className={getStateColor()}>
            {state}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Failure Count:</span>
          <span className="font-medium">{failures}</span>
        </div>
        
        {nextAttempt && nextAttempt > Date.now() && (
          <div className="text-sm">
            <span>Next attempt: </span>
            <span className="font-medium">
              {new Date(nextAttempt).toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {state === 'OPEN' && onReset && (
          <Button size="sm" variant="outline" onClick={onReset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Circuit Breaker
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default {
  ErrorDisplay,
  ConnectionStatusDisplay,
  FallbackModeDisplay,
  RetryCountdown,
  CircuitBreakerStatus
}; 
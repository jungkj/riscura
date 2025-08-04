'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  X,
  Info,
  Zap,
  Signal
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { useToast } from '@/components/ui/UserFeedback';
import { cn } from '@/lib/utils';
import { DaisyProgress } from '@/components/ui/DaisyProgress';

// Network status types
export type NetworkStatus = 'online' | 'offline' | 'slow' | 'checking';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'unknown';

// Request retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

// Failed request queue item
interface FailedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  retryCount: number;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

// Network error handler props
interface NetworkErrorHandlerProps {
  children: React.ReactNode;
  retryConfig?: Partial<RetryConfig>;
  showBanner?: boolean;
  showDetailedStatus?: boolean;
  onNetworkChange?: (status: NetworkStatus, quality: ConnectionQuality) => void;
  className?: string;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Network monitoring hook
function useNetworkMonitor() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('checking');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('unknown');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const qualityCheckRef = useRef<NodeJS.Timeout>();

  // Check network connectivity
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health/network', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Measure connection quality
  const measureConnectionQuality = useCallback(async (): Promise<ConnectionQuality> => {
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      await fetch('/api/health/ping', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;

      if (duration < 500) return 'excellent';
      if (duration < 1000) return 'good';
      if (duration < 3000) return 'poor';
      return 'poor';
    } catch (error) {
      return 'unknown';
    }
  }, []);

  // Monitor network status
  const monitorNetwork = useCallback(async () => {
    setNetworkStatus('checking');
    
    const isOnline = await checkConnectivity();
    setLastChecked(new Date());

    if (isOnline) {
      const quality = await measureConnectionQuality();
      setConnectionQuality(quality);
      setNetworkStatus(quality === 'poor' ? 'slow' : 'online');
    } else {
      setNetworkStatus('offline');
      setConnectionQuality('unknown');
    }
  }, [checkConnectivity, measureConnectionQuality]);

  // Initialize monitoring
  useEffect(() => {
    // Initial check
    monitorNetwork();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(monitorNetwork, 30000); // Check every 30 seconds

    // Listen to navigator online/offline events
    const handleOnline = () => {
      setNetworkStatus('checking');
      monitorNetwork();
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      setConnectionQuality('unknown');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (qualityCheckRef.current) {
        clearInterval(qualityCheckRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [monitorNetwork]);

  return {
    networkStatus,
    connectionQuality,
    lastChecked,
    refreshStatus: monitorNetwork
  };
}

// Request interceptor with retry logic
function useRequestInterceptor(retryConfig: RetryConfig) {
  const [failedRequests, setFailedRequests] = useState<FailedRequest[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate retry delay with exponential backoff
  const calculateRetryDelay = useCallback((retryCount: number): number => {
    const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, retryCount);
    return Math.min(delay, retryConfig.maxDelay);
  }, [retryConfig]);

  // Add request to retry queue
  const queueFailedRequest = useCallback((
    url: string,
    method: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const requestId = `${method}_${url}_${Date.now()}`;
      const failedRequest: FailedRequest = {
        id: requestId,
        url,
        method,
        data,
        headers,
        retryCount: 0,
        timestamp: Date.now(),
        resolve,
        reject
      };

      setFailedRequests(prev => [...prev, failedRequest]);
    });
  }, []);

  // Retry failed requests
  const retryFailedRequests = useCallback(async () => {
    if (failedRequests.length === 0 || isRetrying) return;

    setIsRetrying(true);

    const updatedRequests: FailedRequest[] = [];

    for (const request of failedRequests) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          request.resolve(result);
        } else if (retryConfig.retryableStatuses.includes(response.status)) {
          if (request.retryCount < retryConfig.maxRetries) {
            const delay = calculateRetryDelay(request.retryCount);
            request.retryCount++;
            
            // Schedule retry
            setTimeout(() => {
              updatedRequests.push(request);
            }, delay);
          } else {
            request.reject(new Error(`Request failed after ${retryConfig.maxRetries} retries`));
          }
        } else {
          request.reject(new Error(`Request failed with status ${response.status}`));
        }
      } catch (error) {
        if (request.retryCount < retryConfig.maxRetries) {
          const delay = calculateRetryDelay(request.retryCount);
          request.retryCount++;
          
          setTimeout(() => {
            updatedRequests.push(request);
          }, delay);
        } else {
          request.reject(error);
        }
      }
    }

    setFailedRequests(updatedRequests);
    setIsRetrying(false);

    // Schedule next retry if there are still failed requests
    if (updatedRequests.length > 0) {
      retryTimeoutRef.current = setTimeout(retryFailedRequests, 5000);
    }
  }, [failedRequests, isRetrying, retryConfig, calculateRetryDelay]);

  // Auto-retry when network comes back online
  useEffect(() => {
    if (failedRequests.length > 0 && !isRetrying) {
      retryFailedRequests();
    }
  }, [failedRequests, isRetrying, retryFailedRequests]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    failedRequests,
    isRetrying,
    queueFailedRequest,
    retryFailedRequests: () => retryFailedRequests(),
    clearFailedRequests: () => setFailedRequests([])
  };
}

// Status indicator component
const NetworkStatusIndicator: React.FC<{
  status: NetworkStatus;
  quality: ConnectionQuality;
  lastChecked: Date;
  compact?: boolean;
}> = ({ status, quality, lastChecked, compact = false }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return quality === 'poor' ? <Signal className="w-4 h-4 text-yellow-500" /> : <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'slow':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <DaisyAlertTriangle className="w-4 h-4 text-gray-500" >
  ;
</DaisyAlertTriangle>
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return quality === 'poor' ? 'Poor Connection' : 'Online';
      case 'offline':
        return 'Offline';
      case 'slow':
        return 'Slow Connection';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'poor':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (compact) {

  return (
    <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  };

  return (
    <DaisyCard className="w-full max-w-sm" >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <DaisyCardTitle className="flex items-center gap-2 text-sm" >
  {getStatusIcon()}
</DaisyCardTitle>
          Network Status
        </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody className="space-y-3" >
  <div className="flex items-center justify-between">
</DaisyCardBody>
          <span className="text-sm font-medium">Status:</span>
          <DaisyBadge variant={status === 'online' ? 'default' : 'destructive'} >
  {getStatusText()}
</DaisyBadge>
          </DaisyBadge>
        </div>
        
        {status === 'online' && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quality:</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", getQualityColor())} />
              <span className="text-sm capitalize">{quality}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last checked:</span>
          <span>{lastChecked.toLocaleTimeString()}</span>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Offline banner component
const OfflineBanner: React.FC<{
  onRetry: () => void;
  isRetrying: boolean;
  failedRequestsCount: number;
}> = ({ onRetry, isRetrying, failedRequestsCount }) => {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg"
      data-testid="network-error-banner"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-medium">No internet connection</p>
            {failedRequestsCount > 0 && (
              <p className="text-sm opacity-90">
                {failedRequestsCount} request{failedRequestsCount > 1 ? 's' : ''} pending retry
              </p>
            )}
          </div>
        </div>
        
        <DaisyButton
          variant="secondary"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="bg-white text-red-600 hover:bg-gray-100">
          {isRetrying ? (

        </DaisyButton>
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Now
            </>
          )}
        </DaisyButton>
      </div>
    </div>
  );
};

// Main network error handler component
export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  children,
  retryConfig = {},
  showBanner = true,
  showDetailedStatus = false,
  onNetworkChange,
  className
}) => {
  const finalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const { networkStatus, connectionQuality, lastChecked, refreshStatus } = useNetworkMonitor();
  const { failedRequests, isRetrying, retryFailedRequests, clearFailedRequests } = useRequestInterceptor(finalRetryConfig);

  // Notify parent of network changes
  useEffect(() => {
    onNetworkChange?.(networkStatus, connectionQuality);
  }, [networkStatus, connectionQuality, onNetworkChange]);

  // Handle manual retry
  const handleRetry = useCallback(async () => {
    await refreshStatus();
    if (networkStatus === 'online') {
      await retryFailedRequests();
    }
  }, [refreshStatus, networkStatus, retryFailedRequests]);

  return (
    <div className={cn("relative", className)}>
      {/* Offline Banner */}
      {showBanner && networkStatus === 'offline' && (
        <OfflineBanner
          onRetry={handleRetry}
          isRetrying={isRetrying}
          failedRequestsCount={failedRequests.length} />
      )}

      {/* Detailed Status Display */}
      {showDetailedStatus && (
        <div className="fixed top-4 right-4 z-40">
          <NetworkStatusIndicator
            status={networkStatus}
            quality={connectionQuality}
            lastChecked={lastChecked}
            compact={!showDetailedStatus} />
        </div>
      )}

      {/* Main Content */}
      <div className={cn(showBanner && networkStatus === 'offline' ? 'pt-16' : '')}>
        {children}
      </div>

      {/* Retry Progress Indicator */}
      {isRetrying && failedRequests.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <DaisyCard className="w-80" >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
              <DaisyCardTitle className="flex items-center gap-2 text-sm" >
  <RefreshCw className="w-4 h-4 animate-spin" />
</DaisyCardTitle>
                Retrying failed requests...
              </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <DaisyProgress 
                value={(failedRequests.filter(r = />
</DaisyCardBody> r.retryCount > 0).length / failedRequests.length) * 100} 
                className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {failedRequests.length} request{failedRequests.length > 1 ? 's' : ''} in queue
              </p>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      )}
    </div>
  );
};

// Hook for components to integrate with network error handling
export const useNetworkErrorHandler = () => {
  const { networkStatus, connectionQuality, lastChecked, refreshStatus } = useNetworkMonitor();
  
  return {
    networkStatus,
    connectionQuality,
    lastChecked,
    refreshStatus,
    isOnline: networkStatus === 'online',
    isOffline: networkStatus === 'offline',
    hasSlowConnection: networkStatus === 'slow' || connectionQuality === 'poor'
  };
};

// Higher-order component for wrapping components with network error handling
export const withNetworkErrorHandler = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<NetworkErrorHandlerProps>
) => {
  const WrappedComponent = (props: P) => (
    <NetworkErrorHandler {...options}>
      <Component {...props} />
    </NetworkErrorHandler>
  );

  WrappedComponent.displayName = `withNetworkErrorHandler(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default NetworkErrorHandler; 
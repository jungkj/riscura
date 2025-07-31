'use client';

// Progressive Loading Dashboard for Optimized Performance
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from 'react-error-boundary';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySkeleton } from '@/components/ui/DaisySkeleton';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { ReactNode } from 'react';

export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: any;
  size: 'small' | 'medium' | 'large' | 'full';
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  minHeight?: number;
  maxHeight?: number;
  refreshInterval?: number;
  cacheKey?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Array<{
    widgetId: string;
    position: { x: number; y: number; w: number; h: number };
    visible: boolean;
  }>;
}

export interface LazyDashboardProps {
  widgets: DashboardWidget[];
  layout?: DashboardLayout;
  loading?: boolean;
  error?: Error;
  className?: string;
  enableVirtualization?: boolean;
  chunkSize?: number;
  loadingDelay?: number;
  enableIntersectionLoading?: boolean;
  enableProgressiveLoading?: boolean;
  onWidgetLoad?: (widgetId: string) => void;
  onWidgetError?: (widgetId: string, error: Error) => void;
  onLayoutChange?: (layout: DashboardLayout) => void;
  enableDragAndDrop?: boolean;
  enableResize?: boolean;
  gridSize?: number;
  containerPadding?: [number, number];
  margin?: [number, number];
  maxRows?: number;
  autoSize?: boolean;
  compactType?: 'vertical' | 'horizontal' | null;
  preventCollision?: boolean;
  useCSSTransforms?: boolean;
}

interface WidgetState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  data: any;
  lastRefresh: number;
}

interface SkeletonProps {
  size: 'small' | 'medium' | 'large' | 'full';
  className?: string;
}

const WidgetSkeleton: React.FC<DaisySkeletonProps> = ({ size, className }) => {
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
    full: 'h-96',
  };

  return (
    <div className={cn('animate-pulse bg-gray-200 rounded-lg', sizeClasses[size], className)}>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
        {size !== 'small' && (
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
};



const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center h-32 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 text-sm mb-2">Failed to load widget</div>
    <div className="text-xs text-gray-500 mb-3">{error.message}</div>
    <button
      onClick={retry}
      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

const LazyWidget: React.FC<{
  widget: DashboardWidget;
  state: WidgetState;
  onLoad: () => void;
  onError: (error: Error) => void;
  onStateChange: (state: Partial<WidgetState>) => void;
  inView?: boolean;
  enableIntersectionLoading?: boolean;
}> = ({ 
  widget, 
  state, 
  onLoad, 
  onError, 
  onStateChange,
  inView = true,
  enableIntersectionLoading = false
}) => {
  const [shouldLoad, setShouldLoad] = useState(!enableIntersectionLoading);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (enableIntersectionLoading && inView && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [inView, enableIntersectionLoading, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || state.loaded) return;

    const loadWidget = async () => {
      try {
        onStateChange({ loading: true, error: null });
        
        // Simulate loading delay for demonstration
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        onStateChange({ 
          loading: false, 
          loaded: true, 
          lastRefresh: Date.now() 
        });
        onLoad();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        onStateChange({ loading: false, error: err });
        onError(err);
      }
    };

    loadWidget();
  }, [shouldLoad, state.loaded, onLoad, onError, onStateChange]);

  // Set up refresh interval
  useEffect(() => {
    if (!widget.refreshInterval || !state.loaded) return;

    refreshTimeoutRef.current = setTimeout(() => {
      onStateChange({ loaded: false });
    }, widget.refreshInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [widget.refreshInterval, state.loaded, state.lastRefresh, onStateChange]);

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    full: 'col-span-4 row-span-2',
  };

  const ErrorComponent = widget.errorComponent || DefaultErrorComponent;
  const LoadingComponent = widget.loadingComponent || (() => <WidgetSkeleton size={widget.size} />);

  if (!shouldLoad) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border', sizeClasses[widget.size])}>
        <WidgetSkeleton size={widget.size} />
      </div>
    );
  }

  if (state.loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('bg-white rounded-lg shadow-sm border', sizeClasses[widget.size])}
      >
        <LoadingComponent />
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('bg-white rounded-lg shadow-sm border', sizeClasses[widget.size])}
      >
        <ErrorBoundary
          fallback={ErrorComponent as unknown as ReactNode}
          onError={onError}
        >
          <ErrorComponent 
            error={state.error} 
            retry={() => onStateChange({ loaded: false, error: null })} 
          />
        </ErrorBoundary>
      </motion.div>
    );
  }

  if (state.loaded) {
    const WidgetComponent = widget.component;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('bg-white rounded-lg shadow-sm border', sizeClasses[widget.size])}
      >
        <ErrorBoundary
          fallback={ErrorComponent as unknown as ReactNode}
          onError={onError}
        >
          <WidgetComponent {...widget.props} />
        </ErrorBoundary>
      </motion.div>
    );
  }

  return null;
};

const LazyDashboard: React.FC<LazyDashboardProps> = ({
  widgets,
  layout,
  loading = false,
  error,
  className,
  enableVirtualization = false,
  chunkSize = 4,
  loadingDelay = 100,
  enableIntersectionLoading = true,
  enableProgressiveLoading = true,
  onWidgetLoad,
  onWidgetError,
  onLayoutChange,
  enableDragAndDrop = false,
  enableResize = false,
  gridSize = 12,
  containerPadding = [16, 16],
  margin = [16, 16],
  maxRows = Infinity,
  autoSize = true,
  compactType = 'vertical',
  preventCollision = false,
  useCSSTransforms = true,
}) => {
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>(() => {
    const states: Record<string, WidgetState> = {};
    widgets.forEach(widget => {
      states[widget.id] = {
        loading: false,
        loaded: false,
        error: null,
        data: null,
        lastRefresh: 0,
      };
    });
    return states;
  });

  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set());
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for widgets
  const { ref: intersectionRef, isIntersecting: inView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Sort widgets by priority
  const sortedWidgets = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...widgets].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [widgets]);

  // Chunk widgets for progressive loading
  const widgetChunks = useMemo(() => {
    const chunks: DashboardWidget[][] = [];
    for (let i = 0; i < sortedWidgets.length; i += chunkSize) {
      chunks.push(sortedWidgets.slice(i, i + chunkSize));
    }
    return chunks;
  }, [sortedWidgets, chunkSize]);

  // Progressive loading effect
  useEffect(() => {
    if (!enableProgressiveLoading) {
      setLoadedChunks(new Set(widgetChunks.map((_, index) => index)));
      return;
    }

    const loadChunks = async () => {
      for (let i = 0; i < widgetChunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, loadingDelay));
        setLoadedChunks(prev => new Set([...prev, i]));
      }
    };

    loadChunks();
  }, [widgetChunks, enableProgressiveLoading, loadingDelay]);

  // Handle widget state changes
  const handleWidgetStateChange = useCallback((widgetId: string, newState: Partial<WidgetState>) => {
    setWidgetStates(prev => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], ...newState },
    }));
  }, []);

  // Handle widget load
  const handleWidgetLoad = useCallback((widgetId: string) => {
    setVisibleWidgets(prev => new Set([...prev, widgetId]));
    onWidgetLoad?.(widgetId);
  }, [onWidgetLoad]);

  // Handle widget error
  const handleWidgetError = useCallback((widgetId: string, error: Error) => {
    onWidgetError?.(widgetId, error);
  }, [onWidgetError]);

  // Get widgets to render
  const widgetsToRender = useMemo(() => {
    if (!enableProgressiveLoading) return sortedWidgets;

    const widgetsToShow: DashboardWidget[] = [];
    loadedChunks.forEach(chunkIndex => {
      if (widgetChunks[chunkIndex]) {
        widgetsToShow.push(...widgetChunks[chunkIndex]);
      }
    });
    return widgetsToShow;
  }, [sortedWidgets, enableProgressiveLoading, loadedChunks, widgetChunks]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('grid grid-cols-4 gap-4 p-4', className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <WidgetSkeleton key={index} size={index % 4 === 0 ? 'large' : 'medium'} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Failed to load dashboard</div>
          <div className="text-gray-500 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (widgets.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No widgets configured</div>
          <div className="text-gray-400 text-sm">Add widgets to see your dashboard</div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={cn('grid grid-cols-4 gap-4 p-4', className)}
    >
      <AnimatePresence mode="wait">
        {widgetsToRender.map((widget, index) => {
          const chunkIndex = Math.floor(sortedWidgets.indexOf(widget) / chunkSize);
          const isChunkLoaded = loadedChunks.has(chunkIndex);

          if (!isChunkLoaded) {
            return (
              <motion.div
                key={`skeleton-${widget.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'bg-white rounded-lg shadow-sm border',
                  widget.size === 'small' && 'col-span-1 row-span-1',
                  widget.size === 'medium' && 'col-span-2 row-span-1',
                  widget.size === 'large' && 'col-span-2 row-span-2',
                  widget.size === 'full' && 'col-span-4 row-span-2'
                )}
              >
                <WidgetSkeleton size={widget.size} />
              </motion.div>
            );
          };

  return (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              ref={enableIntersectionLoading ? intersectionRef as any : undefined}
            >
              <LazyWidget
                widget={widget}
                state={widgetStates[widget.id]}
                onLoad={() => handleWidgetLoad(widget.id)}
                onError={(error) => handleWidgetError(widget.id, error)}
                onStateChange={(state) => handleWidgetStateChange(widget.id, state)}
                inView={inView}
                enableIntersectionLoading={enableIntersectionLoading}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default LazyDashboard;

// Utility hook for dashboard state management
export const useLazyDashboard = (initialWidgets: DashboardWidget[]) => {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadedWidgets, setLoadedWidgets] = useState<Set<string>>(new Set());

  const addWidget = useCallback((widget: DashboardWidget) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLoadedWidgets(prev => {
      const newSet = new Set(prev);
      newSet.delete(widgetId);
      return newSet;
    });
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w));
  }, []);

  const refreshWidget = useCallback((widgetId: string) => {
    setLoadedWidgets(prev => {
      const newSet = new Set(prev);
      newSet.delete(widgetId);
      return newSet;
    });
  }, []);

  const refreshAll = useCallback(() => {
    setLoadedWidgets(new Set());
  }, []);

  const handleWidgetLoad = useCallback((widgetId: string) => {
    setLoadedWidgets(prev => new Set([...prev, widgetId]));
  }, []);

  const handleWidgetError = useCallback((widgetId: string, error: Error) => {
    console.error(`Widget ${widgetId} failed to load:`, error);
  }, []);

  return {
    widgets,
    loading,
    error,
    loadedWidgets,
    setLoading,
    setError,
    addWidget,
    removeWidget,
    updateWidget,
    refreshWidget,
    refreshAll,
    handleWidgetLoad,
    handleWidgetError,
  };
}; 
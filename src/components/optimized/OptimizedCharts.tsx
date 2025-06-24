'use client';

// Optimized Chart Components for High Performance Rendering
import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce, throttle } from 'lodash-es';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface ChartDataPoint {
  [key: string]: any;
  timestamp?: number;
  date?: string;
}

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'combo';
  data: ChartDataPoint[];
  xKey: string;
  yKeys: string[];
  colors: string[];
  height?: number;
  width?: number;
  enableZoom?: boolean;
  enableBrush?: boolean;
  enableAnimation?: boolean;
  enableTooltip?: boolean;
  enableLegend?: boolean;
  enableGrid?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  animationDuration?: number;
  refreshInterval?: number;
  maxDataPoints?: number;
  aggregationMethod?: 'sum' | 'avg' | 'max' | 'min';
  enableVirtualization?: boolean;
  lazyLoad?: boolean;
  threshold?: number;
  series?: any[];
  margin?: { top: number; right: number; bottom: number; left: number };
  xAxisKey?: string;
  yAxisKeys?: string[];
  samplingStrategy?: 'none' | 'uniform' | 'lttb' | 'adaptive';
  updateInterval?: number;
  responsive?: boolean;
  theme?: 'light' | 'dark';
}

export interface OptimizedChartsProps {
  charts: ChartConfig[];
  loading?: boolean;
  error?: Error;
  className?: string;
  enablePerformanceMode?: boolean;
  maxConcurrentCharts?: number;
  enableIntersectionObserver?: boolean;
  onChartLoad?: (chartIndex: number) => void;
  onChartError?: (chartIndex: number, error: Error) => void;
}

interface ChartState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  visible: boolean;
  lastUpdate: number;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
];

// Optimized data processing utilities
const processChartData = (
  data: ChartDataPoint[], 
  maxPoints: number = 1000,
  aggregationMethod: 'sum' | 'avg' | 'max' | 'min' = 'avg'
): ChartDataPoint[] => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const processed: ChartDataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    const aggregated: ChartDataPoint = {};

    // Aggregate numeric values
    Object.keys(chunk[0] || {}).forEach(key => {
      const values = chunk.map(item => item[key]).filter(val => typeof val === 'number');
      
      if (values.length > 0) {
        switch (aggregationMethod) {
          case 'sum':
            aggregated[key] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregated[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'max':
            aggregated[key] = Math.max(...values);
            break;
          case 'min':
            aggregated[key] = Math.min(...values);
            break;
        }
      } else {
        // Use first non-numeric value
        aggregated[key] = chunk[0][key];
      }
    });

    processed.push(aggregated);
  }

  return processed;
};

// Memoized chart components
const OptimizedLineChart = React.memo<{
  config: ChartConfig;
  data: ChartDataPoint[];
  onLoad?: () => void;
}>(({ config, data, onLoad }) => {
  const processedData = useMemo(() => 
    processChartData(data, config.maxDataPoints, config.aggregationMethod),
    [data, config.maxDataPoints, config.aggregationMethod]
  );

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <LineChart data={processedData}>
        {config.enableGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={config.xKey} 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} />
        {config.enableTooltip && <Tooltip />}
        {config.enableLegend && <Legend />}
        
        {config.yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={config.colors[index] || COLORS[index % COLORS.length]}
            strokeWidth={config.strokeWidth || 2}
            dot={processedData.length > 100 ? false : { r: 3 }}
            animationDuration={config.enableAnimation ? config.animationDuration || 1000 : 0}
            connectNulls={false}
          />
        ))}
        
        {config.enableBrush && <Brush dataKey={config.xKey} height={30} />}
      </LineChart>
    </ResponsiveContainer>
  );
});
OptimizedLineChart.displayName = 'OptimizedLineChart';

const OptimizedAreaChart = React.memo<{
  config: ChartConfig;
  data: ChartDataPoint[];
  onLoad?: () => void;
}>(({ config, data, onLoad }) => {
  const processedData = useMemo(() => 
    processChartData(data, config.maxDataPoints, config.aggregationMethod),
    [data, config.maxDataPoints, config.aggregationMethod]
  );

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <AreaChart data={processedData}>
        {config.enableGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={config.xKey} 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} />
        {config.enableTooltip && <Tooltip />}
        {config.enableLegend && <Legend />}
        
        {config.yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={config.colors[index] || COLORS[index % COLORS.length]}
            fill={config.colors[index] || COLORS[index % COLORS.length]}
            fillOpacity={config.fillOpacity || 0.6}
            animationDuration={config.enableAnimation ? config.animationDuration || 1000 : 0}
          />
        ))}
        
        {config.enableBrush && <Brush dataKey={config.xKey} height={30} />}
      </AreaChart>
    </ResponsiveContainer>
  );
});
OptimizedAreaChart.displayName = 'OptimizedAreaChart';

const OptimizedBarChart = React.memo<{
  config: ChartConfig;
  data: ChartDataPoint[];
  onLoad?: () => void;
}>(({ config, data, onLoad }) => {
  const processedData = useMemo(() => 
    processChartData(data, config.maxDataPoints, config.aggregationMethod),
    [data, config.maxDataPoints, config.aggregationMethod]
  );

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <BarChart data={processedData}>
        {config.enableGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={config.xKey} 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} />
        {config.enableTooltip && <Tooltip />}
        {config.enableLegend && <Legend />}
        
        {config.yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={config.colors[index] || COLORS[index % COLORS.length]}
            animationDuration={config.enableAnimation ? config.animationDuration || 1000 : 0}
          />
        ))}
        
        {config.enableBrush && <Brush dataKey={config.xKey} height={30} />}
      </BarChart>
    </ResponsiveContainer>
  );
});
OptimizedBarChart.displayName = 'OptimizedBarChart';

const OptimizedPieChart = React.memo<{
  config: ChartConfig;
  data: ChartDataPoint[];
  onLoad?: () => void;
}>(({ config, data, onLoad }) => {
  const processedData = useMemo(() => {
    // For pie charts, we typically want to show all categories
    return data.slice(0, config.maxDataPoints || 20);
  }, [data, config.maxDataPoints]);

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <PieChart>
        <Pie
          data={processedData}
          dataKey={config.yKeys[0]}
          nameKey={config.xKey}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          animationDuration={config.enableAnimation ? config.animationDuration || 1000 : 0}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {processedData.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={config.colors[index] || COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        {config.enableTooltip && <Tooltip />}
        {config.enableLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
});
OptimizedPieChart.displayName = 'OptimizedPieChart';

const OptimizedScatterChart = React.memo<{
  config: ChartConfig;
  data: ChartDataPoint[];
  onLoad?: () => void;
}>(({ config, data, onLoad }) => {
  const processedData = useMemo(() => 
    processChartData(data, config.maxDataPoints, config.aggregationMethod),
    [data, config.maxDataPoints, config.aggregationMethod]
  );

  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <ScatterChart data={processedData}>
        {config.enableGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={config.xKey} 
          tick={{ fontSize: 12 }}
          type="number"
        />
        <YAxis 
          dataKey={config.yKeys[0]}
          tick={{ fontSize: 12 }} 
          type="number"
        />
        {config.enableTooltip && <Tooltip />}
        {config.enableLegend && <Legend />}
        
        <Scatter
          dataKey={config.yKeys[0]}
          fill={config.colors[0] || COLORS[0]}
          animationDuration={config.enableAnimation ? config.animationDuration || 1000 : 0}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
});
OptimizedScatterChart.displayName = 'OptimizedScatterChart';

const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="bg-gray-200 rounded-lg h-full flex items-center justify-center">
      <div className="text-gray-400">Loading chart...</div>
    </div>
  </div>
);

const ChartErrorBoundary: React.FC<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> = ({ children, onError }) => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      setError(error);
      onError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">Chart failed to load</div>
          <div className="text-sm text-gray-500">{error.message}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const LazyChart: React.FC<{
  config: ChartConfig;
  index: number;
  onLoad: () => void;
  onError: (error: Error) => void;
  inView: boolean;
  enableIntersectionObserver: boolean;
}> = ({ config, index, onLoad, onError, inView, enableIntersectionObserver }) => {
  const [state, setState] = useState<ChartState>({
    loading: false,
    loaded: false,
    error: null,
    visible: !enableIntersectionObserver,
    lastUpdate: 0,
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle intersection observer
  useEffect(() => {
    if (enableIntersectionObserver && inView && !state.visible) {
      setState(prev => ({ ...prev, visible: true }));
    }
  }, [inView, enableIntersectionObserver, state.visible]);

  // Load chart when visible
  useEffect(() => {
    if (!state.visible || state.loaded) return;

    setState(prev => ({ ...prev, loading: true }));

    const loadChart = async () => {
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setState(prev => ({
          ...prev,
          loading: false,
          loaded: true,
          lastUpdate: Date.now(),
        }));
        onLoad();
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Chart load failed');
        setState(prev => ({
          ...prev,
          loading: false,
          error: err,
        }));
        onError(err);
      }
    };

    loadChart();
  }, [state.visible, state.loaded, onLoad, onError]);

  // Set up refresh interval
  useEffect(() => {
    if (!config.refreshInterval || !state.loaded) return;

    refreshTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, loaded: false }));
    }, config.refreshInterval);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [config.refreshInterval, state.loaded, state.lastUpdate]);

  if (!state.visible) {
    return <ChartSkeleton height={config.height} />;
  }

  if (state.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ChartSkeleton height={config.height} />
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <ChartErrorBoundary onError={onError}>
        <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 mb-2">Chart failed to load</div>
            <div className="text-sm text-gray-500">{state.error.message}</div>
            <button
              onClick={() => setState(prev => ({ ...prev, loaded: false, error: null }))}
              className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </ChartErrorBoundary>
    );
  }

  if (!state.loaded) {
    return <ChartSkeleton height={config.height} />;
  }

  const renderChart = () => {
    const chartProps = {
      config,
      data: config.data,
      onLoad,
    };

    switch (config.type) {
      case 'line':
        return <OptimizedLineChart {...chartProps} />;
      case 'area':
        return <OptimizedAreaChart {...chartProps} />;
      case 'bar':
        return <OptimizedBarChart {...chartProps} />;
      case 'pie':
        return <OptimizedPieChart {...chartProps} />;
      case 'scatter':
        return <OptimizedScatterChart {...chartProps} />;
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-sm border p-4"
    >
      <ChartErrorBoundary onError={onError}>
        {renderChart()}
      </ChartErrorBoundary>
    </motion.div>
  );
};

const OptimizedCharts: React.FC<OptimizedChartsProps> = ({
  charts,
  loading = false,
  error,
  className,
  enablePerformanceMode = true,
  maxConcurrentCharts = 4,
  enableIntersectionObserver = true,
  onChartLoad,
  onChartError,
}) => {
  const [loadedCharts, setLoadedCharts] = useState<Set<number>>(new Set());
  const [visibleCharts, setVisibleCharts] = useState<Set<number>>(new Set());
  const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection observer setup
  useEffect(() => {
    if (!enableIntersectionObserver) {
      setVisibleCharts(new Set(charts.map((_, index) => index)));
      return;
    }

    const observers: IntersectionObserver[] = [];

    charts.forEach((_, index) => {
      const element = observerRefs.current[index];
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCharts(prev => new Set([...prev, index]));
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '100px',
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [charts, enableIntersectionObserver]);

  // Throttled chart loading
  const handleChartLoad = useCallback(
    throttle((chartIndex: number) => {
      setLoadedCharts(prev => new Set([...prev, chartIndex]));
      onChartLoad?.(chartIndex);
    }, 100),
    [onChartLoad]
  );

  const handleChartError = useCallback((chartIndex: number, error: Error) => {
    onChartError?.(chartIndex, error);
  }, [onChartError]);

  // Loading state
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <ChartSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Failed to load charts</div>
          <div className="text-gray-500 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (charts.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No charts configured</div>
          <div className="text-gray-400 text-sm">Add charts to visualize your data</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      <AnimatePresence>
        {charts.map((chart, index) => (
          <div
            key={index}
            ref={(el) => (observerRefs.current[index] = el)}
          >
            <LazyChart
              config={chart}
              index={index}
              onLoad={() => handleChartLoad(index)}
              onError={(error) => handleChartError(index, error)}
              inView={visibleCharts.has(index)}
              enableIntersectionObserver={enableIntersectionObserver}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default OptimizedCharts;

// Utility hook for chart management
export const useOptimizedCharts = (initialCharts: ChartConfig[]) => {
  const [charts, setCharts] = useState(initialCharts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addChart = useCallback((chart: ChartConfig) => {
    setCharts(prev => [...prev, chart]);
  }, []);

  const removeChart = useCallback((index: number) => {
    setCharts(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateChart = useCallback((index: number, updates: Partial<ChartConfig>) => {
    setCharts(prev => prev.map((chart, i) => i === index ? { ...chart, ...updates } : chart));
  }, []);

  const refreshCharts = useCallback(() => {
    setCharts(prev => [...prev]);
  }, []);

  return {
    charts,
    loading,
    error,
    setLoading,
    setError,
    addChart,
    removeChart,
    updateChart,
    refreshCharts,
  };
}; 
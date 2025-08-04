'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/layout/MainContentArea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  LineChart,
  PieChart,
  Map,
  Network,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Target,
  Download,
  Filter,
  RefreshCw,
  Maximize2,
  Share,
  Settings,
} from 'lucide-react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyCalendar } from '@/components/ui/DaisyCalendar';
import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
// import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';

// Import our API services
import { api, analyticsAPI } from '@/lib/mockData';

// ========== TYPES ==========
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    backgroundColor?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  target?: number;
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ComponentType<any>;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export interface Widget {
  id: string;
  title: string;
  type: 'kpi-cards' | 'bar-chart' | 'line-chart' | 'pie-chart' | 'heatmap' | 'progress-rings' | 'table';
  size: 'sm' | 'md' | 'lg' | 'xl';
  data: any;
  config?: any;
  realTime?: boolean;
  drillDown?: string;
  exportable?: boolean;
}

export interface DashboardProps {
  title: string;
  subtitle?: string;
  widgets: Widget[];
  layout?: 'grid' | 'masonry';
  realTimeEnabled?: boolean;
  onWidgetClick?: (widget: Widget) => void;
  onExport?: (widget: Widget, format: string) => void;
  className?: string;
}

// ========== KPI CARD COMPONENT ==========
const KPICard: React.FC<{ 
  metric: KPIMetric; 
  onClick?: () => void;
  realTime?: boolean;
}> = ({ metric, onClick, realTime }) => {
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-semantic-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-semantic-error" />;
      case 'neutral': return <div className="h-4 w-4" />;
      default: return null;
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success': return 'text-semantic-success';
      case 'warning': return 'text-semantic-warning';
      case 'error': return 'text-semantic-error';
      default: return 'text-text-primary';
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-border p-enterprise-6 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-notion-md hover:border-interactive-primary/50",
        realTime && "ring-1 ring-interactive-primary/20"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-enterprise-3">
          {metric.icon && (
            <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
              <metric.icon className="h-5 w-5 text-text-primary" />
            </div>
          )}
          <div>
            <p className="text-body-sm text-text-secondary font-medium">
              {metric.label}
            </p>
            {realTime && (
              <div className="flex items-center space-x-enterprise-1 mt-1">
                <div className="w-2 h-2 bg-semantic-success rounded-full animate-pulse" />
                <span className="text-caption text-text-tertiary">Live</span>
              </div>
            )}
          </div>
        </div>
        
        {metric.trend && getTrendIcon(metric.trend)}
      </div>
      
      <div className="mt-enterprise-4">
        <div className="flex items-baseline space-x-enterprise-2">
          <span className={cn("text-heading-2xl font-bold", getColorClass(metric.color))}>
            {formatValue(metric.value, metric.format)}
          </span>
          
          {metric.trendPercentage && (
            <DaisyBadge 
              variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
              className="text-caption" >
  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
</DaisyBadge>
              {Math.abs(metric.trendPercentage)}%
            </DaisyBadge>
          )}
        </div>
        
        {metric.previousValue && (
          <p className="text-caption text-text-tertiary mt-enterprise-1">
            vs {formatValue(metric.previousValue, metric.format)} last period
          </p>
        )}
        
        {metric.target && (
          <div className="mt-enterprise-3">
            <div className="flex items-center justify-between text-caption text-text-tertiary mb-enterprise-1">
              <span>Progress to target</span>
              <span>{Math.round((Number(metric.value) / metric.target) * 100)}%</span>
            </div>
            <div className="w-full bg-surface-secondary rounded-full h-2">
              <div 
                className="bg-interactive-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((Number(metric.value) / metric.target) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== CHART CONTAINER COMPONENT ==========
const ChartContainer: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onExpand?: () => void;
  onDrillDown?: () => void;
  realTime?: boolean;
  className?: string;
}> = ({ 
  title, 
  subtitle, 
  children, 
  onExport, 
  onExpand, 
  onDrillDown,
  realTime,
  className 
}) => {
  return (
    <ContentCard
      title={title}
      subtitle={subtitle}
      className={cn("h-full", className)}
      action={{
        label: '',
        onClick: () => {},
        icon: Settings,
        variant: 'outline'
      }}
    >
      <div className="space-y-enterprise-4">
        {/* Chart Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-enterprise-2">
            {realTime && (
              <DaisyBadge variant="outline" className="text-caption" >
  <div className="w-2 h-2 bg-semantic-success rounded-full mr-enterprise-1 animate-pulse" />
</DaisyBadge>
                Real-time
              </DaisyBadge>
            )}
          </div>
          
          <div className="flex items-center space-x-enterprise-2">
            {onDrillDown && (
              <DaisyButton variant="ghost" size="sm" onClick={onDrillDown} >
  <Target className="h-4 w-4" />
</DaisyButton>
              </DaisyButton>
            )}
            {onExpand && (
              <DaisyButton variant="ghost" size="sm" onClick={onExpand} >
  <Maximize2 className="h-4 w-4" />
</DaisyButton>
              </DaisyButton>
            )}
            {onExport && (
              <DaisyButton variant="ghost" size="sm" onClick={onExport} >
  <Download className="h-4 w-4" />
</DaisyButton>
              </DaisyButton>
            )}
          </div>
        </div>
        
        {/* Chart Content */}
        <div className="h-80 flex items-center justify-center">
          {children}
        </div>
      </div>
    </ContentCard>
  );
};

// ========== PLACEHOLDER CHART COMPONENTS ==========
const BarChartPlaceholder: React.FC<{ data: ChartData }> = ({ data }) => (
  <div className="w-full h-full bg-surface-secondary rounded-lg flex items-center justify-center">
    <div className="text-center">
      <BarChart3 className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
      <p className="text-body-sm text-text-secondary">Bar Chart</p>
      <p className="text-caption text-text-tertiary">{data.datasets.length} datasets</p>
    </div>
  </div>
);

const LineChartPlaceholder: React.FC<{ data: ChartData }> = ({ data }) => (
  <div className="w-full h-full bg-surface-secondary rounded-lg flex items-center justify-center">
    <div className="text-center">
      <LineChart className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
      <p className="text-body-sm text-text-secondary">Line Chart</p>
      <p className="text-caption text-text-tertiary">{data.labels.length} data points</p>
    </div>
  </div>
);

const PieChartPlaceholder: React.FC<{ data: ChartData }> = ({ data }) => (
  <div className="w-full h-full bg-surface-secondary rounded-lg flex items-center justify-center">
    <div className="text-center">
      <PieChart className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
      <p className="text-body-sm text-text-secondary">Pie Chart</p>
      <p className="text-caption text-text-tertiary">{data.labels.length} segments</p>
    </div>
  </div>
);

const HeatmapPlaceholder: React.FC<{ data: any }> = ({ data }) => (
  <div className="w-full h-full bg-surface-secondary rounded-lg flex items-center justify-center">
    <div className="text-center">
      <Map className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
      <p className="text-body-sm text-text-secondary">Risk Heatmap</p>
      <p className="text-caption text-text-tertiary">Interactive matrix view</p>
    </div>
  </div>
);

const ProgressRingsPlaceholder: React.FC<{ data: any }> = ({ data }) => (
  <div className="w-full h-full bg-surface-secondary rounded-lg flex items-center justify-center">
    <div className="text-center">
      <Target className="h-12 w-12 text-text-tertiary mx-auto mb-enterprise-2" />
      <p className="text-body-sm text-text-secondary">Progress Rings</p>
      <p className="text-caption text-text-tertiary">Compliance progress</p>
    </div>
  </div>
);

// ========== MAIN DASHBOARD COMPONENT ==========
export const AnalyticsDashboard: React.FC<DashboardProps> = ({
  title,
  subtitle,
  widgets,
  layout = 'grid',
  realTimeEnabled = false,
  onWidgetClick,
  onExport,
  className
}) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  const getGridCols = (size: string) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-2';
      case 'lg': return 'col-span-3';
      case 'xl': return 'col-span-4';
      default: return 'col-span-2';
    }
  };

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      onExport: widget.exportable ? () => onExport?.(widget, 'png') : undefined,
      onExpand: () => onWidgetClick?.(widget),
             onDrillDown: widget.drillDown ? () => window.location.href = widget.drillDown! : undefined,
      realTime: widget.realTime && realTimeEnabled,
    };

    switch (widget.type) {
      case 'kpi-cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-enterprise-4">
            {widget.data.map((metric: KPIMetric, index: number) => (
              <KPICard
                key={metric.id}
                metric={metric}
                onClick={() => onWidgetClick?.(widget)}
                realTime={widget.realTime && realTimeEnabled} />
            ))}
          </div>
        );

      case 'bar-chart':
        return (
          <ChartContainer title={widget.title} {...commonProps}>
            <BarChartPlaceholder data={widget.data} />
          </ChartContainer>
        );

      case 'line-chart':
        return (
          <ChartContainer title={widget.title} {...commonProps}>
            <LineChartPlaceholder data={widget.data} />
          </ChartContainer>
        );

      case 'pie-chart':
        return (
          <ChartContainer title={widget.title} {...commonProps}>
            <PieChartPlaceholder data={widget.data} />
          </ChartContainer>
        );

      case 'heatmap':
        return (
          <ChartContainer title={widget.title} {...commonProps}>
            <HeatmapPlaceholder data={widget.data} />
          </ChartContainer>
        );

      case 'progress-rings':
        return (
          <ChartContainer title={widget.title} {...commonProps}>
            <DaisyProgressRingsPlaceholder data={widget.data} / / />
</DaisyProgressRingsPlaceholder>
        );

      default:
        return (
          <ContentCard title={widget.title}>
            <div className="h-40 bg-surface-secondary rounded-lg flex items-center justify-center">
              <p className="text-text-secondary">Widget type: {widget.type}</p>
            </div>
          </ContentCard>
        );
    }
  };

  return (
    <div className={cn("space-y-enterprise-6", className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl font-bold text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-body-base text-text-secondary mt-enterprise-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-enterprise-3">
          {/* Time Range Selector */}
          <DaisySelect value={timeRange} onValueChange={setTimeRange} >
              <DaisySelectTrigger className="w-32">
                <DaisySelectValue />
</DaisySelect>
            <DaisySelectContent >
                <DaisySelectItem value="1d">Last 24h</DaisySelectItem>
              <DaisySelectItem value="7d">Last 7 days</DaisySelectItem>
              <DaisySelectItem value="30d">Last 30 days</DaisySelectItem>
              <DaisySelectItem value="90d">Last 90 days</DaisySelectItem>
              <DaisySelectItem value="1y">Last year</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>

          {/* Actions */}
          <div className="flex items-center space-x-enterprise-2">
            <DaisyButton variant="outline" size="sm" >
  <Filter className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
              Filter
            </DaisyButton>

            <DaisyButton 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing} >
  <RefreshCw className={cn("h-4 w-4 mr-enterprise-1", refreshing && "animate-spin")} />
</DaisyButton>
              Refresh
            </DaisyButton>

            <DaisyButton variant="outline" size="sm" >
  <Share className="h-4 w-4 mr-enterprise-1" />
</DaisyButton>
              Share
            </DaisyButton>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeEnabled && (
        <div className="flex items-center justify-between bg-surface-secondary/50 rounded-lg px-enterprise-4 py-enterprise-3">
          <div className="flex items-center space-x-enterprise-2">
            <div className="w-2 h-2 bg-semantic-success rounded-full animate-pulse" />
            <span className="text-body-sm text-text-primary font-medium">Live Dashboard</span>
            <span className="text-caption text-text-tertiary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          
          <DaisyBadge variant="outline" className="text-caption" >
  Real-time enabled
</DaisyBadge>
          </DaisyBadge>
        </div>
      )}

      {/* Widgets Grid */}
      <div className={cn(
        layout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-enterprise-6" 
          : "space-y-enterprise-6"
      )}>
        {widgets.map((widget) => (
          <div 
            key={widget.id} 
            className={layout === 'grid' ? getGridCols(widget.size) : ''}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 
import React from 'react';
import { cn } from '@/lib/utils';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from 'lucide-react';
import { DaisyCardTitle } from '@/components/ui/daisy-components';

// Chart Types
export interface ChartDataPoint {
  label: string
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  variant?: 'default' | 'minimal';
  showLegend?: boolean;
  showValues?: boolean;
  height?: number;
  className?: string;
}

// Color Palette
const chartColors = [
  '#199BEC', // Primary Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
]

// Simple Bar Chart Component
export const SimpleBarChart: React.FC<ChartProps> = ({
  title,
  subtitle,
  data,
  variant = 'default',
  showLegend = true,
  showValues = true,
  height = 300,
  className,
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <DaisyCard className={cn("border border-gray-200", className)} >
  {(title || subtitle) && (
</DaisyCard>
        <DaisyCardBody >
  {Boolean(title) && (
</DaisyCardBody>
            <DaisyCardTitle className="flex items-center gap-2 text-[#191919] font-inter" >
  <BarChart3 className="h-5 w-5 text-[#199BEC]" />
</DaisyCardTitle>
              {title}
            </DaisyCardTitle>
          )}
          {Boolean(subtitle) && (
            <p className="text-sm text-gray-600 font-inter">{subtitle}</p>
          )}
        
      )}
      
      <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
          {/* Chart */}
          <div className="space-y-3" style={{ height: `${height}px` }}>
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-700 font-inter font-medium truncate">
                  {item.label}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                        backgroundColor: item.color || chartColors[index % chartColors.length],
                      }} />
                  </div>
                  {Boolean(showValues) && (
                    <div className="w-16 text-sm text-gray-600 font-inter font-medium text-right">
                      {item.value.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          {Boolean(showLegend) && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {data.map((item, index) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || chartColors[index % chartColors.length] }} />
                  <span className="text-xs text-gray-600 font-inter">
                    {item.label}: {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}

// Simple Donut Chart Component
export const SimpleDonutChart: React.FC<ChartProps> = ({
  title,
  subtitle,
  data,
  variant = 'default',
  showLegend = true,
  showValues = true,
  height = 300,
  className,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const center = height / 2;
  const radius = (height - 40) / 2;
  const innerRadius = radius * 0.6;

  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const x1 = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const outerPath = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    const innerX1 = center + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
    const innerY1 = center + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
    const innerX2 = center + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180);
    const innerY2 = center + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180);

    const donutPath = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${innerX2} ${innerY2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      path: donutPath,
      percentage: percentage.toFixed(1),
      color: item.color || chartColors[index % chartColors.length],
    }
  });

  return (
    <DaisyCard className={cn("border border-gray-200", className)} >
  {(title || subtitle) && (
</DaisyCard>
        <DaisyCardBody >
  {Boolean(title) && (
</DaisyCardBody>
            <DaisyCardTitle className="flex items-center gap-2 text-[#191919] font-inter" >
  <PieChart className="h-5 w-5 text-[#199BEC]" />
</DaisyCardTitle>
              {title}
            </DaisyCardTitle>
          )}
          {Boolean(subtitle) && (
            <p className="text-sm text-gray-600 font-inter">{subtitle}</p>
          )}
        
      )}
      
      <DaisyCardBody >
  <div className="flex flex-col lg:flex-row gap-6 items-center">
</DaisyCardBody>
          {/* Chart */}
          <div className="relative">
            <svg width={height} height={height} className="drop-shadow-sm">
              {slices.map((slice, index) => (
                <path
                  key={slice.label}
                  d={slice.path}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer" />
              ))}
              
              {/* Center Circle */}
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                fill="white"
                className="drop-shadow-sm" />
              
              {/* Center Text */}
              <text
                x={center}
                y={center - 8}
                textAnchor="middle"
                className="text-lg font-bold fill-[#191919] font-inter"
              >
                {total.toLocaleString()}
              </text>
              <text
                x={center}
                y={center + 12}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-inter"
              >
                Total
              </text>
            </svg>
          </div>

          {/* Legend */}
          {Boolean(showLegend) && (
            <div className="flex-1 space-y-2">
              {slices.map((slice) => (
                <div key={slice.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: slice.color }} />
                    <span className="text-sm text-gray-700 font-inter font-medium">
                      {slice.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#191919] font-inter">
                      {slice.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 font-inter">
                      {slice.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}

// Simple Metric Card
export interface MetricCardProps {
  title: string
  value: string | number;
  change?: {
    value: number;
    period: string;
  }
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  color = '#199BEC',
  className,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }

  return (
    <DaisyCard className={cn("border border-gray-200 hover:shadow-sm transition-all duration-200", className)} >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-inter font-medium mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-[#191919] font-inter mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {Boolean(change) && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn("text-xs font-medium font-inter", getTrendColor())}>
                  {change.value > 0 ? '+' : ''}{change.value}% {change.period}
                </span>
              </div>
            )}
          </div>
          {Boolean(Icon) && (
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}10`, color: color }}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}

// Progress Ring Component
export interface ProgressRingProps {
  value: number
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  subtitle?: string;
  className?: string;
}

export const ProgressRing: React.FC<DaisyProgressRingProps />= ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#199BEC',
  backgroundColor = '#F3F4F6',
  label,
  subtitle,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = (value / max) * 100;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <DaisyCard className={cn("border border-gray-200 p-4", className)} >
  <div className="flex flex-col items-center text-center">
</DaisyProgressRingProps>
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              fill="transparent" />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out" />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-[#191919] font-inter">
              {Math.round(percentage)}%
            </span>
            <span className="text-xs text-gray-500 font-inter">
              {value}/{max}
            </span>
          </div>
        </div>
        
        {(label || subtitle) && (
          <div className="mt-3 text-center">
            {Boolean(label) && (
              <h4 className="font-semibold text-sm text-[#191919] font-inter">
                {label}
              </h4>
            )}
            {Boolean(subtitle) && (
              <p className="text-xs text-gray-600 font-inter mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </DaisyCard>
  );
}

// Simple Trend Line Component
export interface TrendLineProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  showDots?: boolean;
  className?: string;
}

export const SimpleTrendLine: React.FC<TrendLineProps> = ({
  data,
  color = '#199BEC',
  height = 100,
  showDots = true,
  className,
}) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const width = 300;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.value - minValue) / range) * chartHeight;
    return { x, y, ...item }
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
    <div className={cn("relative", className)}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Trend line */}
        <path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round" />
        
        {/* Data points */}
        {Boolean(showDots) && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color}
            className="hover:r-4 transition-all cursor-pointer" />
        ))}
      </svg>
    </div>
  );
} 
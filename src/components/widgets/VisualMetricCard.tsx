'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface SparklineData {
  value: number;
  timestamp: Date;
}

interface VisualMetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  sparklineData?: SparklineData[];
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon?: React.ComponentType<any>;
  color?: string;
  subtitle?: string;
  target?: number;
  showProgress?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  success: {
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: CheckCircle,
    label: 'Good'
  },
  warning: {
    color: '#f59e0b',
    bgColor: '#fef3c7',
    icon: AlertTriangle,
    label: 'Warning'
  },
  error: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: AlertTriangle,
    label: 'Critical'
  },
  info: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: Clock,
    label: 'Info'
  },
  neutral: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: Minus,
    label: 'Neutral'
  }
};

const Sparkline: React.FC<{ data: SparklineData[]; color: string; height?: number }> = ({ 
  data, 
  color, 
  height = 40 
}) => {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = ((max - d.value) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        {/* Area fill */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = ((max - d.value) / range) * 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
};

const ProgressRing: React.FC<{ 
  value: number; 
  target: number; 
  color: string; 
  size?: number 
}> = ({ 
  value, 
  target, 
  color, 
  size = 60 
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

export const VisualMetricCard: React.FC<VisualMetricCardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  trend,
  trendPercentage,
  sparklineData,
  status = 'neutral',
  icon: IconComponent,
  color,
  subtitle,
  target,
  showProgress = false,
  interactive = true,
  onClick,
  className
}) => {
  const statusInfo = statusConfig[status];
  const cardColor = color || statusInfo.color;
  const StatusIcon = statusInfo.icon;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toString();
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <DaisyCard 
        className={`bg-white border-gray-200 transition-all duration-200 ${
          interactive ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <DaisyCardContent className="p-6" >
  <div className="space-y-4">
</DaisyCard>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: cardColor + '20' }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: cardColor }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[#191919] text-sm">{title}</h3>
                  {subtitle && (
                    <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DaisyBadge 
                  variant="secondary"
                  className="text-xs"
                  style={{ 
                    backgroundColor: statusInfo.bgColor,
                    color: statusInfo.color
                  }}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </DaisyBadge>
                
                {interactive && (
                  <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <MoreHorizontal className="w-3 h-3" />
</DaisyButton>
                  </DaisyButton>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Value */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#191919]">
                    {formatValue(value)}
                  </span>
                  {unit && (
                    <span className="text-sm text-gray-600">{unit}</span>
                  )}
                </div>

                {/* Trend */}
                {(trend || trendPercentage !== undefined) && (
                  <div className="flex items-center gap-2 mt-2">
                    {getTrendIcon()}
                    {trendPercentage !== undefined && (
                      <span className={`text-sm font-medium ${getTrendColor()}`}>
                        {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
                      </span>
                    )}
                    {previousValue && (
                      <span className="text-xs text-gray-500">
                        vs {formatValue(previousValue)}
                      </span>
                    )}
                  </div>
                )}

                {/* Target Progress */}
                {target && showProgress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress to target</span>
                      <span>{formatValue(target)} {unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: cardColor }}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min((Number(value) / target) * 100, 100)}%` 
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Elements */}
              <div className="flex items-center gap-4">
                {/* Progress Ring */}
                {target && !showProgress && (
                  <DaisyProgressRing
                    value={Number(value)}
                    target={target}
                    color={cardColor}
                    size={60}
                  />
                )}

                {/* Sparkline */}
                {sparklineData && sparklineData.length > 1 && (
                  <div className="w-24">
                    <Sparkline 
                      data={sparklineData} 
                      color={cardColor}
                      height={40}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            {interactive && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <DaisyButton variant="ghost" size="sm" className="text-xs" >
  <Eye className="w-3 h-3 mr-1" />
</DaisyProgressRing>
                  View Details
                </DaisyButton>
                
                <span className="text-xs text-gray-500">
                  Updated 2 min ago
                </span>
              </div>
            )}
          </div>
        </DaisyCardContent>
      </DaisyCard>
    </motion.div>
  );
}; 
import React from 'react';
import { motion } from 'framer-motion';
// import {
  statusColors,
  getStatusColor,
  getRiskLevelColor,
  getConfidenceColor,
  colorClasses,
  dataColors,
} from '@/lib/design-system/colors';

// Status Badge with enhanced visual feedback
interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  animated?: boolean;
  showIcon?: boolean;
  onClick?: () => void;
  className?: string;
}

export const EnhancedStatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'default',
  animated = true,
  showIcon = false,
  onClick,
  className = '',
}) => {
  const colorConfig = getStatusColor(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const getVariantClasses = () => {
    const statusLower = status.toLowerCase();

    // New color scheme: Low=Green, Medium=Yellow, High=Red, Critical=Red
    const colorMapping = {
      low: 'bg-green-50 text-green-700 border-green-200',
      medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      high: 'bg-red-50 text-red-700 border-red-200',
      critical: 'bg-red-100 text-red-800 border-red-300',
      success: 'bg-green-50 text-green-700 border-green-200',
      mitigated: 'bg-green-50 text-green-700 border-green-200',
      identified: 'bg-blue-50 text-blue-700 border-blue-200',
      assessed: 'bg-blue-50 text-blue-700 border-blue-200',
      monitoring: 'bg-slate-50 text-slate-700 border-slate-200',
    }

    const outlineMapping = {
      low: 'text-green-700 border-green-300 bg-transparent',
      medium: 'text-yellow-800 border-yellow-400 bg-transparent',
      high: 'text-red-700 border-red-300 bg-transparent',
      critical: 'text-red-800 border-red-400 bg-transparent',
      success: 'text-green-700 border-green-300 bg-transparent',
      mitigated: 'text-green-700 border-green-300 bg-transparent',
      identified: 'text-blue-700 border-blue-300 bg-transparent',
      assessed: 'text-blue-700 border-blue-300 bg-transparent',
      monitoring: 'text-slate-700 border-slate-300 bg-transparent',
    }

    const baseClasses =
      colorMapping[statusLower as keyof typeof colorMapping] || colorMapping['medium'];
    const outlineClasses =
      outlineMapping[statusLower as keyof typeof outlineMapping] || outlineMapping['medium'];

    switch (variant) {
      case 'outline':
        return `border-2 ${outlineClasses}`;
      case 'minimal':
        return `bg-transparent border-none ${statusLower === 'critical' || statusLower === 'high' ? 'text-red-700' : statusLower === 'medium' ? 'text-yellow-800' : statusLower === 'low' || statusLower === 'success' || statusLower === 'mitigated' ? 'text-green-700' : 'text-blue-700'}`;
      default:
        return baseClasses;
    }
  }

  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    switch (status.toLowerCase()) {
      case 'critical':
        return <div className={`${iconSize} bg-red-500 rounded-full`} />;
      case 'high':
        return <div className={`${iconSize} bg-orange-500 rounded-full`} />;
      case 'medium':
        return <div className={`${iconSize} bg-yellow-500 rounded-full`} />;
      case 'low':
      case 'success':
        return <div className={`${iconSize} bg-green-500 rounded-full`} />;
      default:
        return <div className={`${iconSize} bg-blue-500 rounded-full`} />;
    }
  }

  const Component = animated ? motion.span : 'span';
  const animationProps = animated
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { duration: 0.2 },
      }
    : {}

  return (
    <Component
      {...(animated ? animationProps : {})}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {Boolean(showIcon) && getStatusIcon()}
      <span className="uppercase font-semibold tracking-wide">{status}</span>
    </Component>
  );
}

// Risk Level Indicator with confidence visualization
interface RiskLevelIndicatorProps {
  level: string | number
  confidence?: number;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  animated?: boolean;
  className?: string;
}

export const EnhancedRiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({
  level,
  confidence = 0.8,
  showConfidence = false,
  size = 'md',
  orientation = 'horizontal',
  animated = true,
  className = '',
}) => {
  const riskColor = getRiskLevelColor(level);
  const confidenceColor = getConfidenceColor(confidence);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const getRiskLevelText = () => {
    if (typeof level === 'number') {
      if (level >= 20) return 'Critical';
      if (level >= 15) return 'High';
      if (level >= 10) return 'Medium';
      if (level >= 5) return 'Low';
      return 'Unknown';
    }
    return level.toString();
  }

  const getRiskValue = () => {
    return typeof level === 'number' ? level : 0;
  }

  const Component = animated ? motion.div : 'div';

  return (
    <Component
      className={`
        ${orientation === 'horizontal' ? 'flex items-center gap-3' : 'flex flex-col gap-2'}
        ${className}
      `}
      {...(animated
        ? {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.3 },
          }
        : {})}
    >
      {/* Risk Level Badge */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: riskColor.color || riskColor[500] }} />
        <span className={`font-medium ${sizeClasses[size]}`} style={{ color: riskColor.text }}>
          {getRiskLevelText()}
        </span>
        {typeof level === 'number' && (
          <span className={`${sizeClasses[size]} text-slate-500`}>({level})</span>
        )}
      </div>

      {/* Risk Level Bar */}
      <div className="relative">
        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: riskColor.color || riskColor[500] }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(getRiskValue() * 4, 100)}%` }}
            transition={{ duration: 0.6, delay: 0.2 }} />
        </div>
      </div>

      {/* Confidence Indicator */}
      {Boolean(showConfidence) && (
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses[size]} text-slate-600`}>Confidence:</span>
          <div
            className={`
              px-2 py-1 rounded text-xs font-medium
              ${
                confidence >= 0.8
                  ? 'bg-green-100 text-green-700'
                  : confidence >= 0.6
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }
            `}
          >
            {Math.round(confidence * 100)}%
          </div>
        </div>
      )}
    </Component>
  );
}

// Progress Ring with color coding
interface ProgressRingProps {
  progress: number
  size?: number;
  strokeWidth?: number;
  status?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const EnhancedProgressRing: React.FC<DaisyProgressRingProps />= ({
  progress,
  size = 60,
  strokeWidth = 6,
  status = 'info',
  showPercentage = true,
  animated = true,
  className = '',
}) => {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const statusColor = getStatusColor(status);
  const progressColor = statusColor.color || statusColor[500] || '#3b82f6';

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg height={size} width={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2} />
        {/* Progress circle */}
        <motion.circle
          stroke={progressColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={animated ? strokeDashoffset : 0}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          initial={animated ? { strokeDashoffset: circumference } : {}}
          animate={animated ? { strokeDashoffset } : {}}
          transition={animated ? { duration: 1, ease: 'easeInOut' } : {}} />
      </svg>
      {Boolean(showPercentage) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

// Interactive Color Dot with hover effects
interface ColorDotProps {
  color: string
  size?: 'sm' | 'md' | 'lg';
  status?: string;
  interactive?: boolean;
  tooltip?: string;
  onClick?: () => void;
  className?: string;
}

export const EnhancedColorDot: React.FC<ColorDotProps> = ({
  color,
  size = 'md',
  status,
  interactive = false,
  tooltip,
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const getColor = () => {
    if (status) {
      const statusColor = getStatusColor(status);
      return statusColor.color || statusColor[500] || color;
    }
    return color;
  }

  const Component = interactive ? motion.div : 'div';

  return (
    <Component
      className={`
        ${sizeClasses[size]} rounded-full
        ${interactive ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ backgroundColor: getColor() }}
      onClick={onClick}
      title={tooltip}
      {...(interactive
        ? {
            whileHover: { scale: 1.2 },
            whileTap: { scale: 0.9 },
            transition: { duration: 0.2 },
          }
        : {})} />
  );
}

// Multi-color Trend Indicator
interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable'
  value?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const EnhancedTrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  value,
  showValue = true,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '↗',
          label: 'Increasing',
        }
      case 'down':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: '↘',
          label: 'Decreasing',
        }
      default:
        return {
          color: 'text-slate-600',
          bgColor: 'bg-slate-100',
          icon: '→',
          label: 'Stable',
        }
    }
  }

  const trendConfig = getTrendConfig();
  const Component = animated ? motion.div : 'div';

  return (
    <Component
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full
        ${trendConfig.bgColor} ${trendConfig.color}
        ${sizeClasses[size]}
        ${className}
      `}
      {...(animated
        ? {
            initial: { opacity: 0, x: -10 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.3 },
          }
        : {})}
    >
      <span className={`${iconSizes[size]} flex items-center justify-center font-bold`}>
        {trendConfig.icon}
      </span>
      {Boolean(showValue) && value !== undefined && (
        <span className="font-medium">
          {value > 0 && trend === 'up' && '+'}
          {value}%
        </span>
      )}
      <span className="font-medium">{trendConfig.label}</span>
    </Component>
  );
}

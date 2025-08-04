'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { cn } from '@/lib/utils';
import { 
  getStatusColor, 
  colorClasses,
  interactiveColors,
  statusColors 
} from '@/lib/design-system/colors';
import { spacingClasses, componentSpacing } from '@/lib/design-system/spacing';

interface TrendData {
  value: number;
  isPositive: boolean;
  period: string;
}

interface SparklineData {
  values: number[];
  trend: 'up' | 'down' | 'neutral';
}

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: TrendData;
  sparkline?: SparklineData;
  progress?: {
    value: number;
    max: number;
    showProgress?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
  };
}

const getVariantStyles = (variant: string) => {
  const statusColor = getStatusColor(variant);
  
  return {
    default: {
      gradient: 'from-slate-50 to-slate-100/50',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      border: 'border-slate-200/60',
      accent: 'bg-slate-500',
      hover: 'hover:bg-slate-50/80',
      ring: 'focus:ring-slate-500/20',
    },
    success: {
      gradient: `from-green-50 to-emerald-100/30`,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      border: 'border-green-200/60',
      accent: 'bg-green-500',
      hover: 'hover:bg-green-50/80',
      ring: 'focus:ring-green-500/20',
    },
    warning: {
      gradient: `from-amber-50 to-yellow-100/30`,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      border: 'border-amber-200/60',
      accent: 'bg-amber-500',
      hover: 'hover:bg-amber-50/80',
      ring: 'focus:ring-amber-500/20',
    },
    danger: {
      gradient: `from-red-50 to-rose-100/30`,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      border: 'border-red-200/60',
      accent: 'bg-red-500',
      hover: 'hover:bg-red-50/80',
      ring: 'focus:ring-red-500/20',
    },
    info: {
      gradient: `from-blue-50 to-sky-100/30`,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      border: 'border-blue-200/60',
      accent: 'bg-blue-500',
      hover: 'hover:bg-blue-50/80',
      ring: 'focus:ring-blue-500/20',
    },
  }[variant] || {
    gradient: 'from-slate-50 to-slate-100/50',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    border: 'border-slate-200/60',
    accent: 'bg-slate-500',
    hover: 'hover:bg-slate-50/80',
    ring: 'focus:ring-slate-500/20',
  };
};

const MiniSparkline: React.FC<{ data: SparklineData }> = ({ data }) => {
  const { values, trend } = data;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="flex items-center gap-2">
      <svg width="48" height="20" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={cn('transition-colors duration-200', trendColor)} />
      </svg>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
    <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
    <div className="h-3 bg-slate-200 rounded w-20"></div>
  </div>
);

export const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  sparkline,
  progress,
  variant = 'default',
  className,
  onClick,
  isLoading = false,
  subtitle,
  badge,
}) => {
  const styles = getVariantStyles(variant);
  const isClickable = !!onClick;

  return (
    <motion.div
      whileHover={isClickable ? { y: -2, scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("relative group", className)}
    >
      <DaisyCard 
        className={cn(
          "relative overflow-hidden border transition-all duration-200",
          "hover:shadow-lg hover:shadow-black/10",
          "bg-gradient-to-br backdrop-blur-sm",
          styles.gradient,
          styles.border,
          styles.hover,
          isClickable && [
            "cursor-pointer",
            "hover:border-opacity-100",
            "focus:ring-2 focus:ring-offset-2",
            styles.ring,
            "focus:outline-none"
          ],
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/60 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity"
        )}
        onClick={onClick}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        } : undefined}
      >
        {/* Accent border */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", styles.accent)} />
        <DaisyCardBody className={cn("relative", spacingClasses.padding.lg)} >
  {isLoading ? (
</DaisyCard>
            <LoadingSkeleton />
          ) : (
            <>
              <div className={cn("flex items-start justify-between", spacingClasses.margin.md.replace('m-', 'mb-'))}>
                <div className={spacingClasses.spacing.xs}>
                  <p className="text-sm font-medium text-slate-600 tracking-wide">
                    {title}
                  </p>
                  {badge && (
                    <DaisyBadge 
                      variant={badge.variant === 'danger' ? 'destructive' : badge.variant === 'success' ? 'default' : badge.variant === 'warning' ? 'secondary' : 'default'} 
                      className="text-xs font-medium" >
  {badge.text}
</DaisyBadge>
                    </DaisyBadge>
                  )}
                </div>
                
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={cn(
                    "p-3 rounded-full transition-all duration-200",
                    "shadow-sm ring-1 ring-black/5",
                    styles.iconBg,
                    "group-hover:shadow-md group-hover:scale-110"
                  )}
                >
                  <Icon className={cn("h-5 w-5", styles.iconColor)} />
                </motion.div>
              </div>

              <div className={spacingClasses.spacing.sm}>
                <div className="flex items-baseline gap-2">
                  <motion.span 
                    className="text-3xl font-bold text-slate-900 tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {value}
                  </motion.span>
                  
                  {sparkline && (
                    <div className="ml-auto">
                      <MiniSparkline data={sparkline} />
                    </div>
                  )}
                </div>

                {subtitle && (
                  <p className="text-sm text-slate-500 font-medium">
                    {subtitle}
                  </p>
                )}

                {trend && (
                  <motion.div 
                    className="flex items-center gap-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className={cn(
                      "text-xs font-semibold",
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {trend.isPositive ? "+" : ""}{trend.value}%
                    </span>
                    <span className="text-xs text-slate-500">
                      {trend.period}
                    </span>
                  </motion.div>
                )}

                {progress?.showProgress && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <DaisyProgress 
                      value={(progress.value / progress.max) * 100} 
                      className="h-2 bg-slate-200" />
<div className="flex justify-between text-xs text-slate-500">
                      <span>{progress.value}</span>
                      <span>{progress.max}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </DaisyProgress>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </DaisyCard>
    </motion.div>
  );
}; 
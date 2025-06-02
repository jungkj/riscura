'use client';

import { FC } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  progress?: {
    value: number;
    max: number;
    color: 'low' | 'medium' | 'high' | 'critical';
  };
  className?: string;
  animated?: boolean;
}

const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    default:
      return Minus;
  }
};

const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return 'text-emerald-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-slate-500';
  }
};

const getProgressColor = (color: 'low' | 'medium' | 'high' | 'critical') => {
  switch (color) {
    case 'low':
      return 'risk-progress-low';
    case 'medium':
      return 'risk-progress-medium';
    case 'high':
      return 'risk-progress-high';
    case 'critical':
      return 'risk-progress-critical';
    default:
      return 'bg-slate-400';
  }
};

export const EnhancedStatsCard: FC<EnhancedStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-slate-600',
  iconBgColor = 'bg-slate-100',
  trend,
  progress,
  className,
  animated = true,
}) => {
  const TrendIcon = trend ? getTrendIcon(trend.direction) : null;
  const progressPercentage = progress ? (progress.value / progress.max) * 100 : 0;

  return (
    <Card className={cn(
      'stats-card group',
      animated && 'hover-lift',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                {title}
              </p>
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-200',
                iconBgColor,
                animated && 'group-hover:scale-110'
              )}>
                <Icon className={cn('w-5 h-5', iconColor)} />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {value}
              </p>
              {subtitle && (
                <p className="text-sm text-slate-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        {trend && TrendIcon && (
          <div className="flex items-center mt-4 pt-4 border-t border-slate-100">
            <div className={cn(
              'flex items-center space-x-1 text-sm font-medium',
              getTrendColor(trend.direction)
            )}>
              <TrendIcon className="w-4 h-4" />
              <span>{Math.abs(trend.value)}%</span>
            </div>
            <span className="text-sm text-slate-500 ml-2">
              {trend.label}
            </span>
          </div>
        )}

        {/* Progress Indicator */}
        {progress && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">
                Progress
              </span>
              <span className="text-sm font-medium text-slate-900">
                {progress.value} / {progress.max}
              </span>
            </div>
            <div className="risk-progress h-2">
              <div 
                className={cn(
                  'risk-progress-bar h-full',
                  getProgressColor(progress.color)
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
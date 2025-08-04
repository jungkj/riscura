'use client';

import React, { FC } from 'react';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  showScore?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  className?: string;
}

const riskConfig = {
  low: {
    label: 'LOW',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    outlineClassName: 'text-green-700 border-green-300 hover:bg-green-50',
    minimalClassName: 'text-green-700',
    pulseColor: 'bg-green-400'
  },
  medium: {
    label: 'MEDIUM', 
    icon: AlertCircle,
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
    outlineClassName: 'text-yellow-800 border-yellow-400 hover:bg-yellow-50',
    minimalClassName: 'text-yellow-800',
    pulseColor: 'bg-yellow-400'
  },
  high: {
    label: 'HIGH',
    icon: AlertTriangle,
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    outlineClassName: 'text-red-700 border-red-300 hover:bg-red-50',
    minimalClassName: 'text-red-700',
    pulseColor: 'bg-red-400'
  },
  critical: {
    label: 'CRITICAL',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 shadow-sm',
    outlineClassName: 'text-red-800 border-red-400 hover:bg-red-50',
    minimalClassName: 'text-red-800',
    pulseColor: 'bg-red-500'
  }
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'w-3 h-3',
    pulse: 'w-1.5 h-1.5'
  },
  md: {
    badge: 'px-2.5 py-1 text-xs',
    icon: 'w-3.5 h-3.5',
    pulse: 'w-2 h-2'
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    pulse: 'w-2.5 h-2.5'
  }
};

export const RiskBadge: FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  showScore = false,
  animated = true,
  size = 'md',
  variant = 'default',
  className
}) => {
  const config = riskConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const getVariantClassName = () => {
    switch (variant) {
      case 'outline':
        return `border-2 bg-transparent ${config.outlineClassName}`;
      case 'minimal':
        return `bg-transparent border-none ${config.minimalClassName}`;
      default:
        return config.className;
    }
  };

  return (
    <DaisyBadge 
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold tracking-wide border transition-all duration-200',
        sizeStyles.badge,
        getVariantClassName(),
        animated && 'hover:scale-105 hover:shadow-sm',
        'relative overflow-hidden',
        className
      )} >
  {/* Animated pulse indicator for critical risks */}
</DaisyBadge>
      {level === 'critical' && animated && (
        <div className="absolute -top-1 -right-1 opacity-75">
          <div className={cn(
            'absolute rounded-full animate-ping',
            sizeStyles.pulse,
            config.pulseColor
          )} />
        </div>
      )}
      
      {Boolean(showIcon) && <Icon className={sizeStyles.icon} />}
      <span>{config.label}</span>
      {Boolean(showScore) && score !== undefined && (
        <span className="font-bold">
          ({score})
        </span>
      )}
    </DaisyBadge>
  );
};

// Utility function to get risk level from score
export const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}; 
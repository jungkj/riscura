'use client';

import { FC } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  showScore?: boolean;
  animated?: boolean;
  className?: string;
}

const riskConfig = {
  low: {
    label: 'Low',
    icon: CheckCircle,
    className: 'risk-badge-low',
    pulseColor: 'bg-emerald-400'
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    className: 'risk-badge-medium',
    pulseColor: 'bg-amber-400'
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    className: 'risk-badge-high',
    pulseColor: 'bg-orange-400'
  },
  critical: {
    label: 'Critical',
    icon: XCircle,
    className: 'risk-badge-critical',
    pulseColor: 'bg-red-400'
  }
};

export const RiskBadge: FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  showScore = false,
  animated = true,
  className
}) => {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        'border',
        config.className,
        'relative overflow-hidden font-medium',
        animated && 'transition-all duration-200 hover:scale-105',
        className
      )}
    >
      {/* Animated pulse indicator for critical risks */}
      {level === 'critical' && animated && (
        <div className="absolute inset-0 opacity-20">
          <div className={cn(
            'absolute w-2 h-2 rounded-full animate-ping',
            config.pulseColor
          )} />
        </div>
      )}
      
      <div className="flex items-center space-x-1.5">
        {showIcon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {config.label}
        </span>
        {showScore && score !== undefined && (
          <span className="text-xs font-bold">
            ({score})
          </span>
        )}
      </div>
    </Badge>
  );
};

// Utility function to get risk level from score
export const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}; 
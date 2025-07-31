'use client';

import React from 'react';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Info,
  AlertCircle,
  Minus,
  Shield,
  Target,
  Activity,
} from 'lucide-react';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'compliant'
  | 'non-compliant'
  | 'in-progress'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'not-started'
  | 'deactivated';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  description?: string;
  showIcon?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'outline';
  className?: string;
  ariaLabel?: string;
  id?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: '#2E7D32',
    bgColor: '#E8F5E8',
    borderColor: '#C8E6C9',
    semanticLabel: 'Success',
    ariaLabel: 'Status: Success',
  },
  warning: {
    icon: AlertTriangle,
    color: '#F57C00',
    bgColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    semanticLabel: 'Warning',
    ariaLabel: 'Status: Warning - Attention required',
  },
  error: {
    icon: XCircle,
    color: '#D32F2F',
    bgColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    semanticLabel: 'Error',
    ariaLabel: 'Status: Error - Action required',
  },
  info: {
    icon: Info,
    color: '#1976D2',
    bgColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    semanticLabel: 'Information',
    ariaLabel: 'Status: Information',
  },
  neutral: {
    icon: Minus,
    color: '#616161',
    bgColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    semanticLabel: 'Neutral',
    ariaLabel: 'Status: Neutral',
  },
  compliant: {
    icon: Shield,
    color: '#2E7D32',
    bgColor: '#E8F5E8',
    borderColor: '#C8E6C9',
    semanticLabel: 'Compliant',
    ariaLabel: 'Compliance Status: Compliant',
  },
  'non-compliant': {
    icon: AlertCircle,
    color: '#D32F2F',
    bgColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    semanticLabel: 'Non-Compliant',
    ariaLabel: 'Compliance Status: Non-Compliant - Immediate attention required',
  },
  'in-progress': {
    icon: Activity,
    color: '#1976D2',
    bgColor: '#E3F2FD',
    borderColor: '#BBDEFB',
    semanticLabel: 'In Progress',
    ariaLabel: 'Status: In Progress',
  },
  pending: {
    icon: Clock,
    color: '#F57C00',
    bgColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    semanticLabel: 'Pending',
    ariaLabel: 'Status: Pending review',
  },
  overdue: {
    icon: AlertTriangle,
    color: '#D32F2F',
    bgColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    semanticLabel: 'Overdue',
    ariaLabel: 'Status: Overdue - Urgent action required',
  },
  completed: {
    icon: CheckCircle,
    color: '#2E7D32',
    bgColor: '#E8F5E8',
    borderColor: '#C8E6C9',
    semanticLabel: 'Completed',
    ariaLabel: 'Status: Completed',
  },
  'not-started': {
    icon: Minus,
    color: '#616161',
    bgColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    semanticLabel: 'Not Started',
    ariaLabel: 'Status: Not Started',
  },
  deactivated: {
    icon: Minus,
    color: '#9E9E9E',
    bgColor: '#FAFAFA',
    borderColor: '#E0E0E0',
    semanticLabel: 'Deactivated',
    ariaLabel: 'Status: Deactivated',
  },
};

const sizeConfig = {
  sm: {
    iconSize: 'w-3 h-3',
    padding: 'px-2 py-1',
    fontSize: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    iconSize: 'w-4 h-4',
    padding: 'px-3 py-1.5',
    fontSize: 'text-sm',
    gap: 'gap-2',
  },
  lg: {
    iconSize: 'w-5 h-5',
    padding: 'px-4 py-2',
    fontSize: 'text-base',
    gap: 'gap-2',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  description,
  showIcon = true,
  showBadge = true,
  size = 'md',
  variant = 'default',
  className = '',
  ariaLabel,
  id,
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;

  const getVariantStyles = () => {
    switch (variant) {
      case 'subtle':
        return {
          backgroundColor: config.bgColor,
          color: config.color,
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: config.color,
          border: `1px solid ${config.color}`,
        };
      default:
        return {
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.borderColor}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  if (showBadge) {
    return (
      <DaisyBadge
        className={`
          inline-flex items-center font-medium rounded-md transition-colors
          ${sizeStyles.padding} ${sizeStyles.fontSize} ${sizeStyles.gap}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          ${className}
        `}
        style={variantStyles}
        aria-label={ariaLabel || config.ariaLabel}
        role="status"
        id={id}
      >
        {showIcon && (
          <>
            <IconComponent className={`${sizeStyles.iconSize} flex-shrink-0`} aria-hidden="true" />
            <span className="sr-only">{config.semanticLabel}:</span>
          </>
        )}
        <span>{label}</span>
        {description && <span className="sr-only">. {description}</span>}
      </DaisyBadge>
    );
  }

  // Non-badge version for more flexible layouts
  return (
    <div
      className={`
        inline-flex items-center font-medium
        ${sizeStyles.gap} ${sizeStyles.fontSize}
        ${className}
      `}
      style={{ color: config.color }}
      aria-label={ariaLabel || config.ariaLabel}
      role="status"
      id={id}
    >
      {showIcon && (
        <>
          <IconComponent className={`${sizeStyles.iconSize} flex-shrink-0`} aria-hidden="true" />
          <span className="sr-only">{config.semanticLabel}:</span>
        </>
      )}
      <span>{label}</span>
      {description && <span className="sr-only">. {description}</span>}
    </div>
  );
};

// Specialized status indicators for common use cases
export const ComplianceStatusIndicator: React.FC<{
  status: 'compliant' | 'non-compliant' | 'in-progress' | 'pending';
  framework?: string;
  score?: number;
  className?: string;
}> = ({ status, framework, score, className }) => {
  const getLabel = () => {
    if (score !== undefined) {
      return `${score}%`;
    }
    return statusConfig[status].semanticLabel;
  };

  const getDescription = () => {
    let desc = '';
    if (framework) desc += `${framework} compliance`;
    if (score !== undefined) desc += ` score: ${score}%`;
    return desc;
  };

  return (
    <StatusIndicator
      status={status}
      label={getLabel()}
      description={getDescription()}
      className={className}
      ariaLabel={`${framework || 'Compliance'} status: ${statusConfig[status].semanticLabel}${score ? ` with score ${score}%` : ''}`}
    />
  );
};

export const RiskStatusIndicator: React.FC<{
  level: 'critical' | 'high' | 'medium' | 'low';
  score?: number;
  title?: string;
  className?: string;
}> = ({ level, score, title, className }) => {
  const riskStatusMap = {
    critical: 'error' as StatusType,
    high: 'warning' as StatusType,
    medium: 'info' as StatusType,
    low: 'success' as StatusType,
  };

  const getLabel = () => {
    if (score !== undefined) {
      return `${score}`;
    }
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getDescription = () => {
    let desc = `${level} risk level`;
    if (title) desc += ` for ${title}`;
    if (score !== undefined) desc += ` with score ${score}`;
    return desc;
  };

  return (
    <StatusIndicator
      status={riskStatusMap[level]}
      label={getLabel()}
      description={getDescription()}
      className={className}
      ariaLabel={`Risk level: ${level}${score ? ` with score ${score}` : ''}${title ? ` for ${title}` : ''}`}
    />
  );
};

export const TaskStatusIndicator: React.FC<{
  status: 'completed' | 'in-progress' | 'pending' | 'overdue' | 'not-started';
  dueDate?: Date;
  assignee?: string;
  className?: string;
}> = ({ status, dueDate, assignee, className }) => {
  const getDescription = () => {
    let desc = `Task status: ${statusConfig[status].semanticLabel}`;
    if (assignee) desc += `, assigned to ${assignee}`;
    if (dueDate) {
      const isOverdue = status === 'overdue' || (new Date() > dueDate && status !== 'completed');
      desc += `, due ${dueDate.toLocaleDateString()}`;
      if (isOverdue) desc += ' (overdue)';
    }
    return desc;
  };

  return (
    <StatusIndicator
      status={status}
      label={statusConfig[status].semanticLabel}
      description={getDescription()}
      className={className}
    />
  );
};

// High contrast mode support
export const HighContrastStatusIndicator: React.FC<StatusIndicatorProps> = (props) => {
  return (
    <div className="high-contrast">
      <StatusIndicator {...props} variant="outline" />
    </div>
  );
};

export default StatusIndicator;

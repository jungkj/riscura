'use client';

import React from 'react';
import { designTokens } from '@/lib/design-system/tokens';
import {
  ActionIcons,
  FileIcons,
  StatusIcons,
  DataIcons,
  UserIcons,
  RiskManagementIcons,
} from '@/components/icons/IconLibrary';

// Base empty state component
interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`text-center ${classes.container} ${className}`}>
      <div className={`flex flex-col items-center ${classes.spacing}`}>
        {/* Illustration or Icon */}
        {illustration ? (
          <div className="mb-2">{illustration}</div>
        ) : Icon ? (
          <div className={`${classes.icon} text-gray-400 mb-2`}>
            <Icon size="xl" color="tertiary" />
          </div>
        ) : null}

        {/* Content */}
        <div className={classes.spacing}>
          <h3 className={`font-semibold text-gray-900 ${classes.title}`}>{title}</h3>
          {description && (
            <p className={`text-gray-600 max-w-md mx-auto ${classes.description}`}>{description}</p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <button
                onClick={action.onClick}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  action.variant === 'secondary'
                    ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple illustration components
const SimpleIllustration: React.FC<{
  type: 'folder' | 'document' | 'chart' | 'search' | 'shield' | 'users' | 'settings';
  className?: string;
}> = ({ type, className = '' }) => {
  const illustrations = {
    folder: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
      </svg>
    ),
    document: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
      </svg>
    ),
    chart: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M22,21H2V3H4V19H6V17H10V19H12V16H16V19H18V17H22V21Z" />
      </svg>
    ),
    search: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    ),
    shield: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z" />
      </svg>
    ),
    users: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4M16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14M8.5 4C10.7 4 12.5 5.8 12.5 8S10.7 12 8.5 12 4.5 10.2 4.5 8 6.3 4 8.5 4M8.5 14C12.9 14 16.5 15.8 16.5 18V20H0V18C0 15.8 4.1 14 8.5 14Z" />
      </svg>
    ),
    settings: (
      <svg
        className={`w-24 h-24 text-gray-300 ${className}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
      </svg>
    ),
  };

  return illustrations[type] || null;
};

// Predefined empty states for common scenarios
export const EmptyStates = {
  // No data/results
  NoData: ({
    title = 'No data available',
    description = "There's no data to display at the moment.",
    onRefresh,
    className = '',
  }: {
    title?: string;
    description?: string;
    onRefresh?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={DataIcons.BarChart3}
      title={title}
      description={description}
      action={
        onRefresh
          ? {
              label: 'Refresh',
              onClick: onRefresh,
              variant: 'secondary',
            }
          : undefined
      }
      className={className}
    />
  ),

  // No search results
  NoSearchResults: ({
    searchTerm,
    onClearSearch,
    className = '',
  }: {
    searchTerm?: string;
    onClearSearch?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="search" />}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`
          : "We couldn't find any results. Try adjusting your search terms."
      }
      action={
        onClearSearch
          ? {
              label: 'Clear search',
              onClick: onClearSearch,
              variant: 'secondary',
            }
          : undefined
      }
      className={className}
    />
  ),

  // Empty folder/directory
  EmptyFolder: ({
    title = 'This folder is empty',
    description = 'Add files or create new folders to get started.',
    onAddFile,
    onCreateFolder,
    className = '',
  }: {
    title?: string;
    description?: string;
    onAddFile?: () => void;
    onCreateFolder?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="folder" />}
      title={title}
      description={description}
      action={
        onAddFile
          ? {
              label: 'Add file',
              onClick: onAddFile,
            }
          : undefined
      }
      secondaryAction={
        onCreateFolder
          ? {
              label: 'Create folder',
              onClick: onCreateFolder,
            }
          : undefined
      }
      className={className}
    />
  ),

  // No documents
  NoDocuments: ({
    title = 'No documents found',
    description = 'Upload or create your first document to get started.',
    onUpload,
    onCreate,
    className = '',
  }: {
    title?: string;
    description?: string;
    onUpload?: () => void;
    onCreate?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="document" />}
      title={title}
      description={description}
      action={
        onUpload
          ? {
              label: 'Upload document',
              onClick: onUpload,
            }
          : undefined
      }
      secondaryAction={
        onCreate
          ? {
              label: 'Create new',
              onClick: onCreate,
            }
          : undefined
      }
      className={className}
    />
  ),

  // No users
  NoUsers: ({
    title = 'No users found',
    description = 'Invite team members to start collaborating.',
    onInvite,
    className = '',
  }: {
    title?: string;
    description?: string;
    onInvite?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="users" />}
      title={title}
      description={description}
      action={
        onInvite
          ? {
              label: 'Invite users',
              onClick: onInvite,
            }
          : undefined
      }
      className={className}
    />
  ),

  // No notifications
  NoNotifications: ({
    title = 'No notifications',
    description = "You're all caught up! New notifications will appear here.",
    className = '',
  }: {
    title?: string;
    description?: string;
    className?: string;
  }) => (
    <EmptyState
      icon={StatusIcons.CheckCircle}
      title={title}
      description={description}
      className={className}
      size="sm"
    />
  ),

  // Access denied
  AccessDenied: ({
    title = 'Access denied',
    description = "You don't have permission to view this content.",
    onRequestAccess,
    className = '',
  }: {
    title?: string;
    description?: string;
    onRequestAccess?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={UserIcons.Lock}
      title={title}
      description={description}
      action={
        onRequestAccess
          ? {
              label: 'Request access',
              onClick: onRequestAccess,
              variant: 'secondary',
            }
          : undefined
      }
      className={className}
    />
  ),

  // Error state
  Error: ({
    title = 'Something went wrong',
    description = 'We encountered an error while loading this content.',
    onRetry,
    onReport,
    className = '',
  }: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    onReport?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={StatusIcons.XCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
            }
          : undefined
      }
      secondaryAction={
        onReport
          ? {
              label: 'Report issue',
              onClick: onReport,
            }
          : undefined
      }
      className={className}
    />
  ),

  // Offline state
  Offline: ({
    title = "You're offline",
    description = 'Check your internet connection and try again.',
    onRetry,
    className = '',
  }: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={StatusIcons.AlertCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: 'Retry',
              onClick: onRetry,
              variant: 'secondary',
            }
          : undefined
      }
      className={className}
    />
  ),

  // Risk Management specific empty states
  NoRisks: ({
    title = 'No risks identified',
    description = 'Start by conducting a risk assessment to identify potential risks.',
    onStartAssessment,
    className = '',
  }: {
    title?: string;
    description?: string;
    onStartAssessment?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={UserIcons.Shield}
      title={title}
      description={description}
      action={
        onStartAssessment
          ? {
              label: 'Start risk assessment',
              onClick: onStartAssessment,
            }
          : undefined
      }
      className={className}
    />
  ),

  NoCompliance: ({
    title = 'No compliance data',
    description = 'Set up compliance frameworks to start monitoring your compliance status.',
    onSetupFramework,
    className = '',
  }: {
    title?: string;
    description?: string;
    onSetupFramework?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={FileIcons.File}
      title={title}
      description={description}
      action={
        onSetupFramework
          ? {
              label: 'Setup framework',
              onClick: onSetupFramework,
            }
          : undefined
      }
      className={className}
    />
  ),

  NoAudits: ({
    title = 'No audits scheduled',
    description = 'Schedule your first audit to ensure compliance with your frameworks.',
    onScheduleAudit,
    className = '',
  }: {
    title?: string;
    description?: string;
    onScheduleAudit?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={FileIcons.File}
      title={title}
      description={description}
      action={
        onScheduleAudit
          ? {
              label: 'Schedule audit',
              onClick: onScheduleAudit,
            }
          : undefined
      }
      className={className}
    />
  ),

  NoReports: ({
    title = 'No reports generated',
    description = 'Generate your first report to track your risk management progress.',
    onGenerateReport,
    className = '',
  }: {
    title?: string;
    description?: string;
    onGenerateReport?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="chart" />}
      title={title}
      description={description}
      action={
        onGenerateReport
          ? {
              label: 'Generate report',
              onClick: onGenerateReport,
            }
          : undefined
      }
      className={className}
    />
  ),

  // Configuration/Setup states
  NotConfigured: ({
    title = 'Setup required',
    description = 'Complete the initial setup to start using this feature.',
    onStartSetup,
    className = '',
  }: {
    title?: string;
    description?: string;
    onStartSetup?: () => void;
    className?: string;
  }) => (
    <EmptyState
      illustration={<SimpleIllustration type="settings" />}
      title={title}
      description={description}
      action={
        onStartSetup
          ? {
              label: 'Start setup',
              onClick: onStartSetup,
            }
          : undefined
      }
      className={className}
    />
  ),

  // Coming soon state
  ComingSoon: ({
    title = 'Coming soon',
    description = 'This feature is currently in development and will be available soon.',
    onNotifyMe,
    className = '',
  }: {
    title?: string;
    description?: string;
    onNotifyMe?: () => void;
    className?: string;
  }) => (
    <EmptyState
      icon={StatusIcons.Info}
      title={title}
      description={description}
      action={
        onNotifyMe
          ? {
              label: 'Notify me',
              onClick: onNotifyMe,
              variant: 'secondary',
            }
          : undefined
      }
      className={className}
    />
  ),

  // Maintenance state
  Maintenance: ({
    title = 'Under maintenance',
    description = 'This feature is temporarily unavailable while we perform maintenance.',
    className = '',
  }: {
    title?: string;
    description?: string;
    className?: string;
  }) => (
    <EmptyState
      icon={ActionIcons.Settings}
      title={title}
      description={description}
      className={className}
    />
  ),
};

// Empty state wrapper for conditional rendering
export const ConditionalEmptyState: React.FC<{
  condition: boolean;
  emptyState: React.ReactNode;
  children: React.ReactNode;
}> = ({ condition, emptyState, children }) => {
  return condition ? <>{emptyState}</> : <>{children}</>;
};

// Empty state with custom illustration
export const CustomEmptyState: React.FC<{
  illustration: React.ReactNode;
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
}> = ({ illustration, title, description, actions, className = '' }) => (
  <div className={`text-center py-12 ${className}`}>
    <div className="flex flex-col items-center space-y-4">
      <div className="mb-2">{illustration}</div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-base text-gray-600 max-w-md mx-auto">{description}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                action.variant === 'secondary'
                  ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                  : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default {
  EmptyState,
  EmptyStates,
  ConditionalEmptyState,
  CustomEmptyState,
  SimpleIllustration,
};

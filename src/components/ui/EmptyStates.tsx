import React from 'react';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useAnimation } from '../../lib/animations/AnimationUtils';
import { AriaUtils } from '../../lib/accessibility/AccessibilityUtils';

// Empty state types
export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  actions?: EmptyStateAction[];
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Base empty state component
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  illustration,
  actions = [],
  className = '',
  animated = true,
  size = 'md'
}) => {
  const { getColor, getSpacing, getBorderRadius, getFontSize } = useTheme();
  const animationRef = useAnimation('fadeInUp', animated) as React.RefObject<HTMLDivElement>;
  const titleId = React.useMemo(() => AriaUtils.generateId('empty-title'), []);
  const descId = React.useMemo(() => AriaUtils.generateId('empty-desc'), []);

  const sizeConfig = {
    sm: {
      container: { padding: getSpacing('lg') },
      icon: { fontSize: '48px' },
      title: { fontSize: getFontSize('lg')[0] },
      description: { fontSize: getFontSize('sm')[0] },
      gap: getSpacing('sm')
    },
    md: {
      container: { padding: getSpacing('xl') },
      icon: { fontSize: '64px' },
      title: { fontSize: getFontSize('xl')[0] },
      description: { fontSize: getFontSize('base')[0] },
      gap: getSpacing('md')
    },
    lg: {
      container: { padding: getSpacing('2xl') },
      icon: { fontSize: '96px' },
      title: { fontSize: getFontSize('2xl')[0] },
      description: { fontSize: getFontSize('lg')[0] },
      gap: getSpacing('lg')
    }
  };

  const config = sizeConfig[size];

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      ...config.container,
      gap: config.gap,
      minHeight: '200px'
    },
    icon: {
      ...config.icon,
      color: getColor('text.muted'),
      marginBottom: getSpacing('sm')
    },
    illustration: {
      maxWidth: '200px',
      maxHeight: '200px',
      marginBottom: getSpacing('md')
    },
    title: {
      ...config.title,
      fontWeight: '600',
      color: getColor('text.primary'),
      margin: 0,
      marginBottom: getSpacing('xs')
    },
    description: {
      ...config.description,
      color: getColor('text.secondary'),
      margin: 0,
      maxWidth: '400px',
      lineHeight: '1.5'
    },
    actions: {
      display: 'flex',
      gap: getSpacing('sm'),
      marginTop: getSpacing('md'),
      flexWrap: 'wrap' as const,
      justifyContent: 'center'
    },
    button: {
      padding: `${getSpacing('sm')} ${getSpacing('md')}`,
      borderRadius: getBorderRadius('md'),
      border: 'none',
      cursor: 'pointer',
      fontSize: getFontSize('sm')[0],
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: getSpacing('xs')
    },
    primaryButton: {
      backgroundColor: getColor('primary.500'),
      color: getColor('text.inverse')
    },
    secondaryButton: {
      backgroundColor: getColor('background.secondary'),
      color: getColor('text.primary'),
      border: `1px solid ${getColor('border.primary')}`
    }
  };

  return (
    <div
      ref={animationRef}
      className={className}
      style={styles.container}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      {illustration && (
        <div style={styles.illustration} aria-hidden="true">
          {illustration}
        </div>
      )}
      
      {icon && !illustration && (
        <div style={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}

      <h2 id={titleId} style={styles.title}>
        {title}
      </h2>

      {description && (
        <p id={descId} style={styles.description}>
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div style={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              style={{
                ...styles.button,
                ...(action.variant === 'primary' ? styles.primaryButton : styles.secondaryButton)
              }}
              aria-label={action.label}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// No data empty state
export interface NoDataProps {
  entity: string;
  onAdd?: () => void;
  onImport?: () => void;
  className?: string;
}

export const NoData: React.FC<NoDataProps> = ({
  entity,
  onAdd,
  onImport,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onAdd) {
    actions.push({
      label: `Add ${entity}`,
      onClick: onAdd,
      variant: 'primary',
      icon: '+'
    });
  }
  
  if (onImport) {
    actions.push({
      label: `Import ${entity}`,
      onClick: onImport,
      variant: 'secondary',
      icon: '📥'
    });
  }

  return (
    <EmptyState
      title={`No ${entity} Found`}
      description={`You haven't created any ${entity.toLowerCase()} yet. Get started by adding your first ${entity.toLowerCase()}.`}
      icon="📋"
      actions={actions}
      className={className}
    />
  );
};

// No search results
export interface NoSearchResultsProps {
  query: string;
  onClear?: () => void;
  onRefine?: () => void;
  className?: string;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  query,
  onClear,
  onRefine,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onClear) {
    actions.push({
      label: 'Clear Search',
      onClick: onClear,
      variant: 'primary',
      icon: '×'
    });
  }
  
  if (onRefine) {
    actions.push({
      label: 'Refine Search',
      onClick: onRefine,
      variant: 'secondary',
      icon: '🔍'
    });
  }

  return (
    <EmptyState
      title="No Results Found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms or clearing the search.`}
      icon="🔍"
      actions={actions}
      className={className}
    />
  );
};

// No permissions
export interface NoPermissionsProps {
  resource: string;
  onRequestAccess?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const NoPermissions: React.FC<NoPermissionsProps> = ({
  resource,
  onRequestAccess,
  onGoBack,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onRequestAccess) {
    actions.push({
      label: 'Request Access',
      onClick: onRequestAccess,
      variant: 'primary',
      icon: '🔑'
    });
  }
  
  if (onGoBack) {
    actions.push({
      label: 'Go Back',
      onClick: onGoBack,
      variant: 'secondary',
      icon: '←'
    });
  }

  return (
    <EmptyState
      title="Access Denied"
      description={`You don't have permission to view ${resource}. Contact your administrator to request access.`}
      icon="🔒"
      actions={actions}
      className={className}
    />
  );
};

// Offline state
export interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  onRetry,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onRetry) {
    actions.push({
      label: 'Try Again',
      onClick: onRetry,
      variant: 'primary',
      icon: '↻'
    });
  }

  return (
    <EmptyState
      title="You're Offline"
      description="It looks like you're not connected to the internet. Some features may not be available."
      icon="📡"
      actions={actions}
      className={className}
    />
  );
};

// Coming soon state
export interface ComingSoonProps {
  feature: string;
  onNotify?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  feature,
  onNotify,
  onGoBack,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onNotify) {
    actions.push({
      label: 'Notify Me',
      onClick: onNotify,
      variant: 'primary',
      icon: '🔔'
    });
  }
  
  if (onGoBack) {
    actions.push({
      label: 'Go Back',
      onClick: onGoBack,
      variant: 'secondary',
      icon: '←'
    });
  }

  return (
    <EmptyState
      title="Coming Soon"
      description={`${feature} is currently in development. We'll notify you when it's ready!`}
      icon="🚧"
      actions={actions}
      className={className}
    />
  );
};

// Loading failed state
export interface LoadingFailedProps {
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

export const LoadingFailed: React.FC<LoadingFailedProps> = ({
  onRetry,
  onReport,
  className
}) => {
  const actions: EmptyStateAction[] = [];
  
  if (onRetry) {
    actions.push({
      label: 'Retry',
      onClick: onRetry,
      variant: 'primary',
      icon: '↻'
    });
  }
  
  if (onReport) {
    actions.push({
      label: 'Report Issue',
      onClick: onReport,
      variant: 'secondary',
      icon: '🐛'
    });
  }

  return (
    <EmptyState
      title="Failed to Load"
      description="Something went wrong while loading the content. Please try again or report the issue."
      icon="⚠️"
      actions={actions}
      className={className}
    />
  );
};

// Empty inbox/notifications
export interface EmptyInboxProps {
  type: 'notifications' | 'messages' | 'inbox';
  onRefresh?: () => void;
  className?: string;
}

export const EmptyInbox: React.FC<EmptyInboxProps> = ({
  type,
  onRefresh,
  className
}) => {
  const typeConfig = {
    notifications: {
      title: 'No Notifications',
      description: 'You\'re all caught up! No new notifications at this time.',
      icon: '🔕'
    },
    messages: {
      title: 'No Messages',
      description: 'Your message inbox is empty. New messages will appear here.',
      icon: '💬'
    },
    inbox: {
      title: 'Inbox Empty',
      description: 'You\'re all caught up! No new items in your inbox.',
      icon: '📥'
    }
  };

  const config = typeConfig[type];
  const actions: EmptyStateAction[] = [];
  
  if (onRefresh) {
    actions.push({
      label: 'Refresh',
      onClick: onRefresh,
      variant: 'secondary',
      icon: '↻'
    });
  }

  return (
    <EmptyState
      title={config.title}
      description={config.description}
      icon={config.icon}
      actions={actions}
      className={className}
    />
  );
};

// First time setup
export interface FirstTimeSetupProps {
  feature: string;
  onGetStarted: () => void;
  onLearnMore?: () => void;
  className?: string;
}

export const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  feature,
  onGetStarted,
  onLearnMore,
  className
}) => {
  const actions: EmptyStateAction[] = [
    {
      label: 'Get Started',
      onClick: onGetStarted,
      variant: 'primary',
      icon: '🚀'
    }
  ];
  
  if (onLearnMore) {
    actions.push({
      label: 'Learn More',
      onClick: onLearnMore,
      variant: 'secondary',
      icon: '📖'
    });
  }

  return (
    <EmptyState
      title={`Welcome to ${feature}`}
      description={`Set up your ${feature.toLowerCase()} to get started. This will only take a few minutes.`}
      icon="✨"
      actions={actions}
      className={className}
      size="lg"
    />
  );
};

// Generic illustration component for custom empty states
export const EmptyStateIllustration: React.FC<{
  name: string;
  size?: number;
  color?: string;
}> = ({ name, size = 120, color = '#E5E5E5' }) => {
  const illustrations = {
    documents: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="20" y="15" width="60" height="80" rx="4" fill={color} />
        <rect x="40" y="25" width="20" height="2" fill="white" />
        <rect x="40" y="35" width="30" height="2" fill="white" />
        <rect x="40" y="45" width="25" height="2" fill="white" />
        <rect x="40" y="55" width="20" height="2" fill="white" />
      </svg>
    ),
    charts: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <rect x="10" y="80" width="15" height="25" fill={color} />
        <rect x="30" y="60" width="15" height="45" fill={color} />
        <rect x="50" y="40" width="15" height="65" fill={color} />
        <rect x="70" y="70" width="15" height="35" fill={color} />
        <rect x="90" y="50" width="15" height="55" fill={color} />
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="40" r="20" fill={color} />
        <path d="M20 100 C20 80, 40 70, 60 70 C80 70, 100 80, 100 100" fill={color} />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <circle cx="50" cy="50" r="25" stroke={color} strokeWidth="4" fill="none" />
        <path d="m70 70 20 20" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {illustrations[name as keyof typeof illustrations] || illustrations.documents}
    </div>
  );
}; 
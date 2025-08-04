'use client';

import React from 'react';
import { ChevronRight, Home, Shield, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRCSA } from '@/context/RCSAContext';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface RCSABreadcrumbProps {
  className?: string;
  showIcons?: boolean;
  maxItems?: number;
}

export const RCSABreadcrumb = ({
  className,
  showIcons = true,
  maxItems = 5,
}: RCSABreadcrumbProps) => {
  const { currentRisk, currentControl, navigationContext } = useRCSA();

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: showIcons ? Home : undefined,
      },
    ];

    // Build contextual breadcrumbs based on current state and navigation context
    if (currentRisk) {
      items.push(
        {
          label: 'Risk Management',
          href: '/risks',
          icon: showIcons ? BarChart3 : undefined,
        },
        {
          label: truncateText(currentRisk.title, 30),
          href: `/risks/${currentRisk.id}`,
          icon: showIcons ? Shield : undefined,
        }
      );

      // If we navigated to a control from this risk
      if (currentControl && navigationContext.fromEntity === 'risk') {
        items.push({
          label: `Control: ${truncateText(currentControl.title, 25)}`,
          current: true,
          icon: showIcons ? FileText : undefined,
        });
      }
    } else if (currentControl) {
      items.push(
        {
          label: 'Controls',
          href: '/controls',
          icon: showIcons ? Shield : undefined,
        },
        {
          label: truncateText(currentControl.title, 30),
          href: `/controls/${currentControl.id}`,
          icon: showIcons ? FileText : undefined,
        }
      );

      // If we navigated to this control from a risk
      if (navigationContext.fromEntity === 'risk' && navigationContext.fromId) {
        items.splice(-1, 0, {
          label: 'From Risk Analysis',
          href: `/risks/${navigationContext.fromId}`,
          icon: showIcons ? BarChart3 : undefined,
        });
      }
    }

    // Truncate breadcrumbs if they exceed maxItems
    if (items.length > maxItems) {
      const truncated = [
        items[0], // Always keep dashboard
        { label: '...', icon: undefined }, // Ellipsis indicator
        ...items.slice(-(maxItems - 2)), // Keep last few items
      ];
      return truncated;
    }

    return items;
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const breadcrumbs = buildBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if we're at the top level
  }

  return (
    <nav
      className={cn(
        'flex items-center space-x-2 text-sm text-muted-foreground mb-6 overflow-hidden',
        className
      )}
      aria-label="Breadcrumb navigation"
    >
      {breadcrumbs.map((item, index, array) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <div className="flex items-center space-x-2 min-w-0">
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="flex items-center space-x-1 hover:text-foreground transition-colors duration-200 truncate group"
                title={item.label} // Show full text on hover
              >
                {item.icon && (
                  <item.icon className="h-4 w-4 flex-shrink-0 group-hover:text-primary" />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <div
                className={cn(
                  'flex items-center space-x-1 truncate',
                  item.current && 'text-foreground font-medium'
                )}
                title={item.label}
              >
                {item.icon && (
                  <item.icon
                    className={cn('h-4 w-4 flex-shrink-0', item.current && 'text-primary')}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>
            )}
          </div>

          {/* Separator */}
          {index < array.length - 1 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Variant for mobile with simplified display
export const MobileRCSABreadcrumb = ({ className }: { className?: string }) => {
  const { currentRisk, currentControl, navigationContext } = useRCSA();

  const getCurrentContext = () => {
    if (currentRisk) {
      return {
        title: currentRisk.title,
        subtitle: 'Risk Analysis',
        backHref: '/risks',
        backLabel: 'Back to Risks',
      };
    }

    if (currentControl) {
      return {
        title: currentControl.title,
        subtitle: navigationContext.fromEntity === 'risk' ? 'Control (from Risk)' : 'Control',
        backHref:
          navigationContext.fromEntity === 'risk' && navigationContext.fromId
            ? `/risks/${navigationContext.fromId}`
            : '/controls',
        backLabel: navigationContext.fromEntity === 'risk' ? 'Back to Risk' : 'Back to Controls',
      };
    }

    return null;
  };

  const context = getCurrentContext();

  if (!context) return null;

  return (
    <div className={cn('mb-4', className)}>
      <Link
        href={context.backHref}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
        {context.backLabel}
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-foreground truncate">{context.title}</h1>
        <p className="text-sm text-muted-foreground">{context.subtitle}</p>
      </div>
    </div>
  );
};

// Context indicator component for showing relationship information
export const RCSAContextIndicator = ({ className }: { className?: string }) => {
  const { currentRisk, currentControl, navigationContext, getRelatedControls, getRelatedRisks } =
    useRCSA();

  if (!navigationContext.maintainContext) return null;

  const getContextInfo = () => {
    if (currentControl && navigationContext.fromEntity === 'risk' && navigationContext.fromId) {
      const relatedRisks = getRelatedRisks(currentControl.id);
      const sourceRisk = relatedRisks.find((r) => r.id === navigationContext.fromId);

      if (sourceRisk) {
        return {
          type: 'control-from-risk' as const,
          message: `This control mitigates "${sourceRisk.title}"`,
          actionHref: `/risks/${sourceRisk.id}`,
          actionLabel: 'View Risk Details',
        };
      }
    }

    if (currentRisk && navigationContext.fromEntity === 'control' && navigationContext.fromId) {
      const relatedControls = getRelatedControls(currentRisk.id);
      const sourceControl = relatedControls.find((c) => c.id === navigationContext.fromId);

      if (sourceControl) {
        return {
          type: 'risk-from-control' as const,
          message: `This risk is mitigated by "${sourceControl.title}"`,
          actionHref: `/controls/${sourceControl.id}`,
          actionLabel: 'View Control Details',
        };
      }
    }

    return null;
  };

  const contextInfo = getContextInfo();

  if (!contextInfo) return null;

  return (
    <div
      className={cn(
        'mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-sm text-blue-700 dark:text-blue-300">{contextInfo.message}</span>
        </div>
        <Link
          href={contextInfo.actionHref}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
        >
          {contextInfo.actionLabel}
        </Link>
      </div>
    </div>
  );
};

export default RCSABreadcrumb;

'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight, 
  Home, 
  MoreHorizontal,
  Plus,
  Download,
  Filter,
  Settings,
  Share,
  BookmarkPlus
} from 'lucide-react';
import Link from 'next/link';

// ========== TYPES ==========
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  current?: boolean;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  icon?: React.ComponentType<any>;
  shortcut?: string;
  disabled?: boolean;
}

export interface PageStats {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export interface MainContentAreaProps {
  children: ReactNode;
  
  // Header Configuration
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  
  // Actions
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  
  // Page Statistics
  stats?: PageStats[];
  
  // Layout Options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  headerSeparator?: boolean;
  contentPadding?: boolean;
  
  // Styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

// ========== BREADCRUMBS COMPONENT ==========
const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-enterprise-1 text-body-sm" aria-label="Breadcrumb">
      <Link 
        href="/dashboard" 
        className="text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="Dashboard home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-text-tertiary" />
          
          {item.href && !item.current ? (
            <Link 
              href={item.href}
              className="text-text-tertiary hover:text-text-primary transition-colors font-medium"
            >
              <div className="flex items-center space-x-enterprise-1">
                {item.icon && <item.icon className="h-3 w-3" />}
                <span>{item.label}</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center space-x-enterprise-1">
              {item.icon && <item.icon className="h-3 w-3 text-text-primary" />}
              <span className={cn(
                "font-medium",
                item.current ? "text-text-primary" : "text-text-tertiary"
              )}>
                {item.label}
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// ========== PAGE STATS COMPONENT ==========
const PageStats: React.FC<{ stats: PageStats[] }> = ({ stats }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'neutral': return '→';
      default: return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-semantic-success';
      case 'down': return 'text-semantic-error';
      case 'neutral': return 'text-text-tertiary';
      default: return 'text-text-tertiary';
    }
  };

  return (
    <div className="flex items-center space-x-enterprise-6">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center space-x-enterprise-2">
          <Badge 
            variant={stat.variant || 'outline'} 
            className="text-body-sm font-medium px-enterprise-3 py-enterprise-1"
          >
            {stat.value} {stat.label}
          </Badge>
          
          {stat.trend && stat.trendValue && (
            <div className={cn("flex items-center space-x-enterprise-1 text-caption", getTrendColor(stat.trend))}>
              <span>{getTrendIcon(stat.trend)}</span>
              <span>{stat.trendValue}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ========== ACTION BUTTONS COMPONENT ==========
const ActionButtons: React.FC<{ 
  primary?: ActionButton; 
  secondary?: ActionButton[] 
}> = ({ primary, secondary = [] }) => {
  return (
    <div className="flex items-center space-x-enterprise-3">
      {/* Secondary Actions */}
      {secondary.length > 0 && (
        <div className="flex items-center space-x-enterprise-2">
          {secondary.slice(0, 2).map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-button border-border hover:border-interactive-primary"
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-enterprise-1" />}
              {action.label}
            </Button>
          ))}
          
          {/* More Actions Dropdown */}
          {secondary.length > 2 && (
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:border-interactive-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Primary Action */}
      {primary && (
        <Button
          variant={primary.variant || 'default'}
          size="sm"
          onClick={primary.onClick}
          disabled={primary.disabled}
          className={cn(
            "text-button font-medium",
            primary.variant === 'default' && "bg-interactive-primary hover:bg-interactive-primary/90"
          )}
          title={primary.shortcut ? `${primary.label} (${primary.shortcut})` : primary.label}
        >
          {primary.icon && <primary.icon className="h-4 w-4 mr-enterprise-1" />}
          {primary.label}
        </Button>
      )}
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export const MainContentArea: React.FC<MainContentAreaProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  primaryAction,
  secondaryActions = [],
  stats = [],
  maxWidth = 'xl',
  headerSeparator = true,
  contentPadding = true,
  className,
  headerClassName,
  contentClassName,
}) => {
  const getMaxWidthClass = (width: string) => {
    switch (width) {
      case 'sm': return 'max-w-screen-sm';
      case 'md': return 'max-w-screen-md';
      case 'lg': return 'max-w-screen-lg';
      case 'xl': return 'max-w-screen-xl';
      case '2xl': return 'max-w-screen-2xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-screen-xl';
    }
  };

  return (
    <div className={cn("min-h-screen bg-surface-primary", className)}>
      {/* Page Header */}
      <header className={cn(
        "bg-white border-b border-border/50",
        headerSeparator && "shadow-notion-xs",
        headerClassName
      )}>
        <div className={cn(
          "mx-auto px-enterprise-6 py-enterprise-6",
          getMaxWidthClass(maxWidth)
        )}>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="mb-enterprise-4">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
          
          {/* Title and Actions */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-enterprise-4 mb-enterprise-2">
                <h1 className="page-title text-text-primary">
                  {title}
                </h1>
                
                {/* Page Stats */}
                {stats.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
                    <PageStats stats={stats} />
                  </>
                )}
              </div>
              
              {subtitle && (
                <p className="text-body-base text-text-secondary max-w-3xl">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {(primaryAction || secondaryActions.length > 0) && (
              <div className="flex-shrink-0 ml-enterprise-6">
                <ActionButtons 
                  primary={primaryAction} 
                  secondary={secondaryActions} 
                />
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className={cn(
        "mx-auto",
        getMaxWidthClass(maxWidth),
        contentPadding && "px-enterprise-6 py-enterprise-6",
        contentClassName
      )}>
        {children}
      </main>
    </div>
  );
};

// ========== CONTENT SECTION COMPONENT ==========
export interface ContentSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ActionButton;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
  spacing = 'normal'
}) => {
  const getSpacingClass = (spacing: string) => {
    switch (spacing) {
      case 'tight': return 'space-y-enterprise-4';
      case 'normal': return 'space-y-enterprise-6';
      case 'loose': return 'space-y-enterprise-8';
      default: return 'space-y-enterprise-6';
    }
  };

  return (
    <section className={cn(getSpacingClass(spacing), className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="section-title text-text-primary">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-body-sm text-text-secondary mt-enterprise-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {action && (
            <Button
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-button border-border hover:border-interactive-primary"
            >
              {action.icon && <action.icon className="h-4 w-4 mr-enterprise-1" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
      
      <div className={getSpacingClass(spacing)}>
        {children}
      </div>
    </section>
  );
};

// ========== CONTENT CARD COMPONENT ==========
export interface ContentCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ActionButton;
  footer?: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className,
  padding = 'md',
  hover = false
}) => {
  const getPaddingClass = (padding: string) => {
    switch (padding) {
      case 'sm': return 'p-enterprise-4';
      case 'md': return 'p-enterprise-6';
      case 'lg': return 'p-enterprise-8';
      default: return 'p-enterprise-6';
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-lg border border-border",
      hover && "hover:shadow-notion-md transition-shadow duration-200",
      className
    )}>
      {/* Card Header */}
      {(title || action) && (
        <div className={cn(
          "flex items-center justify-between border-b border-border",
          getPaddingClass(padding)
        )}>
          <div>
            {title && (
              <h3 className="card-title text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-body-sm text-text-secondary mt-enterprise-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {action && (
            <Button
              variant={action.variant || 'ghost'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="text-button"
            >
              {action.icon && <action.icon className="h-4 w-4 mr-enterprise-1" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className={getPaddingClass(padding)}>
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className={cn(
          "border-t border-border bg-surface-secondary",
          getPaddingClass(padding)
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default MainContentArea; 
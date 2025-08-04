'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import {
  ChevronRight,
  Home,
  MoreHorizontal,
  Plus,
  Download,
  Filter,
  Settings,
  Share,
  BookmarkPlus,
} from 'lucide-react';
import Link from 'next/link';

// ========== TYPES ==========
export interface BreadcrumbItem {
  label: string
  href?: string;
  icon?: React.ComponentType<any>;
  current?: boolean;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
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
  title: string
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];

  // Actions
  primaryAction?: ActionButton
  secondaryActions?: ActionButton[];

  // Page Statistics
  stats?: PageStats[]

  // Layout Options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  headerSeparator?: boolean;
  contentPadding?: boolean;

  // Styling
  className?: string
  headerClassName?: string;
  contentClassName?: string;
}

// ========== BREADCRUMBS COMPONENT ==========
const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Dashboard home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-gray-400" />

          {item.href && !item.current ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <div className="flex items-center space-x-1">
                {item.icon && <item.icon className="h-3 w-3" />}
                <span>{item.label}</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center space-x-1">
              {item.icon && <item.icon className="h-3 w-3 text-gray-900" />}
              <span className={cn('font-medium', item.current ? 'text-gray-900' : 'text-gray-500')}>
                {item.label}
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ========== PAGE STATS COMPONENT ==========
const PageStats: React.FC<{ stats: PageStats[] }> = ({ stats }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return null;
    }
  }

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  }

  return (
    <div className="flex items-center space-x-6">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center space-x-2">
          <DaisyBadge variant={stat.variant || 'outline'} className="text-sm font-medium px-3 py-1">
            {stat.value} {stat.label}
          </DaisyBadge>

          {stat.trend && stat.trendValue && (
            <div className={cn('flex items-center space-x-1 text-xs', getTrendColor(stat.trend))}>
              <span>{getTrendIcon(stat.trend)}</span>
              <span>{stat.trendValue}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ========== ACTION BUTTONS COMPONENT ==========
const ActionButtons: React.FC<{
  primary?: ActionButton
  secondary?: ActionButton[];
}> = ({ primary, secondary = [] }) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Secondary Actions */}
      {secondary.length > 0 && (
        <div className="flex items-center space-x-2">
          {secondary.slice(0, 2).map((action, index) => (
            <DaisyButton
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="border-gray-300 hover:border-[#199BEC]"
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DaisyButton>
          ))}

          {/* More Actions Dropdown */}
          {secondary.length > 2 && (
            <DaisyButton
              variant="outline"
              size="sm"
              className="border-gray-300 hover:border-[#199BEC]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DaisyButton>
          )}
        </div>
      )}

      {/* Primary Action */}
      {Boolean(primary) && (
        <DaisyButton
          variant={primary.variant || 'primary'}
          size="sm"
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="bg-[#199BEC] hover:bg-[#1785d1] text-white"
          title={primary.shortcut ? `${primary.label} (${primary.shortcut})` : primary.label}
        >
          {primary.icon && <primary.icon className="h-4 w-4 mr-2" />}
          {primary.label}
        </DaisyButton>
      )}
    </div>
  );
}

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
      case 'sm':
        return 'max-w-3xl'
      case 'md':
        return 'max-w-4xl';
      case 'lg':
        return 'max-w-5xl';
      case 'xl':
        return 'max-w-6xl';
      case '2xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-6xl';
    }
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className={cn('mx-auto', getMaxWidthClass(maxWidth))}>
        {/* Page Header */}
        <header className={cn('bg-white border-b border-gray-200 px-6 py-6', headerClassName)}>
          <div className="space-y-4 md:space-y-6">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

            {/* Title Section */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {Boolean(subtitle) && <p className="text-lg text-gray-600 max-w-2xl">{subtitle}</p>}
              </div>

              {/* Actions */}
              {(primaryAction || secondaryActions.length > 0) && (
                <ActionButtons primary={primaryAction} secondary={secondaryActions} />
              )}
            </div>

            {/* Stats */}
            {stats.length > 0 && (
              <div className="pt-4">
                <PageStats stats={stats} />
              </div>
            )}
          </div>

          {Boolean(headerSeparator) && <DaisySeparator className="mt-6" />}
        </header>

        {/* Content Area */}
        <main className={cn('bg-white', contentPadding ? 'p-6' : '', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ========== CONTENT SECTION COMPONENT ==========
export interface ContentSectionProps {
  children: ReactNode
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
  spacing = 'normal',
}) => {
  const getSpacingClass = (spacing: string) => {
    switch (spacing) {
      case 'tight':
        return 'space-y-4';
      case 'normal':
        return 'space-y-6 md:space-y-8';
      case 'loose':
        return 'space-y-8 md:space-y-10';
      default:
        return 'space-y-6 md:space-y-8';
    }
  }

  return (
    <section className={cn(getSpacingClass(spacing), className)}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {Boolean(title) && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
            {Boolean(subtitle) && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>

          {Boolean(action) && (
            <DaisyButton
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DaisyButton>
          )}
        </div>
      )}

      <div>{children}</div>
    </section>
  );
}

// ========== CONTENT CARD COMPONENT ==========
export interface ContentCardProps {
  children: ReactNode
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
  hover = false,
}) => {
  const getPaddingClass = (padding: string) => {
    switch (padding) {
      case 'sm':
        return 'p-4';
      case 'md':
        return 'p-6';
      case 'lg':
        return 'p-8';
      default:
        return 'p-6';
    }
  }

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-sm',
        hover && 'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {(title || subtitle || action) && (
        <div
          className={cn(
            'flex items-start justify-between border-b border-gray-100',
            getPaddingClass(padding),
            'pb-4'
          )}
        >
          <div className="space-y-1">
            {Boolean(title) && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {Boolean(subtitle) && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>

          {Boolean(action) && (
            <DaisyButton
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DaisyButton>
          )}
        </div>
      )}

      <div className={cn(getPaddingClass(padding), (title || subtitle || action) && 'pt-4')}>
        {children}
      </div>

      {Boolean(footer) && (
        <div className={cn('border-t border-gray-100', getPaddingClass(padding), 'pt-4')}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default MainContentArea;

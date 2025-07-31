'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  getHeadingClasses,
  getBodyClasses,
  getCaptionClasses,
  spacing,
  separators,
  backgrounds,
} from '@/lib/design-system/typography';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  gradient?: boolean;
  children: React.ReactNode;
}

interface BodyTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'large' | 'normal' | 'small' | 'tiny';
  children: React.ReactNode;
}

interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'label' | 'muted';
  children: React.ReactNode;
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  spacing?: 'large' | 'default' | 'small' | 'tight';
  separator?: 'subtle' | 'default' | 'prominent' | false;
  background?: 'subtle' | 'card' | 'highlight' | 'warning' | 'danger' | 'success' | false;
  children: React.ReactNode;
}

interface ContentGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'large' | 'default' | 'small' | 'tight';
  children: React.ReactNode;
}

// Enhanced Heading Component
export const EnhancedHeading: React.FC<HeadingProps> = ({
  level,
  gradient = false,
  className,
  children,
  ...props
}) => {
  const Component = level;
  const baseClasses = getHeadingClasses(level);

  const gradientClasses = gradient
    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent'
    : '';

  return (
    <Component className={cn(baseClasses, gradientClasses, className)} {...props}>
      {children}
    </Component>
  );
};

// Enhanced Body Text Component
export const EnhancedBodyText: React.FC<BodyTextProps> = ({
  variant = 'normal',
  className,
  children,
  ...props
}) => {
  const baseClasses = getBodyClasses(variant);

  return (
    <p className={cn(baseClasses, className)} {...props}>
      {children}
    </p>
  );
};

// Enhanced Caption Component
export const EnhancedCaption: React.FC<CaptionProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const baseClasses = getCaptionClasses(variant);

  return (
    <span className={cn(baseClasses, className)} {...props}>
      {children}
    </span>
  );
};

// Enhanced Section Component with proper hierarchy
export const EnhancedSection: React.FC<SectionProps> = ({
  title,
  subtitle,
  spacing: spacingVariant = 'default',
  separator = false,
  background = false,
  className,
  children,
  ...props
}) => {
  const spacingClasses = spacing.sections[spacingVariant];
  const separatorClasses = separator ? separators.section[separator] : '';
  const backgroundClasses = background ? backgrounds.sections[background] : '';

  return (
    <motion.section
      className={cn(
        spacingClasses,
        separatorClasses,
        backgroundClasses,
        background && 'rounded-lg p-6',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {(title || subtitle) && (
        <header className="mb-6">
          {title && (
            <EnhancedHeading level="h2" className="mb-2">
              {title}
            </EnhancedHeading>
          )}
          {subtitle && (
            <EnhancedBodyText variant="large" className="text-slate-600">
              {subtitle}
            </EnhancedBodyText>
          )}
        </header>
      )}
      {children}
    </motion.section>
  );
};

// Enhanced Content Group for better organization
export const EnhancedContentGroup: React.FC<ContentGroupProps> = ({
  spacing: spacingVariant = 'default',
  className,
  children,
  ...props
}) => {
  const spacingClasses = spacing.content[spacingVariant];

  return (
    <div className={cn(spacingClasses, className)} {...props}>
      {children}
    </div>
  );
};

// Enhanced Stats Display Component
interface StatsDisplayProps {
  stats: Array<{
    label: string;
    value: string | number;
    description?: string;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    icon?: React.ReactNode;
  }>;
  layout?: 'horizontal' | 'grid';
  className?: string;
}

export const EnhancedStatsDisplay: React.FC<StatsDisplayProps> = ({
  stats,
  layout = 'horizontal',
  className,
}) => {
  const layoutClasses =
    layout === 'grid'
      ? 'grid grid-cols-2 lg:grid-cols-4 gap-6'
      : 'flex items-center flex-wrap gap-6';

  const colorMap = {
    default: 'text-slate-700',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className={cn(layoutClasses, className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {stat.icon && (
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                stat.color === 'success' && 'bg-green-100',
                stat.color === 'warning' && 'bg-amber-100',
                stat.color === 'danger' && 'bg-red-100',
                stat.color === 'info' && 'bg-blue-100',
                !stat.color && 'bg-slate-100'
              )}
            >
              {stat.icon}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  colorMap[stat.color || 'default']
                )}
              >
                {stat.value}
              </span>
              <EnhancedCaption variant="label">{stat.label}</EnhancedCaption>
            </div>
            {stat.description && (
              <EnhancedCaption variant="muted">{stat.description}</EnhancedCaption>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  stats?: StatsDisplayProps['stats'];
  className?: string;
}

export const EnhancedPageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  stats,
  className,
}) => {
  return (
    <header className={cn('pb-8 border-b border-slate-200/60', className)}>
      {breadcrumbs && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2 text-slate-400">/</span>}
                <span
                  className={cn(
                    index === breadcrumbs.length - 1
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {crumb.label}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-3 flex-1">
          <EnhancedHeading level="h1" gradient>
            {title}
          </EnhancedHeading>

          {subtitle && (
            <EnhancedBodyText variant="large" className="text-slate-600 max-w-3xl">
              {subtitle}
            </EnhancedBodyText>
          )}

          {stats && (
            <div className="pt-2">
              <EnhancedStatsDisplay stats={stats} layout="horizontal" />
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
};

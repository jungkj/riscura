import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  layoutClasses,
  spacingClasses,
  responsiveSpacing,
  containers,
  spacing,
} from '@/lib/design-system/spacing';

// Enhanced Page Container
interface EnhancedPageContainerProps {
  children: React.ReactNode;
  maxWidth?: keyof typeof containers;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const EnhancedPageContainer: React.FC<EnhancedPageContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className = '',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4 md:p-6',
    md: 'p-4 md:p-6 lg:p-8',
    lg: 'p-6 md:p-8 lg:p-10',
    xl: 'p-8 md:p-10 lg:p-12',
  };

  const maxWidthClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    '3xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/30',
        paddingClasses[padding],
        className
      )}
    >
      <div className={cn('mx-auto w-full', maxWidthClasses[maxWidth])}>{children}</div>
    </div>
  );
};

// Enhanced Content Section
interface EnhancedContentSectionProps {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'relaxed' | 'loose';
  className?: string;
}

export const EnhancedContentSection: React.FC<EnhancedContentSectionProps> = ({
  children,
  spacing = 'normal',
  className = '',
}) => {
  const spacingClasses = {
    tight: 'space-y-4',
    normal: 'space-y-6 md:space-y-8',
    relaxed: 'space-y-8 md:space-y-10',
    loose: 'space-y-10 md:space-y-12',
  };

  return <div className={cn(spacingClasses[spacing], className)}>{children}</div>;
};

// Enhanced Grid Layout
interface EnhancedGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const EnhancedGrid: React.FC<EnhancedGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  responsive = true,
  className = '',
}) => {
  const getGridClasses = () => {
    if (!responsive) {
      return `grid grid-cols-${cols}`;
    }

    switch (cols) {
      case 1:
        return 'grid grid-cols-1';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case 6:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-10',
  };

  return <div className={cn(getGridClasses(), gapClasses[gap], className)}>{children}</div>;
};

// Enhanced Card Container
interface EnhancedCardContainerProps {
  children: React.ReactNode;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'tight' | 'normal' | 'relaxed';
  background?: 'white' | 'gray' | 'transparent';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const EnhancedCardContainer: React.FC<EnhancedCardContainerProps> = ({
  children,
  padding = 'md',
  spacing = 'normal',
  background = 'white',
  border = true,
  shadow = 'sm',
  rounded = 'md',
  className = '',
}) => {
  const paddingClasses = {
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    relaxed: 'space-y-6',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-slate-50',
    transparent: 'bg-transparent',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  };

  return (
    <div
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        spacingClasses[spacing],
        border && 'border border-slate-200',
        shadowClasses[shadow],
        roundedClasses[rounded],
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};

// Enhanced Flex Layout
interface EnhancedFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  responsive?: boolean;
  className?: string;
}

export const EnhancedFlex: React.FC<EnhancedFlexProps> = ({
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 'md',
  wrap = false,
  responsive = false,
  className = '',
}) => {
  const directionClasses = {
    row: responsive ? 'flex flex-col sm:flex-row' : 'flex flex-row',
    col: 'flex flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div
      className={cn(
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

// Enhanced Section Header
interface EnhancedSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  spacing?: 'tight' | 'normal' | 'relaxed';
  className?: string;
}

export const EnhancedSectionHeader: React.FC<EnhancedSectionHeaderProps> = ({
  title,
  subtitle,
  action,
  size = 'md',
  spacing = 'normal',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      title: 'text-lg font-semibold text-slate-900',
      subtitle: 'text-sm text-slate-600',
    },
    md: {
      title: 'text-xl font-semibold text-slate-900',
      subtitle: 'text-base text-slate-600',
    },
    lg: {
      title: 'text-2xl font-bold text-slate-900',
      subtitle: 'text-lg text-slate-600',
    },
  };

  const spacingClasses = {
    tight: 'mb-4',
    normal: 'mb-6',
    relaxed: 'mb-8',
  };

  return (
    <motion.div
      className={cn(spacingClasses[spacing], className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <EnhancedFlex justify="between" align="end" gap="md">
        <div className="space-y-1">
          <h2 className={sizeClasses[size].title}>{title}</h2>
          {subtitle && <p className={sizeClasses[size].subtitle}>{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </EnhancedFlex>
    </motion.div>
  );
};

// Enhanced Spacer
interface EnhancedSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  responsive?: boolean;
  className?: string;
}

export const EnhancedSpacer: React.FC<EnhancedSpacerProps> = ({
  size = 'md',
  responsive = true,
  className = '',
}) => {
  const spacerClasses = {
    xs: responsive ? 'h-2 md:h-3' : 'h-2',
    sm: responsive ? 'h-3 md:h-4' : 'h-3',
    md: responsive ? 'h-4 md:h-6' : 'h-4',
    lg: responsive ? 'h-6 md:h-8' : 'h-6',
    xl: responsive ? 'h-8 md:h-10' : 'h-8',
    '2xl': responsive ? 'h-10 md:h-12' : 'h-10',
    '3xl': responsive ? 'h-12 md:h-16' : 'h-12',
  };

  return <div className={cn(spacerClasses[size], className)} />;
};

// Enhanced Content Divider
interface EnhancedDividerProps {
  spacing?: 'tight' | 'normal' | 'relaxed';
  style?: 'line' | 'space' | 'gradient';
  className?: string;
}

export const EnhancedDivider: React.FC<EnhancedDividerProps> = ({
  spacing = 'normal',
  style = 'line',
  className = '',
}) => {
  const spacingClasses = {
    tight: 'my-4',
    normal: 'my-6 md:my-8',
    relaxed: 'my-8 md:my-10',
  };

  const styleClasses = {
    line: 'border-t border-slate-200',
    space: '',
    gradient: 'h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent',
  };

  if (style === 'space') {
    return <EnhancedSpacer size="lg" className={className} />;
  }

  return <div className={cn(spacingClasses[spacing], styleClasses[style], className)} />;
};

// Enhanced Two Column Layout
interface EnhancedTwoColumnProps {
  children: [React.ReactNode, React.ReactNode];
  ratio?: '1:1' | '2:1' | '1:2' | '3:1' | '1:3';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}

export const EnhancedTwoColumn: React.FC<EnhancedTwoColumnProps> = ({
  children,
  ratio = '1:1',
  gap = 'lg',
  responsive = true,
  className = '',
}) => {
  const ratioClasses = {
    '1:1': 'grid-cols-1 lg:grid-cols-2',
    '2:1': 'grid-cols-1 lg:grid-cols-3 [&>:first-child]:lg:col-span-2',
    '1:2': 'grid-cols-1 lg:grid-cols-3 [&>:last-child]:lg:col-span-2',
    '3:1': 'grid-cols-1 lg:grid-cols-4 [&>:first-child]:lg:col-span-3',
    '1:3': 'grid-cols-1 lg:grid-cols-4 [&>:last-child]:lg:col-span-3',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  };

  return (
    <div
      className={cn(
        'grid',
        responsive ? ratioClasses[ratio] : 'grid-cols-2',
        gapClasses[gap],
        className
      )}
    >
      {children[0]}
      {children[1]}
    </div>
  );
};

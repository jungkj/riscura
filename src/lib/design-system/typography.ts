/**
 * Typography Design System
 * Apple-inspired typography with 48px line spacing and Notion-like hierarchy
 * Provides consistent text styles, hierarchy, and spacing for the application
 */

export const typography = {
  // Heading Hierarchy (48px spacing based)
  headings: {
    h1: {
      size: 'text-4xl lg:text-5xl xl:text-6xl',
      weight: 'font-bold',
      tracking: 'tracking-tight',
      leading: 'leading-tight',
      color: 'text-slate-900',
      spacing: 'mb-12', // 48px Apple-like spacing
      lineHeight: '1.2',
    },
    h2: {
      size: 'text-2xl lg:text-3xl xl:text-4xl',
      weight: 'font-bold',
      tracking: 'tracking-tight',
      leading: 'leading-tight',
      color: 'text-slate-800',
      spacing: 'mb-8', // 32px spacing
      lineHeight: '1.25',
    },
    h3: {
      size: 'text-xl lg:text-2xl xl:text-3xl',
      weight: 'font-semibold',
      tracking: 'tracking-tight',
      leading: 'leading-snug',
      color: 'text-slate-800',
      spacing: 'mb-6', // 24px spacing
      lineHeight: '1.3',
    },
    h4: {
      size: 'text-lg lg:text-xl',
      weight: 'font-semibold',
      tracking: 'tracking-tight',
      leading: 'leading-normal',
      color: 'text-slate-700',
      spacing: 'mb-4', // 16px spacing
      lineHeight: '1.4',
    },
    h5: {
      size: 'text-base lg:text-lg',
      weight: 'font-semibold',
      tracking: 'tracking-normal',
      leading: 'leading-normal',
      color: 'text-slate-700',
      spacing: 'mb-3', // 12px spacing
      lineHeight: '1.5',
    },
    h6: {
      size: 'text-sm lg:text-base',
      weight: 'font-semibold',
      tracking: 'tracking-wide',
      leading: 'leading-normal',
      color: 'text-slate-600',
      spacing: 'mb-2', // 8px spacing
      lineHeight: '1.5',
    },
  },

  // Body Text Hierarchy
  body: {
    large: {
      size: 'text-lg',
      weight: 'font-normal',
      leading: 'leading-relaxed',
      color: 'text-slate-700',
    },
    normal: {
      size: 'text-base',
      weight: 'font-normal',
      leading: 'leading-normal',
      color: 'text-slate-700',
    },
    small: {
      size: 'text-sm',
      weight: 'font-normal',
      leading: 'leading-normal',
      color: 'text-slate-600',
    },
    tiny: {
      size: 'text-xs',
      weight: 'font-medium',
      leading: 'leading-normal',
      color: 'text-slate-500',
    },
  },

  // Specialized Text Styles
  captions: {
    default: {
      size: 'text-sm',
      weight: 'font-medium',
      color: 'text-slate-500',
      tracking: 'tracking-normal',
    },
    label: {
      size: 'text-xs',
      weight: 'font-semibold',
      color: 'text-slate-600',
      tracking: 'tracking-wide',
      transform: 'uppercase',
    },
    muted: {
      size: 'text-sm',
      weight: 'font-normal',
      color: 'text-slate-400',
      tracking: 'tracking-normal',
    },
  },

  // Interactive Text
  interactive: {
    link: {
      color: 'text-blue-600 hover:text-blue-700',
      weight: 'font-medium',
      decoration: 'hover:underline',
      transition: 'transition-colors duration-200',
    },
    button: {
      weight: 'font-semibold',
      tracking: 'tracking-normal',
    },
  },

  // Semantic Colors
  semantic: {
    primary: 'text-slate-900',
    secondary: 'text-slate-700',
    tertiary: 'text-slate-500',
    muted: 'text-slate-400',
    success: 'text-green-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  },
}

// Helper functions to combine typography styles
export const getHeadingClasses = (level: keyof typeof typography.headings) => {
  const heading = typography.headings[level]
  if (!heading) {
    // console.error(
    //   `Typography heading level "${level}" not found. Available levels:`,
    //   Object.keys(typography.headings)
    // );
    // Fallback to h2 styles
    const fallback = typography.headings.h2
    return `${fallback.size} ${fallback.weight} ${fallback.tracking} ${fallback.leading} ${fallback.color} ${fallback.spacing}`;
  }
  return `${heading.size} ${heading.weight} ${heading.tracking} ${heading.leading} ${heading.color} ${heading.spacing}`;
}

export const getBodyClasses = (variant: keyof typeof typography.body) => {
  const body = typography.body[variant];
  if (!body) {
    // console.error(
      `Typography body variant "${variant}" not found. Available variants:`,
      Object.keys(typography.body)
    )
    // Fallback to normal variant
    const fallback = typography.body.normal
    return `${fallback.size} ${fallback.weight} ${fallback.leading} ${fallback.color}`;
  }
  return `${body.size} ${body.weight} ${body.leading} ${body.color}`;
}

export const getCaptionClasses = (variant: keyof typeof typography.captions) => {
  const caption = typography.captions[variant];
  const transform = 'transform' in caption ? caption.transform : '';
  const tracking = caption.tracking || '';
  return `${caption.size} ${caption.weight} ${caption.color} ${tracking} ${transform}`.trim();
}

// Spacing Scale for consistent vertical rhythm (48px primary line spacing)
export const typographySpacing = {
  sections: {
    hero: 'space-y-16', // 64px for hero sections
    large: 'space-y-12', // 48px PRIMARY LINE SPACING (Apple-like)
    default: 'space-y-8', // 32px for standard sections
    small: 'space-y-6', // 24px for compact sections
    tight: 'space-y-4', // 16px for tight sections
  },
  content: {
    large: 'space-y-6', // 24px for generous content
    default: 'space-y-4', // 16px for standard content
    small: 'space-y-3', // 12px for compact content
    tight: 'space-y-2', // 8px for tight content
  },
  inline: {
    large: 'gap-6', // 24px for large inline elements
    default: 'gap-4', // 16px for standard inline
    small: 'gap-2', // 8px for compact inline
    tight: 'gap-1', // 4px for tight inline
  },
}

// Visual separators and dividers
export const separators = {
  section: {
    subtle: 'border-t border-slate-100 pt-8 mt-8',
    default: 'border-t border-slate-200 pt-6 mt-6',
    prominent: 'border-t-2 border-slate-300 pt-8 mt-8',
  },
  card: {
    subtle: 'border-l-4 border-slate-100 pl-4',
    accent: 'border-l-4 border-blue-500 pl-4',
    warning: 'border-l-4 border-amber-500 pl-4',
    danger: 'border-l-4 border-red-500 pl-4',
    success: 'border-l-4 border-green-500 pl-4',
  },
}

// Background colors for content sections
export const backgrounds = {
  sections: {
    subtle: 'bg-slate-50/50',
    card: 'bg-white',
    highlight: 'bg-blue-50/50',
    warning: 'bg-amber-50/50',
    danger: 'bg-red-50/50',
    success: 'bg-green-50/50',
  },
  overlays: {
    light: 'bg-white/80 backdrop-blur-sm',
    dark: 'bg-slate-900/80 backdrop-blur-sm',
    subtle: 'bg-slate-50/80 backdrop-blur-sm',
  },
}

// Export spacing as an alias to typographySpacing for backward compatibility
export const spacing = typographySpacing

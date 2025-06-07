/**
 * Typography Design System
 * Provides consistent text styles, hierarchy, and spacing for the application
 */

export const typography = {
  // Heading Hierarchy
  headings: {
    h1: {
      size: 'text-4xl lg:text-5xl',
      weight: 'font-bold',
      tracking: 'tracking-tight',
      leading: 'leading-tight',
      color: 'text-slate-900',
      spacing: 'mb-4'
    },
    h2: {
      size: 'text-2xl lg:text-3xl',
      weight: 'font-bold',
      tracking: 'tracking-tight',
      leading: 'leading-tight',
      color: 'text-slate-800',
      spacing: 'mb-3'
    },
    h3: {
      size: 'text-xl lg:text-2xl',
      weight: 'font-semibold',
      tracking: 'tracking-tight',
      leading: 'leading-snug',
      color: 'text-slate-800',
      spacing: 'mb-3'
    },
    h4: {
      size: 'text-lg',
      weight: 'font-semibold',
      tracking: 'tracking-tight',
      leading: 'leading-normal',
      color: 'text-slate-700',
      spacing: 'mb-2'
    },
    h5: {
      size: 'text-base',
      weight: 'font-semibold',
      tracking: 'tracking-normal',
      leading: 'leading-normal',
      color: 'text-slate-700',
      spacing: 'mb-2'
    },
    h6: {
      size: 'text-sm',
      weight: 'font-semibold',
      tracking: 'tracking-wide',
      leading: 'leading-normal',
      color: 'text-slate-600',
      spacing: 'mb-1'
    }
  },

  // Body Text Hierarchy
  body: {
    large: {
      size: 'text-lg',
      weight: 'font-normal',
      leading: 'leading-relaxed',
      color: 'text-slate-700'
    },
    normal: {
      size: 'text-base',
      weight: 'font-normal',
      leading: 'leading-normal',
      color: 'text-slate-700'
    },
    small: {
      size: 'text-sm',
      weight: 'font-normal',
      leading: 'leading-normal',
      color: 'text-slate-600'
    },
    tiny: {
      size: 'text-xs',
      weight: 'font-medium',
      leading: 'leading-normal',
      color: 'text-slate-500'
    }
  },

  // Specialized Text Styles
  captions: {
    default: {
      size: 'text-sm',
      weight: 'font-medium',
      color: 'text-slate-500',
      tracking: 'tracking-normal'
    },
    label: {
      size: 'text-xs',
      weight: 'font-semibold',
      color: 'text-slate-600',
      tracking: 'tracking-wide',
      transform: 'uppercase'
    },
    muted: {
      size: 'text-sm',
      weight: 'font-normal',
      color: 'text-slate-400',
      tracking: 'tracking-normal'
    }
  },

  // Interactive Text
  interactive: {
    link: {
      color: 'text-blue-600 hover:text-blue-700',
      weight: 'font-medium',
      decoration: 'hover:underline',
      transition: 'transition-colors duration-200'
    },
    button: {
      weight: 'font-semibold',
      tracking: 'tracking-normal'
    }
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
    info: 'text-blue-600'
  }
};

// Helper functions to combine typography styles
export const getHeadingClasses = (level: keyof typeof typography.headings) => {
  const heading = typography.headings[level];
  if (!heading) {
    console.error(`Typography heading level "${level}" not found. Available levels:`, Object.keys(typography.headings));
    // Fallback to h2 styles
    const fallback = typography.headings.h2;
    return `${fallback.size} ${fallback.weight} ${fallback.tracking} ${fallback.leading} ${fallback.color} ${fallback.spacing}`;
  }
  return `${heading.size} ${heading.weight} ${heading.tracking} ${heading.leading} ${heading.color} ${heading.spacing}`;
};

export const getBodyClasses = (variant: keyof typeof typography.body) => {
  const body = typography.body[variant];
  if (!body) {
    console.error(`Typography body variant "${variant}" not found. Available variants:`, Object.keys(typography.body));
    // Fallback to normal variant
    const fallback = typography.body.normal;
    return `${fallback.size} ${fallback.weight} ${fallback.leading} ${fallback.color}`;
  }
  return `${body.size} ${body.weight} ${body.leading} ${body.color}`;
};

export const getCaptionClasses = (variant: keyof typeof typography.captions) => {
  const caption = typography.captions[variant];
  const transform = 'transform' in caption ? caption.transform : '';
  const tracking = caption.tracking || '';
  return `${caption.size} ${caption.weight} ${caption.color} ${tracking} ${transform}`.trim();
};

// Spacing Scale for consistent vertical rhythm
export const spacing = {
  sections: {
    large: 'space-y-12',
    default: 'space-y-8',
    small: 'space-y-6',
    tight: 'space-y-4'
  },
  content: {
    large: 'space-y-6',
    default: 'space-y-4',
    small: 'space-y-3',
    tight: 'space-y-2'
  },
  inline: {
    large: 'gap-4',
    default: 'gap-3',
    small: 'gap-2',
    tight: 'gap-1'
  }
};

// Visual separators and dividers
export const separators = {
  section: {
    subtle: 'border-t border-slate-100 pt-8 mt-8',
    default: 'border-t border-slate-200 pt-6 mt-6',
    prominent: 'border-t-2 border-slate-300 pt-8 mt-8'
  },
  card: {
    subtle: 'border-l-4 border-slate-100 pl-4',
    accent: 'border-l-4 border-blue-500 pl-4',
    warning: 'border-l-4 border-amber-500 pl-4',
    danger: 'border-l-4 border-red-500 pl-4',
    success: 'border-l-4 border-green-500 pl-4'
  }
};

// Background colors for content sections
export const backgrounds = {
  sections: {
    subtle: 'bg-slate-50/50',
    card: 'bg-white',
    highlight: 'bg-blue-50/50',
    warning: 'bg-amber-50/50',
    danger: 'bg-red-50/50',
    success: 'bg-green-50/50'
  },
  overlays: {
    light: 'bg-white/80 backdrop-blur-sm',
    dark: 'bg-slate-900/80 backdrop-blur-sm',
    subtle: 'bg-slate-50/80 backdrop-blur-sm'
  }
}; 
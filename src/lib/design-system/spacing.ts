/**
 * Spacing Design System
 * Apple-inspired spacing scale with 8px base unit and 48px primary line spacing
 * Notion-like clean, minimal interface with consistent rhythm
 */

// Core Spacing Scale (8px baseline - Apple/Notion inspired)
export const spacing = {
  // Micro spacing
  xs: '4px', // 0.5 unit - micro elements
  sm: '8px', // 1 unit - base unit
  md: '16px', // 2 units - standard spacing
  lg: '24px', // 3 units - comfortable spacing
  xl: '32px', // 4 units - section spacing
  '2xl': '48px', // 6 units - PRIMARY LINE SPACING (Apple-like)
  '3xl': '64px', // 8 units - major sections
  '4xl': '80px', // 10 units - page sections
  '5xl': '96px', // 12 units - large sections
  '6xl': '128px', // 16 units - hero sections
} as const

// Semantic Spacing (context-aware) - Apple/Notion inspired
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing.xs, // 4px - micro spacing
    sm: spacing.sm, // 8px - base unit, compact components
    md: spacing.md, // 16px - standard components
    lg: spacing.lg, // 24px - comfortable components
    xl: spacing.xl, // 32px - spacious components
  },

  // Section spacing (48px primary line spacing)
  section: {
    xs: spacing.xl, // 32px - tight sections
    sm: spacing['2xl'], // 48px - PRIMARY LINE SPACING (Apple-like)
    md: spacing['3xl'], // 64px - comfortable sections
    lg: spacing['4xl'], // 80px - major sections
    xl: spacing['5xl'], // 96px - page sections
  },

  // Content spacing
  content: {
    xs: spacing.xs, // 4px - inline elements
    sm: spacing.sm, // 8px - base unit, related elements
    md: spacing.md, // 16px - paragraph spacing
    lg: spacing.lg, // 24px - content blocks
    xl: spacing.xl, // 32px - major content sections
  },

  // Layout spacing (48px as standard)
  layout: {
    xs: spacing.lg, // 24px - tight layouts
    sm: spacing.xl, // 32px - standard layouts
    md: spacing['2xl'], // 48px - PRIMARY LINE SPACING (Apple-like)
    lg: spacing['3xl'], // 64px - generous layouts
    xl: spacing['4xl'], // 80px - spacious layouts
  },
} as const

// Container Sizes (responsive max-widths)
export const containers = {
  xs: '448px', // ~28rem - mobile content
  sm: '640px', // ~40rem - small tablets
  md: '768px', // ~48rem - tablets
  lg: '1024px', // ~64rem - laptops
  xl: '1280px', // ~80rem - desktops
  '2xl': '1536px', // ~96rem - large screens
  '3xl': '1728px', // ~108rem - ultra-wide
  full: '100%', // full width
} as const

// Responsive Breakpoints
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Grid System
export const grid = {
  // Grid gaps
  gap: {
    none: '0px',
    xs: spacing.xs, // 4px
    sm: spacing.sm, // 8px
    md: spacing.md, // 16px
    lg: spacing.lg, // 24px
    xl: spacing.xl, // 32px
    '2xl': spacing['2xl'], // 40px
  },

  // Grid columns
  cols: {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    12: '12',
  },

  // Responsive grid configurations
  responsive: {
    mobile: {
      cols: 1,
      gap: spacing.md,
      padding: spacing.md,
    },
    tablet: {
      cols: 2,
      gap: spacing.lg,
      padding: spacing.lg,
    },
    desktop: {
      cols: 3,
      gap: spacing.xl,
      padding: spacing.xl,
    },
    wide: {
      cols: 4,
      gap: spacing.xl,
      padding: spacing['2xl'],
    },
  },
} as const

// Layout Utilities
export const layout = {
  // Page layout
  page: {
    padding: {
      x: spacing.md, // 16px horizontal
      y: spacing.lg, // 24px vertical
      responsive: {
        sm: spacing.lg, // 24px on small screens
        md: spacing.xl, // 32px on medium screens
        lg: spacing['2xl'], // 40px on large screens
      },
    },
    maxWidth: containers.xl,
    margin: 'auto',
  },

  // Content areas
  content: {
    padding: {
      x: spacing.md,
      y: spacing.lg,
    },
    maxWidth: containers.lg,
    margin: 'auto',
  },

  // Card layouts
  card: {
    padding: {
      xs: spacing.md, // 16px
      sm: spacing.lg, // 24px
      md: spacing.xl, // 32px
      lg: spacing['2xl'], // 40px
    },
    gap: spacing.md, // 16px between cards
    border: {
      radius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },

  // Navigation
  nav: {
    height: '64px',
    padding: {
      x: spacing.lg,
      y: spacing.md,
    },
  },

  // Sidebar
  sidebar: {
    width: {
      sm: '256px',
      md: '280px',
      lg: '320px',
    },
    padding: spacing.lg,
  },
} as const

// CSS Classes for easy application
export const spacingClasses = {
  // Spacing utilities
  spacing: {
    xs: 'space-y-1', // 4px
    sm: 'space-y-2', // 8px
    md: 'space-y-4', // 16px
    lg: 'space-y-6', // 24px
    xl: 'space-y-8', // 32px
    '2xl': 'space-y-10', // 40px
    '3xl': 'space-y-12', // 48px
  },

  // Padding utilities
  padding: {
    xs: 'p-1', // 4px
    sm: 'p-2', // 8px
    md: 'p-4', // 16px
    lg: 'p-6', // 24px
    xl: 'p-8', // 32px
    '2xl': 'p-10', // 40px
  },

  // Margin utilities
  margin: {
    xs: 'm-1', // 4px
    sm: 'm-2', // 8px
    md: 'm-4', // 16px
    lg: 'm-6', // 24px
    xl: 'm-8', // 32px
    '2xl': 'm-10', // 40px
  },

  // Gap utilities
  gap: {
    xs: 'gap-1', // 4px
    sm: 'gap-2', // 8px
    md: 'gap-4', // 16px
    lg: 'gap-6', // 24px
    xl: 'gap-8', // 32px
    '2xl': 'gap-10', // 40px
  },

  // Container utilities
  container: {
    xs: 'max-w-sm', // 384px
    sm: 'max-w-md', // 448px
    md: 'max-w-lg', // 512px
    lg: 'max-w-xl', // 576px
    xl: 'max-w-2xl', // 672px
    '2xl': 'max-w-4xl', // 896px
    '3xl': 'max-w-6xl', // 1152px
    full: 'max-w-full', // 100%
  },
} as const

// Layout Component Classes
export const layoutClasses = {
  // Page wrapper
  page: 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/30 p-4 md:p-6 lg:p-8',

  // Content wrapper
  content: 'max-w-7xl mx-auto space-y-6 md:space-y-8 lg:space-y-10',

  // Section wrapper
  section: 'space-y-4 md:space-y-6',

  // Card grid
  cardGrid: {
    1: 'grid grid-cols-1 gap-4 md:gap-6',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
  },

  // Flex layouts
  flex: {
    row: 'flex items-center gap-2 md:gap-4',
    col: 'flex flex-col gap-2 md:gap-4',
    between: 'flex items-center justify-between gap-2 md:gap-4',
    center: 'flex items-center justify-center gap-2 md:gap-4',
  },

  // Component spacing
  component: {
    tight: 'space-y-2',
    normal: 'space-y-4',
    relaxed: 'space-y-6',
    loose: 'space-y-8',
  },
} as const

// Responsive Spacing Utilities
export const responsiveSpacing = {
  // Generate responsive padding classes
  padding: (
    base: keyof typeof spacing,
    responsive?: { sm?: keyof typeof spacing; md?: keyof typeof spacing; lg?: keyof typeof spacing }
  ) => {
    let classes = `p-${getSpacingValue(base)}`;
    if (responsive?.sm) classes += ` sm:p-${getSpacingValue(responsive.sm)}`;
    if (responsive?.md) classes += ` md:p-${getSpacingValue(responsive.md)}`;
    if (responsive?.lg) classes += ` lg:p-${getSpacingValue(responsive.lg)}`;
    return classes;
  },

  // Generate responsive margin classes
  margin: (
    base: keyof typeof spacing,
    responsive?: { sm?: keyof typeof spacing; md?: keyof typeof spacing; lg?: keyof typeof spacing }
  ) => {
    let classes = `m-${getSpacingValue(base)}`;
    if (responsive?.sm) classes += ` sm:m-${getSpacingValue(responsive.sm)}`;
    if (responsive?.md) classes += ` md:m-${getSpacingValue(responsive.md)}`;
    if (responsive?.lg) classes += ` lg:m-${getSpacingValue(responsive.lg)}`;
    return classes;
  },

  // Generate responsive gap classes
  gap: (
    base: keyof typeof spacing,
    responsive?: { sm?: keyof typeof spacing; md?: keyof typeof spacing; lg?: keyof typeof spacing }
  ) => {
    let classes = `gap-${getSpacingValue(base)}`;
    if (responsive?.sm) classes += ` sm:gap-${getSpacingValue(responsive.sm)}`;
    if (responsive?.md) classes += ` md:gap-${getSpacingValue(responsive.md)}`;
    if (responsive?.lg) classes += ` lg:gap-${getSpacingValue(responsive.lg)}`;
    return classes;
  },
} as const;

// Helper function to convert spacing to Tailwind values
const getSpacingValue = (spacingKey: keyof typeof spacing): string {
  const spacingMap: Record<keyof typeof spacing, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '10',
    '3xl': '12',
    '4xl': '16',
    '5xl': '20',
    '6xl': '24',
  }

  return spacingMap[spacingKey] || '4';
}

// Component-specific spacing configurations
export const componentSpacing = {
  // Header spacing
  header: {
    padding: spacingClasses.padding.lg,
    gap: spacingClasses.gap.md,
    marginBottom: spacingClasses.margin.xl,
  },

  // Card spacing
  card: {
    padding: spacingClasses.padding.lg,
    gap: spacingClasses.gap.md,
    margin: spacingClasses.margin.md,
  },

  // List spacing
  list: {
    gap: spacingClasses.gap.sm,
    itemPadding: spacingClasses.padding.md,
  },

  // Form spacing
  form: {
    fieldSpacing: spacingClasses.spacing.md,
    labelMargin: spacingClasses.margin.sm,
    buttonMargin: spacingClasses.margin.lg,
  },

  // Navigation spacing
  nav: {
    itemSpacing: spacingClasses.gap.md,
    padding: spacingClasses.padding.md,
  },
} as const

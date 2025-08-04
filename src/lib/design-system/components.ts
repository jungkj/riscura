/**
 * Component System - Standardized component definitions
 * Defines consistent component variants, sizes, and styling patterns
 */

import { designTokens } from './tokens';

// Component variant definitions
export const componentVariants = {
  // Button variants
  button: {
    variants: {
      primary: {
        backgroundColor: designTokens.colors.interactive.primary,
        color: designTokens.colors.text.inverse,
        border: `1px solid ${designTokens.colors.interactive.primary}`,
        '&:hover': {
          backgroundColor: designTokens.colors.interactive.primaryHover,
          borderColor: designTokens.colors.interactive.primaryHover,
        },
        '&:active': {
          backgroundColor: designTokens.colors.interactive.primaryActive,
          borderColor: designTokens.colors.interactive.primaryActive,
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.interactive.primaryDisabled,
          borderColor: designTokens.colors.interactive.primaryDisabled,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
      secondary: {
        backgroundColor: designTokens.colors.interactive.secondary,
        color: designTokens.colors.text.primary,
        border: `1px solid ${designTokens.colors.border.primary}`,
        '&:hover': {
          backgroundColor: designTokens.colors.interactive.secondaryHover,
          borderColor: designTokens.colors.border.primary,
        },
        '&:active': {
          backgroundColor: designTokens.colors.interactive.secondaryActive,
          borderColor: designTokens.colors.border.primary,
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.background.disabled,
          borderColor: designTokens.colors.border.secondary,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        color: designTokens.colors.interactive.primary,
        border: `1px solid ${designTokens.colors.interactive.primary}`,
        '&:hover': {
          backgroundColor: designTokens.colors.primary[50],
          borderColor: designTokens.colors.interactive.primaryHover,
          color: designTokens.colors.interactive.primaryHover,
        },
        '&:active': {
          backgroundColor: designTokens.colors.primary[100],
          borderColor: designTokens.colors.interactive.primaryActive,
          color: designTokens.colors.interactive.primaryActive,
        },
        '&:disabled': {
          backgroundColor: 'transparent',
          borderColor: designTokens.colors.interactive.primaryDisabled,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: designTokens.colors.text.primary,
        border: '1px solid transparent',
        '&:hover': {
          backgroundColor: designTokens.colors.neutral[100],
          color: designTokens.colors.text.primary,
        },
        '&:active': {
          backgroundColor: designTokens.colors.neutral[200],
          color: designTokens.colors.text.primary,
        },
        '&:disabled': {
          backgroundColor: 'transparent',
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
      danger: {
        backgroundColor: designTokens.colors.interactive.danger,
        color: designTokens.colors.text.inverse,
        border: `1px solid ${designTokens.colors.interactive.danger}`,
        '&:hover': {
          backgroundColor: designTokens.colors.interactive.dangerHover,
          borderColor: designTokens.colors.interactive.dangerHover,
        },
        '&:active': {
          backgroundColor: designTokens.colors.interactive.dangerActive,
          borderColor: designTokens.colors.interactive.dangerActive,
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.interactive.primaryDisabled,
          borderColor: designTokens.colors.interactive.primaryDisabled,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
      success: {
        backgroundColor: designTokens.colors.interactive.success,
        color: designTokens.colors.text.inverse,
        border: `1px solid ${designTokens.colors.interactive.success}`,
        '&:hover': {
          backgroundColor: designTokens.colors.interactive.successHover,
          borderColor: designTokens.colors.interactive.successHover,
        },
        '&:active': {
          backgroundColor: designTokens.colors.interactive.successActive,
          borderColor: designTokens.colors.interactive.successActive,
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.interactive.primaryDisabled,
          borderColor: designTokens.colors.interactive.primaryDisabled,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
      },
    },
    sizes: {
      xs: {
        height: designTokens.sizing.button.xs,
        padding: `0 ${designTokens.spacing.sm}`,
        fontSize: designTokens.typography.fontSize.xs,
        borderRadius: designTokens.borderRadius.component.button,
      },
      sm: {
        height: designTokens.sizing.button.sm,
        padding: `0 ${designTokens.spacing.md}`,
        fontSize: designTokens.typography.fontSize.sm,
        borderRadius: designTokens.borderRadius.component.button,
      },
      md: {
        height: designTokens.sizing.button.md,
        padding: `0 ${designTokens.spacing.lg}`,
        fontSize: designTokens.typography.fontSize.base,
        borderRadius: designTokens.borderRadius.component.button,
      },
      lg: {
        height: designTokens.sizing.button.lg,
        padding: `0 ${designTokens.spacing.xl}`,
        fontSize: designTokens.typography.fontSize.lg,
        borderRadius: designTokens.borderRadius.component.button,
      },
      xl: {
        height: designTokens.sizing.button.xl,
        padding: `0 ${designTokens.spacing['2xl']}`,
        fontSize: designTokens.typography.fontSize.xl,
        borderRadius: designTokens.borderRadius.component.button,
      },
    },
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: designTokens.typography.fontWeight.medium,
      transition: designTokens.animation.transition.default,
      cursor: 'pointer',
      outline: 'none',
      textDecoration: 'none',
      userSelect: 'none',
      '&:focus-visible': {
        outline: `2px solid ${designTokens.colors.border.focus}`,
        outlineOffset: '2px',
      },
    },
  },

  // Card variants
  card: {
    variants: {
      default: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.secondary}`,
        boxShadow: designTokens.elevation.component.card,
      },
      elevated: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.tertiary}`,
        boxShadow: designTokens.elevation.component.cardHover,
      },
      outlined: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.primary}`,
        boxShadow: 'none',
      },
      filled: {
        backgroundColor: designTokens.colors.background.secondary,
        border: `1px solid ${designTokens.colors.border.tertiary}`,
        boxShadow: 'none',
      },
      interactive: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.secondary}`,
        boxShadow: designTokens.elevation.component.card,
        cursor: 'pointer',
        transition: designTokens.animation.transition.default,
        '&:hover': {
          boxShadow: designTokens.elevation.component.cardHover,
          borderColor: designTokens.colors.border.primary,
        },
      },
    },
    base: {
      borderRadius: designTokens.borderRadius.component.card,
      overflow: 'hidden',
    },
  },

  // Input variants
  input: {
    variants: {
      default: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.primary}`,
        color: designTokens.colors.text.primary,
        '&:focus': {
          borderColor: designTokens.colors.border.focus,
          outline: 'none',
          boxShadow: `0 0 0 1px ${designTokens.colors.border.focus}`,
        },
        '&:disabled': {
          backgroundColor: designTokens.colors.background.disabled,
          borderColor: designTokens.colors.border.secondary,
          color: designTokens.colors.text.disabled,
          cursor: 'not-allowed',
        },
        '&::placeholder': {
          color: designTokens.colors.text.tertiary,
        },
      },
      error: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.error}`,
        color: designTokens.colors.text.primary,
        '&:focus': {
          borderColor: designTokens.colors.border.error,
          outline: 'none',
          boxShadow: `0 0 0 1px ${designTokens.colors.border.error}`,
        },
      },
      success: {
        backgroundColor: designTokens.colors.background.primary,
        border: `1px solid ${designTokens.colors.border.success}`,
        color: designTokens.colors.text.primary,
        '&:focus': {
          borderColor: designTokens.colors.border.success,
          outline: 'none',
          boxShadow: `0 0 0 1px ${designTokens.colors.border.success}`,
        },
      },
    },
    sizes: {
      sm: {
        height: designTokens.sizing.input.sm,
        padding: `0 ${designTokens.spacing.sm}`,
        fontSize: designTokens.typography.fontSize.sm,
        borderRadius: designTokens.borderRadius.component.input,
      },
      md: {
        height: designTokens.sizing.input.md,
        padding: `0 ${designTokens.spacing.md}`,
        fontSize: designTokens.typography.fontSize.base,
        borderRadius: designTokens.borderRadius.component.input,
      },
      lg: {
        height: designTokens.sizing.input.lg,
        padding: `0 ${designTokens.spacing.lg}`,
        fontSize: designTokens.typography.fontSize.lg,
        borderRadius: designTokens.borderRadius.component.input,
      },
    },
    base: {
      width: '100%',
      transition: designTokens.animation.transition.colors,
      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    },
  },

  // Badge variants
  badge: {
    variants: {
      default: {
        backgroundColor: designTokens.colors.neutral[100],
        color: designTokens.colors.text.primary,
        border: `1px solid ${designTokens.colors.border.secondary}`,
      },
      primary: {
        backgroundColor: designTokens.colors.primary[100],
        color: designTokens.colors.primary[700],
        border: `1px solid ${designTokens.colors.primary[200]}`,
      },
      secondary: {
        backgroundColor: designTokens.colors.neutral[100],
        color: designTokens.colors.neutral[700],
        border: `1px solid ${designTokens.colors.neutral[200]}`,
      },
      success: {
        backgroundColor: designTokens.colors.semantic.success[100],
        color: designTokens.colors.semantic.success[700],
        border: `1px solid ${designTokens.colors.semantic.success[200]}`,
      },
      warning: {
        backgroundColor: designTokens.colors.semantic.warning[100],
        color: designTokens.colors.semantic.warning[700],
        border: `1px solid ${designTokens.colors.semantic.warning[200]}`,
      },
      error: {
        backgroundColor: designTokens.colors.semantic.error[100],
        color: designTokens.colors.semantic.error[700],
        border: `1px solid ${designTokens.colors.semantic.error[200]}`,
      },
      info: {
        backgroundColor: designTokens.colors.semantic.info[100],
        color: designTokens.colors.semantic.info[700],
        border: `1px solid ${designTokens.colors.semantic.info[200]}`,
      },
    },
    sizes: {
      sm: {
        padding: `${designTokens.spacing.xs} ${designTokens.spacing.sm}`,
        fontSize: designTokens.typography.fontSize.xs,
        borderRadius: designTokens.borderRadius.component.badge,
      },
      md: {
        padding: `${designTokens.spacing.xs} ${designTokens.spacing.md}`,
        fontSize: designTokens.typography.fontSize.sm,
        borderRadius: designTokens.borderRadius.component.badge,
      },
      lg: {
        padding: `${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
        fontSize: designTokens.typography.fontSize.base,
        borderRadius: designTokens.borderRadius.component.badge,
      },
    },
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      fontWeight: designTokens.typography.fontWeight.medium,
      whiteSpace: 'nowrap',
    },
  },

  // Alert variants
  alert: {
    variants: {
      info: {
        backgroundColor: designTokens.colors.semantic.info[50],
        color: designTokens.colors.semantic.info[700],
        border: `1px solid ${designTokens.colors.semantic.info[200]}`,
      },
      success: {
        backgroundColor: designTokens.colors.semantic.success[50],
        color: designTokens.colors.semantic.success[700],
        border: `1px solid ${designTokens.colors.semantic.success[200]}`,
      },
      warning: {
        backgroundColor: designTokens.colors.semantic.warning[50],
        color: designTokens.colors.semantic.warning[700],
        border: `1px solid ${designTokens.colors.semantic.warning[200]}`,
      },
      error: {
        backgroundColor: designTokens.colors.semantic.error[50],
        color: designTokens.colors.semantic.error[700],
        border: `1px solid ${designTokens.colors.semantic.error[200]}`,
      },
    },
    base: {
      padding: designTokens.spacing.md,
      borderRadius: designTokens.borderRadius.lg,
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  },

  // Avatar variants
  avatar: {
    sizes: {
      xs: {
        width: designTokens.sizing.avatar.xs,
        height: designTokens.sizing.avatar.xs,
        fontSize: designTokens.typography.fontSize.xs,
      },
      sm: {
        width: designTokens.sizing.avatar.sm,
        height: designTokens.sizing.avatar.sm,
        fontSize: designTokens.typography.fontSize.sm,
      },
      md: {
        width: designTokens.sizing.avatar.md,
        height: designTokens.sizing.avatar.md,
        fontSize: designTokens.typography.fontSize.base,
      },
      lg: {
        width: designTokens.sizing.avatar.lg,
        height: designTokens.sizing.avatar.lg,
        fontSize: designTokens.typography.fontSize.lg,
      },
      xl: {
        width: designTokens.sizing.avatar.xl,
        height: designTokens.sizing.avatar.xl,
        fontSize: designTokens.typography.fontSize.xl,
      },
      '2xl': {
        width: designTokens.sizing.avatar['2xl'],
        height: designTokens.sizing.avatar['2xl'],
        fontSize: designTokens.typography.fontSize['2xl'],
      },
    },
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: designTokens.borderRadius.component.avatar,
      backgroundColor: designTokens.colors.neutral[200],
      color: designTokens.colors.text.primary,
      fontWeight: designTokens.typography.fontWeight.medium,
      overflow: 'hidden',
    },
  },

  // Progress variants
  progress: {
    variants: {
      default: {
        backgroundColor: designTokens.colors.neutral[200],
      },
      primary: {
        backgroundColor: designTokens.colors.primary[200],
      },
      success: {
        backgroundColor: designTokens.colors.semantic.success[200],
      },
      warning: {
        backgroundColor: designTokens.colors.semantic.warning[200],
      },
      error: {
        backgroundColor: designTokens.colors.semantic.error[200],
      },
    },
    sizes: {
      sm: {
        height: '4px',
      },
      md: {
        height: '8px',
      },
      lg: {
        height: '12px',
      },
    },
    base: {
      width: '100%',
      borderRadius: designTokens.borderRadius.full,
      overflow: 'hidden',
    },
  },
} as const

// Component composition patterns
export const componentPatterns = {
  // Form field pattern
  formField: {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: designTokens.spacing.xs,
    },
    label: {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      color: designTokens.colors.text.primary,
      marginBottom: designTokens.spacing.xs,
    },
    helpText: {
      fontSize: designTokens.typography.fontSize.xs,
      color: designTokens.colors.text.tertiary,
      marginTop: designTokens.spacing.xs,
    },
    errorText: {
      fontSize: designTokens.typography.fontSize.xs,
      color: designTokens.colors.semantic.error[600],
      marginTop: designTokens.spacing.xs,
    },
  },

  // Card content pattern
  cardContent: {
    header: {
      padding: designTokens.spacing.lg,
      borderBottom: `1px solid ${designTokens.colors.border.secondary}`,
    },
    body: {
      padding: designTokens.spacing.lg,
    },
    footer: {
      padding: designTokens.spacing.lg,
      borderTop: `1px solid ${designTokens.colors.border.secondary}`,
      backgroundColor: designTokens.colors.background.secondary,
    },
  },

  // List item pattern
  listItem: {
    container: {
      display: 'flex',
      alignItems: 'center',
      padding: designTokens.spacing.md,
      borderBottom: `1px solid ${designTokens.colors.border.tertiary}`,
      transition: designTokens.animation.transition.colors,
      '&:hover': {
        backgroundColor: designTokens.colors.background.secondary,
      },
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.sm,
    },
  },

  // Modal pattern
  modal: {
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: designTokens.colors.background.overlay,
      zIndex: designTokens.elevation.zIndex.overlay,
    },
    content: {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: designTokens.colors.background.primary,
      borderRadius: designTokens.borderRadius.component.modal,
      boxShadow: designTokens.elevation.component.modal,
      zIndex: designTokens.elevation.zIndex.modal,
      maxHeight: '90vh',
      overflow: 'auto',
    },
  },

  // Dropdown pattern
  dropdown: {
    trigger: {
      cursor: 'pointer',
    },
    content: {
      backgroundColor: designTokens.colors.background.primary,
      border: `1px solid ${designTokens.colors.border.primary}`,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.elevation.component.dropdown,
      padding: designTokens.spacing.xs,
      zIndex: designTokens.elevation.zIndex.dropdown,
    },
    item: {
      padding: `${designTokens.spacing.sm} ${designTokens.spacing.md}`,
      borderRadius: designTokens.borderRadius.sm,
      cursor: 'pointer',
      transition: designTokens.animation.transition.colors,
      '&:hover': {
        backgroundColor: designTokens.colors.background.secondary,
      },
      '&:focus': {
        backgroundColor: designTokens.colors.background.secondary,
        outline: 'none',
      },
    },
  },
} as const

// Utility classes for common styling patterns
export const utilityClasses = {
  // Layout utilities
  layout: {
    container: {
      maxWidth: designTokens.sizing.container.xl,
      margin: '0 auto',
      padding: `0 ${designTokens.spacing.layout.containerPadding}`,
    },
    section: {
      marginBottom: designTokens.spacing.layout.sectionGap,
    },
    grid: {
      display: 'grid',
      gap: designTokens.spacing.layout.cardGap,
    },
    flex: {
      display: 'flex',
      alignItems: 'center',
      gap: designTokens.spacing.md,
    },
    stack: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: designTokens.spacing.md,
    },
  },

  // Typography utilities
  typography: {
    heading1: designTokens.typography.heading.h1,
    heading2: designTokens.typography.heading.h2,
    heading3: designTokens.typography.heading.h3,
    heading4: designTokens.typography.heading.h4,
    heading5: designTokens.typography.heading.h5,
    heading6: designTokens.typography.heading.h6,
    bodyLarge: designTokens.typography.body.large,
    body: designTokens.typography.body.base,
    bodySmall: designTokens.typography.body.small,
    caption: designTokens.typography.caption,
    code: designTokens.typography.code,
  },

  // Spacing utilities
  spacing: {
    p: {
      xs: { padding: designTokens.spacing.xs },
      sm: { padding: designTokens.spacing.sm },
      md: { padding: designTokens.spacing.md },
      lg: { padding: designTokens.spacing.lg },
      xl: { padding: designTokens.spacing.xl },
    },
    m: {
      xs: { margin: designTokens.spacing.xs },
      sm: { margin: designTokens.spacing.sm },
      md: { margin: designTokens.spacing.md },
      lg: { margin: designTokens.spacing.lg },
      xl: { margin: designTokens.spacing.xl },
    },
    gap: {
      xs: { gap: designTokens.spacing.xs },
      sm: { gap: designTokens.spacing.sm },
      md: { gap: designTokens.spacing.md },
      lg: { gap: designTokens.spacing.lg },
      xl: { gap: designTokens.spacing.xl },
    },
  },

  // Color utilities
  colors: {
    text: {
      primary: { color: designTokens.colors.text.primary },
      secondary: { color: designTokens.colors.text.secondary },
      tertiary: { color: designTokens.colors.text.tertiary },
      disabled: { color: designTokens.colors.text.disabled },
      inverse: { color: designTokens.colors.text.inverse },
    },
    background: {
      primary: { backgroundColor: designTokens.colors.background.primary },
      secondary: { backgroundColor: designTokens.colors.background.secondary },
      tertiary: { backgroundColor: designTokens.colors.background.tertiary },
    },
  },

  // Border utilities
  borders: {
    default: { border: `1px solid ${designTokens.colors.border.primary}` },
    secondary: { border: `1px solid ${designTokens.colors.border.secondary}` },
    tertiary: { border: `1px solid ${designTokens.colors.border.tertiary}` },
    focus: { border: `1px solid ${designTokens.colors.border.focus}` },
    none: { border: 'none' },
  },

  // Shadow utilities
  shadows: {
    none: { boxShadow: designTokens.elevation.shadow.none },
    sm: { boxShadow: designTokens.elevation.shadow.sm },
    md: { boxShadow: designTokens.elevation.shadow.md },
    lg: { boxShadow: designTokens.elevation.shadow.lg },
    xl: { boxShadow: designTokens.elevation.shadow.xl },
  },

  // Border radius utilities
  borderRadius: {
    none: { borderRadius: designTokens.borderRadius.none },
    sm: { borderRadius: designTokens.borderRadius.sm },
    md: { borderRadius: designTokens.borderRadius.md },
    lg: { borderRadius: designTokens.borderRadius.lg },
    xl: { borderRadius: designTokens.borderRadius.xl },
    full: { borderRadius: designTokens.borderRadius.full },
  },
} as const

export default {
  componentVariants,
  componentPatterns,
  utilityClasses,
}

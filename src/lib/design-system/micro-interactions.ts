/**
 * Micro-Interactions Design System
 * Sophisticated animations, transitions, and polish effects for premium user experience
 */

import { type Variants } from 'framer-motion';

// Core Animation Timings (based on Material Design and Apple HIG)
export const timings = {
  // Micro interactions (instant feedback)
  instant: 0.1,
  quick: 0.2,
  snappy: 0.3,

  // Standard interactions
  normal: 0.4,
  moderate: 0.5,
  relaxed: 0.6,

  // Complex animations
  slow: 0.8,
  deliberate: 1.0,
  patient: 1.2,
} as const;

// Easing Functions (sophisticated motion curves)
export const easings = {
  // Standard easings
  linear: [0.0, 0.0, 1.0, 1.0],
  ease: [0.25, 0.1, 0.25, 1.0],
  easeIn: [0.42, 0.0, 1.0, 1.0],
  easeOut: [0.0, 0.0, 0.58, 1.0],
  easeInOut: [0.42, 0.0, 0.58, 1.0],

  // Premium easings (Apple/Google inspired)
  snappy: [0.25, 0.46, 0.45, 0.94],
  smooth: [0.23, 1, 0.32, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],

  // Context-specific easings
  slideIn: [0.25, 0.46, 0.45, 0.94],
  slideOut: [0.55, 0.055, 0.675, 0.19],
  modalIn: [0.23, 1, 0.32, 1],
  modalOut: [0.755, 0.05, 0.855, 0.06],
} as const;

// Animation Variants for Common Patterns
export const variants = {
  // Page Transitions
  page: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: timings.moderate,
        ease: easings.smooth,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: timings.quick,
        ease: easings.slideOut,
      },
    },
  } as Variants,

  // Card Animations
  card: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: timings.normal,
        ease: easings.smooth,
      },
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: timings.instant,
        ease: easings.snappy,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: timings.quick,
        ease: easings.slideOut,
      },
    },
  } as Variants,

  // List Item Animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: (_i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: timings.normal,
        ease: easings.smooth,
        delay: i * 0.05, // Staggered animation
      },
    }),
    hover: {
      x: 4,
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: timings.quick,
        ease: easings.slideOut,
      },
    },
  } as Variants,

  // Button Interactions
  button: {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: timings.instant,
        ease: easings.snappy,
      },
    },
    loading: {
      scale: [1, 1.05, 1],
      transition: {
        duration: timings.slow,
        ease: easings.smooth,
        repeat: Infinity,
      },
    },
    success: {
      scale: [1, 1.1, 1],
      backgroundColor: ['#3b82f6', '#10b981', '#3b82f6'],
      transition: {
        duration: timings.moderate,
        ease: easings.bounce,
      },
    },
    error: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: timings.normal,
        ease: easings.snappy,
      },
    },
  } as Variants,

  // Modal Animations
  modal: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: timings.normal,
        ease: easings.modalIn,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        duration: timings.quick,
        ease: easings.modalOut,
      },
    },
  } as Variants,

  // Backdrop Animations
  backdrop: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: timings.normal,
        ease: easings.ease,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: timings.quick,
        ease: easings.ease,
      },
    },
  } as Variants,

  // Notification Animations
  notification: {
    initial: { opacity: 0, x: 300, scale: 0.9 },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: timings.normal,
        ease: easings.bounce,
      },
    },
    exit: {
      opacity: 0,
      x: 300,
      scale: 0.9,
      transition: {
        duration: timings.quick,
        ease: easings.slideOut,
      },
    },
  } as Variants,

  // Loading Skeleton
  skeleton: {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: timings.deliberate,
        ease: easings.ease,
        repeat: Infinity,
      },
    },
  } as Variants,

  // Stagger Container
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as Variants,

  // Icon Animations
  icon: {
    initial: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
    tap: {
      scale: 0.9,
      transition: {
        duration: timings.instant,
        ease: easings.snappy,
      },
    },
    spin: {
      rotate: 360,
      transition: {
        duration: timings.deliberate,
        ease: easings.linear,
        repeat: Infinity,
      },
    },
    success: {
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: timings.moderate,
        ease: easings.bounce,
      },
    },
  } as Variants,

  // Progress Animations
  progress: {
    initial: { scaleX: 0, originX: 0 },
    animate: (progress: number) => ({
      scaleX: progress / 100,
      transition: {
        duration: timings.moderate,
        ease: easings.smooth,
      },
    }),
  } as Variants,

  // Drag and Drop
  draggable: {
    drag: {
      scale: 1.05,
      rotate: 2,
      zIndex: 1000,
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
    dragHover: {
      scale: 1.1,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      transition: {
        duration: timings.quick,
        ease: easings.snappy,
      },
    },
  } as Variants,
} as const;

// Interaction Presets
export const interactions = {
  // Hover Effects
  subtleHover: {
    scale: 1.02,
    transition: {
      duration: timings.quick,
      ease: easings.snappy,
    },
  },

  liftHover: {
    y: -2,
    scale: 1.02,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    transition: {
      duration: timings.quick,
      ease: easings.snappy,
    },
  },

  glowHover: {
    boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 20px rgba(59, 130, 246, 0.3)'],
    transition: {
      duration: timings.normal,
      ease: easings.smooth,
    },
  },

  // Focus Effects
  focusRing: {
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
    transition: {
      duration: timings.quick,
      ease: easings.snappy,
    },
  },

  // Touch Effects (for mobile)
  touchFeedback: {
    scale: 0.95,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    transition: {
      duration: timings.instant,
      ease: easings.snappy,
    },
  },

  // Loading States
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: timings.slow,
      ease: easings.ease,
      repeat: Infinity,
    },
  },

  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: timings.deliberate,
      ease: easings.linear,
      repeat: Infinity,
    },
  },
} as const;

// Success/Error Feedback Animations
export const feedbackAnimations = {
  success: {
    scale: [1, 1.2, 1],
    backgroundColor: ['#3b82f6', '#10b981', '#3b82f6'],
    transition: {
      duration: timings.moderate,
      ease: easings.bounce,
    },
  },

  error: {
    x: [-4, 4, -4, 4, 0],
    backgroundColor: ['#3b82f6', '#ef4444', '#3b82f6'],
    transition: {
      duration: timings.normal,
      ease: easings.snappy,
    },
  },

  warning: {
    scale: [1, 1.1, 1],
    backgroundColor: ['#3b82f6', '#f59e0b', '#3b82f6'],
    transition: {
      duration: timings.normal,
      ease: easings.smooth,
    },
  },

  info: {
    scale: [1, 1.05, 1],
    backgroundColor: ['#3b82f6', '#06b6d4', '#3b82f6'],
    transition: {
      duration: timings.normal,
      ease: easings.smooth,
    },
  },
} as const;

// Animation Utilities
export const animationUtils = {
  // Stagger children animations
  staggerChildren: (delay: number = 0.1) => ({
    transition: {
      staggerChildren: delay,
      delayChildren: delay,
    },
  }),

  // Chain multiple animations
  sequence: (...animations: any[]) => ({
    transition: {
      times: animations.map((_, i) => i / (animations.length - 1)),
    },
  }),

  // Spring configurations
  springs: {
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    wobbly: { type: 'spring', stiffness: 180, damping: 12 },
    stiff: { type: 'spring', stiffness: 210, damping: 20 },
    slow: { type: 'spring', stiffness: 80, damping: 14 },
    bouncy: { type: 'spring', stiffness: 150, damping: 8 },
  },

  // Reduced motion considerations
  respectsMotion: (animation: any, reducedMotion: any = {}) => ({
    ...animation,
    '@media (prefers-reduced-motion: reduce)': reducedMotion,
  }),
} as const;

// Accessibility Helpers
export const a11y = {
  // Respect user's motion preferences
  reduceMotion: {
    transition: { duration: 0.01 },
  },

  // Focus management
  focusableElements: [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', '),

  // Screen reader announcements
  announcements: {
    loading: 'Loading content, please wait',
    loaded: 'Content loaded successfully',
    error: 'An error occurred while loading content',
    success: 'Action completed successfully',
  },
} as const;

// Performance Optimizations
export const performance = {
  // Use transform and opacity for GPU acceleration
  gpuAccelerated: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    perspective: 1000,
  },

  // Optimize for mobile devices
  mobileOptimized: {
    transform: 'translateZ(0)', // Force hardware acceleration
    WebkitBackfaceVisibility: 'hidden',
    WebkitPerspective: 1000,
  },
} as const;

// Theme-aware animations
export const themeAnimations = {
  light: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    color: '#1e293b',
  },

  dark: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#f8fafc',
  },
} as const;

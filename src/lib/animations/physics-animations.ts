import { Variants, Transition, MotionProps } from 'framer-motion';

export interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
}

export interface PhysicsPreset {
  name: string;
  description: string;
  spring: SpringConfig;
  duration?: number;
}

export interface AnimationSequence {
  name: string;
  steps: Array<{
    selector: string;
    animation: Variants;
    delay?: number;
  }>;
}

export interface InteractionAnimation {
  hover?: Variants;
  tap?: Variants;
  focus?: Variants;
  drag?: Variants;
}

export interface GestureConfig {
  drag?: boolean | 'x' | 'y';
  dragConstraints?: { top?: number; right?: number; bottom?: number; left?: number };
  dragElastic?: number;
  dragMomentum?: boolean;
  whileHover?: any;
  whileTap?: any;
  whileFocus?: any;
  whileDrag?: any;
}

// Physics presets for different animation types
export const PHYSICS_PRESETS: Record<string, PhysicsPreset> = {
  // Gentle animations for everyday interactions
  gentle: {
    name: 'Gentle',
    description: 'Soft, natural movement for common UI elements',
    spring: { tension: 120, friction: 20, mass: 1 },
  },

  // Snappy animations for immediate feedback
  snappy: {
    name: 'Snappy',
    description: 'Quick, responsive feedback for user actions',
    spring: { tension: 300, friction: 25, mass: 0.8 },
  },

  // Bouncy animations for playful interactions
  bouncy: {
    name: 'Bouncy',
    description: 'Playful bounce effect for engaging interactions',
    spring: { tension: 180, friction: 12, mass: 1 },
  },

  // Smooth animations for transitions
  smooth: {
    name: 'Smooth',
    description: 'Fluid transitions for navigation and layout changes',
    spring: { tension: 100, friction: 26, mass: 1.2 },
  },

  // Wobbly animations for attention-grabbing
  wobbly: {
    name: 'Wobbly',
    description: 'Wobbly effect for drawing attention',
    spring: { tension: 180, friction: 10, mass: 1 },
  },

  // Elastic animations for stretch effects
  elastic: {
    name: 'Elastic',
    description: 'Elastic stretch effect for dynamic interactions',
    spring: { tension: 150, friction: 8, mass: 1 },
  },
};

// Animation variants for common UI patterns
export const ANIMATION_VARIANTS: Record<string, Variants> = {
  // Fade animations
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },

  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },

  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },

  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },

  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },

  // Scale animations
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },

  scaleOut: {
    visible: { opacity: 1, scale: 1 },
    hidden: { opacity: 0, scale: 0.8 },
  },

  // Slide animations
  slideInLeft: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  },

  slideInRight: {
    hidden: { x: '100%' },
    visible: { x: 0 },
  },

  slideInUp: {
    hidden: { y: '100%' },
    visible: { y: 0 },
  },

  slideInDown: {
    hidden: { y: '-100%' },
    visible: { y: 0 },
  },

  // Rotate animations
  rotateIn: {
    hidden: { opacity: 0, rotate: -180 },
    visible: { opacity: 1, rotate: 0 },
  },

  // Flip animations
  flipIn: {
    hidden: { opacity: 0, rotateY: -90 },
    visible: { opacity: 1, rotateY: 0 },
  },

  // Zoom animations
  zoomIn: {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1 },
  },

  // Bounce animations
  bounceIn: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        ...PHYSICS_PRESETS.bouncy.spring,
      },
    },
  },

  // Elastic animations
  elasticIn: {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        ...PHYSICS_PRESETS.elastic.spring,
      },
    },
  },

  // Stagger children
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

// Interactive animation variants
export const INTERACTION_VARIANTS: Record<string, InteractionAnimation> = {
  // Button interactions
  button: {
    hover: {
      scale: 1.05,
      transition: { type: 'spring', ...PHYSICS_PRESETS.snappy.spring },
    },
    tap: {
      scale: 0.95,
      transition: { type: 'spring', ...PHYSICS_PRESETS.snappy.spring },
    },
  },

  // Card interactions
  card: {
    hover: {
      y: -5,
      scale: 1.02,
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      transition: { type: 'spring', ...PHYSICS_PRESETS.gentle.spring },
    },
    tap: {
      scale: 0.98,
      transition: { type: 'spring', ...PHYSICS_PRESETS.snappy.spring },
    },
  },

  // Icon interactions
  icon: {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { type: 'spring', ...PHYSICS_PRESETS.bouncy.spring },
    },
    tap: {
      scale: 0.9,
      rotate: -5,
      transition: { type: 'spring', ...PHYSICS_PRESETS.snappy.spring },
    },
  },

  // Link interactions
  link: {
    hover: {
      scale: 1.02,
      color: '#3b82f6',
      transition: { type: 'spring', ...PHYSICS_PRESETS.gentle.spring },
    },
  },

  // Image interactions
  image: {
    hover: {
      scale: 1.05,
      filter: 'brightness(1.1)',
      transition: { type: 'spring', ...PHYSICS_PRESETS.smooth.spring },
    },
  },

  // Menu item interactions
  menuItem: {
    hover: {
      x: 10,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      transition: { type: 'spring', ...PHYSICS_PRESETS.gentle.spring },
    },
  },

  // Notification interactions
  notification: {
    hover: {
      scale: 1.02,
      y: -2,
      transition: { type: 'spring', ...PHYSICS_PRESETS.gentle.spring },
    },
  },
};

// Page transition variants
export const PAGE_TRANSITIONS: Record<string, Variants> = {
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },

  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },

  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },

  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },

  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },

  rotate: {
    initial: { rotate: -90, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 90, opacity: 0 },
  },
};

// Gesture configurations
export const GESTURE_CONFIGS: Record<string, GestureConfig> = {
  draggable: {
    drag: true,
    dragMomentum: false,
    dragElastic: 0.2,
    whileDrag: { scale: 1.1, rotate: 5 },
  },

  draggableX: {
    drag: 'x',
    dragMomentum: true,
    dragElastic: 0.1,
    whileDrag: { scale: 1.05 },
  },

  draggableY: {
    drag: 'y',
    dragMomentum: true,
    dragElastic: 0.1,
    whileDrag: { scale: 1.05 },
  },

  swipeable: {
    drag: 'x',
    dragConstraints: { left: -100, right: 100 },
    dragElastic: 0.3,
    whileDrag: { opacity: 0.8 },
  },

  pullToRefresh: {
    drag: 'y',
    dragConstraints: { top: 0, bottom: 100 },
    dragElastic: 0.2,
    whileDrag: { scale: 0.95 },
  },
};

// Animation utility class
export class AnimationManager {
  private reducedMotion: boolean = false;

  constructor() {
    this.detectReducedMotion();
  }

  /**
   * Detect user's reduced motion preference
   */
  private detectReducedMotion(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }

  /**
   * Get transition configuration based on physics preset
   */
  getTransition(preset: keyof typeof PHYSICS_PRESETS, override?: Partial<Transition>): Transition {
    const config = PHYSICS_PRESETS[preset];

    if (this.reducedMotion) {
      return {
        duration: 0.1,
        ease: 'linear',
        ...override,
      };
    }

    return {
      type: 'spring',
      ...config.spring,
      ...override,
    };
  }

  /**
   * Get animation variants with reduced motion support
   */
  getVariants(variantName: keyof typeof ANIMATION_VARIANTS): Variants {
    const variants = ANIMATION_VARIANTS[variantName];

    if (this.reducedMotion) {
      // Return simplified variants for reduced motion
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      };
    }

    return variants;
  }

  /**
   * Get interaction variants with reduced motion support
   */
  getInteractionVariants(interactionName: keyof typeof INTERACTION_VARIANTS): InteractionAnimation {
    const variants = INTERACTION_VARIANTS[interactionName];

    if (this.reducedMotion) {
      // Return minimal interaction feedback for reduced motion
      return {
        hover: { opacity: 0.8, transition: { duration: 0.1 } },
        tap: { opacity: 0.6, transition: { duration: 0.1 } },
      };
    }

    return variants;
  }

  /**
   * Create staggered animation for lists
   */
  createStaggerAnimation(itemCount: number, staggerDelay: number = 0.1): Variants {
    if (this.reducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      };
    }

    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    };
  }

  /**
   * Create scroll-triggered animation
   */
  createScrollAnimation(_threshold: number = 0.1): Variants {
    if (this.reducedMotion) {
      return {
        offscreen: { opacity: 0 },
        onscreen: { opacity: 1, transition: { duration: 0.1 } },
      };
    }

    return {
      offscreen: {
        y: 50,
        opacity: 0,
      },
      onscreen: {
        y: 0,
        opacity: 1,
        transition: {
          type: 'spring',
          ...PHYSICS_PRESETS.gentle.spring,
          delay: 0.1,
        },
      },
    };
  }

  /**
   * Create morphing animation between two shapes
   */
  createMorphAnimation(fromPath: string, toPath: string): Variants {
    if (this.reducedMotion) {
      return {
        from: { d: fromPath },
        to: { d: toPath, transition: { duration: 0.1 } },
      };
    }

    return {
      from: { d: fromPath },
      to: {
        d: toPath,
        transition: {
          type: 'spring',
          ...PHYSICS_PRESETS.smooth.spring,
        },
      },
    };
  }

  /**
   * Create particle animation system
   */
  createParticleAnimation(particleCount: number): Array<{
    x: number[];
    y: number[];
    opacity: number[];
    scale: number[];
  }> {
    if (this.reducedMotion) {
      // Return static particles for reduced motion
      return Array.from({ length: particleCount }, () => ({
        x: [0],
        y: [0],
        opacity: [1],
        scale: [1],
      }));
    }

    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;

      return {
        x: [0, Math.cos(angle) * distance, Math.cos(angle) * distance * 1.5],
        y: [0, Math.sin(angle) * distance, Math.sin(angle) * distance * 1.5],
        opacity: [1, 0.8, 0],
        scale: [0.5, 1, 0.5],
      };
    });
  }

  /**
   * Get loading animation variants
   */
  getLoadingAnimation(): Variants {
    if (this.reducedMotion) {
      return {
        loading: { opacity: [1, 0.5, 1], transition: { duration: 1, repeat: Infinity } },
      };
    }

    return {
      loading: {
        rotate: [0, 360],
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        },
      },
      pulse: {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
      dots: {
        y: [0, -10, 0],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };
  }

  /**
   * Check if reduced motion is enabled
   */
  isReducedMotion(): boolean {
    return this.reducedMotion;
  }
}

// Animation sequences for complex interactions
export const ANIMATION_SEQUENCES: Record<string, AnimationSequence> = {
  loginSuccess: {
    name: 'Login Success',
    steps: [
      { selector: '.login-form', animation: ANIMATION_VARIANTS.scaleOut, delay: 0 },
      { selector: '.success-message', animation: ANIMATION_VARIANTS.bounceIn, delay: 0.3 },
      { selector: '.dashboard-preview', animation: ANIMATION_VARIANTS.fadeInUp, delay: 0.6 },
    ],
  },

  dataLoad: {
    name: 'Data Loading',
    steps: [
      { selector: '.skeleton', animation: ANIMATION_VARIANTS.fadeIn, delay: 0 },
      { selector: '.skeleton', animation: ANIMATION_VARIANTS.fadeOut, delay: 1 },
      { selector: '.content', animation: ANIMATION_VARIANTS.staggerContainer, delay: 1.2 },
    ],
  },

  onboarding: {
    name: 'Onboarding Flow',
    steps: [
      { selector: '.step-1', animation: ANIMATION_VARIANTS.slideInRight, delay: 0 },
      { selector: '.step-1', animation: ANIMATION_VARIANTS.slideOutLeft, delay: 3 },
      { selector: '.step-2', animation: ANIMATION_VARIANTS.slideInRight, delay: 3.5 },
      { selector: '.step-2', animation: ANIMATION_VARIANTS.slideOutLeft, delay: 6.5 },
      { selector: '.step-3', animation: ANIMATION_VARIANTS.slideInRight, delay: 7 },
    ],
  },
};

// Motion configuration presets
export const MOTION_PRESETS: Record<string, MotionProps> = {
  fadeInUp: {
    initial: 'hidden',
    animate: 'visible',
    variants: ANIMATION_VARIANTS.fadeInUp,
    transition: { type: 'spring', ...PHYSICS_PRESETS.gentle.spring },
  },

  bounceButton: {
    whileHover: INTERACTION_VARIANTS.button.hover,
    whileTap: INTERACTION_VARIANTS.button.tap,
  },

  floatingCard: {
    whileHover: INTERACTION_VARIANTS.card.hover,
    initial: 'hidden',
    animate: 'visible',
    variants: ANIMATION_VARIANTS.fadeInUp,
  },

  staggerList: {
    initial: 'hidden',
    animate: 'visible',
    variants: ANIMATION_VARIANTS.staggerContainer,
  },

  pageTransition: {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: PAGE_TRANSITIONS.fade,
    transition: { type: 'spring', ...PHYSICS_PRESETS.smooth.spring },
  },
};

// Create global animation manager instance
export const animationManager = new AnimationManager();

// Export default presets
export default {
  PHYSICS_PRESETS,
  ANIMATION_VARIANTS,
  INTERACTION_VARIANTS,
  PAGE_TRANSITIONS,
  GESTURE_CONFIGS,
  ANIMATION_SEQUENCES,
  MOTION_PRESETS,
  AnimationManager,
  animationManager,
};

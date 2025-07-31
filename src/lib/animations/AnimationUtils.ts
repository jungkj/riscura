import React from 'react';
import { useReducedMotion } from '../accessibility/AccessibilityUtils';

// Animation presets
export const animations = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 300,
    easing: 'ease-out',
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: 300,
    easing: 'ease-in',
  },
  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  fadeInDown: {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  fadeInLeft: {
    from: { opacity: 0, transform: 'translateX(-20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  fadeInRight: {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    duration: 400,
    easing: 'ease-out',
  },

  // Scale animations
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    duration: 300,
    easing: 'ease-out',
  },
  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.8)' },
    duration: 300,
    easing: 'ease-in',
  },

  // Slide animations
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  slideInUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
    duration: 400,
    easing: 'ease-out',
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
    duration: 400,
    easing: 'ease-out',
  },

  // Bounce animations
  bounceIn: {
    keyframes: [
      { offset: 0, opacity: 0, transform: 'scale(0.3)' },
      { offset: 0.5, opacity: 1, transform: 'scale(1.05)' },
      { offset: 0.7, transform: 'scale(0.9)' },
      { offset: 1, opacity: 1, transform: 'scale(1)' },
    ],
    duration: 600,
    easing: 'ease-out',
  },

  // Pulse animation
  pulse: {
    keyframes: [
      { offset: 0, transform: 'scale(1)' },
      { offset: 0.5, transform: 'scale(1.05)' },
      { offset: 1, transform: 'scale(1)' },
    ],
    duration: 1000,
    easing: 'ease-in-out',
    iterations: Infinity,
  },

  // Shake animation
  shake: {
    keyframes: [
      { offset: 0, transform: 'translateX(0)' },
      { offset: 0.1, transform: 'translateX(-10px)' },
      { offset: 0.2, transform: 'translateX(10px)' },
      { offset: 0.3, transform: 'translateX(-10px)' },
      { offset: 0.4, transform: 'translateX(10px)' },
      { offset: 0.5, transform: 'translateX(-10px)' },
      { offset: 0.6, transform: 'translateX(10px)' },
      { offset: 0.7, transform: 'translateX(-10px)' },
      { offset: 0.8, transform: 'translateX(10px)' },
      { offset: 0.9, transform: 'translateX(-10px)' },
      { offset: 1, transform: 'translateX(0)' },
    ],
    duration: 600,
    easing: 'ease-in-out',
  },
} as const;

export type AnimationName = keyof typeof animations;

// Easing functions
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeInElastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOutElastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeInBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Animation utilities
export class AnimationUtils {
  public static createAnimation(
    element: HTMLElement,
    animationName: AnimationName,
    options?: {
      duration?: number;
      delay?: number;
      easing?: string;
      iterations?: number;
      direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
      fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
    }
  ): Animation {
    const animation = animations[animationName];
    const animationOptions: KeyframeAnimationOptions = {
      duration: options?.duration || animation.duration,
      delay: options?.delay || 0,
      easing: options?.easing || animation.easing,
      iterations: options?.iterations || 1,
      direction: options?.direction || 'normal',
      fill: options?.fillMode || 'forwards',
    };

    if ('keyframes' in animation) {
      return element.animate(animation.keyframes, animationOptions);
    } else {
      return element.animate([animation.from, animation.to], animationOptions);
    }
  }

  public static animateHeight(
    element: HTMLElement,
    from: number | 'auto',
    to: number | 'auto',
    duration: number = 300
  ): Promise<void> {
    const actualFrom = from === 'auto' ? element.scrollHeight : from;
    const actualTo = to === 'auto' ? element.scrollHeight : to;

    return new Promise((resolve) => {
      const animation = element.animate(
        [{ height: `${actualFrom}px` }, { height: `${actualTo}px` }],
        {
          duration,
          easing: 'ease-out',
          fill: 'forwards',
        }
      );

      animation.addEventListener('finish', () => resolve());
    });
  }

  public static animateWidth(
    element: HTMLElement,
    from: number | 'auto',
    to: number | 'auto',
    duration: number = 300
  ): Promise<void> {
    const actualFrom = from === 'auto' ? element.scrollWidth : from;
    const actualTo = to === 'auto' ? element.scrollWidth : to;

    return new Promise((resolve) => {
      const animation = element.animate(
        [{ width: `${actualFrom}px` }, { width: `${actualTo}px` }],
        {
          duration,
          easing: 'ease-out',
          fill: 'forwards',
        }
      );

      animation.addEventListener('finish', () => resolve());
    });
  }

  public static staggeredAnimation(
    elements: HTMLElement[],
    animationName: AnimationName,
    staggerDelay: number = 100
  ): Promise<void> {
    const promises = elements.map((element, index) => {
      return new Promise<void>((resolve) => {
        const animation = this.createAnimation(element, animationName, {
          delay: index * staggerDelay,
        });
        animation.addEventListener('finish', () => resolve());
      });
    });

    return Promise.all(promises).then(() => {});
  }

  public static createSpringAnimation(
    element: HTMLElement,
    from: Record<string, any>,
    to: Record<string, any>,
    options?: {
      stiffness?: number;
      damping?: number;
      mass?: number;
    }
  ): Animation {
    const { stiffness = 100, damping = 10, mass = 1 } = options || {};

    // Simple spring physics approximation
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    let duration = 1000;
    if (zeta < 1) {
      duration = (4 / (omega * Math.sqrt(1 - zeta * zeta))) * 1000;
    } else {
      duration = (4 / omega) * 1000;
    }

    return element.animate([from, to], {
      duration: Math.min(duration, 2000),
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards',
    });
  }

  public static morphElement(
    element: HTMLElement,
    targetElement: HTMLElement,
    duration: number = 500
  ): Promise<void> {
    const fromRect = element.getBoundingClientRect();
    const toRect = targetElement.getBoundingClientRect();

    const scaleX = toRect.width / fromRect.width;
    const scaleY = toRect.height / fromRect.height;
    const translateX = toRect.left - fromRect.left;
    const translateY = toRect.top - fromRect.top;

    return new Promise((resolve) => {
      const animation = element.animate(
        [
          { transform: 'translate(0, 0) scale(1, 1)' },
          { transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})` },
        ],
        {
          duration,
          easing: 'ease-out',
          fill: 'forwards',
        }
      );

      animation.addEventListener('finish', () => resolve());
    });
  }

  public static createRevealAnimation(
    element: HTMLElement,
    direction: 'left' | 'right' | 'up' | 'down' = 'up',
    duration: number = 600
  ): Animation {
    const transforms = {
      up: ['translateY(100%)', 'translateY(0)'],
      down: ['translateY(-100%)', 'translateY(0)'],
      left: ['translateX(100%)', 'translateX(0)'],
      right: ['translateX(-100%)', 'translateX(0)'],
    };

    return element.animate(
      [
        { transform: transforms[direction][0], opacity: 0 },
        { transform: transforms[direction][1], opacity: 1 },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      }
    );
  }
}

// Intersection Observer based animations
export class ScrollAnimationUtils {
  private static observer: IntersectionObserver | null = null;
  private static callbacks: Map<Element, () => void> = new Map();

  public static initialize(): void {
    if (typeof window === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.callbacks.delete(entry.target);
              this.observer?.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );
  }

  public static animateOnScroll(
    element: HTMLElement,
    animationName: AnimationName,
    options?: {
      threshold?: number;
      rootMargin?: string;
    }
  ): void {
    if (!this.observer) this.initialize();
    if (!this.observer) return;

    const callback = () => {
      AnimationUtils.createAnimation(element, animationName);
    };

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  public static cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

// React hooks for animations
export function useAnimation(
  animationName: AnimationName,
  trigger: boolean = true,
  options?: {
    duration?: number;
    delay?: number;
    easing?: string;
  }
) {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!ref.current || !trigger || prefersReducedMotion) return;

    const animation = AnimationUtils.createAnimation(ref.current, animationName, options);

    return () => {
      animation.cancel();
    };
  }, [animationName, trigger, options, prefersReducedMotion]);

  return ref;
}

export function useStaggeredAnimation(
  animationName: AnimationName,
  itemCount: number,
  trigger: boolean = true,
  staggerDelay: number = 100
) {
  const refs = React.useRef<(HTMLElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!trigger || prefersReducedMotion) return;

    const elements = refs.current.filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    AnimationUtils.staggeredAnimation(elements, animationName, staggerDelay);
  }, [animationName, trigger, staggerDelay, prefersReducedMotion]);

  const setRef = React.useCallback(
    (index: number) => (element: HTMLElement | null) => {
      refs.current[index] = element;
    },
    []
  );

  return setRef;
}

export function useScrollAnimation(
  animationName: AnimationName,
  options?: {
    threshold?: number;
    rootMargin?: string;
  }
) {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;

    ScrollAnimationUtils.animateOnScroll(ref.current, animationName, options);
  }, [animationName, options, prefersReducedMotion]);

  return ref;
}

export function useSpringAnimation(
  from: Record<string, any>,
  to: Record<string, any>,
  trigger: boolean = true,
  options?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  }
) {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!ref.current || !trigger || prefersReducedMotion) return;

    const animation = AnimationUtils.createSpringAnimation(ref.current, from, to, options);

    return () => {
      animation.cancel();
    };
  }, [from, to, trigger, options, prefersReducedMotion]);

  return ref;
}

export function useAnimationQueue() {
  const [queue, setQueue] = React.useState<(() => Promise<void>)[]>([]);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const addToQueue = React.useCallback((animation: () => Promise<void>) => {
    setQueue((prev) => [...prev, animation]);
  }, []);

  const clearQueue = React.useCallback(() => {
    setQueue([]);
  }, []);

  React.useEffect(() => {
    if (queue.length === 0 || isAnimating) return;

    const processQueue = async () => {
      setIsAnimating(true);

      while (queue.length > 0) {
        const animation = queue.shift();
        if (animation) {
          await animation();
        }
      }

      setIsAnimating(false);
    };

    processQueue();
  }, [queue, isAnimating]);

  return { addToQueue, clearQueue, isAnimating, queueLength: queue.length };
}

// CSS Animation utilities
export function generateAnimationCSS(
  animationName: AnimationName,
  className: string = 'animate'
): string {
  const animation = animations[animationName];

  if ('keyframes' in animation) {
    // Generate keyframes CSS
    const keyframesCSS = animation.keyframes
      .map((keyframe, index) => {
        const percent = keyframe.offset * 100;
        const properties = Object.entries(keyframe)
          .filter(([key]) => key !== 'offset')
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        return `${percent}% { ${properties} }`;
      })
      .join('\n  ');

    return `
@keyframes ${className}-${animationName} {
  ${keyframesCSS}
}

.${className}-${animationName} {
  animation: ${className}-${animationName} ${animation.duration}ms ${animation.easing} forwards;
}
    `;
  } else {
    // Generate simple transition CSS
    const fromProps = Object.entries(animation.from)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    const toProps = Object.entries(animation.to)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    return `
.${className}-${animationName}-enter {
  ${fromProps};
  transition: all ${animation.duration}ms ${animation.easing};
}

.${className}-${animationName}-enter-active {
  ${toProps};
}
    `;
  }
}

// Initialize scroll animations
if (typeof window !== 'undefined') {
  ScrollAnimationUtils.initialize();
}

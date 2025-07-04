"use client";

import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';

export type AnimationType = 
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'zoom'
  | 'bounce'
  | 'rotate'
  | 'none';

export interface AnimatedWrapperProps {
  children: React.ReactNode;
  /** Animation type to apply */
  animationType?: AnimationType;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation delay in seconds */
  delay?: number;
  /** Custom easing curve */
  easing?: string | number[];
  /** Whether to animate only when element enters viewport */
  whileInView?: boolean;
  /** Whether to animate only once */
  once?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Distance for slide animations */
  distance?: number;
  /** Custom animation variants */
  customVariants?: Variants;
  /** Whether to respect reduced motion preferences */
  respectReducedMotion?: boolean;
  /** Fallback component for reduced motion users */
  fallbackComponent?: React.ReactNode;
  /** Trigger animation on hover */
  onHover?: boolean;
  /** Trigger animation on tap/click */
  onTap?: boolean;
}

// Predefined animation variants
const getAnimationVariants = (
  type: AnimationType,
  distance: number = 30,
  duration: number = 0.6,
  easing: string | number[] = 'easeOut'
): Variants => {
  const baseTransition = {
    duration,
    ease: easing,
  };

  switch (type) {
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: baseTransition },
      };

    case 'slide-up':
      return {
        hidden: { opacity: 0, y: distance },
        visible: { opacity: 1, y: 0, transition: baseTransition },
      };

    case 'slide-down':
      return {
        hidden: { opacity: 0, y: -distance },
        visible: { opacity: 1, y: 0, transition: baseTransition },
      };

    case 'slide-left':
      return {
        hidden: { opacity: 0, x: distance },
        visible: { opacity: 1, x: 0, transition: baseTransition },
      };

    case 'slide-right':
      return {
        hidden: { opacity: 0, x: -distance },
        visible: { opacity: 1, x: 0, transition: baseTransition },
      };

    case 'scale':
      return {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: baseTransition },
      };

    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 0.5 },
        visible: { opacity: 1, scale: 1, transition: baseTransition },
      };

    case 'bounce':
      return {
        hidden: { opacity: 0, y: -10 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            ...baseTransition, 
            type: 'spring',
            bounce: 0.4,
          } 
        },
      };

    case 'rotate':
      return {
        hidden: { opacity: 0, rotate: -180 },
        visible: { opacity: 1, rotate: 0, transition: baseTransition },
      };

    case 'none':
    default:
      return {
        hidden: {},
        visible: {},
      };
  }
};

// Hook to detect reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animationType = 'fade',
  duration = 0.6,
  delay = 0,
  easing = 'easeOut',
  whileInView = false,
  once = true,
  className = '',
  distance = 30,
  customVariants,
  respectReducedMotion = true,
  fallbackComponent,
  onHover = false,
  onTap = false,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // If user prefers reduced motion and we respect it, render fallback or static content
  if (respectReducedMotion && prefersReducedMotion) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    return <div className={className}>{children}</div>;
  }

  // Use custom variants if provided, otherwise generate from animationType
  const variants = customVariants || getAnimationVariants(animationType, distance, duration, easing);

  // Configure motion props
  const motionProps: any = {
    variants,
    initial: 'hidden',
    className,
    transition: { delay },
  };

  // Add animation triggers based on props
  if (whileInView) {
    motionProps.whileInView = 'visible';
    motionProps.viewport = { once };
  } else {
    motionProps.animate = 'visible';
  }

  // Add interaction animations
  if (onHover) {
    motionProps.whileHover = { scale: 1.05, transition: { duration: 0.2 } };
  }

  if (onTap) {
    motionProps.whileTap = { scale: 0.95, transition: { duration: 0.1 } };
  }

  return <motion.div {...motionProps}>{children}</motion.div>;
};

// Convenient preset components
export const FadeIn: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="fade" />
);

export const SlideUp: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="slide-up" />
);

export const SlideDown: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="slide-down" />
);

export const SlideLeft: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="slide-left" />
);

export const SlideRight: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="slide-right" />
);

export const ScaleIn: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="scale" />
);

export const ZoomIn: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="zoom" />
);

export const BounceIn: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="bounce" />
);

export const RotateIn: React.FC<Omit<AnimatedWrapperProps, 'animationType'>> = (props) => (
  <AnimatedWrapper {...props} animationType="rotate" />
);

// Higher-order component for easy integration
export const withAnimation = <P extends object>(
  Component: React.ComponentType<P>,
  animationProps: Partial<AnimatedWrapperProps> = {}
) => {
  const AnimatedComponent = (props: P) => (
    <AnimatedWrapper {...animationProps}>
      <Component {...props} />
    </AnimatedWrapper>
  );

  AnimatedComponent.displayName = `withAnimation(${Component.displayName || Component.name})`;
  return AnimatedComponent;
};

export default AnimatedWrapper;
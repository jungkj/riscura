'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';

export const TextFlipContainer = ({
  words,
  className,
  cursorClassName,
}: {
  words: string[];
  className?: string;
  cursorClassName?: string;
}) => {
  const [currentWord, setCurrentWord] = React.useState(words[0]);
  const [isAnimating, setIsAnimating] = React.useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check for prefers-reduced-motion on mount and when it changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const startAnimation = useCallback(() => {
    const currentIndex = words.indexOf(currentWord);
    const nextIndex = (currentIndex + 1) % words.length;
    const nextWord = words[nextIndex];
    setCurrentWord(nextWord);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        startAnimation();
      }, 3000); // Wait 3 seconds between word changes
      return () => clearTimeout(timer);
    }
  }, [isAnimating, startAnimation, prefersReducedMotion]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: 10,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 100,
                damping: 10,
              }
        }
        exit={
          prefersReducedMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: -40,
                x: 40,
                filter: 'blur(8px)',
                scale: 2,
                position: 'absolute',
              }
        }
        className={`z-10 inline-block relative text-left ${className}`}
        key={currentWord}
      >
        {prefersReducedMotion ? (
          // Simple text display without animation when reduced motion is preferred
          <span>{currentWord}</span>
        ) : (
          // Animated letter-by-letter display
          currentWord.split('').map((letter, index) => (
            <motion.span
              key={currentWord + index}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
              }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))
        )}
        <motion.span
          initial={{
            opacity: prefersReducedMotion ? 1 : 0,
          }}
          animate={{
            opacity: prefersReducedMotion ? 1 : [0, 1],
          }}
          transition={
            prefersReducedMotion
              ? {}
              : {
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }
          }
          className={`inline-block ml-1 h-4 w-[2px] bg-current ${cursorClassName}`}
        />
      </motion.div>
    </AnimatePresence>
  );
};

"use client";

import React, { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ContainerTextFlipProps {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  animationDuration?: number;
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3000,
  className,
  textClassName,
  animationDuration = 0.5,
}: ContainerTextFlipProps) {
  const id = useId();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState("auto");
  const measureRef = React.useRef<HTMLSpanElement>(null);

  // Calculate the maximum width needed for all words
  const calculateMaxWidth = React.useCallback(() => {
    if (measureRef.current) {
      let maxWidth = 0;
      const originalText = measureRef.current.textContent;
      
      words.forEach(word => {
        measureRef.current!.textContent = word;
        const width = measureRef.current!.scrollWidth;
        maxWidth = Math.max(maxWidth, width);
      });
      
      measureRef.current.textContent = originalText;
      setContainerWidth(`${maxWidth}px`); // No extra padding needed
    }
  }, [words]);

  useEffect(() => {
    calculateMaxWidth();
    // Recalculate on window resize
    const handleResize = () => calculateMaxWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateMaxWidth]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [words, interval]);

  return (
    <div className="relative inline-block">
      {/* Hidden element for measuring text width */}
      <span
        ref={measureRef}
        className={cn(
          "invisible absolute whitespace-nowrap",
          textClassName
        )}
        aria-hidden="true"
      >
        {words[currentWordIndex]}
      </span>

      {/* Visible animated container */}
      <motion.div
        layout
        animate={{ width: containerWidth }}
        transition={{ 
          duration: animationDuration,
          ease: "easeInOut"
        }}
        className={cn(
          "relative inline-flex items-center justify-center font-bold overflow-hidden",
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={currentWordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: animationDuration,
              ease: "easeInOut"
            }}
            className={cn(
              "whitespace-nowrap",
              textClassName
            )}
          >
            {words[currentWordIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
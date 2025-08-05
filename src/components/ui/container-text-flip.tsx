"use client";

import React, { useState, useEffect, useId } from "react";
import { motion } from "framer-motion";
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
  animationDuration = 0.7,
}: ContainerTextFlipProps) {
  const id = useId();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [width, setWidth] = useState(100);
  const textRef = React.useRef<HTMLSpanElement>(null);

  const updateWidthForWord = () => {
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth + 20;
      setWidth(textWidth);
    }
  };

  useEffect(() => {
    updateWidthForWord();
  }, [currentWordIndex]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [words, interval]);

  return (
    <motion.div
      layout
      layoutId={`words-here-${id}`}
      animate={{ width }}
      transition={{ duration: animationDuration }}
      className={cn(
        "relative inline-block rounded-lg pt-2 pb-3 text-center font-bold",
        "bg-gradient-to-b from-gray-100 to-gray-200",
        "shadow-[inset_0_-1px_theme(colors.gray.300),inset_0_1px_theme(colors.white)]",
        "dark:bg-gradient-to-b dark:from-gray-800 dark:to-gray-900",
        "dark:shadow-[inset_0_-1px_theme(colors.gray.600),inset_0_1px_theme(colors.gray.700)]",
        className
      )}
      style={{ width }}
    >
      <span
        ref={textRef}
        className={cn(
          "relative z-10 px-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600",
          textClassName
        )}
      >
        {words[currentWordIndex]}
      </span>
      <motion.div
        key={currentWordIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: animationDuration / 2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className={cn(
            "px-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600",
            textClassName
          )}
        >
          {words[currentWordIndex]}
        </span>
      </motion.div>
    </motion.div>
  );
}
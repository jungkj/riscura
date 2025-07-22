'use client';

import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const FloatingNav = ({
  navItems,
  className,
  onLogin,
  onGetStarted,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
  onLogin?: () => void;
  onGetStarted?: () => void;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      const direction = current - lastScrollY;
      
      if (direction < 0) {
        // Scrolling up
        setVisible(true);
      } else {
        // Scrolling down
        setVisible(false);
      }

      setLastScrollY(current);
    }
  });

  // Show navbar when at the top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100) {
        setVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-gray-200/50 rounded-full bg-white/80 backdrop-blur-xl shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-2 pl-4 py-2 items-center justify-center space-x-4",
          className
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-2">
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="hidden sm:block text-lg font-bold text-[#199BEC]">Riscura</span>
        </Link>
        
        {/* Separator */}
        <div className="hidden sm:block h-5 w-px bg-gray-300" />
        
        {navItems.map((navItem, idx) => (
          <Link
            key={`link-${idx}`}
            href={navItem.link}
            className={cn(
              "relative items-center flex space-x-1 text-gray-600 hover:text-[#199BEC] transition-colors"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm font-medium">{navItem.name}</span>
          </Link>
        ))}
        <div className="flex items-center space-x-2">
          <button 
            onClick={onLogin}
            className="text-sm font-medium text-gray-600 hover:text-[#199BEC] px-4 py-2 transition-colors"
          >
            Login
          </button>
          <button 
            onClick={onGetStarted}
            className="border text-sm font-medium relative border-[#199BEC] bg-[#199BEC] text-white px-4 py-2 rounded-full hover:bg-[#199BEC]/90 transition-colors"
          >
            <span>Get Started</span>
            <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-white to-transparent h-px opacity-50" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
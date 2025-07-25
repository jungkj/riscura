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
  const { scrollY } = useScroll();
  const [isFloating, setIsFloating] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const updateNavbar = () => {
      const currentScrollY = scrollY.get();
      const previousScrollY = scrollY.getPrevious() || 0;
      
      // Transform to floating navbar after scrolling 100px
      if (currentScrollY > 100) {
        setIsFloating(true);
        
        // Hide/show based on scroll direction when floating
        if (currentScrollY > previousScrollY) {
          setHidden(true); // Scrolling down
        } else {
          setHidden(false); // Scrolling up
        }
      } else {
        setIsFloating(false);
        setHidden(false);
      }
    };

    const unsubscribe = scrollY.on("change", updateNavbar);
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <>
      {/* Regular Navbar (when at top) */}
      <motion.nav
        initial={{ opacity: 1, y: 0 }}
        animate={{
          opacity: isFloating ? 0 : 1,
          y: isFloating ? -100 : 0,
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[5000] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.1]",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-bold text-[#199BEC]">Riscura</span>
            </Link>

            {/* Nav Items */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((navItem, idx) => (
                <Link
                  key={`nav-${idx}`}
                  href={navItem.link}
                  className="text-gray-700 hover:text-[#199BEC] transition-colors font-medium"
                >
                  {navItem.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogin}
                className="text-gray-700 hover:text-[#199BEC] font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={onGetStarted}
                className="bg-[#199BEC] text-white px-6 py-2 rounded-full hover:bg-[#199BEC]/90 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Floating Navbar (when scrolled) */}
      <AnimatePresence>
        {isFloating && (
          <motion.div
            initial={{
              opacity: 0,
              y: -100,
              scale: 1.1,
            }}
            animate={{
              y: hidden ? -100 : 0,
              opacity: hidden ? 0 : 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -100,
              scale: 0.9,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-2 pl-8 py-2 items-center justify-center space-x-4",
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
            
            {navItems.map((navItem: any, idx: number) => (
              <Link
                key={`link-${idx}`}
                href={navItem.link}
                className={cn(
                  "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500"
                )}
              >
                <span className="block sm:hidden">{navItem.icon}</span>
                <span className="hidden sm:block text-sm">{navItem.name}</span>
              </Link>
            ))}
            <div className="flex items-center space-x-2">
              <button 
                onClick={onLogin}
                className="border text-sm font-medium relative border-neutral-200 dark:border-white/[0.2] text-black dark:text-white px-4 py-2 rounded-full"
              >
                <span>Login</span>
                <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px" />
              </button>
              <button 
                onClick={onGetStarted}
                className="border text-sm font-medium relative border-neutral-200 dark:border-white/[0.2] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full"
              >
                <span>Get Started</span>
                <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-white to-transparent h-px opacity-40" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
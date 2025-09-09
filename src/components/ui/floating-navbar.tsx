'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
}) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const router = useRouter();

  useMotionValueEvent(scrollY, "change", (current) => {
    const scrollThreshold = 200; // Show after scrolling 200px
    const direction = current - prevScrollY;

    if (current < scrollThreshold) {
      setVisible(false);
    } else if (direction < -5) {
      // Scrolling up - show navbar
      setVisible(true);
    } else if (direction > 5) {
      // Scrolling down - hide navbar
      setVisible(false);
    }

    setPrevScrollY(current);
  });

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -100,
          }}
          transition={{
            duration: 0.2,
          }}
          className={cn(
            "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-2 pl-8 py-2 items-center justify-center space-x-4",
            className
          )}
        >
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura Logo"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="text-sm font-semibold text-[#199BEC] dark:text-white font-inter">Riscura</span>
          </div>

          {navItems.map((navItem: any, idx: number) => (
            <a
              key={`link=${idx}`}
              href={navItem.link}
              className={cn(
                "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500 px-4 py-2 rounded-full transition-colors duration-200"
              )}
            >
              <span className="block sm:hidden">
                {navItem.icon}
              </span>
              <span className="hidden sm:block text-sm font-medium">
                {navItem.name}
              </span>
            </a>
          ))}

          {/* CTA Button - Book a Demo */}
          <button 
            onClick={() => router.push('/auth/register')}
            className="border text-sm font-medium relative border-neutral-200 dark:border-white/[0.2] text-black dark:text-white px-4 py-2 rounded-full transition-all duration-200 hover:shadow-[0px_1px_0px_0px_#FFFFFF40_inset,0px_-1px_0px_0px_#FFFFFF40_inset] hover:dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          >
            <span>Book a Demo</span>
          </button>

          {/* Log In Button in Riscura Blue */}
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-[#199BEC] relative text-white text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 hover:bg-[#199BEC]/90 hover:shadow-lg"
          >
            Log In
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Static navbar for when floating nav is not visible
export const StaticNav = () => {
  const router = useRouter();

  return (
    <nav className="fixed inset-x-0 top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
            <span className="text-2xl font-bold text-[#199BEC] font-inter">Riscura</span>
          </div>
          
          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">About</button>
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">Pricing</button>
            <button 
              onClick={() => router.push('/auth/register')}
              className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors"
            >
              Book a Demo
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 text-sm bg-[#199BEC] hover:bg-[#199BEC]/90 text-white"
            >
              Log In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
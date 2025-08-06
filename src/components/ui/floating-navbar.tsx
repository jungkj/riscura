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
    <AnimatePresence>
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
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "flex max-w-fit fixed top-4 inset-x-0 mx-auto border border-gray-200 rounded-full bg-white/90 backdrop-blur-md shadow-lg z-[5000] pr-2 pl-8 py-2 items-center justify-center space-x-4",
            className
          )}
        >
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="text-lg font-bold text-[#199BEC] font-inter">Riscura</span>
        </div>

        {navItems.map((navItem: any, idx: number) => (
          <button
            key={`link-${idx}`}
            onClick={() => router.push(navItem.link)}
            className={cn(
              "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500"
            )}
          >
            <span className="block sm:hidden">
              {navItem.icon}
            </span>
            <span className="hidden sm:block text-sm font-medium">
              {navItem.name}
            </span>
          </button>
        ))}

        {/* CTA Buttons */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost"
            onClick={() => router.push('/auth/login')}
            className="text-sm px-3 py-1 h-8"
          >
            Login
          </Button>
          <Button 
            onClick={() => router.push('/auth/register')}
            className="text-sm px-4 py-1 h-8 bg-[#199BEC] hover:bg-[#199BEC]/80"
          >
            Get Started
          </Button>
        </div>
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
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">Platform</button>
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">Enterprise</button>
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">Pricing</button>
            <button className="text-gray-600 hover:text-[#199BEC] font-medium transition-colors">Demo</button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 text-sm border-[#199BEC] text-[#199BEC] hover:bg-[#199BEC] hover:text-white"
            >
              Login
            </Button>
            <Button 
              onClick={() => router.push('/auth/register')}
              className="px-4 py-2 text-sm bg-[#199BEC] hover:bg-[#199BEC]/80"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
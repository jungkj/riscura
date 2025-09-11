'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export const PalaceNavbar = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRequestDemo = () => {
    router.push('/auth/register');
  };

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 pt-6"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto w-full max-w-lg">
        <motion.div 
          className={`flex items-center justify-between rounded-full px-4 py-2 transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/90 backdrop-blur-md shadow-lg border border-gray-200/50' 
              : 'bg-white/60 backdrop-blur-sm border border-white/30'
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Logo */}
          <motion.a 
            className="flex items-center gap-2 text-sm text-[#272727] font-light"
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura logo"
              width={19}
              height={25}
              className="object-contain"
            />
            <span className="font-medium">Riscura</span>
          </motion.a>

          {/* CTA Button */}
          <motion.button
            onClick={handleRequestDemo}
            className="rounded-full bg-[#282828] px-4 py-2 text-xs font-normal text-white shadow hover:bg-[#282828]/90 transition-all duration-200"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 4px 12px rgba(40, 40, 40, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Request a demo
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  );
};
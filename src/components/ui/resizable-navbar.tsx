'use client';
import { cn } from '@/lib/utils';
import { Menu, X, Shield } from 'lucide-react';
import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ModernButton } from './modern-button';

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div ref={ref} className={cn('fixed inset-x-0 top-0 z-50 w-full', className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? 'blur(10px)' : 'none',
        boxShadow: visible
          ? '0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset'
          : 'none',
        width: visible ? '70%' : '100%',
        y: visible ? 20 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 250,
        damping: 40,
      }}
      style={{
        minWidth: visible ? '600px' : '700px',
      }}
      className={cn(
        'relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between self-start rounded-full bg-transparent py-2.5 lg:flex',
        visible ? 'px-3' : 'px-5',
        visible && 'bg-white/90',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'hidden flex-1 flex-row items-center justify-center space-x-0.5 text-sm font-medium text-gray-600 transition duration-200 hover:text-gray-800 lg:flex mx-6',
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-2.5 py-1.5 text-gray-700 font-medium hover:text-gray-900 transition-colors whitespace-nowrap text-sm"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-[#199BEC]/10"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? 'blur(10px)' : 'none',
        boxShadow: visible
          ? '0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset'
          : 'none',
        width: visible ? '85%' : '100%',
        paddingRight: visible ? '8px' : '0px',
        paddingLeft: visible ? '8px' : '0px',
        borderRadius: visible ? '12px' : '2rem',
        y: visible ? 16 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 250,
        damping: 40,
      }}
      className={cn(
        'relative z-50 mx-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-center justify-between bg-transparent px-3 py-2.5 lg:hidden',
        visible && 'bg-white/90',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return (
    <div className={cn('flex w-full flex-row items-center justify-between', className)}>
      {children}
    </div>
  );
};

export const MobileNavMenu = ({ children, className, isOpen, onClose }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white/95 backdrop-blur-xl px-6 py-8 shadow-2xl border border-gray-200/50',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return (
    <button onClick={onClick} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
      {isOpen ? (
        <X className="w-5 h-5 text-gray-700" />
      ) : (
        <Menu className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 mr-4 flex items-center px-2 py-1 text-sm font-normal text-black"
    >
      <Image
        src="/images/logo/riscura.png"
        alt="Riscura Logo"
        width={120}
        height={32}
        className="object-contain"
        priority
      />
      <span className="ml-3 text-2xl font-bold text-[#199BEC] font-inter tracking-tight bg-gradient-to-r from-[#199BEC] to-[#0f7dc7] bg-clip-text text-transparent drop-shadow-sm">
        Riscura
      </span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = 'a',
  children,
  className,
  variant = 'primary',
  onClick,
  ...restProps
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'gradient';
  onClick?: () => void;
} & (React.ComponentPropsWithoutRef<'a'> | React.ComponentPropsWithoutRef<'button'>)) => {
  // Create clean button props by excluding href and as
  const buttonProps = Object.fromEntries(
    Object.entries(restProps).filter(([key]) => key !== 'href' && key !== 'as')
  );

  if (variant === 'primary') {
    return (
      <ModernButton
        onClick={onClick}
        className={cn('text-sm', className)}
        type="button"
        {...buttonProps}
      >
        {children}
      </ModernButton>
    );
  }

  if (variant === 'gradient') {
    return (
      <ModernButton
        variant="gradient"
        onClick={onClick}
        className={cn('text-sm', className)}
        type="button"
        {...buttonProps}
      >
        {children}
      </ModernButton>
    );
  }

  return (
    <ModernButton
      variant="outline"
      onClick={onClick}
      className={cn('text-sm bg-transparent', className)}
      type="button"
      {...buttonProps}
    >
      {children}
    </ModernButton>
  );
};

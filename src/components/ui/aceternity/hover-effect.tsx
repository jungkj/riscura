import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverEffectProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  transformOrigin?: string;
}

export const HoverEffect: React.FC<HoverEffectProps> = ({
  children,
  className,
  containerClassName,
  scale = 1.05,
  rotateX = 10,
  rotateY = 10,
  perspective = 1000,
  transformOrigin = 'center',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setMousePosition({
      x: (x - centerX) / centerX,
      y: (y - centerY) / centerY,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn('relative', containerClassName)}
      style={{ perspective }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={cn('relative', className)}
        style={{ transformOrigin }}
        animate={{
          scale: isHovered ? scale : 1,
          rotateX: isHovered ? mousePosition.y * rotateX : 0,
          rotateY: isHovered ? mousePosition.x * rotateY : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
            filter: 'blur(20px)',
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
          }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none overflow-hidden"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                ${Math.atan2(mousePosition.y, mousePosition.x) * (180 / Math.PI) + 90}deg,
                transparent 30%,
                rgba(255, 255, 255, 0.1) 50%,
                transparent 70%
              )`,
            }}
            animate={{
              x: mousePosition.x * 20,
              y: mousePosition.y * 20,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  hoverClassName?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  className,
  hoverClassName,
}) => {
  return (
    <HoverEffect
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300',
        'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600',
        className
      )}
      containerClassName={hoverClassName}
    >
      {children}
    </HoverEffect>
  );
}; 
import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  delay?: number;
  direction?: 'up' | 'down';
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
  delay = 0,
  direction = 'up',
}) => {
  const [displayValue, setDisplayValue] = useState(direction === 'up' ? 0 : value);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const startValue = direction === 'up' ? 0 : value;
    const endValue = direction === 'up' ? value : 0;
    const startTime = performance.now() + delay;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (elapsed < 0) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, delay, direction, isInView]);

  const formatNumber = (num: number): string => {
    const rounded = Number(num.toFixed(decimals));
    const parts = rounded.toString().split('.');

    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    return parts.join('.');
  };

  return (
    <motion.span
      ref={ref}
      className={cn('inline-block', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </motion.span>
  );
};

interface CounterCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const CounterCard: React.FC<CounterCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  decimals,
  icon,
  trend,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-2xl font-bold text-gray-900 dark:text-white"
          duration={1500}
        />

        {trend && (
          <motion.div
            className={cn(
              'flex items-center text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
            {Math.abs(trend.value)}%
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface MetricsGridProps {
  metrics: Array<{
    id: string;
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      isPositive: boolean;
    };
  }>;
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CounterCard {...metric} />
        </motion.div>
      ))}
    </div>
  );
};

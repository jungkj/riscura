'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ChartDataItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface EnhancedChartCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  data: ChartDataItem[];
  totalValue: number;
  variant?: 'default' | 'gradient' | 'modern';
  showTrends?: boolean;
  showActions?: boolean;
  className?: string;
  onItemClick?: (item: ChartDataItem) => void;
  isLoading?: boolean;
}

const chartColors = [
  'bg-blue-500',
  'bg-emerald-500', 
  'bg-amber-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-slate-200 rounded w-32"></div>
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
          <div className="h-3 bg-slate-200 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
          <div className="w-6 h-3 bg-slate-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const EnhancedProgressBar: React.FC<{ 
  percentage: number; 
  color: string;
  animated?: boolean;
}> = ({ percentage, color, animated = true }) => (
  <div className="w-20 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
    <motion.div
      className={cn("h-full rounded-full shadow-sm", color)}
      initial={animated ? { width: 0 } : { width: `${percentage}%` }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
  </div>
);

export const EnhancedChartCard: React.FC<EnhancedChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  data,
  totalValue,
  variant = 'default',
  showTrends = true,
  showActions = true,
  className,
  onItemClick,
  isLoading = false,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const enhancedData = data.map((item, index) => ({
    ...item,
    color: item.color || chartColors[index % chartColors.length],
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <DaisyCard className={cn(
        "relative overflow-hidden border-0 shadow-lg shadow-slate-200/50",
        "bg-gradient-to-br from-white to-slate-50/30",
        "hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300",
        "backdrop-blur-sm border border-slate-200/60"
      )}>
        <DaisyCardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 shadow-sm"
              >
                <Icon className="h-5 w-5 text-slate-600" />
              </motion.div>
              
              <div>
                <DaisyCardTitle className="text-lg font-semibold text-slate-800">
                  {title}
                </DaisyCardTitle>
                {subtitle && (
                  <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DaisyButton variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </DaisyButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                  <DropdownMenuItem>Configure</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        

        <DaisyCardContent className="pt-0">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {enhancedData.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                      "hover:bg-slate-50/80 cursor-pointer group",
                      hoveredItem === item.label && "bg-slate-50 shadow-sm"
                    )}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => onItemClick?.(item)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <motion.div
                        className={cn("w-3 h-3 rounded-full shadow-sm", item.color)}
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {item.label}
                        </span>
                        {showTrends && item.trend && (
                          <div className="flex items-center gap-1">
                            {item.trend.isPositive ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={cn(
                              "text-xs font-medium",
                              item.trend.isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {item.trend.value}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <EnhancedProgressBar 
                        percentage={item.percentage}
                        color={item.color}
                        animated={true}
                      />
                      
                      <div className="text-right min-w-[2rem]">
                        <motion.span 
                          className="text-sm font-semibold text-slate-800"
                          whileHover={{ scale: 1.05 }}
                        >
                          {item.value}
                        </motion.span>
                        <div className="text-xs text-slate-500">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Summary Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 pt-4 border-t border-slate-100"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total Items</span>
                  <DaisyBadge variant="secondary" className="font-semibold">
                    {totalValue}
                  </DaisyBadge>
                </div>
              </motion.div>
            </div>
          )}
        </DaisyCardBody>

        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100/40 to-transparent opacity-60 pointer-events-none" />
      </DaisyCard>
    </motion.div>
  );
}; 
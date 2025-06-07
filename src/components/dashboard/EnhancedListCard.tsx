'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ChevronRight, AlertTriangle, Shield, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListItem {
  id: string;
  title: string;
  description: string;
  value: number;
  subValue?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  metadata?: Record<string, any>;
}

interface EnhancedListCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: ListItem[];
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
  onItemClick?: (item: ListItem) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const priorityStyles = {
  low: {
    badge: 'bg-green-100 text-green-700 border-green-200',
    indicator: 'bg-green-500',
    glow: 'shadow-green-500/20',
  },
  medium: {
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    indicator: 'bg-yellow-500',
    glow: 'shadow-yellow-500/20',
  },
  high: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    indicator: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
  },
  critical: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    indicator: 'bg-red-500',
    glow: 'shadow-red-500/20',
  },
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <div className="w-1 h-12 bg-slate-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="space-y-1">
          <div className="h-6 bg-slate-200 rounded w-12"></div>
          <div className="h-3 bg-slate-200 rounded w-8"></div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-12"
  >
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
      <Shield className="h-8 w-8 text-slate-400" />
    </div>
    <p className="text-slate-500 font-medium">{message}</p>
  </motion.div>
);

const ListItemComponent: React.FC<{
  item: ListItem;
  index: number;
  onClick?: (item: ListItem) => void;
}> = ({ item, index, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const priorityStyle = priorityStyles[item.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-lg cursor-pointer",
        "transition-all duration-200 hover:bg-slate-50/80",
        "border border-transparent hover:border-slate-200/60",
        isHovered && "shadow-sm"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(item)}
    >
      {/* Priority Indicator */}
      <motion.div
        className={cn(
          "w-1 h-12 rounded-full shadow-sm",
          priorityStyle.indicator,
          isHovered && priorityStyle.glow
        )}
        whileHover={{ height: 48, width: 6 }}
        transition={{ type: "spring", stiffness: 300 }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 truncate group-hover:text-slate-900 transition-colors">
              {item.title}
            </h4>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge 
              className={cn(
                "text-xs font-medium border",
                priorityStyle.badge
              )}
            >
              {item.priority}
            </Badge>
            
            <div className="text-right">
              <motion.div 
                className="text-lg font-bold text-slate-800"
                whileHover={{ scale: 1.05 }}
              >
                {item.value}
              </motion.div>
              {item.subValue && (
                <div className="text-xs text-slate-500">
                  {item.subValue}
                </div>
              )}
            </div>
          </div>
        </div>

        {item.status && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
              {item.status}
            </span>
          </div>
        )}
      </div>

      {/* Hover Arrow */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -8
        }}
        transition={{ duration: 0.2 }}
        className="text-slate-400"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.div>

      {/* Selection Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

export const EnhancedListCard: React.FC<EnhancedListCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  items,
  maxItems = 5,
  showViewAll = true,
  className,
  onItemClick,
  onViewAll,
  isLoading = false,
  emptyMessage = "No items found",
}) => {
  const displayItems = items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className={cn(
        "relative overflow-hidden border-0 shadow-lg shadow-slate-200/50",
        "bg-gradient-to-br from-white to-slate-50/30",
        "hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300",
        "backdrop-blur-sm border border-slate-200/60"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 shadow-sm"
              >
                <Icon className="h-5 w-5 text-slate-600" />
              </motion.div>
              
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  {title}
                </CardTitle>
                {subtitle && (
                  <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {showViewAll && hasMoreItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-slate-600 hover:text-slate-800"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {displayItems.map((item, index) => (
                  <ListItemComponent
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={onItemClick}
                  />
                ))}
              </AnimatePresence>

              {hasMoreItems && showViewAll && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 mt-4 border-t border-slate-100"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewAll}
                    className="w-full text-slate-600 hover:text-slate-800 border-slate-200"
                  >
                    View {items.length - maxItems} more items
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>

        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100/40 to-transparent opacity-60 pointer-events-none" />
      </Card>
    </motion.div>
  );
}; 
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProboRiskBadgeProps {
  level: number | string;
  className?: string;
}

const getBadgeVariant = (level: string | number) => {
  if (typeof level === "number") {
    if (level >= 15) {
      level = "CRITICAL";
    } else if (level >= 8) {
      level = "HIGH";
    } else {
      level = "LOW";
    }
  }
  
  switch (level) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "secondary";
    case "LOW":
      return "outline";
    default:
      return "outline";
  }
};

const getBadgeColor = (level: string | number) => {
  if (typeof level === "number") {
    if (level >= 15) {
      level = "CRITICAL";
    } else if (level >= 8) {
      level = "HIGH";
    } else {
      level = "LOW";
    }
  }
  
  switch (level) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
      return "bg-green-100 text-green-800 border-green-200";
    case "NONE":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getLabel = (level: string | number) => {
  if (typeof level === "number") {
    if (level >= 15) {
      return "Critical";
    }
    if (level >= 8) {
      return "High";
    }
    return "Low";
  }
  
  switch (level) {
    case "CRITICAL":
      return "Critical";
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    case "NONE":
      return "None";
    default:
      return "Low";
  }
};

export function ProboRiskBadge({ level, className }: ProboRiskBadgeProps) {
  const label = getLabel(level);
  const colorClasses = getBadgeColor(level);
  
  return (
    <Badge 
      className={cn(
        "text-xs font-medium px-2 py-1",
        colorClasses,
        className
      )}
    >
      {label}
    </Badge>
  );
} 
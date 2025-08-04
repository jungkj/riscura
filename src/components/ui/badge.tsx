import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-[#199BEC] bg-[#199BEC] text-white shadow-sm hover:bg-[#0f7dc7]',
        secondary: 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
        success: 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
        warning: 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
        destructive: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
        outline: 'border border-gray-300 bg-white text-[#191919] hover:bg-gray-50',
        purple: 'border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
        blue: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
};

export { Badge, badgeVariants };

'use client';

import { FC } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNav: FC<BreadcrumbNavProps> = ({ items, className }) => {
  return (
    <nav className={cn('breadcrumb', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <a
            href="/dashboard"
            className="breadcrumb-item flex items-center text-slate-500 hover:text-slate-900"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </a>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="breadcrumb-separator w-4 h-4 mx-2" />
            {item.href && !item.current ? (
              <a href={item.href} className="breadcrumb-item font-medium">
                {item.label}
              </a>
            ) : (
              <span
                className={cn('font-medium', item.current ? 'text-slate-900' : 'text-slate-600')}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

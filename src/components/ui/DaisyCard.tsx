import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  bordered?: boolean;
  glass?: boolean;
}

export const DaisyCard = ({ className, children, compact, bordered, glass, ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        'card bg-base-100 shadow-xl',
        compact && 'card-compact',
        bordered && 'card-bordered',
        glass && 'glass',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

export const DaisyCardBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('card-body', className)} {...props}>
      {children}
    </div>
  );
};

export const DaisyCardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2 className={cn('card-title', className)} {...props}>
      {children}
    </h2>
  );
};

export const DaisyCardActions = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('card-actions justify-end', className)} {...props}>
      {children}
    </div>
  );
};
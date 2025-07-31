import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const DaisySeparator = ({ 
  className, 
  orientation = 'horizontal',
  children,
  ...props 
}: SeparatorProps) => {
  if (children) {
    return (
      <div className={cn('divider', className)} {...props}>
        {children}
      </div>
    );
  };

  return (
    <div
      className={cn(
        orientation === 'horizontal' ? 'divider' : 'divider divider-horizontal',
        className
      )}
      {...props}
    />
  );
};
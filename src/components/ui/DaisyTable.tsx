import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  zebra?: boolean;
  pinRows?: boolean;
  pinCols?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const DaisyTable = ({
  className,
  zebra,
  pinRows,
  pinCols,
  size = 'md',
  children,
  ...props
}: TableProps) => {
  const sizeClasses = {
    xs: 'table-xs',
    sm: 'table-sm',
    md: '',
    lg: 'table-lg',
  };

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'table',
          zebra && 'table-zebra',
          pinRows && 'table-pin-rows',
          pinCols && 'table-pin-cols',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLProgressElement> {
  value?: number;
  max?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
}

export const DaisyProgress = ({
  className,
  value,
  max = 100,
  color = 'primary',
  ...props
}: ProgressProps) => {
  const colorClasses = {
    primary: 'progress-primary',
    secondary: 'progress-secondary',
    accent: 'progress-accent',
    info: 'progress-info',
    success: 'progress-success',
    warning: 'progress-warning',
    error: 'progress-error',
  }

  return (
    <progress
      className={cn('progress w-full', colorClasses[color], className)}
      value={value}
      max={max}
      {...props}
    />
  );
}

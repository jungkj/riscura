import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: boolean;
}

export const DaisyAlert = ({
  className,
  variant = 'info',
  icon = true,
  children,
  ...props
}: AlertProps) => {
  const variantClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  const icons = {
    info: <Info className="h-6 w-6" />,
    success: <CheckCircle className="h-6 w-6" />,
    warning: <AlertCircle className="h-6 w-6" />,
    error: <XCircle className="h-6 w-6" />,
  };

  return (
    <div className={cn('alert', variantClasses[variant], className)} {...props}>
      {Boolean(icon) && icons[variant]}
      <span>{children}</span>
    </div>
  );
};

import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const DaisyLabel = ({ className, children, required, ...props }: LabelProps) => {
  return (
    <label className={cn('label', className)} {...props}>
      <span className="label-text">
        {children}
        {required && <span className="text-error ml-1">*</span>}
      </span>
    </label>
  );
};
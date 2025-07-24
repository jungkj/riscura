import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const DaisyDialog = ({ open, onOpenChange, children, className }: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className={cn('modal-box', className)}>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export const DaisyDialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('relative', className)} {...props}>
      {children}
    </div>
  );
};

export const DaisyDialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const DaisyDialogTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3 className={cn('font-bold text-lg', className)} {...props}>
      {children}
    </h3>
  );
};

export const DaisyDialogDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={cn('text-sm text-base-content/70', className)} {...props}>
      {children}
    </p>
  );
};

export const DaisyDialogFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('modal-action', className)} {...props}>
      {children}
    </div>
  );
};

export const DaisyDialogClose = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <form method="dialog" className="absolute right-2 top-2">
      <button className={cn('btn btn-sm btn-circle btn-ghost', className)} {...props}>
        {children || <X className="h-4 w-4" />}
      </button>
    </form>
  );
};
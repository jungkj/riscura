import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DaisyPopover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange: handleOpenChange } as any);
        }
        return child;
      })}
    </div>
  );
};

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DaisyPopoverTrigger = ({ children, asChild, open, onOpenChange }: PopoverTriggerProps) => {
  const handleClick = () => {
    onOpenChange?.(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  };

  return (
    <button onClick={handleClick} className="cursor-pointer">
      {children}
    </button>
  );
};

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DaisyPopoverContent = ({ 
  children, 
  className, 
  align = 'center', 
  side = 'bottom',
  open,
  onOpenChange,
  ...props 
}: PopoverContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    };

  return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 w-72 rounded-md border bg-base-100 p-4 shadow-md',
        positionClasses[side],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLUListElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  disabled?: boolean;
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {}

export const DaisyDropdownMenu = ({ children }: DropdownMenuProps) => {
  return <div className="dropdown">{children}</div>;
};

export const DaisyDropdownMenuTrigger = ({ children, asChild }: DropdownMenuTriggerProps) => {
  return (
    <label tabIndex={0} className="cursor-pointer">
      {children}
    </label>
  );
};

export const DaisyDropdownMenuContent = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
  ...props
}: DropdownMenuContentProps) => {
  const alignClasses = {
    start: 'dropdown-start',
    center: '',
    end: 'dropdown-end',
  };

  const sideClasses = {
    top: 'dropdown-top',
    right: 'dropdown-right',
    bottom: '',
    left: 'dropdown-left',
  };

  return (
    <ul
      tabIndex={0}
      className={cn(
        'dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52',
        alignClasses[align],
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </ul>
  );
};

export const DaisyDropdownMenuItem = ({
  children,
  className,
  disabled,
  onClick,
  ...props
}: DropdownMenuItemProps) => {
  return (
    <li className={cn(disabled && 'disabled')} {...props}>
      <a onClick={onClick} className={className}>
        {children}
      </a>
    </li>
  );
};

export const DaisyDropdownMenuSeparator = ({ className, ...props }: DropdownMenuSeparatorProps) => {
  return <li className={cn('divider m-0', className)} {...props}></li>;
};

// Label component
export const DaisyDropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <li className="menu-title">
      <span className={cn('text-xs', className)} {...props}>
        {children}
      </span>
    </li>
  );
};

// Group component
export const DaisyDropdownMenuGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => {
  return <>{children}</>;
};

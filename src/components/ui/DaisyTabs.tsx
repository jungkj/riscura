import { cn } from '@/lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (_value: string) => void;
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const DaisyTabs = ({ children, className, ...props }: TabsProps) => {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  );
}

export const DaisyTabsList = ({ children, className, ...props }: TabsListProps) => {
  return (
    <div role="tablist" className={cn('tabs tabs-boxed', className)} {...props}>
      {children}
    </div>
  );
}

export const DaisyTabsTrigger = ({ children, className, value, ...props }: TabsTriggerProps) => {
  return (
    <button role="tab" className={cn('tab', className)} aria-selected={false} {...props}>
      {children}
    </button>
  );
}

export const DaisyTabsContent = ({ children, className, value, ...props }: TabsContentProps) => {
  return (
    <div role="tabpanel" className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

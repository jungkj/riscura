import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, createContext, useContext } from 'react';

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (_value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: React.ReactNode;
}

export const DaisyAccordion = ({
  type = 'single',
  defaultValue = [],
  children,
  className,
  ...props
}: AccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  );

  const toggleItem = (_value: string) => {
    if (type === 'single') {
      setOpenItems((current) => (current.includes(value) ? [] : [value]));
    } else {
      setOpenItems((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('join join-vertical w-full', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const DaisyAccordionItem = ({
  value,
  children,
  className,
  ...props
}: AccordionItemProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <div
      className={cn(
        'collapse collapse-arrow join-item border border-base-300',
        isOpen && 'collapse-open',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface AccordionTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DaisyAccordionTrigger = ({ children, className, ...props }: AccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within AccordionItem');

  return (
    <div
      className={cn('collapse-title text-base font-medium', className)}
      onClick={(e) => {
        const item = e.currentTarget.closest('.collapse');
        const value = item?.getAttribute('data-value');
        if (value) context.toggleItem(value);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DaisyAccordionContent = ({ children, className, ...props }: AccordionContentProps) => {
  return (
    <div className={cn('collapse-content', className)} {...props}>
      {children}
    </div>
  );
};

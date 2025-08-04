import { cn } from '@/lib/utils';
import { forwardRef, createContext, useContext } from 'react';

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (_value: string) => void;
  name?: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (_value: string) => void;
  defaultValue?: string;
  name?: string;
}

export const DaisyRadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, name, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
        <div
          ref={ref}
          className={cn('flex flex-col space-y-2', className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

DaisyRadioGroup.displayName = 'DaisyRadioGroup';

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export const DaisyRadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = useContext(RadioGroupContext);

    return (
      <input
        ref={ref}
        type="radio"
        name={context.name}
        value={value}
        checked={context.value === value}
        onChange={(e) => {
          if (e.target.checked && context.onValueChange) {
            context.onValueChange(value);
          }
        }}
        className={cn('radio', className)}
        {...props}
      />
    );
  }
);

DaisyRadioGroupItem.displayName = 'DaisyRadioGroupItem';

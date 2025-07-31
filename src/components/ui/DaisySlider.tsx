import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

export const DaisySlider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, step = 1, value, onValueChange, onChange, ...props }, ref) => {
    const currentValue = value?.[0] ?? 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      onValueChange?.([newValue]);
      onChange?.(e);
    };

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className={cn('range', className)}
        {...props}
      />
    );
  }
);

DaisySlider.displayName = 'DaisySlider';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DaisyButton } from './DaisyButton';
import { useState } from 'react';

interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: 'single' | 'multiple' | 'range';
  disabled?: (date: Date) => boolean;
}

export const DaisyCalendar = ({
  className,
  selected,
  onSelect,
  mode = 'single',
  disabled,
  ...props
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(
    selected ? new Date(selected) : new Date()
  );

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (disabled?.(date)) return;
    onSelect?.(date);
  }

  const isSelected = (day: number) => {
    if (!selected) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={cn('p-3', className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <DaisyButton
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-7 w-7 p-0" >
  <ChevronLeft className="h-4 w-4" />
</DaisyButton>
        </DaisyButton>
        <div className="text-sm font-medium">{monthName}</div>
        <DaisyButton
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-7 w-7 p-0" >
  <ChevronRight className="h-4 w-4" />
</DaisyButton>
        </DaisyButton>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs text-center text-base-content/60 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const isDisabled = disabled?.(date);
          
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={cn(
                'h-9 w-9 text-sm rounded-md hover:bg-base-200 transition-colors',
                isSelected(day) && 'bg-primary text-primary-content hover:bg-primary',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
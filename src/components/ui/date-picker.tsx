"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DaisyButton } from '@/components/ui/DaisyButton'
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DaisyPopover open={open} onOpenChange={setOpen}>
      <DaisyPopoverTrigger asChild>
        <DaisyButton
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <DaisyCalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </DaisyButton>
      </DaisyPopoverTrigger>
      <DaisyPopoverContent className="w-auto p-0">
        <DaisyCalendar
          mode="single"
          selected={value || undefined}
          onSelect={(date) => {
            onChange?.(date || null)
            setOpen(false)
          }}
          initialFocus
        />
      </DaisyPopoverContent>
    </DaisyPopover>
  )
} 
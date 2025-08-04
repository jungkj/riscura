'use client';

import React from 'react';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { Search } from 'lucide-react';

interface IntegratedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const IntegratedSearch = ({
  value,
  onChange,
  placeholder = 'Search...',
}: IntegratedSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A8A8A8]" />
      <DaisyInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 bg-[#FAFAFA] border-[#D8C3A5] focus:border-[#191919] text-[#191919] placeholder:text-[#A8A8A8] font-inter"
      />
    </div>
  );
}

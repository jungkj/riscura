'use client';

import { useState, useMemo, useCallback } from 'react';
// import { useRisks } from '@/context/RiskContext'
// import { Risk } from '@/types'
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import {
import { DaisyCardTitle, DaisySelect, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyPopover } from '@/components/ui/daisy-components';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyCalendar } from '@/components/ui/DaisyCalendar';
import {
  Filter,
  X,
  Search,
  Settings,
  Save,
  Bookmark,
  Calendar as CalendarIcon,
  ChevronDown,
  Undo,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  search: string;
  categories: string[];
  owners: string[];
  statuses: string[];
  levels: string[];
  scoreRange: [number, number];
  dateRange: {
    from: Date | null;
    to: Date | null;
  }
  impactRange: [number, number];
  likelihoodRange: [number, number];
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  isDefault?: boolean;
}

interface AdvancedFiltersProps {
  className?: string;
  onFiltersChange?: (_filters: FilterState) => void;
  compact?: boolean;
}

const defaultFilters: FilterState = {
  search: '',
  categories: [],
  owners: [],
  statuses: [],
  levels: [],
  scoreRange: [0, 25],
  dateRange: { from: null, to: null },
  impactRange: [1, 5],
  likelihoodRange: [1, 5],
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  className = '',
  onFiltersChange,
  compact = false,
}) => {
  const { getFilteredRisks } = useRisks();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterHistory, setFilterHistory] = useState<FilterState[]>([defaultFilters]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([
    {
      id: 'high-critical',
      name: 'High & Critical Risks',
      filters: { ...defaultFilters, levels: ['high', 'critical'] },
      isDefault: true,
    },
    {
      id: 'recent',
      name: 'Recent Risks',
      filters: { 
        ...defaultFilters, 
        dateRange: { 
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
          to: new Date() 
        } 
      },
      isDefault: true,
    },
  ]);

  const risks = getFilteredRisks();

  // Get unique values for filter options
  const filterOptions = useMemo(() => ({
    categories: [...new Set(risks.map(r => r.category).filter(Boolean))],
    owners: [...new Set(risks.map(r => r.owner).filter(Boolean))],
    statuses: [...new Set(risks.map(r => r.status).filter(Boolean))],
    levels: ['low', 'medium', 'high', 'critical'],
  }), [risks])

  // Apply filters to get filtered risks
  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      // Search filter
      if (filters.search && !risk.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !risk.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(risk.category || '')) {
        return false
      }

      // Owner filter
      if (filters.owners.length > 0 && !filters.owners.includes(risk.owner || '')) {
        return false
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(risk.status || '')) {
        return false
      }

      // Level filter
      if (filters.levels.length > 0) {
        const level = risk.riskScore >= 20 ? 'critical' :
                     risk.riskScore >= 15 ? 'high' :
                     risk.riskScore >= 8 ? 'medium' : 'low'
        if (!filters.levels.includes(level)) {
          return false;
        }
      }

      // Score range filter
      if (risk.riskScore < filters.scoreRange[0] || risk.riskScore > filters.scoreRange[1]) {
        return false
      }

      // Impact range filter
      if (risk.impact < filters.impactRange[0] || risk.impact > filters.impactRange[1]) {
        return false
      }

      // Likelihood range filter
      if (risk.likelihood < filters.likelihoodRange[0] || risk.likelihood > filters.likelihoodRange[1]) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const riskDate = new Date(risk.createdAt)
        if (filters.dateRange.from && riskDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && riskDate > filters.dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [risks, filters]);

  // Update filters and history
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters);
    
    // Add to history
    const newHistory = filterHistory.slice(0, currentHistoryIndex + 1)
    newHistory.push(updatedFilters);
    setFilterHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);

    onFiltersChange?.(updatedFilters);
  }, [filters, filterHistory, currentHistoryIndex, onFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    updateFilters(defaultFilters)
  }, [updateFilters]);

  // Undo/Redo functionality
  const canUndo = currentHistoryIndex > 0
  const canRedo = currentHistoryIndex < filterHistory.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const prevIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(prevIndex);
      setFilters(filterHistory[prevIndex]);
      onFiltersChange?.(filterHistory[prevIndex]);
    }
  }, [canUndo, currentHistoryIndex, filterHistory, onFiltersChange]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const nextIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(nextIndex);
      setFilters(filterHistory[nextIndex]);
      onFiltersChange?.(filterHistory[nextIndex]);
    }
  }, [canRedo, currentHistoryIndex, filterHistory, onFiltersChange]);

  // Preset management
  const applyPreset = useCallback((preset: FilterPreset) => {
    updateFilters(preset.filters)
  }, [updateFilters]);

  const saveCurrentAsPreset = useCallback(() => {
    const name = prompt('Enter preset name:');
    if (name) {
      const newPreset: FilterPreset = {
        id: Date.now().toString(),
        name,
        filters: { ...filters },
      }
      setSavedPresets(prev => [...prev, newPreset]);
    }
  }, [filters]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++;
    if (filters.categories.length > 0) count++;
    if (filters.owners.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.levels.length > 0) count++;
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 25) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.impactRange[0] > 1 || filters.impactRange[1] < 5) count++;
    if (filters.likelihoodRange[0] > 1 || filters.likelihoodRange[1] < 5) count++;
    return count;
  }, [filters]);

  // Multi-select component
  const MultiSelect: React.FC<{
    options: string[]
    value: string[];
    onChange: (_value: string[]) => void;
    placeholder: string;
  }> = ({ options, value, onChange, placeholder }) => {
    const [open, setOpen] = useState(false);

    return (
      <DaisyPopover open={open} onOpenChange={setOpen} >
          <DaisyPopoverTrigger asChild >
            <DaisyButton
            className="w-full justify-between text-left font-normal"
            size="sm" >
  {value.length > 0 ? (
</DaisyPopover>
              <span>{value.length} selected</span>
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </DaisyButton>
        </DaisyPopoverTrigger>
        <DaisyPopoverContent className="w-full p-0" align="start" >
            <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => {
                      const newValue = value.includes(option)
                        ? value.filter((v) => v !== option)
                        : [...value, option];
                      onChange(newValue);
                    }}
                  >
                    <DaisyCheckbox
                      checked={value.includes(option)}
                      className="mr-2" />
{option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DaisyPopoverContent>
      </DaisyPopover>
    );
  }

  return (
    <DaisyCard className={className} >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="flex items-center gap-2" >
  <Filter className="h-5 w-5" />
</DaisyCardTitle>
            Advanced Filters
            {activeFilterCount > 0 && (
              <DaisyBadge className="ml-2" >
  {activeFilterCount}
</DaisyBadge>
              </DaisyBadge>
            )}
          </DaisyCardTitle>
          
          <div className="flex items-center gap-2">
            <DaisyButton size="sm" onClick={handleUndo} disabled={!canUndo} >
  <Undo className="h-4 w-4" />
</DaisyButton>
            </DaisyButton>
            <DaisyButton size="sm" onClick={clearAllFilters} >
  <RotateCcw className="h-4 w-4" />
</DaisyButton>
            </DaisyButton>
            <DaisyButton 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)} />
              <Settings className="h-4 w-4" />
            </DaisyButton>
          </div>
        </div>
        
        {/* Quick Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.search && (
              <DaisyBadge className="gap-1" >
  Search: "{filters.search}"
</DaisyBadge>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ search: '' })} />
              </DaisyBadge>
            )}
            {filters.categories.map(category => (
              <DaisyBadge key={category} className="gap-1" >
  {category}
</DaisyBadge>
                <X 
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilters({ 
                    categories: filters.categories.filter(c => c !== category) 
                  })} />
              </DaisyBadge>
            ))}
            {filters.levels.map(level => (
              <DaisyBadge key={level} className="gap-1" >
  {level}
</DaisyBadge>
                <X 
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilters({ 
                    levels: filters.levels.filter(l => l !== level) 
                  })} />
              </DaisyBadge>
            ))}
          </div>
        )}
      

      {Boolean(isExpanded) && (
        <DaisyCardBody className="space-y-6" >
  {/* Search */}
</DaisyCardBody>
          <div className="space-y-2">
            <DaisyLabel>Search</DaisyLabel>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <DaisyInput
                placeholder="Search risks by title or description..."
                value={filters.search}
                onChange={(e) = />
updateFilters({ search: e.target.value })}
                className="pl-10" />
            </div>
          </div>

          {/* Saved Presets */}
          <div className="space-y-2">
            <DaisyLabel>Quick Presets</DaisyInput>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => (
                <DaisyButton
                  key={preset.id}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="gap-2" />
                  <Bookmark className="h-3 w-3" />
                  {preset.name}
                </DaisyButton>
              ))}
              <DaisyButton
                size="sm"
                onClick={saveCurrentAsPreset}
                className="gap-2" >
  <Save className="h-3 w-3" />
</DaisyButton>
                Save Current
              </DaisyButton>
            </div>
          </div>

          {/* Multi-dimensional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <DaisyLabel>Categories</DaisyLabel>
              <MultiSelect
                options={filterOptions.categories}
                value={filters.categories}
                onChange={(categories) => updateFilters({ categories })}
                placeholder="Select categories" />
            </div>

            <div className="space-y-2">
              <DaisyLabel>Owners</DaisyLabel>
              <MultiSelect
                options={filterOptions.owners}
                value={filters.owners}
                onChange={(owners) => updateFilters({ owners })}
                placeholder="Select owners" />
            </div>

            <div className="space-y-2">
              <DaisyLabel>Risk Levels</DaisyLabel>
              <MultiSelect
                options={filterOptions.levels}
                value={filters.levels}
                onChange={(levels) => updateFilters({ levels })}
                placeholder="Select levels" />
            </div>

            <div className="space-y-2">
              <DaisyLabel>Status</DaisyLabel>
              <MultiSelect
                options={filterOptions.statuses}
                value={filters.statuses}
                onChange={(statuses) => updateFilters({ statuses })}
                placeholder="Select statuses" />
            </div>
          </div>

          {/* Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <DaisyLabel>Risk Score Range</DaisyLabel>
              <div className="flex items-center gap-2">
                <DaisyInput
                  type="number"
                  min="0"
                  max="25"
                  value={filters.scoreRange[0]}
                  onChange={(e) = />
updateFilters({
                    scoreRange: [parseInt(e.target.value) || 0, filters.scoreRange[1]]
                  })}
                  className="w-20" />
                <span>to</span>
                <DaisyInput
                  type="number"
                  min="0"
                  max="25"
                  value={filters.scoreRange[1]}
                  onChange={(e) = />
updateFilters({
                    scoreRange: [filters.scoreRange[0], parseInt(e.target.value) || 25]
                  })}
                  className="w-20" />
              </div>
            </div>

            <div className="space-y-2">
              <DaisyLabel>Impact Range</DaisyInput>
              <div className="flex items-center gap-2">
                <DaisySelect 
                  value={filters.impactRange[0].toString()} 
                  onValueChange={(value) => updateFilters({
                    impactRange: [parseInt(value), filters.impactRange[1]]
                  })}
                >
                  <DaisySelectTrigger className="w-20">
                      <DaisySelectValue />
</DaisySelect>
                  <DaisySelectContent >
                      {[1, 2, 3, 4, 5].map(num => (
                      <DaisySelectItem key={num} value={num.toString()}>{num}</DaisySelectItem>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>
                <span>to</span>
                <DaisySelect 
                  value={filters.impactRange[1].toString()} 
                  onValueChange={(value) => updateFilters({
                    impactRange: [filters.impactRange[0], parseInt(value)]
                  })}
                >
                  <DaisySelectTrigger className="w-20">
                      <DaisySelectValue />
</DaisySelect>
                  <DaisySelectContent >
                      {[1, 2, 3, 4, 5].map(num => (
                      <DaisySelectItem key={num} value={num.toString()}>{num}</DaisySelectItem>
                    ))}
                  </DaisySelectContent>
                </DaisySelect>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Showing {filteredRisks.length} of {risks.length} risks
              </span>
              <span className="text-slate-500">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </span>
            </div>
          </div>
        </DaisyCardBody>
      )}
    </DaisyCard>
  );
} 
'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, ChevronRight, Plus, Filter, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const CommandPalette = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-white/95 backdrop-blur-md text-slate-900',
      className
    )}
    {...props}
  />
));
CommandPalette.displayName = CommandPrimitive.displayName;

interface CommandPaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRisk?: () => void;
  onFilter?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

const CommandPaletteDialog = ({
  open,
  onOpenChange,
  onCreateRisk,
  onFilter,
  onExport,
  onSettings,
}: CommandPaletteDialogProps) => {
  const [search, setSearch] = React.useState('');

  const runCommand = React.useCallback((command: () => void) => {
    setSearch('');
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl command-palette border-0 max-w-2xl">
        <CommandPalette>
          <div className="flex items-center border-b border-slate-200/60 px-4 py-3">
            <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List className="max-h-96 overflow-y-auto overflow-x-hidden p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </CommandPrimitive.Empty>

            <CommandPrimitive.Group heading="Actions" className="mb-4">
              <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </div>
              
              <CommandPrimitive.Item
                onSelect={() => onCreateRisk && runCommand(onCreateRisk)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Create New Risk</div>
                  <div className="text-xs text-slate-500">Add a new risk to the system</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </CommandPrimitive.Item>

              <CommandPrimitive.Item
                onSelect={() => onFilter && runCommand(onFilter)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white">
                  <Filter className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Open Filters</div>
                  <div className="text-xs text-slate-500">Filter and sort risks</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </CommandPrimitive.Item>

              <CommandPrimitive.Item
                onSelect={() => onExport && runCommand(onExport)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-white">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Export Risks</div>
                  <div className="text-xs text-slate-500">Download risk data as CSV</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Navigation" className="mb-4">
              <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Navigation
              </div>
              
              <CommandPrimitive.Item
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-500 text-white">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Go to Settings</div>
                  <div className="text-xs text-slate-500">Configure risk management settings</div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>

            <CommandPrimitive.Group heading="Quick Search">
              <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quick Search
              </div>
              
              <CommandPrimitive.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors">
                <div className="text-slate-500">Search for risks by title, category, or owner...</div>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
          </CommandPrimitive.List>
        </CommandPalette>
      </DialogContent>
    </Dialog>
  );
};

export { CommandPalette, CommandPaletteDialog }; 
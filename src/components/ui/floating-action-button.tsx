'use client';

import { FC, useState } from 'react';
import { Plus, X, FileText, Filter, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FloatingAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  onPrimaryAction: () => void;
  actions?: FloatingAction[];
  className?: string;
}

export const FloatingActionButton: FC<FloatingActionButtonProps> = ({
  onPrimaryAction,
  actions = [],
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultActions: FloatingAction[] = [
    {
      icon: FileText,
      label: 'View Reports',
      onClick: () => console.log('View reports'),
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      icon: Filter,
      label: 'Open Filters',
      onClick: () => console.log('Open filters'),
      color: 'bg-amber-500 hover:bg-amber-600'
    },
    {
      icon: Download,
      label: 'Export Data',
      onClick: () => console.log('Export data'),
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const finalActions = actions.length > 0 ? actions : defaultActions;

  const handlePrimaryClick = () => {
    if (finalActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      onPrimaryAction();
    }
  };

  const handleActionClick = (action: FloatingAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3', className)}>
      {/* Secondary Actions */}
      {isExpanded && finalActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <div
            key={index}
            className="flex items-center space-x-3 animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-slate-200/60">
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                {action.label}
              </span>
            </div>
            <Button
              onClick={() => handleActionClick(action)}
              className={cn(
                'w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110',
                action.color || 'bg-slate-500 hover:bg-slate-600'
              )}
            >
              <Icon className="w-5 h-5 text-white" />
            </Button>
          </div>
        );
      })}

      {/* Primary Action Button */}
      <Button
        onClick={finalActions.length > 0 ? handlePrimaryClick : onPrimaryAction}
        className="fab relative"
      >
        <div className={cn(
          'transition-transform duration-300',
          isExpanded ? 'rotate-45' : 'rotate-0'
        )}>
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </div>
      </Button>

      {/* Backdrop for closing when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}; 
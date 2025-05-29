import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  RefreshCw, 
  Sparkles, 
  Lightbulb, 
  Shield, 
  Search, 
  AlertTriangle,
  Zap,
  HelpCircle
} from 'lucide-react';

import { AIAction } from './SelectableContent';
import { TextSelection } from '@/hooks/useTextSelection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface AIActionToolbarProps {
  selection: TextSelection;
  position: { x: number; y: number };
  onAction: (action: AIAction) => void;
  availableActions: AIAction[];
  isProcessing?: boolean;
  className?: string;
}

interface ActionConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  shortcut?: string;
  color: string;
  priority: number;
}

const actionConfigs: Record<AIAction, ActionConfig> = {
  explain: {
    icon: HelpCircle,
    label: 'Explain',
    description: 'Get AI explanation of selected content',
    shortcut: 'E',
    color: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30',
    priority: 1,
  },
  regenerate: {
    icon: RefreshCw,
    label: 'Regenerate',
    description: 'Generate alternative version using AI',
    shortcut: 'R',
    color: 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30',
    priority: 2,
  },
  improve: {
    icon: Sparkles,
    label: 'Improve',
    description: 'Enhance content with AI suggestions',
    shortcut: 'I',
    color: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30',
    priority: 3,
  },
  alternatives: {
    icon: Lightbulb,
    label: 'Alternatives',
    description: 'Generate alternative approaches',
    shortcut: 'A',
    color: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
    priority: 4,
  },
  'compliance-check': {
    icon: Shield,
    label: 'Compliance',
    description: 'Check against compliance requirements',
    shortcut: 'C',
    color: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30',
    priority: 5,
  },
  'find-related': {
    icon: Search,
    label: 'Find Related',
    description: 'Find related content and dependencies',
    shortcut: 'F',
    color: 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
    priority: 6,
  },
  'analyze-risk': {
    icon: AlertTriangle,
    label: 'Analyze Risk',
    description: 'Perform detailed risk analysis',
    shortcut: 'T',
    color: 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30',
    priority: 7,
  },
  'suggest-controls': {
    icon: Zap,
    label: 'Controls',
    description: 'Suggest risk control measures',
    shortcut: 'S',
    color: 'text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30',
    priority: 8,
  },
};

export const AIActionToolbar: React.FC<AIActionToolbarProps> = ({
  selection,
  position,
  onAction,
  availableActions,
  isProcessing = false,
  className,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Sort actions by priority and filter available ones
  const sortedActions = availableActions
    .sort((a, b) => actionConfigs[a].priority - actionConfigs[b].priority)
    .slice(0, 6); // Limit to 6 actions for UI space

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isProcessing) return;

      // Handle shortcuts
      const key = event.key.toLowerCase();
      const action = Object.entries(actionConfigs).find(
        ([actionKey, config]) => 
          availableActions.includes(actionKey as AIAction) && 
          config.shortcut?.toLowerCase() === key
      );

      if (action && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onAction(action[0] as AIAction);
      }

      // Handle Escape to close toolbar
      if (event.key === 'Escape') {
        // This would be handled by parent component
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [availableActions, isProcessing, onAction]);

  // Calculate toolbar position with boundary checks
  const getToolbarStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      zIndex: 50,
    };

    // Adjust position if toolbar would go off-screen
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Adjust horizontal position
      if (position.x + rect.width > viewportWidth - 20) {
        baseStyle.left = viewportWidth - rect.width - 20;
      }

      // Adjust vertical position
      if (position.y < 0) {
        baseStyle.top = position.y + selection.boundingRect.height + 10;
      }
    }

    return baseStyle;
  };

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2 }}
        style={getToolbarStyle()}
        className={cn(
          'bg-card border border-border rounded-lg shadow-lg p-1',
          'flex items-center gap-1',
          'backdrop-blur-sm',
          className
        )}
        data-toolbar
      >
        {/* Selection Info */}
        <div className="px-2 py-1 text-xs text-muted-foreground border-r border-border">
          {selection.text.length} chars
        </div>

        {/* Action Buttons */}
        {sortedActions.map((action) => {
          const config = actionConfigs[action];
          const Icon = config.icon;

          return (
            <Tooltip key={action}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(action)}
                  disabled={isProcessing}
                  className={cn(
                    'h-8 w-8 p-0 transition-colors',
                    config.color,
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="text-center">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {config.description}
                  </div>
                  {config.shortcut && (
                    <div className="text-xs mt-1 opacity-70">
                      {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + {config.shortcut}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* AI Brain Icon */}
        <div className="px-2 py-1 border-l border-border">
          <motion.div
            animate={isProcessing ? { rotate: 360 } : {}}
            transition={isProcessing ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          >
            <Brain className={cn(
              'h-4 w-4',
              isProcessing ? 'text-blue-500' : 'text-muted-foreground'
            )} />
          </motion.div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
              Processing...
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}; 
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Link,
  ChevronRight,
  X
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SmartContextSuggestion } from '@/services/ContextIntelligenceService';

interface SmartContextSuggestionsProps {
  suggestions: SmartContextSuggestion[];
  onApplySuggestion: (suggestion: SmartContextSuggestion) => Promise<void>;
  onDismiss?: (suggestionId: string) => void;
  className?: string;
  compact?: boolean;
}

const suggestionIcons = {
  data_insight: Lightbulb,
  missing_context: AlertCircle,
  related_entity: Link,
  action_item: Clock,
  efficiency_tip: Zap
};

const suggestionColors = {
  data_insight: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  missing_context: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
  related_entity: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
  action_item: 'text-red-500 bg-red-50 dark:bg-red-950/20',
  efficiency_tip: 'text-green-500 bg-green-50 dark:bg-green-950/20'
};

const SuggestionCard: React.FC<{
  suggestion: SmartContextSuggestion;
  onApply: () => Promise<void>;
  onDismiss?: () => void;
  compact?: boolean;
}> = ({ suggestion, onApply, onDismiss, compact = false }) => {
  const Icon = suggestionIcons[suggestion.type];
  const colorClasses = suggestionColors[suggestion.type];
  const [isApplying, setIsApplying] = React.useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
    } finally {
      setIsApplying(false);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'data_insight': return 'Data Insight';
      case 'missing_context': return 'Missing Context';
      case 'related_entity': return 'Related Entity';
      case 'action_item': return 'Action Required';
      case 'efficiency_tip': return 'Efficiency Tip';
      default: return type.replace('_', ' ');
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
      >
        <div className={`p-2 rounded-lg ${colorClasses}`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.title}</p>
          <p className="text-xs text-muted-foreground truncate">{suggestion.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${getRelevanceColor(suggestion.relevanceScore)}`} />
            <span className="text-xs text-muted-foreground">
              {Math.round(suggestion.relevanceScore * 100)}%
            </span>
          </div>

          {suggestion.quickAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleApply}
              disabled={isApplying}
              className="text-xs px-2"
            >
              {isApplying ? 'Applying...' : suggestion.quickAction.label}
            </Button>
          )}

          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-md transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{suggestion.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getTypeLabel(suggestion.type)}
                  </Badge>
                  {suggestion.actionRequired && (
                    <Badge variant="destructive" className="text-xs">
                      Action Required
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Relevance</div>
                <div className="flex items-center gap-1">
                  <Progress 
                    value={suggestion.relevanceScore * 100} 
                    className="h-1 w-12"
                  />
                  <span className="text-xs font-medium">
                    {Math.round(suggestion.relevanceScore * 100)}%
                  </span>
                </div>
              </div>

              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="mb-4">
            {suggestion.description}
          </CardDescription>

          {suggestion.quickAction && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Quick Action Available
              </div>
              
              <Button
                onClick={handleApply}
                disabled={isApplying}
                size="sm"
                className="group"
              >
                {isApplying ? (
                  'Applying...'
                ) : (
                  <>
                    {suggestion.quickAction.label}
                    <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const SmartContextSuggestions: React.FC<SmartContextSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
  onDismiss,
  className = '',
  compact = false
}) => {
  const [dismissedSuggestions, setDismissedSuggestions] = React.useState<Set<string>>(new Set());

  const visibleSuggestions = suggestions.filter(
    suggestion => !dismissedSuggestions.has(suggestion.id)
  );

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    onDismiss?.(suggestionId);
  };

  const handleApply = async (suggestion: SmartContextSuggestion) => {
    await onApplySuggestion(suggestion);
    // Auto-dismiss after successful application
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const urgentSuggestions = visibleSuggestions.filter(s => s.actionRequired);
  const otherSuggestions = visibleSuggestions.filter(s => !s.actionRequired);

  if (visibleSuggestions.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <AnimatePresence>
          {visibleSuggestions.slice(0, 5).map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={() => handleApply(suggestion)}
              onDismiss={() => handleDismiss(suggestion.id)}
              compact
            />
          ))}
        </AnimatePresence>
        
        {visibleSuggestions.length > 5 && (
          <div className="text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              +{visibleSuggestions.length - 5} more suggestions
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {urgentSuggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Action Required ({urgentSuggestions.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {urgentSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApply(suggestion)}
                  onDismiss={onDismiss ? () => handleDismiss(suggestion.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {otherSuggestions.length > 0 && (
        <div>
          {urgentSuggestions.length > 0 && <Separator />}
          
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold">
              Smart Suggestions ({otherSuggestions.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {otherSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApply(suggestion)}
                  onDismiss={onDismiss ? () => handleDismiss(suggestion.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Suggestions are generated based on your current context and activity patterns
          </p>
        </div>
      )}
    </div>
  );
}; 
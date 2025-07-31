import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

import { ARIAChat } from './ARIAChat';
import { useARIAChat, RiskContext } from '@/hooks/useARIAChat';
import { useAI } from '@/context/AIContext';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { DaisyCard } from '@/components/ui/DaisyCard';

interface ARIAWidgetProps {
  initialContext?: RiskContext;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  disabled?: boolean;
}

interface ProactiveSuggestion {
  id: string;
  title: string;
  description: string;
  context?: RiskContext;
  action?: () => void;
  type: 'risk_alert' | 'insight' | 'recommendation' | 'notification';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
}

const ProactiveSuggestionCard: React.FC<{
  suggestion: ProactiveSuggestion;
  onDismiss: () => void;
  onAccept: () => void;
}> = ({ suggestion, onDismiss, onAccept }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'risk_alert': return <DaisyAlertCircle className="h-4 w-4 text-amber-500" >
  ;
</DaisyAlertCircle>
      case 'insight': return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'recommendation': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="mb-3"
    >
      <DaisyCard className={cn(
        "p-3 shadow-lg border-l-4 max-w-sm",
        getPriorityColor(suggestion.priority)
      )} >
  <div className="flex items-start gap-3">
</DaisyCard>
          {getIcon(suggestion.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground">
              {suggestion.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <DaisyButton 
                size="sm" 
                variant="outline" 
                onClick={onAccept}
                className="h-6 text-xs" >
  Open ARIA
</DaisyButton>
              </DaisyButton>
              <DaisyButton 
                size="sm" 
                variant="ghost" 
                onClick={onDismiss}
                className="h-6 text-xs" >
  Dismiss
</DaisyButton>
              </DaisyButton>
            </div>
          </div>
          <DaisyButton 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" >
  <X className="h-3 w-3" />
</DaisyButton>
          </DaisyButton>
        </div>
      </DaisyCard>
    </motion.div>
  );
};

export const ARIAWidget: React.FC<ARIAWidgetProps> = ({
  initialContext,
  position = 'bottom-right',
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { state } = useARIAChat(initialContext);
  const { toggleARIA } = useAI();

  // Position classes based on prop
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K to toggle ARIA
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleToggleChat();
      }
      
      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mock proactive suggestions (in production, these would come from AI analysis)
  useEffect(() => {
    if (disabled) return;

    // Simulate proactive suggestions
    const suggestionsTimer = setTimeout(() => {
      const mockSuggestions: ProactiveSuggestion[] = [
        {
          id: '1',
          title: 'High Risk Alert',
          description: 'A critical operational risk has been identified that requires immediate attention.',
          type: 'risk_alert',
          priority: 'high',
          timestamp: new Date(),
          action: () => handleToggleChat(),
        },
        {
          id: '2',
          title: 'AI Insight Available',
          description: 'New patterns detected in your risk data. Review recommended actions.',
          type: 'insight',
          priority: 'medium',
          timestamp: new Date(),
          action: () => handleToggleChat(),
        }
      ];

      // Only show suggestions if chat is closed
      if (!isOpen && Math.random() > 0.7) {
        setSuggestions(prev => [...prev, ...mockSuggestions.slice(0, 1)]);
      }
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(suggestionsTimer);
  }, [isOpen, disabled]);

  // Check for unread messages
  useEffect(() => {
    if (state.messages.length > 0 && !isOpen) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setHasUnreadMessages(true);
      }
    } else {
      setHasUnreadMessages(false);
    }
  }, [state.messages, isOpen]);

  // Handle chat toggle
  const handleToggleChat = useCallback(() => {
    setIsOpen(!isOpen);
    setHasUnreadMessages(false);
    toggleARIA();
  }, [isOpen, toggleARIA]);

  // Handle suggestion acceptance
  const handleAcceptSuggestion = useCallback((suggestion: ProactiveSuggestion) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setIsOpen(true);
    setHasUnreadMessages(false);
    
    // If suggestion has context, use it
    if (suggestion.context) {
      // Would set context in the chat
    }
    
    // Execute suggestion action
    suggestion.action?.();
  }, []);

  // Handle suggestion dismissal
  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  // Auto-hide on scroll (optional)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      
      if (isScrollingDown && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (disabled || !isVisible) return null;

  return (
    <DaisyTooltipProvider />
      <div className={cn('fixed z-50', getPositionClasses(), className)}>
        {/* Proactive Suggestions */}
        <AnimatePresence>
          {suggestions.map((suggestion) => (
            <ProactiveSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={() => handleDismissSuggestion(suggestion.id)}
              onAccept={() => handleAcceptSuggestion(suggestion)}
            />
          ))}
        </AnimatePresence>

        {/* Main Chat Interface */}
        <AnimatePresence>
          {isOpen && (
            <ARIAChat
              context="general"
              className="mb-4"
            />
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <DaisyTooltip />
            <DaisyTooltipTrigger asChild />
              <DaisyButton
                onClick={handleToggleChat}
                size="lg"
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
                  "bg-[#D8C3A5] hover:bg-[#C4AE96] border-2 border-[#191919] dark:border-[#FAFAFA]",
                  "text-[#191919] hover:text-[#000000]",
                  isOpen && "bg-[#191919] hover:bg-[#2A2A2A] text-[#FAFAFA] border-[#D8C3A5]"
                )} >
  <AnimatePresence mode="wait">
</DaisyTooltipProvider>
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bot"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </DaisyButton>
            </DaisyTooltipTrigger>
            <DaisyTooltipContent side="left" className="bg-[#191919] text-[#FAFAFA] border-[#D8C3A5]" />
              <div className="flex flex-col items-center">
                <span>{isOpen ? 'Close ARIA' : 'Open ARIA'}</span>
                <span className="text-xs text-[#D8C3A5]">Ctrl+K</span>
              </div>
            </DaisyTooltipContent>
          </DaisyTooltip>

          {/* Notification Badges */}
          <AnimatePresence>
            {hasUnreadMessages && !isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <DaisyBadge 
                  className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse bg-[#191919] text-[#FAFAFA] border-[#D8C3A5]" >
  {state.messages.filter(m => m.role === 'assistant').length}
</DaisyBadge>
                </DaisyBadge>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {suggestions.length > 0 && !isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -left-2"
              >
                <div className="h-4 w-4 bg-[#D8C3A5] rounded-full animate-ping" />
                <div className="absolute inset-0 h-4 w-4 bg-[#D8C3A5] rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Indicator */}
          {state.isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 rounded-full border-2 border-[#191919] dark:border-[#FAFAFA]"
            >
              <div className="w-full h-full rounded-full border-t-2 border-[#D8C3A5]" />
            </motion.div>
          )}
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1"
        >
          <div className={cn(
            "h-3 w-3 rounded-full border-2 border-[#FAFAFA] dark:border-[#191919]",
            state.isConnected ? "bg-green-500" : "bg-red-500"
          )} />
        </motion.div>
      </div>
    
  );
}; 
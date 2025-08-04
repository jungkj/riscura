import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { formatDistanceToNow } from 'date-fns';
import { 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  User,
  Volume2,
  VolumeX,
  Download,
  ExternalLink
} from 'lucide-react';

import { ChatMessage as ChatMessageType, AISuggestion } from '@/hooks/useARIAChat';
// import { AgentType } from '@/types/ai.types';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger, DaisyDropdownMenuSeparator } from '@/components/ui/DaisyDropdown';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { useToast } from '@/hooks/use-toast';

interface MessageAttachment {
  id: string;
  type: string;
  title: string;
  url?: string;
}

interface MessageAttachmentProps {
  attachment: MessageAttachment;
  onView?: () => void;
  onDownload?: () => void;
}

interface ChatMessageProps {
  message: ChatMessageType;
  isAI: boolean;
  agentType?: AgentType;
  onRegenerate?: () => void;
  onCopy?: () => void;
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
  isLast?: boolean;
  className?: string;
}

const MessageAttachment: React.FC<MessageAttachmentProps> = ({ 
  attachment, 
  onView, 
  onDownload 
}) => {
  const getAttachmentIcon = (_type: string) => {
    switch (type) {
      case 'risk': return '⚠️';
      case 'control': return '🛡️';
      case 'document': return '📄';
      case 'file': return '📎';
      default: return '📎';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md border">
      <span className="text-sm">{getAttachmentIcon(attachment.type)}</span>
      <span className="text-sm font-medium truncate flex-1">{attachment.title}</span>
      <div className="flex gap-1">
        {Boolean(onView) && (
          <DaisyButton variant="ghost" size="sm" onClick={onView} >
  <ExternalLink className="h-3 w-3" />
</DaisyButton>
          </DaisyButton>
        )}
        {Boolean(onDownload) && (
          <DaisyButton variant="ghost" size="sm" onClick={onDownload} >
  <Download className="h-3 w-3" />
</DaisyButton>
          </DaisyButton>
        )}
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<{
  suggestion: AISuggestion;
  onApply: (suggestion: AISuggestion) => void;
}> = ({ suggestion, onApply }) => {
  const getSuggestionIcon = (_type: string) => {
    switch (type) {
      case 'analysis': return '🔍';
      case 'recommendation': return '💡';
      case 'action': return '⚡';
      case 'explanation': return '❓';
      default: return '💡';
    }
  };

  return (
    <DaisyCard className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800" >
  <div className="flex items-start gap-3">
</DaisyCard>
        <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{suggestion.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
        </div>
        <DaisyButton 
          size="sm" 
          variant="outline" 
          onClick={() =>
          onApply(suggestion)}
          className="ml-2" />
          Apply
        
        </DaisyButton>
      </div>
    </DaisyCard>
  );
};

// Simple text formatter for basic markdown-like features
const formatMessageContent = (_content: string) => {
  // Convert **bold** to <strong>
  const boldFormatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  const italicFormatted = boldFormatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert `code` to <code>
  const codeFormatted = italicFormatted.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-accent text-sm">$1</code>');
  
  // Convert line breaks
  const lineBreakFormatted = codeFormatted.replace(/\n/g, '<br>');
  
  return lineBreakFormatted;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isAI,
  agentType = 'general_assistant',
  onRegenerate,
  onCopy,
  onApplySuggestion,
  onFeedback,
  isLast = false,
  className,
}) => {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isLast && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isLast, message.content]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied.",
      });
      onCopy?.();
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy message content.",
        variant: "destructive",
      });
    }
  }, [message.content, toast, onCopy]);

  const handleSpeak = useCallback(() => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  }, [message.content, isSpeaking]);

  const handleFeedback = useCallback((_type: 'positive' | 'negative') => {
    onFeedback?.(message.id, type);
    toast({
      title: "Feedback received",
      description: `Thanks for your ${type} feedback!`,
    });
  }, [message.id, onFeedback, toast]);

  const getAgentAvatar = (_agentType: AgentType) => {
    const avatars = {
      risk_analyzer: '🔍',
      control_advisor: '🛡️',
      compliance_expert: '📋',
      general_assistant: '🤖',
    };
    return avatars[agentType];
  };

  const getStatusIcon = () => {
    if (message.isError) return <XCircle className="h-4 w-4 text-destructive" />;
    if (message.isStreaming) return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const messageAlignment = isAI ? 'flex-start' : 'flex-end';
  const messageMaxWidth = isAI ? '85%' : '75%';

  return (
    <DaisyTooltipProvider>
        <motion.div
        ref={messageRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "flex gap-3 mb-4",
          isAI ? "justify-start" : "justify-end",
          className
        )}
        style={{ alignItems: 'flex-start' }}
      >
        {/* Avatar */}
        {Boolean(isAI) && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
            {getAgentAvatar(agentType)}
          </div>
        )}

        {/* Message Content */}
        <div 
          className="flex flex-col gap-2"
          style={{ 
            alignItems: messageAlignment,
            maxWidth: messageMaxWidth 
          }}
        >
          {/* Message Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isAI ? (
              <>
                <Bot className="h-3 w-3" />
                <span>ARIA</span>
                {agentType !== 'general_assistant' && (
                  <DaisyBadge variant="secondary" className="text-xs" >
  {agentType.replace('_', ' ')}
</DaisyTooltipProvider>
                  </DaisyBadge>
                )}
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                <span>You</span>
              </>
            )}
            <DaisySeparator orientation="vertical" className="h-3" />
<DaisyTooltip>
                <DaisyTooltipTrigger>
                  <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
              </DaisySeparator>
              <DaisyTooltipContent>
                  {message.timestamp.toLocaleString()}
              </DaisyTooltipContent>
            </DaisyTooltip>
            {getStatusIcon()}
          </div>

          {/* Message Bubble */}
          <DaisyCard 
            className={cn(
              "relative p-4 max-w-none",
              isAI 
                ? "bg-card border-border" 
                : "bg-primary text-primary-foreground ml-auto",
              message.isError && "border-destructive bg-destructive/10"
            )} >
  {/* Message Content */}
</DaisyCard>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: formatMessageContent(message.content) 
              }} />
            {/* Token Usage (for AI messages) */}
            {Boolean(isAI) && message.usage && (
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tokens: {message.usage.totalTokens}</span>
                  <span>Cost: ${message.usage.estimatedCost.toFixed(4)}</span>
                </div>
              </div>
            )}

            {/* Message Actions */}
            <div className="absolute -bottom-2 right-2 flex gap-1">
              <DaisyDropdownMenu >
                  <DaisyDropdownMenuTrigger asChild >
                    <DaisyButton 
                    variant="secondary" 
                    size="sm" 
                    className="h-6 w-6 p-0 bg-background border shadow-sm" >
  <MoreHorizontal className="h-3 w-3" />
</DaisyDropdownMenu>
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent align="end" >
                    <DaisyDropdownMenuItem onClick={handleCopy} >
                      <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DaisyDropdownMenuContent>
                  
                  {Boolean(isAI) && onRegenerate && (
                    <DaisyDropdownMenuItem onClick={onRegenerate} >
                        <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </DaisyDropdownMenuItem>
                  )}
                  
                  <DaisyDropdownMenuItem onClick={handleSpeak} >
                      {isSpeaking ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Speak
                      </>
                    )}
                  </DaisyDropdownMenuItem>

                  {Boolean(isAI) && onFeedback && (
                    <>
                      <DaisyDropdownMenuSeparator />
<DaisyDropdownMenuItem onClick={() => handleFeedback('positive')} />
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Good response
                      </DaisyDropdownMenuSeparator>
                      <DaisyDropdownMenuItem onClick={() => handleFeedback('negative')} />
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Poor response
                      </DaisyDropdownMenuItem>
                    </>
                  )}
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          </DaisyCard>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {message.attachments.map((attachment) => (
                <MessageAttachment
                  key={attachment.id}
                  attachment={attachment}
                  onView={() => {
                    if (attachment.url) {
                      window.open(attachment.url, '_blank');
                    }
                  }}
                  onDownload={() => {
                    // Implementation for download
                    // console.log('Download:', attachment.title);
                  }} />
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          {Boolean(isAI) && message.suggestions && message.suggestions.length > 0 && onApplySuggestion && (
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-xs font-medium text-muted-foreground">Suggested actions:</p>
              {message.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={onApplySuggestion} />
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        {!isAI && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
            <User className="h-4 w-4" />
          </div>
        )}
      </motion.div>
    
  );
}; 
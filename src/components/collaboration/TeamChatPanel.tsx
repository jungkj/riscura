import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
  };
  timestamp: string;
  isCurrentUser: boolean;
}

export default function TeamChatPanel({ isOpen, onClose }: TeamChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "I've just uploaded a new policy document for review.",
      user: {
        id: '2',
        name: 'Jane Smith',
        initials: 'JS'
      },
      timestamp: '10:30 AM',
      isCurrentUser: false
    },
    {
      id: '2',
      content: "Thanks, I'll take a look at it shortly.",
      user: {
        id: '1',
        name: 'Current User',
        initials: 'CU'
      },
      timestamp: '10:32 AM',
      isCurrentUser: true
    },
    {
      id: '3',
      content: "Has anyone updated the cybersecurity risk assessment?",
      user: {
        id: '3',
        name: 'Robert Johnson',
        initials: 'RJ'
      },
      timestamp: '10:45 AM',
      isCurrentUser: false
    }
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: Date.now().toString(),
        content: newMessage,
        user: {
          id: '1',
          name: 'Current User',
          initials: 'CU'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrentUser: true
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 z-30 w-96 flex flex-col border-l bg-background transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Chat</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-3",
                message.isCurrentUser && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={message.user.avatar} />
                <AvatarFallback>{message.user.initials}</AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "rounded-lg p-3 max-w-[80%]",
                message.isCurrentUser 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {message.isCurrentUser ? 'You' : message.user.name}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
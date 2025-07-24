'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSession } from 'next-auth/react';
import { ChannelType, ChatMessageType } from '@prisma/client';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Hash,
  Users,
  Phone,
  Video,
  Search,
  Settings,
  Plus,
  MoreHorizontal,
  Pin,
  Star,
  Reply,
  Edit,
  Trash2,
  Download,
  Image,
  FileText,
  Shield,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';

// Types
interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  organizationId: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: {
    userId: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  }[];
  _count?: {
    messages: number;
  };
  lastMessage?: any;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: ChatMessageType;
  attachments?: any;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  reactions?: {
    messageId: string;
    userId: string;
    emoji: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
  readReceipts?: {
    userId: string;
    readAt: string;
  }[];
  parent?: any;
  _count?: {
    replies: number;
  };
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: string;
}


const getStatusConfig = (status: string) => {
  const configs = {
    online: { color: 'bg-green-500', label: 'Online' },
    away: { color: 'bg-yellow-500', label: 'Away' },
    busy: { color: 'bg-red-500', label: 'Busy' },
    offline: { color: 'bg-gray-500', label: 'Offline' },
  };
  return configs[status as keyof typeof configs] || configs.offline;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export default function TeamChatPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    type: ChannelType.PUBLIC,
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket handlers
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'new_message':
        if (message.payload.channelId === activeChannel) {
          setMessages(prev => [...prev, message.payload]);
          scrollToBottom();
        }
        // Update unread count for inactive channels
        if (message.payload.channelId !== activeChannel) {
          setChannels(prev => prev.map(ch => 
            ch.id === message.payload.channelId 
              ? { ...ch, unreadCount: (ch.unreadCount || 0) + 1 }
              : ch
          ));
        }
        break;
      
      case 'typing':
        if (message.payload.channelId === activeChannel) {
          if (message.payload.isTyping) {
            setTypingUsers(prev => [...new Set([...prev, message.payload.userId])]);
          } else {
            setTypingUsers(prev => prev.filter(id => id !== message.payload.userId));
          }
        }
        break;
      
      case 'user_joined':
      case 'user_left':
        // Refresh channel members
        if (message.payload.channelId === activeChannel) {
          fetchChannel(activeChannel);
        }
        break;
      
      case 'reaction':
        setMessages(prev => prev.map(msg => {
          if (msg.id === message.payload.messageId) {
            const reactions = [...(msg.reactions || [])];
            // Check if this user already reacted with this emoji
            const existingReactionIndex = reactions.findIndex(
              r => r.userId === message.payload.userId && r.emoji === message.payload.emoji
            );
            
            if (existingReactionIndex === -1) {
              // Add new reaction
              reactions.push({
                messageId: msg.id,
                userId: message.payload.userId,
                emoji: message.payload.emoji,
                user: {
                  id: message.payload.userId,
                  firstName: message.payload.userFirstName || '',
                  lastName: message.payload.userLastName || '',
                },
              });
            }
            return { ...msg, reactions };
          }
          return msg;
        }));
        break;
    }
  }, [activeChannel]);

  const ws = useWebSocket(handleWebSocketMessage);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);
      ws.joinChannel(activeChannel);
      return () => {
        ws.leaveChannel(activeChannel);
      };
    }
    return undefined;
  }, [activeChannel, ws]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/chat/channels');
      const data = await response.json();
      if (data.success) {
        setChannels(data.data);
        if (data.data.length > 0 && !activeChannel) {
          setActiveChannel(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load channels',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/chat/channels/${channelId}`);
      const data = await response.json();
      if (data.success) {
        setChannels(prev => prev.map(ch => ch.id === channelId ? data.data : ch));
      }
    } catch (error) {
      console.error('Failed to fetch channel:', error);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await fetch(`/api/chat/channels/${channelId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        // Mark messages as read
        if (data.data.length > 0) {
          const lastMessage = data.data[data.data.length - 1];
          ws.markAsRead(channelId, lastMessage.id);
        }
        // Clear unread count
        setChannels(prev => prev.map(ch => 
          ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
        ));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChannel || isSending) return;

    setIsSending(true);
    const messageContent = messageInput;
    setMessageInput('');

    try {
      const response = await fetch(`/api/chat/channels/${activeChannel}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          type: ChatMessageType.TEXT,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Message will be added via WebSocket
        ws.sendChatMessage(activeChannel, messageContent);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      setMessageInput(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!activeChannel || !ws.connected) return;
    
    // Send typing indicator
    ws.sendTyping(activeChannel, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      ws.sendTyping(activeChannel, false);
    }, 3000);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && activeChannel) {
      const file = files[0];
      
      toast({
        title: 'Uploading',
        description: `Uploading ${file.name}...`,
      });
      
      try {
        // Upload file to Supabase Storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'attachments');
        formData.append('metadata', JSON.stringify({
          channelId: activeChannel,
          originalName: file.name,
        }));

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Upload failed');
        }

        // Send message with file attachment
        const response = await fetch(`/api/chat/channels/${activeChannel}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `Shared file: ${file.name}`,
            type: ChatMessageType.FILE,
            attachments: [{
              id: uploadData.data.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: uploadData.data.signedUrl,
              path: uploadData.data.path,
            }],
          }),
        });

        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: 'File shared successfully',
          });
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload file',
          variant: 'destructive',
        });
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      const data = await response.json();
      if (data.success) {
        ws.addReaction(messageId, emoji);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelData.name.trim()) return;

    try {
      const response = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannelData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Channel created successfully',
        });
        setIsCreateChannelOpen(false);
        setNewChannelData({ name: '', description: '', type: ChannelType.PUBLIC });
        fetchChannels();
        setActiveChannel(data.data.id);
      } else {
        throw new Error(data.error || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel',
        variant: 'destructive',
      });
    }
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);
  const channelMessages = messages;
  const onlineMembers = activeChannelData?.members.filter(m => m.user.id !== (session?.user as any)?.id) || [];

  return (
    <ProtectedRoute>
      <MainContentArea
        title="Team Chat"
        subtitle="Real-time communication and collaboration"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Team', href: '/dashboard/team' },
          { label: 'Chat', current: true },
        ]}
        primaryAction={{
          label: 'New Channel',
          onClick: () => setIsCreateChannelOpen(true),
          icon: Plus,
        }}
        secondaryActions={[
          {
            label: 'Video Call',
            onClick: () => toast({ title: 'Starting video call...', variant: 'default' }),
            icon: Video,
            variant: 'outline',
          },
          {
            label: 'Settings',
            onClick: () => toast({ title: 'Opening chat settings...', variant: 'default' }),
            icon: Settings,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'active channels',
            value: channels.filter((c: ChatChannel) => c.isActive).length,
            variant: 'default',
          },
          {
            label: 'online members',
            value: onlineMembers.length,
            variant: 'default',
          },
          {
            label: 'unread messages',
            value: channels.reduce((sum: number, c: ChatChannel) => sum + (c.unreadCount || 0), 0),
            variant: 'warning',
          },
        ]}
        maxWidth="full"
        className="h-screen"
      >
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Channel Sidebar */}
          <div className="col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DaisyInput
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Channels */}
            <DaisyCard>
              <DaisyCardHeader className="pb-3">
                <DaisyCardTitle className="text-sm font-medium flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Channels
                </DaisyCardTitle>
              
              <DaisyCardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {channels
                      .filter(c => c.type !== ChannelType.DIRECT)
                      .map((channel) => (
                        <div
                          key={channel.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                            activeChannel === channel.id && "bg-blue-50 border border-blue-200"
                          )}
                          onClick={() => setActiveChannel(channel.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{channel.name}</div>
                              {channel.lastMessage && (
                                <div className="text-xs text-gray-500 truncate">
                                  {channel.lastMessage.content}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {channel.type === ChannelType.PRIVATE && (
                              <Shield className="h-3 w-3 text-orange-500" />
                            )}
                            {channel.unreadCount && channel.unreadCount > 0 && (
                              <DaisyBadge variant="error" className="text-xs">
                                {channel.unreadCount}
                              </DaisyBadge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </DaisyCardBody>
            </DaisyCard>

            {/* Direct Messages */}
            <DaisyCard>
              <DaisyCardHeader className="pb-3">
                <DaisyCardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Direct Messages
                </DaisyCardTitle>
              
              <DaisyCardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {channels
                      .filter((c: ChatChannel) => c.type === ChannelType.DIRECT)
                      .map((channel: ChatChannel) => (
                        <div
                          key={channel.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
                            activeChannel === channel.id && "bg-blue-50 border border-blue-200"
                          )}
                          onClick={() => setActiveChannel(channel.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <DaisyAvatar className="h-6 w-6">
                              <DaisyAvatarFallback className="text-xs">
                                {channel.name.split(' ').map((n: string) => n[0]).join('')}
                              </DaisyAvatarFallback>
                            </DaisyAvatar>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{channel.name}</div>
                              {channel.lastMessage && (
                                <div className="text-xs text-gray-500 truncate">
                                  {channel.lastMessage}
                                </div>
                              )}
                            </div>
                          </div>
                          {channel.unreadCount > 0 && (
                            <DaisyBadge variant="error" className="text-xs">
                              {channel.unreadCount}
                            </DaisyBadge>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </DaisyCardBody>
            </DaisyCard>
          </div>

          {/* Chat Area */}
          <div className="col-span-6 flex flex-col">
            <DaisyCard className="flex-1 flex flex-col">
              {/* Chat Header */}
              <DaisyCardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {activeChannelData?.type === ChannelType.DIRECT ? (
                      <DaisyAvatar className="h-8 w-8">
                        <DaisyAvatarFallback>
                          {activeChannelData.name.split(' ').map(n => n[0]).join('')}
                        </DaisyAvatarFallback>
                      </DaisyAvatar>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-gray-500" />
                        {activeChannelData?.type === ChannelType.PRIVATE && (
                          <Shield className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    )}
                    <div>
                      <DaisyCardTitle className="text-lg">{activeChannelData?.name}</DaisyCardTitle>
                      <DaisyCardDescription>
                        {activeChannelData?.type === ChannelType.DIRECT 
                          ? 'Direct message' 
                          : `${activeChannelData?.members?.length || 0} members`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DaisyButton variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </DaisyButton>
                    <DaisyButton variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </DaisyButton>
                    <DaisyButton variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </DaisyButton>
                  </div>
                </div>
              

              {/* Messages */}
              <DaisyCardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {channelMessages.map((message) => {
                      // const StatusIcon = getMessageStatusIcon(message.status);
                      
                      return (
                        <div key={message.id} className="group">
                          <div className="flex items-start space-x-3">
                            <DaisyAvatar className="h-8 w-8">
                              <DaisyAvatarImage src={message.user.avatar} />
                              <DaisyAvatarFallback className="text-xs">
                                {`${message.user.firstName} ${message.user.lastName}`.split(' ').map((n: string) => n[0]).join('')}
                              </DaisyAvatarFallback>
                            </DaisyAvatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">{`${message.user.firstName} ${message.user.lastName}`}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </span>
                                {message.isEdited && (
                                  <DaisyBadge variant="outline" className="text-xs">
                                    edited
                                  </DaisyBadge>
                                )}
                                {/* Status icon removed as message doesn't have status property */}
                              </div>
                              
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                {message.content}
                              </div>

                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment: any) => (
                                    <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium">{attachment.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(attachment.size)}
                                        </div>
                                      </div>
                                      <DaisyButton variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                      </DaisyButton>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex items-center space-x-1 mt-2">
                                  {message.reactions.map((reaction, index) => (
                                    <DaisyButton
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => handleReaction(message.id, reaction.emoji)}
                                    >
                                      {reaction.emoji} {(reaction as any).count || 1}
                                    </DaisyButton>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Message Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                              <DaisyButton variant="ghost" size="sm" onClick={() => handleReaction(message.id, '👍')}>
                                <Smile className="h-4 w-4" />
                              </DaisyButton>
                              <DaisyButton variant="ghost" size="sm">
                                <Reply className="h-4 w-4" />
                              </DaisyButton>
                              <DaisyButton variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </DaisyButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </DaisyCardBody>

              {/* Message Input */}
              <div className="border-t p-4">
                {typingUsers.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    Someone is typing...
                  </div>
                )}
                <div className="flex items-end space-x-2">
                  <DaisyButton
                    variant="outline"
                    size="sm"
                    onClick={handleFileUpload}
                    className="flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </DaisyButton>
                  <div className="flex-1">
                    <DaisyTextarea
                      placeholder={`Message ${activeChannelData?.name}...`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                  <DaisyButton
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </DaisyButton>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelected}
                  multiple
                />
              </div>
            </DaisyCard>
          </div>

          {/* Team Members Sidebar */}
          <div className="col-span-3 space-y-4">
            <DaisyCard>
              <DaisyCardHeader className="pb-3">
                <DaisyCardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Team Members
                  <DaisyBadge variant="outline" className="ml-2 text-xs">
                    {onlineMembers.length} online
                  </DaisyBadge>
                </DaisyCardTitle>
              
              <DaisyCardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {onlineMembers.map((member: any) => {
                      return (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => toast({ title: `Starting chat with ${member.user.firstName}...`, variant: 'default' })}
                        >
                          <div className="relative">
                            <DaisyAvatar className="h-8 w-8">
                              <DaisyAvatarImage src={member.user.avatar} />
                              <DaisyAvatarFallback className="text-xs">
                                {`${member.user.firstName} ${member.user.lastName}`.split(' ').map((n: string) => n[0]).join('')}
                              </DaisyAvatarFallback>
                            </DaisyAvatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                              "bg-green-500"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{member.user.firstName} {member.user.lastName}</div>
                            <div className="text-xs text-gray-500 truncate">{member.role}</div>
                          </div>
                          <DaisyBadge variant="outline" className={cn("text-xs", "text-green-500")}>
                            Online
                          </DaisyBadge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DaisyCardBody>
            </DaisyCard>

            {/* Quick Actions */}
            <DaisyCard>
              <DaisyCardHeader className="pb-3">
                <DaisyCardTitle className="text-sm font-medium">Quick Actions</DaisyCardTitle>
              
              <DaisyCardContent>
                <div className="space-y-2">
                  <DaisyButton variant="outline" size="sm" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Call
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Share Document
                  </DaisyButton>
                  <DaisyButton variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Chat Settings
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </div>

        {/* Create Channel Dialog */}
        <DaisyDialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
          <DaisyDialogContent>
            <DaisyDialogHeader>
              <DaisyDialogTitle>Create New Channel</DaisyDialogTitle>
              <DaisyDialogDescription>
                Create a new channel for your team to collaborate
              </DaisyDialogDescription>
            </DaisyDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="channel-name">Channel Name</DaisyLabel>
                <DaisyInput
                  id="channel-name"
                  placeholder="e.g., project-alpha"
                  value={newChannelData.name}
                  onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <DaisyLabel htmlFor="channel-description">Description (optional)</DaisyLabel>
                <DaisyInput
                  id="channel-description"
                  placeholder="What's this channel about?"
                  value={newChannelData.description}
                  onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <DaisyLabel htmlFor="channel-type">Channel Type</DaisyLabel>
                <DaisySelect
                  value={newChannelData.type}
                  onValueChange={(value) => setNewChannelData(prev => ({ ...prev, type: value as ChannelType }))}
                >
                  <DaisySelectTrigger>
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value={ChannelType.PUBLIC}>
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2" />
                        Public - Anyone in the organization can join
                      </div>
                    </SelectItem>
                    <DaisySelectItem value={ChannelType.PRIVATE}>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Private - Invite only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </DaisySelect>
              </div>
            </div>
            <DaisyDialogFooter>
              <DaisyButton variant="outline" onClick={() => setIsCreateChannelOpen(false)}>
                Cancel
              </DaisyButton>
              <DaisyButton onClick={handleCreateChannel} disabled={!newChannelData.name.trim()}>
                Create Channel
              </DaisyButton>
            </DialogFooter>
          </DaisyDialogContent>
        </DaisyDialog>
      </MainContentArea>
    </ProtectedRoute>
  );
} 
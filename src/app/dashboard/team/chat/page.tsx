'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainContentArea } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
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
  description: string;
  type: 'public' | 'private' | 'direct';
  memberCount: number;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  isActive: boolean;
  isPinned: boolean;
}

interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  isEdited: boolean;
  reactions: { emoji: string; count: number; users: string[] }[];
  attachments?: ChatAttachment[];
  replyTo?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: string;
  lastSeen?: Date;
}

// Sample data
const sampleChannels: ChatChannel[] = [
  {
    id: 'general',
    name: 'general',
    description: 'General team discussions',
    type: 'public',
    memberCount: 12,
    unreadCount: 3,
    lastMessage: 'The SOC 2 audit is scheduled for next week',
    lastMessageTime: new Date('2024-01-30T14:30:00'),
    isActive: true,
    isPinned: true,
  },
  {
    id: 'compliance',
    name: 'compliance',
    description: 'Compliance and regulatory discussions',
    type: 'public',
    memberCount: 8,
    unreadCount: 0,
    lastMessage: 'Updated the GDPR assessment checklist',
    lastMessageTime: new Date('2024-01-30T11:15:00'),
    isActive: false,
    isPinned: false,
  },
  {
    id: 'security',
    name: 'security',
    description: 'Security team coordination',
    type: 'private',
    memberCount: 5,
    unreadCount: 7,
    lastMessage: 'New vulnerability detected in the payment system',
    lastMessageTime: new Date('2024-01-30T16:45:00'),
    isActive: false,
    isPinned: true,
  },
  {
    id: 'dm-sarah',
    name: 'Sarah Chen',
    description: 'Direct message',
    type: 'direct',
    memberCount: 2,
    unreadCount: 1,
    lastMessage: 'Can you review the access control documentation?',
    lastMessageTime: new Date('2024-01-30T13:20:00'),
    isActive: false,
    isPinned: false,
  },
];

const sampleMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'general',
    userId: 'user-1',
    userName: 'Sarah Chen',
    content: 'Good morning team! Just a reminder that the SOC 2 audit is scheduled for next week. Please make sure all your documentation is up to date.',
    timestamp: new Date('2024-01-30T09:00:00'),
    type: 'text',
    isEdited: false,
    reactions: [
      { emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'] },
      { emoji: '✅', count: 2, users: ['user-5', 'user-6'] },
    ],
    status: 'read',
  },
  {
    id: 'msg-2',
    channelId: 'general',
    userId: 'user-2',
    userName: 'Michael Rodriguez',
    content: 'Thanks for the reminder! I\'ve completed the GDPR documentation review. The updated files are ready for audit.',
    timestamp: new Date('2024-01-30T09:15:00'),
    type: 'text',
    isEdited: false,
    reactions: [],
    status: 'read',
  },
  {
    id: 'msg-3',
    channelId: 'general',
    userId: 'user-3',
    userName: 'Emma Johnson',
    content: 'I\'ve uploaded the latest risk assessment report to the shared drive. Let me know if you need any clarifications.',
    timestamp: new Date('2024-01-30T10:30:00'),
    type: 'text',
    isEdited: false,
    reactions: [{ emoji: '📄', count: 1, users: ['user-1'] }],
    attachments: [
      {
        id: 'att-1',
        name: 'Risk_Assessment_Q1_2024.pdf',
        size: 2547832,
        type: 'application/pdf',
        url: '/files/risk-assessment.pdf',
      },
    ],
    status: 'read',
  },
  {
    id: 'msg-4',
    channelId: 'general',
    userId: 'user-4',
    userName: 'David Kim',
    content: 'The network security controls testing is complete. All systems passed the vulnerability scans.',
    timestamp: new Date('2024-01-30T11:45:00'),
    type: 'text',
    isEdited: false,
    reactions: [{ emoji: '🔒', count: 2, users: ['user-1', 'user-2'] }],
    status: 'read',
  },
  {
    id: 'msg-5',
    channelId: 'general',
    userId: 'user-1',
    userName: 'Sarah Chen',
    content: 'Excellent work everyone! The audit preparation is going smoothly. Let\'s have a quick standup at 2 PM to review the final checklist.',
    timestamp: new Date('2024-01-30T14:30:00'),
    type: 'text',
    isEdited: false,
    reactions: [],
    status: 'delivered',
  },
];

const sampleTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    status: 'online',
    role: 'Security Manager',
  },
  {
    id: 'user-2',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    status: 'online',
    role: 'Compliance Analyst',
  },
  {
    id: 'user-3',
    name: 'Emma Johnson',
    email: 'emma.johnson@company.com',
    status: 'away',
    role: 'Risk Auditor',
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    status: 'online',
    role: 'IT Security Specialist',
  },
  {
    id: 'user-5',
    name: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    status: 'busy',
    role: 'Privacy Officer',
  },
];

const getStatusConfig = (status: string) => {
  const configs = {
    online: { color: 'bg-green-500', label: 'Online' },
    away: { color: 'bg-yellow-500', label: 'Away' },
    busy: { color: 'bg-red-500', label: 'Busy' },
    offline: { color: 'bg-gray-500', label: 'Offline' },
  };
  return configs[status as keyof typeof configs] || configs.offline;
};

const getMessageStatusIcon = (status: string) => {
  const icons = {
    sending: Clock,
    sent: Check,
    delivered: CheckCheck,
    read: CheckCheck,
    failed: AlertCircle,
  };
  return icons[status as keyof typeof icons] || Clock;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function TeamChatPage() {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState(sampleTeamMembers.filter(m => m.status === 'online'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChannelData = sampleChannels.find(c => c.id === activeChannel);
  const channelMessages = sampleMessages.filter(m => m.channelId === activeChannel);

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel,
      userId: 'current-user',
      userName: 'You',
      content: messageInput,
      timestamp: new Date(),
      type: 'text',
      isEdited: false,
      reactions: [],
      status: 'sending',
    };

    // Simulate sending message
    toast.success('Message sent!');
    setMessageInput('');
    
    // Simulate message status updates
    setTimeout(() => {
      toast.success('Message delivered');
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      toast.success(`Uploading ${file.name}...`);
      // Simulate file upload
      setTimeout(() => {
        toast.success('File uploaded successfully!');
      }, 2000);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    toast.success(`Added ${emoji} reaction`);
  };

  const handleChannelAction = (action: string, channelId: string) => {
    switch (action) {
      case 'pin':
        toast.success('Channel pinned');
        break;
      case 'mute':
        toast.success('Channel muted');
        break;
      case 'leave':
        if (confirm('Are you sure you want to leave this channel?')) {
          toast.success('Left channel');
        }
        break;
      default:
        toast(`Action "${action}" not yet implemented for channel ${channelId}`);
    }
  };

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
          onClick: () => toast.success('Opening channel creation...'),
          icon: Plus,
        }}
        secondaryActions={[
          {
            label: 'Video Call',
            onClick: () => toast.success('Starting video call...'),
            icon: Video,
            variant: 'outline',
          },
          {
            label: 'Settings',
            onClick: () => toast.success('Opening chat settings...'),
            icon: Settings,
            variant: 'outline',
          },
        ]}
        stats={[
          {
            label: 'active channels',
            value: sampleChannels.filter(c => c.isActive).length,
            variant: 'default',
          },
          {
            label: 'online members',
            value: onlineMembers.length,
            variant: 'default',
          },
          {
            label: 'unread messages',
            value: sampleChannels.reduce((sum, c) => sum + c.unreadCount, 0),
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
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Channels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {sampleChannels
                      .filter(c => c.type !== 'direct')
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
                                  {channel.lastMessage}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {channel.isPinned && (
                              <Pin className="h-3 w-3 text-gray-400" />
                            )}
                            {channel.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {channel.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Direct Messages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Direct Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {sampleChannels
                      .filter(c => c.type === 'direct')
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
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {channel.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
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
                            <Badge variant="destructive" className="text-xs">
                              {channel.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="col-span-6 flex flex-col">
            <Card className="flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {activeChannelData?.type === 'direct' ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {activeChannelData.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-gray-500" />
                        {activeChannelData?.type === 'private' && (
                          <Shield className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{activeChannelData?.name}</CardTitle>
                      <CardDescription>
                        {activeChannelData?.type === 'direct' 
                          ? 'Direct message' 
                          : `${activeChannelData?.memberCount} members`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {channelMessages.map((message) => {
                      const StatusIcon = getMessageStatusIcon(message.status);
                      
                      return (
                        <div key={message.id} className="group">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.userAvatar} />
                              <AvatarFallback className="text-xs">
                                {message.userName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">{message.userName}</span>
                                <span className="text-xs text-gray-500">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                                {message.isEdited && (
                                  <Badge variant="outline" className="text-xs">
                                    edited
                                  </Badge>
                                )}
                                <StatusIcon className={cn(
                                  "h-3 w-3",
                                  message.status === 'read' ? 'text-blue-500' :
                                  message.status === 'delivered' ? 'text-gray-500' :
                                  message.status === 'failed' ? 'text-red-500' : 'text-gray-400'
                                )} />
                              </div>
                              
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                {message.content}
                              </div>

                              {/* Attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <div className="flex-1">
                                        <div className="text-sm font-medium">{attachment.name}</div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(attachment.size)}
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Reactions */}
                              {message.reactions.length > 0 && (
                                <div className="flex items-center space-x-1 mt-2">
                                  {message.reactions.map((reaction, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => handleReaction(message.id, reaction.emoji)}
                                    >
                                      {reaction.emoji} {reaction.count}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Message Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleReaction(message.id, '👍')}>
                                <Smile className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                {isTyping && (
                  <div className="text-xs text-gray-500 mb-2">
                    Someone is typing...
                  </div>
                )}
                <div className="flex items-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFileUpload}
                    className="flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder={`Message ${activeChannelData?.name}...`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelected}
                  multiple
                />
              </div>
            </Card>
          </div>

          {/* Team Members Sidebar */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Team Members
                  <Badge variant="outline" className="ml-2 text-xs">
                    {onlineMembers.length} online
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {sampleTeamMembers.map((member) => {
                      const statusConfig = getStatusConfig(member.status);
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => toast.success(`Starting chat with ${member.name}...`)}
                        >
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                              statusConfig.color
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{member.name}</div>
                            <div className="text-xs text-gray-500 truncate">{member.role}</div>
                          </div>
                          <Badge variant="outline" className={cn("text-xs", statusConfig.color.replace('bg-', 'text-'))}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Call
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Share Document
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Chat Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainContentArea>
    </ProtectedRoute>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard'
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyCardTitle, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTabsTrigger } from '@/components/ui/daisy-components';
// import { 
  MessageSquare,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  Clock,
  User,
  Bot,
  Star,
  Archive,
  Share2,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  History
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    type?: string;
    model?: string;
  }
}

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  isStarred: boolean;
  isArchived: boolean;
  tags: string[];
  summary?: string;
  messages?: ChatMessage[];
}

interface ConversationHistoryProps {
  organizationId: string;
  onConversationSelect?: (conversation: Conversation) => void;
  onConversationRestore?: (conversationId: string) => void;
  className?: string;
}

export default function ConversationHistory({
  organizationId,
  onConversationSelect,
  onConversationRestore,
  className = ''
}: ConversationHistoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('recent');

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()
  }, [organizationId]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch conversation history
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          title: 'Risk Assessment Discussion',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          messageCount: 12,
          isStarred: true,
          isArchived: false,
          tags: ['risk-analysis', 'cybersecurity'],
          summary: 'Discussed cybersecurity risks and mitigation strategies for the new cloud infrastructure.',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'What are the main cybersecurity risks for our new cloud infrastructure?',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Based on your cloud infrastructure setup, the main cybersecurity risks include: 1) Misconfigured access controls, 2) Data encryption gaps, 3) Insufficient monitoring, 4) Third-party integration vulnerabilities. I recommend implementing a comprehensive security framework.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              metadata: { confidence: 0.89, type: 'risk_analysis', model: 'gpt-4' }
            }
          ]
        },
        {
          id: 'conv-2',
          title: 'Compliance Gap Analysis',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          messageCount: 8,
          isStarred: false,
          isArchived: false,
          tags: ['compliance', 'gdpr', 'gap-analysis'],
          summary: 'Analyzed GDPR compliance gaps and discussed remediation steps.',
        },
        {
          id: 'conv-3',
          title: 'Control Recommendations',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          messageCount: 15,
          isStarred: true,
          isArchived: false,
          tags: ['controls', 'automation', 'recommendations'],
          summary: 'Generated control recommendations for financial reporting processes.',
        },
        {
          id: 'conv-4',
          title: 'Risk Trend Analysis',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          messageCount: 6,
          isStarred: false,
          isArchived: true,
          tags: ['trends', 'analytics', 'forecasting'],
          summary: 'Analyzed risk trends and discussed predictive models for operational risks.',
        },
        {
          id: 'conv-5',
          title: 'Incident Response Planning',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          messageCount: 20,
          isStarred: false,
          isArchived: false,
          tags: ['incident-response', 'planning', 'procedures'],
          summary: 'Developed incident response procedures and communication protocols.',
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setConversations(mockConversations);
    } catch (error) {
      // console.error('Error fetching conversations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load conversation history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter(conv => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          conv.title.toLowerCase().includes(query) ||
          conv.summary?.toLowerCase().includes(query) ||
          conv.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(conv => {
      // Apply tab filter
      switch (activeTab) {
        case 'recent':
          return !conv.isArchived
        case 'starred':
          return conv.isStarred && !conv.isArchived;
        case 'archived':
          return conv.isArchived;
        default:
          return true;
      }
    })
    .filter(conv => {
      // Apply additional filter
      switch (selectedFilter) {
        case 'today':
          return conv.updatedAt.toDateString() === new Date().toDateString()
        case 'week':
          return conv.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return conv.updatedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'messages':
          return b.messageCount - a.messageCount;
        case 'updated':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

  // Handle conversation actions
  const toggleStar = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isStarred: !conv.isStarred }
        : conv
    ))
  }

  const toggleArchive = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isArchived: !conv.isArchived }
        : conv
    ));
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // In real implementation, this would call the API
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been permanently deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const deleteSelectedConversations = async () => {
    try {
      setConversations(prev => prev.filter(conv => !selectedConversations.has(conv.id)));
      setSelectedConversations(new Set());
      
      toast({
        title: 'Conversations Deleted',
        description: `${selectedConversations.size} conversations have been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversations. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const exportConversations = (conversations: Conversation[]) => {
    const exportData = conversations.map(conv => ({
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messageCount: conv.messageCount,
      tags: conv.tags,
      summary: conv.summary,
      messages: conv.messages || []
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aria-conversations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const shareConversation = (conversation: Conversation) => {
    const shareText = `ARIA Conversation: ${conversation.title}\n\nSummary: ${conversation.summary}\n\nMessages: ${conversation.messageCount}\nCreated: ${conversation.createdAt.toLocaleDateString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: conversation.title,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied',
        description: 'Conversation details copied to clipboard',
      });
    }
  }

  const toggleConversationExpansion = (conversationId: string) => {
    setExpandedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  }

  const handleConversationSelect = (conversation: Conversation) => {
    onConversationSelect?.(conversation);
  }

  const restoreConversation = (conversationId: string) => {
    onConversationRestore?.(conversationId);
  }

  if (isLoading) {

  return (
    <DaisyCard className={className} >
  <DaisyCardBody >
</DaisyCard>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <DaisyCardTitle className="text-lg">Conversation History</DaisyCardTitle>
          </div>
        
        <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  }

  return (
    <DaisyCard className={className} >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <DaisyCardTitle className="text-lg">Conversation History</DaisyCardTitle>
            <DaisyBadge variant="secondary" className="text-xs" >
  {conversations.length} conversations
</DaisyBadge>
            </DaisyBadge>
          </div>
          
          <div className="flex items-center space-x-1">
            {selectedConversations.size > 0 && (
              <>
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => exportConversations(
                    conversations.filter(conv => selectedConversations.has(conv.id))
                  )}
                  className="p-2" />
                  <Download className="w-4 h-4" />
                </DaisyButton>
                
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={deleteSelectedConversations}
                  className="p-2 text-red-600" >
  <Trash2 className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              </>
            )}
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => exportConversations(filteredConversations)}
              className="p-2" />
              <Download className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
      

      <DaisyCardBody className="p-0" >
  {/* Search and Filters */}
</DaisyCardBody>
        <div className="p-4 border-b space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <DaisyInput
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) = />
setSearchQuery(e.target.value)}
                className="pl-10" />
            </div>
            
            <DaisySelect value={selectedFilter} onValueChange={setSelectedFilter} >
                <DaisySelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                <DaisySelectValue />
</DaisyInput>
              <DaisySelectContent >
                  <DaisySelectItem value="all">All Time</DaisySelectItem>
                <DaisySelectItem value="today">Today</DaisySelectItem>
                <DaisySelectItem value="week">This Week</DaisySelectItem>
                <DaisySelectItem value="month">This Month</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
            
            <DaisySelect value={sortBy} onValueChange={setSortBy} >
                <DaisySelectTrigger className="w-32">
                  <DaisySelectValue />
</DaisySelect>
              <DaisySelectContent >
                  <DaisySelectItem value="updated">Last Updated</DaisySelectItem>
                <DaisySelectItem value="created">Date Created</DaisySelectItem>
                <DaisySelectItem value="title">Title</DaisySelectItem>
                <DaisySelectItem value="messages">Message Count</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>
        </div>

        {/* Tabs */}
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full" >
            <DaisyTabsList className="grid w-full grid-cols-3 mx-4 mb-4" >
              <DaisyTabsTrigger value="recent">Recent</DaisyTabs>
            <DaisyTabsTrigger value="starred">Starred</DaisyTabsTrigger>
            <DaisyTabsTrigger value="archived">Archived</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value={activeTab} className="mt-0" >
              <div className="max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {searchQuery 
                      ? 'No conversations match your search.' 
                      : activeTab === 'starred' 
                        ? 'No starred conversations yet.' 
                        : activeTab === 'archived'
                          ? 'No archived conversations.'
                          : 'No conversations yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 px-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedConversations.has(conversation.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedConversations);
                                if (e.target.checked) {
                                  newSet.add(conversation.id);
                                } else {
                                  newSet.delete(conversation.id);
                                }
                                setSelectedConversations(newSet);
                              }}
                              className="mt-1" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 
                                  className="font-medium text-sm cursor-pointer hover:text-blue-600 truncate"
                                  onClick={() => handleConversationSelect(conversation)}
                                >
                                  {conversation.title}
                                </h4>
                                
                                {conversation.isStarred && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                                
                                {conversation.isArchived && (
                                  <Archive className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              
                              {conversation.summary && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {conversation.summary}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{conversation.messageCount} messages</span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{conversation.updatedAt.toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              {conversation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {conversation.tags.slice(0, 3).map((tag) => (
                                    <DaisyBadge key={tag} variant="outline" className="text-xs" >
  {tag}
</DaisyBadge>
          </DaisyTabsContent>
                                  ))}
                                  {conversation.tags.length > 3 && (
                                    <DaisyBadge variant="outline" className="text-xs" >
  +{conversation.tags.length - 3}
</DaisyBadge>
                                    </DaisyBadge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(conversation.id)}
                              className="p-1 h-6 w-6" />
                              <Star 
                                className={`w-3 h-3 ${
                                  conversation.isStarred ? 'text-yellow-500 fill-current' : ''
                                }`} />
                            </DaisyButton>
                            
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={() => shareConversation(conversation)}
                              className="p-1 h-6 w-6" />
                              <Share2 className="w-3 h-3" />
                            </DaisyButton>
                            
                            <DaisyButton
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleConversationExpansion(conversation.id)}
                              className="p-1 h-6 w-6" />
                              {expandedConversations.has(conversation.id) ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </DaisyButton>
                            
                            <select
                              className="text-xs border rounded px-1 py-0.5"
                              onChange={(e) => {
                                const action = e.target.value;
                                if (action === 'archive') {
                                  toggleArchive(conversation.id);
                                } else if (action === 'delete') {
                                  deleteConversation(conversation.id);
                                } else if (action === 'restore') {
                                  restoreConversation(conversation.id);
                                }
                                e.target.value = '';
                              }}
                            >
                              <option value="">Actions</option>
                              {!conversation.isArchived && (
                                <option value="archive">Archive</option>
                              )}
                              <option value="delete">Delete</option>
                              <option value="restore">Restore to Chat</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Expanded Messages Preview */}
                        {expandedConversations.has(conversation.id) && conversation.messages && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {conversation.messages.slice(0, 4).map((message) => (
                                <div key={message.id} className="flex items-start space-x-2">
                                  <div className="flex-shrink-0">
                                    {message.role === 'user' ? (
                                      <User className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Bot className="w-4 h-4 text-purple-600" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700 line-clamp-2">
                                      {message.content}
                                    </p>
                                    
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="text-xs text-gray-500">
                                        {message.timestamp.toLocaleTimeString()}
                                      </span>
                                      
                                      {message.metadata?.confidence && (
                                        <DaisyBadge variant="outline" className="text-xs" >
  {Math.round(message.metadata.confidence * 100)}% confidence
</DaisyBadge>
                                        </DaisyBadge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {conversation.messages.length > 4 && (
                                <div className="text-xs text-gray-500 text-center">
                                  ... and {conversation.messages.length - 4} more messages
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </DaisyCardBody>
    </DaisyCard>
  );
} 
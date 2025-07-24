'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Search,
  X,
  Clock,
  Filter,
  ArrowRight,
  Star,
  History,
  TrendingUp,
  FileText,
  Shield,
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Brain,
  Database,
  Globe,
  Lock,
  Unlock,
  Calendar,
  Bell,
  User,
  Tag,
  Folder,
  File,
  BookOpen,
  Target,
  Activity,
  Zap,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  Send,
  Archive,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Command,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Hash,
  AtSign,
  Slash,
  Dot
} from 'lucide-react';

// Types
interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'control' | 'policy' | 'user' | 'report' | 'workflow' | 'page' | 'document' | 'compliance' | 'audit';
  category: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
  relevanceScore: number;
  lastModified?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
  breadcrumb?: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'filter' | 'shortcut';
  icon: React.ComponentType<any>;
  description?: string;
  action?: () => void;
}

interface SearchFilter {
  id: string;
  label: string;
  type: 'type' | 'category' | 'date' | 'status' | 'user';
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
  isActive: boolean;
  selectedValues: string[];
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  showFilters?: boolean;
  maxResults?: number;
  categories?: string[];
  onResultSelect?: (result: SearchResult) => void;
}

export default function GlobalSearch({
  isOpen,
  onClose,
  placeholder = "Search anything...",
  showFilters = true,
  maxResults = 50,
  categories = [],
  onResultSelect
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: Date; results: number }>>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Mock data - in real app, this would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Data Breach Risk Assessment',
      description: 'Comprehensive assessment of data breach risks and mitigation strategies',
      type: 'risk',
      category: 'Cybersecurity',
      url: '/dashboard/risks/1',
      icon: Shield,
      color: '#ef4444',
      relevanceScore: 95,
      lastModified: new Date('2024-01-15'),
      tags: ['high-priority', 'cybersecurity', 'data-protection'],
      breadcrumb: ['Dashboard', 'Risk Management', 'Assessments']
    },
    {
      id: '2',
      title: 'Access Control Policy',
      description: 'Organization-wide access control and authentication policy',
      type: 'policy',
      category: 'Security Policies',
      url: '/dashboard/policies/2',
      icon: Lock,
      color: '#10b981',
      relevanceScore: 88,
      lastModified: new Date('2024-01-12'),
      tags: ['policy', 'access-control', 'authentication'],
      breadcrumb: ['Dashboard', 'Policies', 'Security']
    },
    {
      id: '3',
      title: 'ISO 27001 Compliance Review',
      description: 'Annual compliance review for ISO 27001 certification',
      type: 'compliance',
      category: 'Compliance',
      url: '/dashboard/compliance/iso27001',
      icon: CheckCircle,
      color: '#3b82f6',
      relevanceScore: 82,
      lastModified: new Date('2024-01-10'),
      tags: ['iso27001', 'compliance', 'annual-review'],
      breadcrumb: ['Dashboard', 'Compliance', 'Frameworks']
    },
    {
      id: '4',
      title: 'Risk Assessment Workflow',
      description: 'Step-by-step workflow for conducting risk assessments',
      type: 'workflow',
      category: 'Workflows',
      url: '/dashboard/workflows/risk-assessment',
      icon: Target,
      color: '#8b5cf6',
      relevanceScore: 78,
      tags: ['workflow', 'risk-assessment', 'process'],
      breadcrumb: ['Dashboard', 'Workflows', 'Risk Management']
    },
    {
      id: '5',
      title: 'Quarterly Risk Report',
      description: 'Q4 2023 comprehensive risk management report',
      type: 'report',
      category: 'Reports',
      url: '/dashboard/reports/quarterly-risk-q4-2023',
      icon: BarChart3,
      color: '#f59e0b',
      relevanceScore: 75,
      lastModified: new Date('2024-01-08'),
      tags: ['quarterly', 'report', 'q4-2023'],
      breadcrumb: ['Dashboard', 'Reports', 'Risk Reports']
    },
    {
      id: '6',
      title: 'John Smith',
      description: 'Risk Manager - IT Security Department',
      type: 'user',
      category: 'Users',
      url: '/dashboard/users/john-smith',
      icon: User,
      color: '#06b6d4',
      relevanceScore: 70,
      tags: ['risk-manager', 'it-security'],
      breadcrumb: ['Dashboard', 'Users', 'Risk Management Team']
    }
  ];

  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      text: 'risk assessment',
      type: 'query',
      icon: Search,
      description: 'Search for risk assessments'
    },
    {
      id: '2',
      text: 'type:policy',
      type: 'filter',
      icon: Filter,
      description: 'Filter by policy documents'
    },
    {
      id: '3',
      text: 'Go to Dashboard',
      type: 'shortcut',
      icon: ArrowRight,
      description: 'Navigate to main dashboard',
      action: () => router.push('/dashboard')
    },
    {
      id: '4',
      text: 'compliance review',
      type: 'query',
      icon: Search,
      description: 'Search for compliance reviews'
    },
    {
      id: '5',
      text: 'status:active',
      type: 'filter',
      icon: Filter,
      description: 'Filter by active items'
    }
  ];

  // Load search history and recent searches
  useEffect(() => {
    const savedHistory = localStorage.getItem('riscura-search-history');
    const savedRecent = localStorage.getItem('riscura-recent-searches');
    
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    if (savedRecent) {
      setRecentSearches(JSON.parse(savedRecent));
    }
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < (results.length + suggestions.length - 1) ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < suggestions.length) {
              handleSuggestionSelect(suggestions[selectedIndex]);
            } else {
              handleResultSelect(results[selectedIndex - suggestions.length]);
            }
          } else if (query.trim()) {
            performSearch(query);
          }
          break;
        case 'Tab':
          if (suggestions.length > 0 && selectedIndex < suggestions.length) {
            event.preventDefault();
            const suggestion = suggestions[selectedIndex >= 0 ? selectedIndex : 0];
            if (suggestion.type === 'query') {
              setQuery(suggestion.text);
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedIndex, results, suggestions, query]);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setResults([]);
        setSuggestions(mockSuggestions);
      }
    }, 300);
  }, []);

  // Perform search
  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Filter and sort results based on query
      const filteredResults = mockResults
        .filter(result => 
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          result.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      setResults(filteredResults);
      
      // Update search history
      const newHistoryEntry = {
        query: searchQuery,
        timestamp: new Date(),
        results: filteredResults.length
      };
      
      const updatedHistory = [newHistoryEntry, ...searchHistory.slice(0, 9)];
      setSearchHistory(updatedHistory);
      localStorage.setItem('riscura-search-history', JSON.stringify(updatedHistory));
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle query change
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setSuggestions(mockSuggestions);
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.text);
      performSearch(suggestion.text);
    } else if (suggestion.type === 'filter') {
      setQuery(prev => prev + ' ' + suggestion.text);
    } else if (suggestion.action) {
      suggestion.action();
      onClose();
    }
    
    // Add to recent searches
    if (suggestion.type === 'query') {
      const updatedRecent = [suggestion.text, ...recentSearches.filter(s => s !== suggestion.text)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('riscura-recent-searches', JSON.stringify(updatedRecent));
    }
  };

  // Handle result select
  const handleResultSelect = (result: SearchResult) => {
    // Add to recent searches
    const updatedRecent = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('riscura-recent-searches', JSON.stringify(updatedRecent));
    
    // Navigate or callback
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }
    
    onClose();
    
    toast({
      title: 'Opening',
      description: result.title,
    });
  };

  // Get result type icon and color
  const getResultTypeInfo = (type: string) => {
    switch (type) {
      case 'risk': return { icon: Shield, color: '#ef4444' };
      case 'control': return { icon: CheckCircle, color: '#10b981' };
      case 'policy': return { icon: FileText, color: '#3b82f6' };
      case 'user': return { icon: User, color: '#06b6d4' };
      case 'report': return { icon: BarChart3, color: '#f59e0b' };
      case 'workflow': return { icon: Target, color: '#8b5cf6' };
      case 'page': return { icon: Globe, color: '#6b7280' };
      case 'document': return { icon: File, color: '#84cc16' };
      case 'compliance': return { icon: CheckCircle, color: '#3b82f6' };
      case 'audit': return { icon: Eye, color: '#f97316' };
      default: return { icon: File, color: '#6b7280' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl mx-4"
      >
        <DaisyCard className="bg-white border border-gray-200 shadow-2xl">
          {/* Search Header */}
          <DaisyCardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <DaisyInput
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={placeholder}
                  className="pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 bg-transparent"
                />
                {query && (
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQueryChange('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </DaisyButton>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {showFilters && (
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </DaisyButton>
                )}
                
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </DaisyButton>
              </div>
            </div>

            {/* Search Stats */}
            {results.length > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{results.length} results found</span>
                {isLoading && <span>Searching...</span>}
              </div>
            )}
          

          <DaisyCardContent className="p-0 max-h-96 overflow-y-auto" ref={resultsRef}>
            {/* No query state - show suggestions and recent */}
            {!query.trim() && (
              <div className="p-6 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleQueryChange(search)}
                          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 text-left"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push('/dashboard/workflows/risk-assessment')}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left"
                    >
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">New Risk Assessment</span>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/workflows/compliance-review')}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Compliance Review</span>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/reporting')}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left"
                    >
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Generate Report</span>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/aria')}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left"
                    >
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Ask ARIA</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {query.trim() && suggestions.length > 0 && results.length === 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`flex items-center gap-3 w-full p-2 rounded-lg text-left transition-colors ${
                        selectedIndex === index ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <suggestion.icon className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{suggestion.text}</span>
                        {suggestion.description && (
                          <p className="text-xs text-gray-500">{suggestion.description}</p>
                        )}
                      </div>
                      {suggestion.type === 'shortcut' && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-4">
                <div className="space-y-2">
                  {results.map((result, index) => {
                    const typeInfo = getResultTypeInfo(result.type);
                    const resultIndex = suggestions.length + index;
                    
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className={`flex items-start gap-3 w-full p-3 rounded-lg text-left transition-colors ${
                          selectedIndex === resultIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: typeInfo.color + '20' }}
                        >
                          <typeInfo.icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                            <DaisyBadge variant="secondary" className="text-xs">
                              {result.type}
                            </DaisyBadge>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {result.description}
                          </p>
                          
                          {/* Breadcrumb */}
                          {result.breadcrumb && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              {result.breadcrumb.map((crumb, i) => (
                                <React.Fragment key={i}>
                                  <span>{crumb}</span>
                                  {i < result.breadcrumb!.length - 1 && (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                          
                          {/* Tags and metadata */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.tags && result.tags.slice(0, 2).map(tag => (
                                <DaisyBadge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </DaisyBadge>
                              ))}
                              {result.tags && result.tags.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{result.tags.length - 2} more
                                </span>
                              )}
                            </div>
                            
                            {result.lastModified && (
                              <span className="text-xs text-gray-500">
                                {result.lastModified.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {query.trim() && results.length === 0 && !isLoading && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or using different keywords.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <DaisyButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQueryChange('')}
                  >
                    Clear Search
                  </DaisyButton>
                  <DaisyButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAdvanced(true)}
                  >
                    Advanced Search
                  </DaisyButton>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Searching...</p>
              </div>
            )}
          </DaisyCardBody>

          {/* Footer with shortcuts */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">CornerDownLeft</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">X</kbd>
                  <span>Close</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <Brain className="w-3 h-3" />
                <span>ARIA</span>
              </div>
            </div>
          </div>
        </DaisyCard>
      </motion.div>
    </div>
  );
}

// Search trigger component
export function SearchTrigger({ 
  className = '',
  variant = 'default' 
}: { 
  className?: string;
  variant?: 'default' | 'compact' | 'icon';
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (variant === 'icon') {
    return (
      <>
        <DaisyButton
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`w-8 h-8 p-0 ${className}`}
        >
          <Search className="w-4 h-4" />
        </DaisyButton>
        <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <DaisyButton
          variant="secondary"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 ${className}`}
        >
          <Search className="w-4 h-4" />
          Search
          <kbd className="ml-auto px-1.5 py-0.5 bg-gray-200 border border-gray-300 rounded text-xs">
            ⌘K
          </kbd>
        </DaisyButton>
        <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors ${className}`}
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500 flex-1">Search anything...</span>
        <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-500">
          ⌘K
        </kbd>
      </div>
      <GlobalSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
} 
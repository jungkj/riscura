'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Search, Filter, Tag, Star, BookmarkPlus, Download, Upload,
  X, Plus, Edit3, Trash2, Save, RefreshCw, SlidersHorizontal,
  Calendar, Clock, User, FolderOpen, Archive, CheckSquare,
  Square, MoreVertical, ArrowUpDown, Eye, Copy, Share2,
  FileText, Image, MapPin, Settings, Target, AlertCircle,
  TrendingUp, TrendingDown, BarChart3, Grid3X3, Activity
} from 'lucide-react';

// Types for search and filtering
interface SearchFilter {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  label: string;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: SearchFilter[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  createdBy: string;
  useCount: number;
}

interface QuickFilter {
  id: string;
  name: string;
  icon: React.ReactNode;
  filters: SearchFilter[];
  color: string;
  count?: number;
}

interface BulkOperation {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: (selectedItems: string[]) => void;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  category?: string;
}

interface AdvancedSearchFilterProps {
  items: any[];
  onFilteredItemsChange: (items: any[]) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
  searchableFields: Array<{ key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'boolean' }>;
  availableTags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  className?: string;
}

export function AdvancedSearchFilter({
  items,
  onFilteredItemsChange,
  onSelectionChange,
  searchableFields,
  availableTags,
  onTagsChange,
  className
}: AdvancedSearchFilterProps) {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  
  // Saved Searches State
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: 'saved-1',
      name: 'High Priority Items',
      description: 'Items with high priority and recent activity',
      query: 'priority:high',
      filters: [
        { id: 'f1', field: 'priority', operator: 'equals', value: 'high', label: 'Priority is High' },
        { id: 'f2', field: 'lastModified', operator: 'greater_than', value: '2024-01-01', label: 'Modified after Jan 1, 2024' }
      ],
      tags: ['priority', 'recent'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      createdBy: 'current-user',
      useCount: 15
    },
    {
      id: 'saved-2',
      name: 'Compliance Questionnaires',
      description: 'All compliance-related questionnaires',
      query: 'category:compliance',
      filters: [
        { id: 'f3', field: 'category', operator: 'equals', value: 'compliance', label: 'Category is Compliance' }
      ],
      tags: ['compliance', 'regulatory'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      createdBy: 'current-user',
      useCount: 8
    }
  ]);
  
  // Quick Filters
  const quickFilters: QuickFilter[] = useMemo(() => [
    {
      id: 'all',
      name: 'All Items',
      icon: <Grid3X3 className="w-4 h-4" />,
      filters: [],
      color: 'bg-gray-100 text-gray-800',
      count: items.length
    },
    {
      id: 'recent',
      name: 'Recent',
      icon: <Clock className="w-4 h-4" />,
      filters: [{ id: 'qf1', field: 'lastModified', operator: 'greater_than', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), label: 'Modified in last 7 days' }],
      color: 'bg-blue-100 text-blue-800',
      count: Math.floor(items.length * 0.3)
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      icon: <AlertCircle className="w-4 h-4" />,
      filters: [{ id: 'qf2', field: 'priority', operator: 'equals', value: 'high', label: 'Priority is High' }],
      color: 'bg-red-100 text-red-800',
      count: Math.floor(items.length * 0.15)
    },
    {
      id: 'draft',
      name: 'Drafts',
      icon: <Edit3 className="w-4 h-4" />,
      filters: [{ id: 'qf3', field: 'status', operator: 'equals', value: 'draft', label: 'Status is Draft' }],
      color: 'bg-yellow-100 text-yellow-800',
      count: Math.floor(items.length * 0.25)
    },
    {
      id: 'published',
      name: 'Published',
      icon: <Eye className="w-4 h-4" />,
      filters: [{ id: 'qf4', field: 'status', operator: 'equals', value: 'published', label: 'Status is Published' }],
      color: 'bg-green-100 text-green-800',
      count: Math.floor(items.length * 0.4)
    }
  ], [items.length]);

  // Bulk Operations
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const bulkOperations: BulkOperation[] = [
    {
      id: 'export',
      name: 'Export Selected',
      icon: <Download className="w-4 h-4" />,
      action: (items) => handleBulkExport(items),
      requiresConfirmation: false
    },
    {
      id: 'tag',
      name: 'Add Tags',
      icon: <Tag className="w-4 h-4" />,
      action: (items) => handleBulkAddTags(items),
      requiresConfirmation: false
    },
    {
      id: 'archive',
      name: 'Archive',
      icon: <Archive className="w-4 h-4" />,
      action: (items) => handleBulkArchive(items),
      requiresConfirmation: true
    },
    {
      id: 'delete',
      name: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      action: (items) => handleBulkDelete(items),
      requiresConfirmation: true,
      destructive: true
    }
  ];

  // Tag Management State
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Saved Search State
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');
  const [newSearchIsPublic, setNewSearchIsPublic] = useState(false);

  // Advanced Filter State
  const [newFilter, setNewFilter] = useState<Partial<SearchFilter>>({
    field: '',
    operator: 'contains',
    value: ''
  });

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        )
      );
    }

    // Apply filters
    activeFilters.forEach(filter => {
      filtered = filtered.filter(item => {
        const fieldValue = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filter.value;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'starts_with':
            return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'ends_with':
            return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'greater_than':
            return fieldValue > filter.value;
          case 'less_than':
            return fieldValue < filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(fieldValue);
          case 'not_in':
            return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
          default:
            return true;
        }
      });
    });

    // Apply tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => 
        item.tags && selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    return filtered;
  }, [items, searchQuery, activeFilters, selectedTags]);

  // Update parent component when filtered items change
  useEffect(() => {
    onFilteredItemsChange(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  // Update parent component when selection changes
  useEffect(() => {
    onSelectionChange?.(selectedItems);
  }, [selectedItems, onSelectionChange]);

  // Bulk Operation Handlers
  const handleBulkExport = async (itemIds: string[]) => {
    const exportData = filteredItems.filter(item => itemIds.includes(item.id));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported-items-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${itemIds.length} items successfully.`,
    });
  };

  const handleBulkAddTags = (itemIds: string[]) => {
    // In a real app, this would update the items with new tags
    console.log('Adding tags to items:', itemIds);
    toast({
      title: 'Tags Added',
      description: `Added tags to ${itemIds.length} items.`,
    });
  };

  const handleBulkArchive = (itemIds: string[]) => {
    // In a real app, this would archive the items
    console.log('Archiving items:', itemIds);
    toast({
      title: 'Items Archived',
      description: `Archived ${itemIds.length} items.`,
    });
  };

  const handleBulkDelete = (itemIds: string[]) => {
    // In a real app, this would delete the items
    console.log('Deleting items:', itemIds);
    toast({
      title: 'Items Deleted',
      description: `Deleted ${itemIds.length} items.`,
      variant: 'destructive',
    });
  };

  // Filter Management
  const addFilter = () => {
    if (!newFilter.field || newFilter.value === undefined) return;

    const filter: SearchFilter = {
      id: `filter-${Date.now()}`,
      field: newFilter.field,
      operator: newFilter.operator || 'contains',
      value: newFilter.value,
      label: `${searchableFields.find(f => f.key === newFilter.field)?.label} ${newFilter.operator} ${newFilter.value}`
    };

    setActiveFilters([...activeFilters, filter]);
    setNewFilter({ field: '', operator: 'contains', value: '' });
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedTags([]);
    setSearchQuery('');
    setSelectedItems([]);
  };

  // Quick Filter Application
  const applyQuickFilter = (quickFilter: QuickFilter) => {
    setActiveFilters(quickFilter.filters);
    setSelectedTags([]);
    setSearchQuery('');
  };

  // Saved Search Management
  const saveCurrentSearch = () => {
    if (!newSearchName.trim()) return;

    const savedSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      name: newSearchName,
      description: newSearchDescription,
      query: searchQuery,
      filters: activeFilters,
      tags: selectedTags,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: newSearchIsPublic,
      createdBy: 'current-user',
      useCount: 0
    };

    setSavedSearches([...savedSearches, savedSearch]);
    setNewSearchName('');
    setNewSearchDescription('');
    setNewSearchIsPublic(false);
    setShowSaveSearch(false);

    toast({
      title: 'Search Saved',
      description: `Saved search "${newSearchName}" created successfully.`,
    });
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setActiveFilters(savedSearch.filters);
    setSelectedTags(savedSearch.tags);
    
    // Update use count
    setSavedSearches(prev => prev.map(s => 
      s.id === savedSearch.id 
        ? { ...s, useCount: s.useCount + 1, updatedAt: new Date() }
        : s
    ));

    toast({
      title: 'Search Loaded',
      description: `Loaded saved search "${savedSearch.name}".`,
    });
  };

  const deleteSavedSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== searchId));
    toast({
      title: 'Search Deleted',
      description: 'Saved search deleted successfully.',
    });
  };

  // Tag Management
  const addTag = () => {
    if (!newTagName.trim()) return;

    const tag: Tag = {
      id: `tag-${Date.now()}`,
      name: newTagName,
      color: newTagColor,
      count: 0
    };

    onTagsChange?.([...availableTags, tag]);
    setNewTagName('');
    setNewTagColor('#3b82f6');

    toast({
      title: 'Tag Created',
      description: `Tag "${newTagName}" created successfully.`,
    });
  };

  const updateTag = (tagId: string, updates: Partial<Tag>) => {
    onTagsChange?.(availableTags.map(t => t.id === tagId ? { ...t, ...updates } : t));
    setEditingTag(null);
  };

  const deleteTag = (tagId: string) => {
    onTagsChange?.(availableTags.filter(t => t.id !== tagId));
    setSelectedTags(selectedTags.filter(t => t !== tagId));
    toast({
      title: 'Tag Deleted',
      description: 'Tag deleted successfully.',
    });
  };

  // Selection Management
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllVisible = () => {
    setSelectedItems(filteredItems.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          className={showAdvancedSearch ? 'bg-blue-50 border-blue-200' : ''}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>

        {/* Saved Searches Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Saved
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {savedSearches.map(search => (
              <DropdownMenuItem key={search.id} onSelect={() => loadSavedSearch(search)}>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{search.name}</span>
                    <span className="text-xs text-gray-500">{search.useCount} uses</span>
                  </div>
                  {search.description && (
                    <span className="text-xs text-gray-600">{search.description}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowSaveSearch(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Save Current Search
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setShowTagManagement(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Manage Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearAllFilters}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear All Filters
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBulkExport(filteredItems.map(item => item.id))}>
              <Download className="w-4 h-4 mr-2" />
              Export All Results
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map(filter => (
          <Button
            key={filter.id}
            variant={activeFilters.length === filter.filters.length && 
                    activeFilters.every(af => filter.filters.some(ff => ff.field === af.field && ff.value === af.value))
                    ? "default" : "outline"}
            size="sm"
            onClick={() => applyQuickFilter(filter)}
            className="h-8"
          >
            {filter.icon}
            <span className="ml-2">{filter.name}</span>
            {filter.count !== undefined && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {filter.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Advanced Search Panel */}
      <AnimatePresence>
        {showAdvancedSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Advanced Search & Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Filter */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Select value={newFilter.field} onValueChange={(value) => setNewFilter({...newFilter, field: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchableFields.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={newFilter.operator} onValueChange={(value) => setNewFilter({...newFilter, operator: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="starts_with">Starts with</SelectItem>
                      <SelectItem value="ends_with">Ends with</SelectItem>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={newFilter.value || ''}
                    onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
                  />

                  <Button onClick={addFilter} disabled={!newFilter.field || !newFilter.value}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Filter
                  </Button>
                </div>

                {/* Active Filters */}
                {activeFilters.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Active Filters:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {activeFilters.map(filter => (
                        <Badge key={filter.id} variant="secondary" className="pr-1">
                          {filter.label}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2"
                            onClick={() => removeFilter(filter.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tag Filters */}
                {availableTags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Filter by Tags:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableTags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag.id)
                                ? prev.filter(t => t !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.name}
                          <span className="ml-1 text-xs">({tag.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary & Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredItems.length} of {items.length} items
            {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
          </span>

          {filteredItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedItems.length === filteredItems.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllVisible();
                  } else {
                    clearSelection();
                  }
                }}
              />
              <span className="text-sm text-gray-600">Select all visible</span>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions ({selectedItems.length})
                <MoreVertical className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {bulkOperations.map(operation => (
                <DropdownMenuItem
                  key={operation.id}
                  onClick={() => operation.action(selectedItems)}
                  className={operation.destructive ? 'text-red-600' : ''}
                >
                  {operation.icon}
                  <span className="ml-2">{operation.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Save Search Dialog */}
      <Dialog open={showSaveSearch} onOpenChange={setShowSaveSearch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
            <DialogDescription>
              Save your current search criteria for quick access later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
                placeholder="Enter search name"
              />
            </div>
            
            <div>
              <Label htmlFor="search-description">Description (Optional)</Label>
              <Textarea
                id="search-description"
                value={newSearchDescription}
                onChange={(e) => setNewSearchDescription(e.target.value)}
                placeholder="Describe this search"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="search-public"
                checked={newSearchIsPublic}
                onCheckedChange={setNewSearchIsPublic}
              />
              <Label htmlFor="search-public">Make this search public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveSearch(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentSearch} disabled={!newSearchName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Management Dialog */}
      <Dialog open={showTagManagement} onOpenChange={setShowTagManagement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Create and manage tags for better organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add New Tag */}
            <div className="flex space-x-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-16"
              />
              <Button onClick={addTag} disabled={!newTagName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            
            {/* Existing Tags */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {tag.count} items
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTag(tag)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTag(tag.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTagManagement(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
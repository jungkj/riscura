'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, Clock, X, Plus } from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, subMonths, subYears } from 'date-fns';
import toast from 'react-hot-toast';

interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  fileType: string;
  uploadedBy: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sizeRange: {
    min: number;
    max: number;
  };
  linkedEntityType: string;
  linkedEntityId: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  useCount: number;
}

interface DocumentSearchProps {
  onSearch: (results: any[]) => void;
  onSaveSearch?: (search: SavedSearch) => void;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'policy', label: 'Policy' },
  { value: 'control', label: 'Control Documentation' },
  { value: 'risk', label: 'Risk Assessment' },
  { value: 'audit', label: 'Audit Documentation' },
  { value: 'template', label: 'Template' },
  { value: 'general', label: 'General' },
];

const FILE_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'word', label: 'Word Documents' },
  { value: 'excel', label: 'Excel Spreadsheets' },
  { value: 'powerpoint', label: 'PowerPoint Presentations' },
  { value: 'image', label: 'Images' },
  { value: 'text', label: 'Text Files' },
  { value: 'archive', label: 'Archives' },
];

const QUICK_DATE_RANGES = [
  { label: 'Last 7 days', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Last 3 months', value: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'Last 6 months', value: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: 'Last year', value: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
];

export default function DocumentSearch({
  onSearch,
  onSaveSearch,
  className = '',
}: DocumentSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    tags: [],
    fileType: '',
    uploadedBy: '',
    dateRange: {},
    sizeRange: { min: 0, max: 100 },
    linkedEntityType: '',
    linkedEntityId: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchFacets, setSearchFacets] = useState<any>({});

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches?entityType=DOCUMENT');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.searches || []);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);

      const searchParams = new URLSearchParams();
      
      if (filters.query) searchParams.append('q', filters.query);
      if (filters.category) searchParams.append('category', filters.category);
      if (filters.fileType) searchParams.append('fileType', filters.fileType);
      if (filters.uploadedBy) searchParams.append('uploadedBy', filters.uploadedBy);
      if (filters.linkedEntityType) searchParams.append('linkedEntityType', filters.linkedEntityType);
      if (filters.linkedEntityId) searchParams.append('linkedEntityId', filters.linkedEntityId);
      
      if (filters.tags.length > 0) {
        searchParams.append('tags', filters.tags.join(','));
      }
      
      if (filters.dateRange.from) {
        searchParams.append('dateFrom', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange.to) {
        searchParams.append('dateTo', filters.dateRange.to.toISOString());
      }
      
      if (filters.sizeRange.min > 0) {
        searchParams.append('sizeMin', (filters.sizeRange.min * 1024 * 1024).toString());
      }
      if (filters.sizeRange.max < 100) {
        searchParams.append('sizeMax', (filters.sizeRange.max * 1024 * 1024).toString());
      }

      const response = await fetch(`/api/documents/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchFacets(data.facets);
      onSearch(data.documents);
      
      toast.success(`Found ${data.documents.length} document(s)`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for the search');
      return;
    }

    try {
      const searchQuery = {
        filters,
        query: filters.query,
      };

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName,
          query: JSON.stringify(searchQuery),
          entityType: 'DOCUMENT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save search');
      }

      const savedSearch = await response.json();
      setSavedSearches(prev => [savedSearch, ...prev]);
      setSaveSearchName('');
      setShowSaveSearch(false);
      onSaveSearch?.(savedSearch);
      
      toast.success('Search saved successfully');
    } catch (error) {
      console.error('Save search error:', error);
      toast.error('Failed to save search');
    }
  };

  const loadSavedSearch = async (search: SavedSearch) => {
    try {
      const query = JSON.parse(search.query);
      setFilters(query.filters || {});
      
      // Update use count
      await fetch(`/api/saved-searches/${search.id}/use`, { method: 'POST' });
      
      toast.success(`Loaded search: ${search.name}`);
    } catch (error) {
      console.error('Load search error:', error);
      toast.error('Failed to load saved search');
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      tags: [],
      fileType: '',
      uploadedBy: '',
      dateRange: {},
      sizeRange: { min: 0, max: 100 },
      linkedEntityType: '',
      linkedEntityId: '',
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const setDateRange = (range: { from?: Date; to?: Date }) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range,
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <DaisyTabs defaultValue="search" className="w-full">
        <DaisyTabsList className="grid w-full grid-cols-2">
          <DaisyTabsTrigger value="search">Search Filters</DaisyTabsTrigger>
          <DaisyTabsTrigger value="saved">Saved Searches</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="search" className="space-y-6 mt-6">
          {/* Basic Search */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="text-lg">Basic Search</DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              <div className="space-y-2">
                <DaisyLabel htmlFor="search-query">Search Query</DaisyLabel>
                <DaisyInput
                  id="search-query"
                  placeholder="Enter keywords, file names, or phrases..."
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DaisyLabel>Category</DaisyLabel>
                  <DaisySelect 
                    value={filters.category} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      {CATEGORY_OPTIONS.map(option => (
                        <DaisySelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                </div>

                <div className="space-y-2">
                  <DaisyLabel>File Type</DaisyLabel>
                  <DaisySelect 
                    value={filters.fileType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      {FILE_TYPE_OPTIONS.map(option => (
                        <DaisySelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Advanced Filters */}
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="text-lg">Advanced Filters</DaisyCardTitle>
            
            <DaisyCardContent className="space-y-4">
              {/* Tags */}
              <div className="space-y-2">
                <DaisyLabel>Tags</DaisyLabel>
                <div className="flex gap-2">
                  <DaisyInput
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <DaisyButton onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </DaisyButton>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map((tag, index) => (
                      <DaisyBadge key={index} variant="secondary" className="cursor-pointer">
                        {tag}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => removeTag(tag)}
                        />
                      </DaisyBadge>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <DaisyLabel>Upload Date Range</DaisyLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {QUICK_DATE_RANGES.map((range, index) => (
                    <DaisyButton
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(range.value())}
                    >
                      {range.label}
                    </DaisyButton>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <DaisyButton variant="outline" className="justify-start text-left font-normal">
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, 'PPP')
                        ) : (
                          'From date'
                        )}
                      </DaisyButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => setDateRange({ ...filters.dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <DaisyButton variant="outline" className="justify-start text-left font-normal">
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, 'PPP')
                        ) : (
                          'To date'
                        )}
                      </DaisyButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => setDateRange({ ...filters.dateRange, to: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* File Size Range */}
              <div className="space-y-2">
                <DaisyLabel>File Size Range (MB)</DaisyLabel>
                <div className="px-2">
                  <Slider
                    value={[filters.sizeRange.min, filters.sizeRange.max]}
                    onValueChange={([min, max]) => setFilters(prev => ({
                      ...prev,
                      sizeRange: { min, max }
                    }))}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{filters.sizeRange.min} MB</span>
                    <span>{filters.sizeRange.max} MB</span>
                  </div>
                </div>
              </div>

              {/* Linked Entity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DaisyLabel>Linked Entity Type</DaisyLabel>
                  <DaisySelect 
                    value={filters.linkedEntityType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, linkedEntityType: value }))}
                  >
                    <DaisySelectTrigger>
                      <DaisySelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="">All Types</SelectItem>
                      <DaisySelectItem value="RISK">Risk</SelectItem>
                      <DaisySelectItem value="CONTROL">Control</SelectItem>
                      <DaisySelectItem value="ASSESSMENT">Assessment</SelectItem>
                      <DaisySelectItem value="AUDIT">Audit</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>

                <div className="space-y-2">
                  <DaisyLabel>Entity ID</DaisyLabel>
                  <DaisyInput
                    placeholder="Enter entity ID..."
                    value={filters.linkedEntityId}
                    onChange={(e) => setFilters(prev => ({ ...prev, linkedEntityId: e.target.value }))}
                  />
                </div>
              </div>
            </DaisyCardBody>
          </DaisyCard>

          {/* Search Actions */}
          <div className="flex items-center justify-between">
            <DaisyButton variant="outline" onClick={clearFilters}>
              Clear Filters
            </DaisyButton>
            
            <div className="flex items-center gap-2">
              <DaisyButton
                variant="outline"
                onClick={() => setShowSaveSearch(true)}
                disabled={!filters.query && !filters.category && !filters.fileType}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </DaisyButton>
              
              <DaisyButton onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </DaisyButton>
            </div>
          </div>

          {/* Save Search Dialog */}
          {showSaveSearch && (
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle className="text-lg">Save Search</DaisyCardTitle>
              
              <DaisyCardContent className="space-y-4">
                <div className="space-y-2">
                  <DaisyLabel htmlFor="search-name">Search Name</DaisyLabel>
                  <DaisyInput
                    id="search-name"
                    placeholder="Enter a name for this search..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <DaisyButton onClick={handleSaveSearch}>Save</DaisyButton>
                  <DaisyButton variant="outline" onClick={() => setShowSaveSearch(false)}>
                    Cancel
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          )}
        </DaisyTabsContent>

        <DaisyTabsContent value="saved" className="space-y-4 mt-6">
          <DaisyCard>
            <DaisyCardHeader>
              <DaisyCardTitle className="text-lg">Saved Searches</DaisyCardTitle>
            
            <DaisyCardContent>
              {savedSearches.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h3>
                  <p className="text-gray-500">Save your frequently used searches for quick access</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div 
                      key={search.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadSavedSearch(search)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{search.name}</h4>
                        <p className="text-sm text-gray-500">
                          Created {format(new Date(search.createdAt), 'MMM dd, yyyy')} • 
                          Used {search.useCount} time{search.useCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <DaisyButton size="sm" variant="ghost">
                        Load
                      </DaisyButton>
                    </div>
                  ))}
                </div>
              )}
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>

      {/* Search Facets */}
      {Object.keys(searchFacets).length > 0 && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle className="text-lg">Refine Results</DaisyCardTitle>
          
          <DaisyCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {searchFacets.categories && searchFacets.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="space-y-1">
                    {searchFacets.categories.slice(0, 5).map((facet: any) => (
                      <div key={facet.value} className="flex items-center justify-between text-sm">
                        <span>{facet.value}</span>
                        <DaisyBadge variant="secondary">{facet.count}</DaisyBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchFacets.fileTypes && searchFacets.fileTypes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">File Types</h4>
                  <div className="space-y-1">
                    {searchFacets.fileTypes.slice(0, 5).map((facet: any) => (
                      <div key={facet.value} className="flex items-center justify-between text-sm">
                        <span>{facet.value}</span>
                        <DaisyBadge variant="secondary">{facet.count}</DaisyBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchFacets.uploaders && searchFacets.uploaders.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Uploaders</h4>
                  <div className="space-y-1">
                    {searchFacets.uploaders.slice(0, 5).map((facet: any) => (
                      <div key={facet.value} className="flex items-center justify-between text-sm">
                        <span className="truncate">{facet.label}</span>
                        <DaisyBadge variant="secondary">{facet.count}</DaisyBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
} 
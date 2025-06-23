'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Save, Clock, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Filters</TabsTrigger>
          <TabsTrigger value="saved">Saved Searches</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          {/* Basic Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-query">Search Query</Label>
                <Input
                  id="search-query"
                  placeholder="Enter keywords, file names, or phrases..."
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>File Type</Label>
                  <Select 
                    value={filters.fileType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {tag}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Upload Date Range</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {QUICK_DATE_RANGES.map((range, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(range.value())}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        {filters.dateRange.from ? (
                          format(filters.dateRange.from, 'PPP')
                        ) : (
                          'From date'
                        )}
                      </Button>
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
                      <Button variant="outline" className="justify-start text-left font-normal">
                        {filters.dateRange.to ? (
                          format(filters.dateRange.to, 'PPP')
                        ) : (
                          'To date'
                        )}
                      </Button>
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
                <Label>File Size Range (MB)</Label>
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
                  <Label>Linked Entity Type</Label>
                  <Select 
                    value={filters.linkedEntityType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, linkedEntityType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="RISK">Risk</SelectItem>
                      <SelectItem value="CONTROL">Control</SelectItem>
                      <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                      <SelectItem value="AUDIT">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Entity ID</Label>
                  <Input
                    placeholder="Enter entity ID..."
                    value={filters.linkedEntityId}
                    onChange={(e) => setFilters(prev => ({ ...prev, linkedEntityId: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveSearch(true)}
                disabled={!filters.query && !filters.category && !filters.fileType}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
              
              <Button onClick={handleSearch} disabled={searching}>
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
              </Button>
            </div>
          </div>

          {/* Save Search Dialog */}
          {showSaveSearch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Save Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    placeholder="Enter a name for this search..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSaveSearch}>Save</Button>
                  <Button variant="outline" onClick={() => setShowSaveSearch(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Searches</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <Button size="sm" variant="ghost">
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Facets */}
      {Object.keys(searchFacets).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Refine Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {searchFacets.categories && searchFacets.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="space-y-1">
                    {searchFacets.categories.slice(0, 5).map((facet: any) => (
                      <div key={facet.value} className="flex items-center justify-between text-sm">
                        <span>{facet.value}</span>
                        <Badge variant="secondary">{facet.count}</Badge>
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
                        <Badge variant="secondary">{facet.count}</Badge>
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
                        <Badge variant="secondary">{facet.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
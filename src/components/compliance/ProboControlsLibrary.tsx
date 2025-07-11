'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Star,
  Building,
  Network,
  Lock,
  Users,
  FileText,
  Globe,
  Database,
  Eye,
  Settings
} from 'lucide-react';
import { ProboService, type ProboMitigation } from '@/services/ProboService';
import { toast } from 'sonner';

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Identity & access management': <Users className="h-4 w-4" />,
    'Communications & collaboration security': <Globe className="h-4 w-4" />,
    'Human resources & personnel security': <Users className="h-4 w-4" />,
    'Infrastructure & network security': <Network className="h-4 w-4" />,
    'Secure development & code management': <FileText className="h-4 w-4" />,
    'Endpoint security': <Shield className="h-4 w-4" />,
    'Business continuity & third-party management': <Building className="h-4 w-4" />,
    'Data management & privacy': <Database className="h-4 w-4" />,
    'Governance, Risk & Compliance': <Settings className="h-4 w-4" />,
  };
  return iconMap[category] || <Shield className="h-4 w-4" />;
};

const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'MANDATORY':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'PREFERRED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ADVANCED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getImportanceIcon = (importance: string) => {
  switch (importance) {
    case 'MANDATORY':
      return <AlertTriangle className="h-3 w-3" />;
    case 'PREFERRED':
      return <Star className="h-3 w-3" />;
    case 'ADVANCED':
      return <Info className="h-3 w-3" />;
    default:
      return <Info className="h-3 w-3" />;
  }
};

export function ProboControlsLibrary() {
  const [mitigations, setMitigations] = useState<ProboMitigation[]>([]);
  const [filteredMitigations, setFilteredMitigations] = useState<ProboMitigation[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');

  const proboService = ProboService.getInstance();

  useEffect(() => {
    loadMitigations();
  }, []);

  useEffect(() => {
    filterMitigations();
  }, [mitigations, searchQuery, selectedCategory, selectedImportance]);

  const loadMitigations = async () => {
    try {
      setLoading(true);
      const [mitigationsData, categoriesData] = await Promise.all([
        proboService.getMitigations(),
        proboService.getMitigationCategories()
      ]);
      setMitigations(mitigationsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading mitigations:', error);
      toast.error('Failed to load security controls');
    } finally {
      setLoading(false);
    }
  };

  const filterMitigations = () => {
    let filtered = mitigations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (selectedImportance !== 'all') {
      filtered = filtered.filter(m => m.importance === selectedImportance);
    }

    setFilteredMitigations(filtered);
  };

  const handleMitigationToggle = (mitigationId: string) => {
    const newSelected = new Set(selectedMitigations);
    if (newSelected.has(mitigationId)) {
      newSelected.delete(mitigationId);
    } else {
      newSelected.add(mitigationId);
    }
    setSelectedMitigations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMitigations.size === filteredMitigations.length) {
      setSelectedMitigations(new Set());
    } else {
      setSelectedMitigations(new Set(filteredMitigations.map(m => m.id)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedMitigations.size === 0) {
      toast.error('Please select at least one control to import');
      return;
    }

    try {
      toast.success(`Successfully imported ${selectedMitigations.size} security controls`);
      setSelectedMitigations(new Set());
    } catch (error) {
      console.error('Error importing controls:', error);
      toast.error('Failed to import controls');
    }
  };

  const getCategoryStats = () => {
    const stats: { [key: string]: { total: number; mandatory: number; preferred: number; advanced: number } } = {};
    
    mitigations.forEach(m => {
      if (!stats[m.category]) {
        stats[m.category] = { total: 0, mandatory: 0, preferred: 0, advanced: 0 };
      }
      stats[m.category].total++;
      stats[m.category][m.importance.toLowerCase() as 'mandatory' | 'preferred' | 'advanced']++;
    });

    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#199BEC]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#191919] font-inter">Probo Security Controls Library</h2>
          <p className="text-[#A8A8A8] mt-1">
            Browse and import from {mitigations.length} security controls across multiple frameworks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-[#199BEC] text-white">
            <Shield className="h-3 w-3 mr-1" />
            {mitigations.length} Controls
          </Badge>
          <Button variant="outline" className="border-[#D8C3A5]">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Library</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="import">Import Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-white border-[#D8C3A5]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A8A8A8]" />
                    <Input
                      placeholder="Search controls by name, description, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedImportance} onValueChange={setSelectedImportance}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="MANDATORY">Mandatory</SelectItem>
                      <SelectItem value="PREFERRED">Preferred</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls List */}
          <Card className="bg-white border-[#D8C3A5]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#191919]">
                  Security Controls ({filteredMitigations.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-[#D8C3A5]"
                  >
                    {selectedMitigations.size === filteredMitigations.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedMitigations.size > 0 && (
                    <Button
                      onClick={handleImportSelected}
                      className="bg-[#199BEC] hover:bg-[#199BEC]/90"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Import Selected ({selectedMitigations.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredMitigations.map((mitigation) => (
                    <div
                      key={mitigation.id}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedMitigations.has(mitigation.id)
                          ? 'border-[#199BEC] bg-blue-50'
                          : 'border-[#D8C3A5] hover:border-[#199BEC]/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedMitigations.has(mitigation.id)}
                          onCheckedChange={() => handleMitigationToggle(mitigation.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(mitigation.category)}
                              <h4 className="font-medium text-[#191919]">{mitigation.name}</h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getImportanceColor(mitigation.importance)}>
                                {getImportanceIcon(mitigation.importance)}
                                <span className="ml-1">{mitigation.importance}</span>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {mitigation.category}
                            </Badge>
                            {mitigation.standards && (
                              <Badge variant="outline" className="text-xs">
                                {mitigation.standards.split(';').slice(0, 2).join(', ')}
                                {mitigation.standards.split(';').length > 2 && '...'}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-[#A8A8A8] line-clamp-2">
                            {mitigation.description.replace(/##\s*/g, '').split('\n')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getCategoryStats()).map(([category, stats]) => (
              <Card key={category} className="bg-white border-[#D8C3A5] hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(category)}
                    <CardTitle className="text-sm font-medium text-[#191919]">{category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#A8A8A8]">Total Controls</span>
                      <Badge variant="outline">{stats.total}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-red-600 font-medium">{stats.mandatory}</div>
                        <div className="text-[#A8A8A8]">Mandatory</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-600 font-medium">{stats.preferred}</div>
                        <div className="text-[#A8A8A8]">Preferred</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-600 font-medium">{stats.advanced}</div>
                        <div className="text-[#A8A8A8]">Advanced</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Import selected security controls into your organization's control framework. 
              This will add them to your compliance dashboard and enable tracking.
            </AlertDescription>
          </Alert>

          {selectedMitigations.size > 0 ? (
            <Card className="bg-white border-[#D8C3A5]">
              <CardHeader>
                <CardTitle className="text-[#191919]">
                  Selected Controls ({selectedMitigations.size})
                </CardTitle>
                <CardDescription>
                  Review the controls you've selected for import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(selectedMitigations).map(id => {
                    const mitigation = mitigations.find(m => m.id === id);
                    if (!mitigation) return null;
                    
                    return (
                      <div key={id} className="flex items-center justify-between p-3 border border-[#D8C3A5] rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(mitigation.category)}
                          <div>
                            <h4 className="font-medium text-[#191919]">{mitigation.name}</h4>
                            <p className="text-sm text-[#A8A8A8]">{mitigation.category}</p>
                          </div>
                        </div>
                        <Badge className={getImportanceColor(mitigation.importance)}>
                          {mitigation.importance}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={handleImportSelected}
                    className="bg-[#199BEC] hover:bg-[#199BEC]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Import {selectedMitigations.size} Controls
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-[#D8C3A5]">
              <CardContent className="p-12 text-center">
                <Shield className="h-12 w-12 text-[#A8A8A8] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#191919] mb-2">No Controls Selected</h3>
                <p className="text-[#A8A8A8] mb-4">
                  Go to the Browse Library tab to select security controls for import.
                </p>
                <Button
                  onClick={() => setActiveTab('browse')}
                  variant="outline"
                  className="border-[#D8C3A5]"
                >
                  Browse Controls
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { 
  Search,
  Shield,
  Upload,
  Star,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Zap,
  Settings,
  Database,
  Lock,
  Eye,
  Users,
  FileText,
  Globe,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MitigationControl {
  id: string;
  name: string;
  category: string;
  importance: 'MANDATORY' | 'PREFERRED' | 'ADVANCED';
  standards: string;
  description: string;
  implementation?: string;
  evidence?: string;
  frequency?: string;
  linkedControls?: string[];
}

export function ProboMitigationLibrary() {
  const [mitigations, setMitigations] = useState<MitigationControl[]>([]);
  const [filteredMitigations, setFilteredMitigations] = useState<MitigationControl[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    loadMitigations();
  }, []);

  useEffect(() => {
    filterMitigations();
  }, [mitigations, selectedCategory, selectedImportance, searchQuery]);

  const loadMitigations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/probo/mitigations');
      if (response.ok) {
        const data = await response.json();
        setMitigations(data);
      }
    } catch (error) {
      // console.error('Failed to load mitigations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMitigations = () => {
    let filtered = mitigations;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => 
        m.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (selectedImportance !== 'all') {
      filtered = filtered.filter(m => m.importance === selectedImportance);
    }

    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.standards.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMitigations(filtered);
  };

  const importSelectedMitigations = async () => {
    setImporting(true);
    try {
      const organizationId = 'current-org-id'; // Get from context
      const response = await fetch('/api/probo/mitigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          selectedIds: selectedMitigations,
          importAll: selectedMitigations.length === 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        // console.log('Import successful:', result);
        setSelectedMitigations([]);
      }
    } catch (error) {
      // console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const toggleMitigationSelection = (id: string) => {
    setSelectedMitigations(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'MANDATORY': return 'bg-red-100 text-red-700 border-red-200';
      case 'PREFERRED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ADVANCED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'MANDATORY': return <DaisyAlertCircle className="h-3 w-3" >
  ;
</DaisyAlertCircle>
      case 'PREFERRED': return <Star className="h-3 w-3" />;
      case 'ADVANCED': return <Zap className="h-3 w-3" />;
      default: return <CheckCircle className="h-3 w-3" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('access')) return <Lock className="h-4 w-4" />;
    if (categoryLower.includes('network')) return <Globe className="h-4 w-4" />;
    if (categoryLower.includes('data')) return <Database className="h-4 w-4" />;
    if (categoryLower.includes('system')) return <Cpu className="h-4 w-4" />;
    if (categoryLower.includes('audit')) return <Eye className="h-4 w-4" />;
    if (categoryLower.includes('personnel')) return <Users className="h-4 w-4" />;
    if (categoryLower.includes('physical')) return <Shield className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const _categories = [
    'Access Control', 'Network Security', 'Data Protection', 'System Security',
    'Audit & Compliance', 'Personnel Security', 'Physical Security', 'Operational Security'
  ];

  if (loading) {

  return (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#199BEC]"></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191919]">Security Controls Library</h1>
          <p className="text-[#A8A8A8]">650+ security controls from Probo's mitigation library</p>
        </div>
        <DaisyBadge className="bg-[#199BEC] text-white" >
  {mitigations.length} Controls Available
</DaisyBadge>
        </DaisyBadge>
      </div>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab} >
          <DaisyTabsList className="grid w-full grid-cols-3" >
            <DaisyTabsTrigger value="browse">Browse Library</DaisyTabs>
          <DaisyTabsTrigger value="import">Import Controls</DaisyTabsTrigger>
          <DaisyTabsTrigger value="imported">My Controls</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="browse" className="space-y-4" >
            {/* Search and Filters */}
          <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]" >
  <DaisyCardBody className="p-4" >
  </DaisyTabsContent>
</DaisyCardBody>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 transform -translate-y-1/2 text-[#A8A8A8]" />
                  <DaisyInput
                    placeholder="Search controls by name, description, or standards..."
                    value={searchQuery}
                    onChange={(e) = />
setSearchQuery(e.target.value)}
                    className="pl-10 border-[#D8C3A5] focus:border-[#199BEC]" />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-[#D8C3A5] rounded-md text-sm focus:outline-none focus:border-[#199BEC]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={selectedImportance}
                  onChange={(e) => setSelectedImportance(e.target.value)}
                  className="px-3 py-2 border border-[#D8C3A5] rounded-md text-sm focus:outline-none focus:border-[#199BEC]"
                >
                  <option value="all">All Priorities</option>
                  <option value="MANDATORY">Mandatory</option>
                  <option value="PREFERRED">Preferred</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </DaisyInput>
          </DaisyCard>

          {/* Selection Actions */}
          {selectedMitigations.length > 0 && (
            <DaisyAlert >
  <CheckCircle className="h-4 w-4" />
</DaisyAlert>
              <DaisyAlertDescription className="flex items-center justify-between w-full" >
  <span>
                </DaisyAlertDescription>
</DaisyAlert>{selectedMitigations.length} controls selected</span>
                <div className="flex items-center space-x-2">
                  <DaisyButton size="sm" variant="outline" onClick={() =>
          setSelectedMitigations([])} />
                    Clear Selection
                  
        </DaisyButton>
                  <DaisyButton size="sm" onClick={importSelectedMitigations} disabled={importing}>
          {importing ? 'Importing...' : 'Import Selected'}

        </DaisyButton>
                  </DaisyButton>
                </div>
                </DaisyAlertDescription>
              </DaisyAlert>
          )}

          {/* Controls Grid */}
          <div className="space-y-2">
            <p className="text-sm text-[#A8A8A8]">
              Showing {filteredMitigations.length} of {mitigations.length} controls
            </p>

            <div className="grid gap-4">
              {filteredMitigations.map(mitigation => (
                <DaisyCard key={mitigation.id} className="bg-[#FAFAFA] border-[#D8C3A5] hover:shadow-md transition-shadow" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                    <div className="flex items-start space-x-3">
                      <DaisyCheckbox
                        checked={selectedMitigations.includes(mitigation.id)}
                        onCheckedChange={() = />
toggleMitigationSelection(mitigation.id)}
                        className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getCategoryIcon(mitigation.category)}
                              <h4 className="font-medium text-[#191919]">{mitigation.name}</h4>
                            </div>
                            <p className="text-sm text-[#A8A8A8] mb-2">{mitigation.description}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <DaisyBadge className={cn('text-xs border', getImportanceColor(mitigation.importance))} >
  <span className="flex items-center space-x-1">
</DaisyCheckbox>
                                {getImportanceIcon(mitigation.importance)}
                                <span>{mitigation.importance}</span>
                              </span>
                            </DaisyBadge>
                            <DaisyBadge variant="outline" className="text-xs" >
  {mitigation.category}
</DaisyBadge>
                            </DaisyBadge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-[#A8A8A8]">
                            <span>Standards: {mitigation.standards}</span>
                            {mitigation.frequency && (
                              <span>Frequency: {mitigation.frequency}</span>
                            )}
                          </div>
                          <DaisyButton size="sm" variant="outline" className="text-xs">
          View Details

        </DaisyButton>
                          </DaisyButton>
                        </div>
                      </div>
                    </div>
                  </DaisyCardBody>
                </DaisyCard>
              ))}
            </div>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="import" className="space-y-4" >
            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]" >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="text-[#191919] font-inter flex items-center" >
  <Upload className="h-5 w-5 mr-2" />
</DaisyCardTitle>
                Import Security Controls
              </DaisyCardTitle>
              <DaisyCardDescription >
  Import Probo's security controls into your organization's control library
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody className="space-y-4" >
  <DaisyAlert >
  </DaisyCardBody>
</DaisyAlert>
                <BookOpen className="h-4 w-4" />
                <DaisyAlertDescription >
  These controls are sourced from industry-standard frameworks including ISO 27001, SOC 2, NIST, and more. 
                </DaisyAlertDescription>
</DaisyAlert>
                  You can customize them after import to match your organization's specific requirements.
                </DaisyAlertDescription>
              </DaisyAlert>

              <div className="space-y-4">
                <DaisyButton 
                  onClick={importSelectedMitigations}
                  disabled={importing || selectedMitigations.length === 0}
                  className="bg-[#199BEC] hover:bg-[#199BEC]/90 w-full">
          {importing ? (

        </DaisyButton>
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing Controls...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Selected Controls ({selectedMitigations.length})
                    </>
                  )}
                </DaisyButton>

                <DaisyButton 
                  variant="outline" 
                  onClick={() =>
          {
                    setSelectedMitigations([]);
                    importSelectedMitigations();
                  }}
                  disabled={importing}
                  className="w-full"
                >
                  Import All Controls ({mitigations.length})
                
        </DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="imported" className="space-y-4" >
            <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5]" >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle className="text-[#191919] font-inter">Imported Controls</DaisyCardTitle>
              <DaisyCardDescription >
  Security controls that have been imported into your organization
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <div className="text-center py-8">
</DaisyCardBody>
                <FileText className="h-12 w-12 text-[#A8A8A8] mx-auto mb-4" />
                <p className="text-[#191919] font-medium">No controls imported yet</p>
                <p className="text-[#A8A8A8] text-sm">Start by importing controls from the library</p>
                <DaisyButton 
                  className="mt-4 bg-[#199BEC] hover:bg-[#199BEC]/90"
                  onClick={() =>
          setActiveTab('browse')} />
                  Browse Library
                
        </DaisyButton>
              </div>
            </DaisyCardBody>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
} 
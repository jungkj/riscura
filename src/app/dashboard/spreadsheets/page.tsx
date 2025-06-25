'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, MoreHorizontal, Edit, Trash2, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

interface Spreadsheet {
  id: string;
  name: string;
  description: string;
  templateType: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sheets: Array<{
    id: string;
    name: string;
    position: number;
  }>;
  permissions: Array<{
    permission: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  _count: {
    sheets: number;
    versions: number;
  };
}

const templateTypes = [
  { value: 'RCSA_ASSESSMENT', label: 'RCSA Assessment', description: 'Complete risk and control self-assessment' },
  { value: 'RISK_REGISTER', label: 'Risk Register', description: 'Track and monitor organizational risks' },
  { value: 'CONTROL_MATRIX', label: 'Control Matrix', description: 'Map controls to risks and frameworks' },
  { value: 'COMPLIANCE_TRACKER', label: 'Compliance Tracker', description: 'Monitor compliance requirements' },
  { value: 'VENDOR_ASSESSMENT', label: 'Vendor Assessment', description: 'Evaluate third-party vendors' },
  { value: 'AUDIT_FINDINGS', label: 'Audit Findings', description: 'Track audit findings and remediation' },
  { value: 'CUSTOM', label: 'Custom Template', description: 'Create a custom spreadsheet structure' }
];

export default function SpreadsheetsPage() {
  const router = useRouter();
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [filteredSpreadsheets, setFilteredSpreadsheets] = useState<Spreadsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSpreadsheet, setNewSpreadsheet] = useState({
    name: '',
    description: '',
    templateType: 'RCSA_ASSESSMENT'
  });

  // Fetch spreadsheets
  useEffect(() => {
    const fetchSpreadsheets = async () => {
      try {
        const response = await fetch('/api/spreadsheets');
        const data = await response.json();
        
        if (data.success) {
          setSpreadsheets(data.data);
          setFilteredSpreadsheets(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch spreadsheets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpreadsheets();
  }, []);

  // Filter and search spreadsheets
  useEffect(() => {
    let filtered = spreadsheets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.templateType === filterType);
    }

    setFilteredSpreadsheets(filtered);
  }, [spreadsheets, searchTerm, filterType]);

  const handleCreateSpreadsheet = async () => {
    try {
      const response = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSpreadsheet),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsCreateDialogOpen(false);
        setNewSpreadsheet({ name: '', description: '', templateType: 'RCSA_ASSESSMENT' });
        // Refresh spreadsheets list
        const refreshResponse = await fetch('/api/spreadsheets');
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setSpreadsheets(refreshData.data);
        }
      }
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    const template = templateTypes.find(t => t.value === type);
    return template?.label || type;
  };

  const getTemplateTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'RCSA_ASSESSMENT': 'bg-blue-100 text-blue-800',
      'RISK_REGISTER': 'bg-red-100 text-red-800',
      'CONTROL_MATRIX': 'bg-green-100 text-green-800',
      'COMPLIANCE_TRACKER': 'bg-purple-100 text-purple-800',
      'VENDOR_ASSESSMENT': 'bg-orange-100 text-orange-800',
      'AUDIT_FINDINGS': 'bg-yellow-100 text-yellow-800',
      'CUSTOM': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SpreadsheetCard = ({ spreadsheet }: { spreadsheet: Spreadsheet }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
              {spreadsheet.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {spreadsheet.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/spreadsheets/${spreadsheet.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={getTemplateTypeBadgeColor(spreadsheet.templateType)}>
              {getTemplateTypeLabel(spreadsheet.templateType)}
            </Badge>
            <span className="text-sm text-gray-500">
              {spreadsheet._count.sheets} sheet{spreadsheet._count.sheets !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>By {spreadsheet.creator.firstName} {spreadsheet.creator.lastName}</span>
            <span>{formatDate(spreadsheet.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SpreadsheetListItem = ({ spreadsheet }: { spreadsheet: Spreadsheet }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer group">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
              {spreadsheet.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{spreadsheet.description}</p>
          </div>
          <Badge className={getTemplateTypeBadgeColor(spreadsheet.templateType)}>
            {getTemplateTypeLabel(spreadsheet.templateType)}
          </Badge>
          <div className="text-sm text-gray-500 min-w-0">
            <div>{spreadsheet._count.sheets} sheets</div>
            <div>{formatDate(spreadsheet.updatedAt)}</div>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/dashboard/spreadsheets/${spreadsheet.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spreadsheets</h1>
          <p className="text-gray-500 mt-1">
            Create and manage risk assessment spreadsheets and matrices
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Spreadsheet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Spreadsheet</DialogTitle>
              <DialogDescription>
                Choose a template and customize your spreadsheet for risk management and compliance tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter spreadsheet name"
                  value={newSpreadsheet.name}
                  onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a brief description"
                  value={newSpreadsheet.description}
                  onChange={(e) => setNewSpreadsheet({ ...newSpreadsheet, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={newSpreadsheet.templateType}
                  onValueChange={(value) => setNewSpreadsheet({ ...newSpreadsheet, templateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        <div>
                          <div className="font-medium">{template.label}</div>
                          <div className="text-sm text-gray-500">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSpreadsheet} disabled={!newSpreadsheet.name}>
                Create Spreadsheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search spreadsheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {templateTypes.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Spreadsheets Grid/List */}
      {filteredSpreadsheets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No spreadsheets found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first spreadsheet'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Spreadsheet
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-2'
        }>
          {filteredSpreadsheets.map((spreadsheet) => (
            <div key={spreadsheet.id} onClick={() => router.push(`/dashboard/spreadsheets/${spreadsheet.id}`)}>
              {viewMode === 'grid' ? (
                <SpreadsheetCard spreadsheet={spreadsheet} />
              ) : (
                <SpreadsheetListItem spreadsheet={spreadsheet} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useControls } from '@/context/ControlContext';
import { Control } from '@/types';
import { formatDate } from '@/lib/utils';

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Eye,
  Edit,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface ControlLibraryViewProps {
  onCreateControl?: () => void;
  onEditControl?: (control: Control) => void;
  onTestControl?: (control: Control) => void;
}

export const ControlLibraryView: React.FC<ControlLibraryViewProps> = ({
  onCreateControl,
  onEditControl,
  onTestControl,
}) => {
  const router = useRouter();
  const {
    getFilteredControls,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    selectedControls,
    setSelectedControls,
    selectAllControls,
    clearSelection,
    deleteControl,
    deleteControls,
    sortBy,
    sortDirection,
    setSorting,
    getControlStats,
  } = useControls();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, setFilters]);

  const filteredControls = getFilteredControls();
  const stats = getControlStats();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredControls.length / itemsPerPage);
  const paginatedControls = filteredControls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedControls.length === filteredControls.length) {
      clearSelection();
    } else {
      selectAllControls();
    }
  };

  const handleSelectControl = (controlId: string) => {
    if (selectedControls.includes(controlId)) {
      setSelectedControls(selectedControls.filter(id => id !== controlId));
    } else {
      setSelectedControls([...selectedControls, controlId]);
    }
  };

  // Sorting handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSorting(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSorting(field, 'asc');
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedControls.length > 0) {
      try {
        await deleteControls(selectedControls);
        clearSelection();
      } catch (error) {
        console.error('Failed to delete controls:', error);
      }
    }
  };

  const handleBulkExport = () => {
    const selectedControlData = filteredControls.filter(control => selectedControls.includes(control.id));
    const csvContent = [
      ['Title', 'Type', 'Effectiveness', 'Status', 'Owner', 'Created Date'].join(','),
      ...selectedControlData.map(control => [
        control.title,
        control.type,
        control.effectiveness,
        control.status,
        control.owner,
        formatDate(control.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'controls-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Control type badge component
  const ControlTypeBadge: React.FC<{ type: Control['type'] }> = ({ type }) => {
    const typeConfig = {
      preventive: { color: 'bg-blue-100 text-blue-800', icon: Shield },
      detective: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      corrective: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };
    
    const config = typeConfig[type];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </Badge>
    );
  };

  // Effectiveness indicator component
  const EffectivenessIndicator: React.FC<{ effectiveness: Control['effectiveness'] }> = ({ effectiveness }) => {
    const effectivenessConfig = {
      high: { value: 85, color: 'text-green-600', bgColor: 'bg-green-50' },
      medium: { value: 65, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      low: { value: 35, color: 'text-red-600', bgColor: 'bg-red-50' },
    };

    let config;
    if (typeof effectiveness === 'string' && effectiveness in effectivenessConfig) {
      config = effectivenessConfig[effectiveness as keyof typeof effectivenessConfig];
    } else if (typeof effectiveness === 'number') {
      if (effectiveness >= 80) config = effectivenessConfig.high;
      else if (effectiveness >= 60) config = effectivenessConfig.medium;
      else config = effectivenessConfig.low;
    } else {
      config = effectivenessConfig.low;
    }
    
    return (
      <div className="flex items-center space-x-2">
        <Progress value={config.value} className="w-16" />
        <Badge variant="outline" className={`${config.color} ${config.bgColor}`}>
          {String(effectiveness).toUpperCase()}
        </Badge>
      </div>
    );
  };

  // Control status indicator
  const ControlStatusIndicator: React.FC<{ control: Control }> = ({ control }) => {
    const isOverdue = control.nextTestDate && new Date(control.nextTestDate) < new Date();
    
    if (isOverdue) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Overdue</span>
        </div>
      );
    }
    
    if (control.status === 'ACTIVE') {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs">Active</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-1 text-gray-600">
        <Clock className="w-4 h-4" />
        <span className="text-xs">{control.status}</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading controls..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading controls: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control Library</h1>
          <p className="text-muted-foreground">
            {stats.total} controls • {stats.overdueTests} overdue tests • {stats.coverageGaps} coverage gaps
          </p>
        </div>
        <Button onClick={onCreateControl || (() => router.push('/controls/new'))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Effectiveness</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byEffectiveness.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Performing well
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueTests}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageEffectiveness.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 scale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Select
                value={filters.type || ''}
                onValueChange={(value) => setFilters({ type: value as Control['type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Control Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="detective">Detective</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.effectiveness ? String(filters.effectiveness) : ''}
                onValueChange={(value) => setFilters({ effectiveness: value as Control['effectiveness'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Effectiveness" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Effectiveness</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters({ status: value as Control['status'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Bulk Actions */}
      {selectedControls.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedControls.length} control(s) selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedControls.length === filteredControls.length && filteredControls.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('title')}
                    className="h-auto p-0 font-semibold"
                  >
                    Title
                    {sortBy === 'title' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'title' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('effectiveness')}
                    className="h-auto p-0 font-semibold"
                  >
                    Effectiveness
                    {sortBy === 'effectiveness' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'effectiveness' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead>Next Test</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedControls.map((control) => (
                <TableRow key={control.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedControls.includes(control.id)}
                      onCheckedChange={() => handleSelectControl(control.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{control.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {control.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ControlTypeBadge type={control.type} />
                  </TableCell>
                  <TableCell>
                    <EffectivenessIndicator effectiveness={control.effectiveness} />
                  </TableCell>
                  <TableCell>
                    <ControlStatusIndicator control={control} />
                  </TableCell>
                  <TableCell>{control.owner}</TableCell>
                  <TableCell>
                    {control.lastTestDate ? formatDate(control.lastTestDate) : 'Never'}
                  </TableCell>
                  <TableCell>
                    {control.nextTestDate ? (
                      <div className={`text-sm ${new Date(control.nextTestDate) < new Date() ? 'text-red-600' : ''}`}>
                        {formatDate(control.nextTestDate)}
                      </div>
                    ) : (
                      'Not scheduled'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedControl(control)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditControl ? onEditControl(control) : router.push(`/controls/${control.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onTestControl ? onTestControl(control) : router.push(`/controls/${control.id}/test`)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Test
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteControl(control.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredControls.length)} of{' '}
                {filteredControls.length} controls
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredControls.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No controls found</p>
              <p className="text-sm">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first control.'}
              </p>
              {Object.keys(filters).length === 0 && (
                <Button onClick={onCreateControl || (() => router.push('/controls/new'))} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Control
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Detail Dialog */}
      <Dialog open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedControl?.title}</DialogTitle>
            <DialogDescription>
              Control details and effectiveness information
            </DialogDescription>
          </DialogHeader>
          {selectedControl && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="mt-1">
                    <ControlTypeBadge type={selectedControl.type} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Effectiveness</label>
                  <div className="mt-1">
                    <EffectivenessIndicator effectiveness={selectedControl.effectiveness} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <p className="text-sm text-muted-foreground">{selectedControl.frequency}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedControl.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Last Tested</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedControl.lastTestDate ? formatDate(selectedControl.lastTestDate) : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Next Test Due</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedControl.nextTestDate ? formatDate(selectedControl.nextTestDate) : 'Not scheduled'}
                  </p>
                </div>
              </div>
              {selectedControl.evidence.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Evidence ({selectedControl.evidence.length})</label>
                  <div className="mt-2 space-y-2">
                    {selectedControl.evidence.slice(0, 3).map((evidence) => (
                      <div key={evidence.id} className="flex items-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{evidence.name}</span>
                      </div>
                    ))}
                    {selectedControl.evidence.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{selectedControl.evidence.length - 3} more files
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 
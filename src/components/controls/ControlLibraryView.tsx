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
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
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
      <DaisyBadge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </DaisyBadge>
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
        <DaisyProgress value={config.value} className="w-16" />
        <DaisyBadge variant="outline" className={`${config.color} ${config.bgColor}`}>
          {String(effectiveness).toUpperCase()}
        </DaisyBadge>
      </div>
    );
  };

  // Control status indicator
  const ControlStatusIndicator: React.FC<{ control: Control }> = ({ control }) => {
    const isOverdue = control.nextTestDate && new Date(control.nextTestDate) < new Date();
    
    if (isOverdue) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <DaisyAlertTriangle className="w-4 h-4" />
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
      <DaisyCard>
        <DaisyCardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading controls: {error}</p>
            <DaisyButton onClick={() => window.location.reload()} className="mt-2">
              Retry
            </DaisyButton>
          </div>
        </DaisyCardBody>
      </DaisyCard>
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
        <DaisyButton onClick={onCreateControl || (() => router.push('/controls/new'))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </DaisyButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Total Controls</DaisyCardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all types
            </p>
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">High Effectiveness</DaisyCardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byEffectiveness.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Performing well
            </p>
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Overdue Tests</DaisyCardTitle>
            <DaisyAlertTriangle className="h-4 w-4 text-red-600" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueTests}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </DaisyCardBody>
        </DaisyCard>
        
        <DaisyCard>
          <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DaisyCardTitle className="text-sm font-medium">Avg Effectiveness</DaisyCardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">
              {stats.averageEffectiveness.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 scale
            </p>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Search and Filters */}
      <DaisyCard>
        <DaisyCardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <DaisyInput
                placeholder="Search controls..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <DaisyButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <DaisyBadge variant="secondary" className="ml-2">
                  {Object.keys(filters).length}
                </DaisyBadge>
              )}
            </DaisyButton>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <DaisySelect
                value={filters.type || ''}
                onValueChange={(value) => setFilters({ type: value as Control['type'] })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Control Type" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Types</SelectItem>
                  <DaisySelectItem value="preventive">Preventive</SelectItem>
                  <DaisySelectItem value="detective">Detective</SelectItem>
                  <DaisySelectItem value="corrective">Corrective</SelectItem>
                </SelectContent>
              </DaisySelect>

              <DaisySelect
                value={filters.effectiveness ? String(filters.effectiveness) : ''}
                onValueChange={(value) => setFilters({ effectiveness: value as Control['effectiveness'] })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Effectiveness" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Effectiveness</SelectItem>
                  <DaisySelectItem value="high">High</SelectItem>
                  <DaisySelectItem value="medium">Medium</SelectItem>
                  <DaisySelectItem value="low">Low</SelectItem>
                </SelectContent>
              </DaisySelect>

              <DaisySelect
                value={filters.status || ''}
                onValueChange={(value) => setFilters({ status: value as Control['status'] })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Status" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Statuses</SelectItem>
                  <DaisySelectItem value="active">Active</SelectItem>
                  <DaisySelectItem value="planned">Planned</SelectItem>
                  <DaisySelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </DaisySelect>

              <DaisyButton variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </DaisyButton>
            </div>
          )}
        
      </DaisyCard>

      {/* Bulk Actions */}
      {selectedControls.length > 0 && (
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedControls.length} control(s) selected
              </span>
              <div className="flex gap-2">
                <DaisyButton variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DaisyButton>
                <DaisyButton variant="danger" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DaisyButton>
                <DaisyButton variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </DaisyButton>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* Control Table */}
      <DaisyCard>
        <DaisyCardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <DaisyCheckbox
                    checked={selectedControls.length === filteredControls.length && filteredControls.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <DaisyButton
                    variant="ghost"
                    onClick={() => handleSort('title')}
                    className="h-auto p-0 font-semibold"
                  >
                    Title
                    {sortBy === 'title' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'title' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </DaisyButton>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <DaisyButton
                    variant="ghost"
                    onClick={() => handleSort('effectiveness')}
                    className="h-auto p-0 font-semibold"
                  >
                    Effectiveness
                    {sortBy === 'effectiveness' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'effectiveness' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </DaisyButton>
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
                    <DaisyCheckbox
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
                        <DaisyButton variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </DaisyButton>
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
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </DaisyButton>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <DaisyButton
                      key={page}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </DaisyButton>
                  ))}
                </div>
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </DaisyButton>
              </div>
            </div>
          )}
        </DaisyCardBody>
      </DaisyCard>

      {/* Empty State */}
      {filteredControls.length === 0 && (
        <DaisyCard>
          <DaisyCardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No controls found</p>
              <p className="text-sm">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first control.'}
              </p>
              {Object.keys(filters).length === 0 && (
                <DaisyButton onClick={onCreateControl || (() => router.push('/controls/new'))} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Control
                </DaisyButton>
              )}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* Control Detail Dialog */}
      <DaisyDialog open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
        <DaisyDialogContent className="max-w-2xl">
          <DaisyDialogHeader>
            <DaisyDialogTitle>{selectedControl?.title}</DaisyDialogTitle>
            <DaisyDialogDescription>
              Control details and effectiveness information
            </DaisyDialogDescription>
          </DaisyDialogHeader>
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
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
}; 
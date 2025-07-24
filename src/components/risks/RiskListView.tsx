import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRisks } from '@/context/RiskContext';
import { Risk, RiskCategory } from '@/types';
import { formatDate, getRiskLevel, getRiskLevelColor } from '@/lib/utils';

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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
} from 'lucide-react';

interface RiskListViewProps {
  onCreateRisk?: () => void;
  onEditRisk?: (risk: Risk) => void;
  onViewRisk?: (risk: Risk) => void;
}

export const RiskListView: React.FC<RiskListViewProps> = ({
  onCreateRisk,
  onEditRisk,
  onViewRisk,
}) => {
  const router = useRouter();
  const {
    getFilteredRisks,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    selectedRisks,
    setSelectedRisks,
    selectAllRisks,
    clearSelection,
    deleteRisk,
    deleteRisks,
    sortBy,
    sortDirection,
    setSorting,
    getRiskStats,
  } = useRisks();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, setFilters]);

  const filteredRisks = getFilteredRisks();
  const stats = getRiskStats();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRisks.length / itemsPerPage);
  const paginatedRisks = filteredRisks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedRisks.length === filteredRisks.length) {
      clearSelection();
    } else {
      selectAllRisks();
    }
  };

  const handleSelectRisk = (riskId: string) => {
    if (selectedRisks.includes(riskId)) {
      setSelectedRisks(selectedRisks.filter(id => id !== riskId));
    } else {
      setSelectedRisks([...selectedRisks, riskId]);
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
    if (selectedRisks.length > 0) {
      try {
        await deleteRisks(selectedRisks);
        clearSelection();
      } catch (error) {
        console.error('Failed to delete risks:', error);
      }
    }
  };

  const handleBulkExport = () => {
    const selectedRiskData = filteredRisks.filter(risk => selectedRisks.includes(risk.id));
    const csvContent = [
      ['Title', 'Category', 'Status', 'Risk Score', 'Owner', 'Created Date'].join(','),
      ...selectedRiskData.map(risk => [
        risk.title,
        risk.category,
        risk.status,
        risk.riskScore.toString(),
        risk.owner,
        formatDate(risk.createdAt)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risks-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Risk level badge component
  const RiskLevelBadge: React.FC<{ score: number }> = ({ score }) => {
    const level = getRiskLevel(score);
    const colorClass = getRiskLevelColor(level);
    
    return (
      <DaisyBadge variant="outline" className={colorClass}>
        {level.toUpperCase()}
      </DaisyBadge>
    );
  };

  // Risk score progress component
  const RiskScoreProgress: React.FC<{ score: number }> = ({ score }) => {
    const percentage = (score / 25) * 100; // Max score is 25 (5x5)

    return (
      <div className="flex items-center space-x-2">
        <DaisyProgress value={percentage} className="w-16" />
        <span className="text-sm font-medium">{score}</span>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading risks..." />;
  }

  if (error) {
    return (
      <DaisyCard>
        <DaisyCardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading risks: {error}</p>
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
          <h1 className="text-3xl font-bold">Risk Register</h1>
          <p className="text-muted-foreground">
            {stats.total} risks • {stats.byLevel.critical || 0} critical • {stats.byLevel.high || 0} high
          </p>
        </div>
        <DaisyButton onClick={onCreateRisk || (() => router.push('/risks/new'))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Risk
        </DaisyButton>
      </div>

      {/* Search and Filters */}
      <DaisyCard>
        <DaisyCardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <DaisyInput
                placeholder="Search risks..."
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
                value={filters.category || ''}
                onValueChange={(value) => setFilters({ category: value as RiskCategory })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Category" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Categories</SelectItem>
                  <DaisySelectItem value="operational">Operational</SelectItem>
                  <DaisySelectItem value="financial">Financial</SelectItem>
                  <DaisySelectItem value="strategic">Strategic</SelectItem>
                  <DaisySelectItem value="compliance">Compliance</SelectItem>
                  <DaisySelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </DaisySelect>

              <DaisySelect
                value={filters.status || ''}
                onValueChange={(value) => setFilters({ status: value as Risk['status'] })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Status" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Statuses</SelectItem>
                  <DaisySelectItem value="identified">Identified</SelectItem>
                  <DaisySelectItem value="assessed">Assessed</SelectItem>
                  <DaisySelectItem value="mitigated">Mitigated</SelectItem>
                  <DaisySelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </DaisySelect>

              <DaisySelect
                value={filters.riskLevel || ''}
                onValueChange={(value) => setFilters({ riskLevel: value as 'low' | 'medium' | 'high' | 'critical' })}
              >
                <DaisySelectTrigger>
                  <DaisySelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <DaisySelectContent>
                  <DaisySelectItem value="">All Levels</SelectItem>
                  <DaisySelectItem value="low">Low</SelectItem>
                  <DaisySelectItem value="medium">Medium</SelectItem>
                  <DaisySelectItem value="high">High</SelectItem>
                  <DaisySelectItem value="critical">Critical</SelectItem>
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
      {selectedRisks.length > 0 && (
        <DaisyCard>
          <DaisyCardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedRisks.length} risk(s) selected
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

      {/* Risk Table */}
      <DaisyCard>
        <DaisyCardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <DaisyCheckbox
                    checked={selectedRisks.length === filteredRisks.length && filteredRisks.length > 0}
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
                <TableHead>Category</TableHead>
                <TableHead>
                  <DaisyButton
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="h-auto p-0 font-semibold"
                  >
                    Status
                    {sortBy === 'status' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'status' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </DaisyButton>
                </TableHead>
                <TableHead>
                  <DaisyButton
                    variant="ghost"
                    onClick={() => handleSort('riskScore')}
                    className="h-auto p-0 font-semibold"
                  >
                    Risk Score
                    {sortBy === 'riskScore' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'riskScore' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </DaisyButton>
                </TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>
                  <DaisyButton
                    variant="ghost"
                    onClick={() => handleSort('createdAt')}
                    className="h-auto p-0 font-semibold"
                  >
                    Created
                    {sortBy === 'createdAt' && (
                      sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'createdAt' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </DaisyButton>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRisks.map((risk) => (
                <TableRow key={risk.id} className="hover:bg-muted/50">
                  <TableCell>
                    <DaisyCheckbox
                      checked={selectedRisks.includes(risk.id)}
                      onCheckedChange={() => handleSelectRisk(risk.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{risk.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {risk.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DaisyBadge variant="outline">
                      {risk.category}
                    </DaisyBadge>
                  </TableCell>
                  <TableCell>
                    <DaisyBadge
                      variant={risk.status === 'closed' ? 'default' : 'secondary'}
                    >
                      {risk.status}
                    </DaisyBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <RiskScoreProgress score={risk.riskScore} />
                      <RiskLevelBadge score={risk.riskScore} />
                    </div>
                  </TableCell>
                  <TableCell>{risk.owner}</TableCell>
                  <TableCell>{formatDate(risk.createdAt)}</TableCell>
                  <TableCell>
                    <DaisyDropdownMenu>
                      <DaisyDropdownMenuTrigger asChild>
                        <DaisyButton variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </DaisyButton>
                      </DaisyDropdownMenuTrigger>
                      <DaisyDropdownMenuContent align="end">
                        <DaisyDropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DaisyDropdownMenuItem
                          onClick={() => onViewRisk ? onViewRisk(risk) : router.push(`/risks/${risk.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DaisyDropdownMenuItem>
                        <DaisyDropdownMenuItem
                          onClick={() => onEditRisk ? onEditRisk(risk) : router.push(`/risks/${risk.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DaisyDropdownMenuItem>
                        <DaisyDropdownMenuSeparator />
                        <DaisyDropdownMenuItem
                          onClick={() => deleteRisk(risk.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DaisyDropdownMenuItem>
                      </DaisyDropdownMenuContent>
                    </DaisyDropdownMenu>
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
                {Math.min(currentPage * itemsPerPage, filteredRisks.length)} of{' '}
                {filteredRisks.length} risks
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
                      variant={currentPage === page ? 'default' : 'outline'}
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
      {filteredRisks.length === 0 && (
        <DaisyCard>
          <DaisyCardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">No risks found</p>
              <p className="text-sm">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first risk.'}
              </p>
              {Object.keys(filters).length === 0 && (
                <DaisyButton onClick={onCreateRisk || (() => router.push('/risks/new'))} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Risk
                </DaisyButton>
              )}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}
    </div>
  );
}; 
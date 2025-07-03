'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  User,
  MoreHorizontal,
  RefreshCw,
  Archive,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Report {
  id: string;
  name: string;
  type: string;
  format: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  fileSize: number;
  generatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  downloadUrl?: string;
  parameters?: Record<string, any>;
  recipients?: string[];
  isScheduled: boolean;
  schedule?: {
    frequency: string;
    nextRun?: Date;
  };
}

interface ReportLibraryProps {
  onRefresh?: () => void;
  onDownload?: (report: Report) => void;
  onDelete?: (reportIds: string[]) => void;
  onShare?: (report: Report) => void;
}

export default function ReportLibrary({ 
  onRefresh, 
  onDownload, 
  onDelete, 
  onShare 
}: ReportLibraryProps) {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [currentPage, typeFilter, statusFilter, dateFilter]);

  // Filter reports based on search term
  useEffect(() => {
    const filtered = reports.filter(report => {
      const matchesSearch = searchTerm === '' || 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredReports(filtered);
  }, [reports, searchTerm]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        
        switch (dateFilter) {
          case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          default:
            dateFrom = new Date(0);
        }
        
        params.append('dateFrom', dateFrom.toISOString());
      }

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.data.reports);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error('Failed to load reports');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(filteredReports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleDownload = async (report: Report) => {
    if (report.status !== 'COMPLETED') {
      toast({
        title: 'Error',
        description: 'Report is not ready for download',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (onDownload) {
        await onDownload(report);
      } else {
        // Default download behavior
        const response = await fetch(`/api/reports/${report.id}/download`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${report.name}.${report.format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          throw new Error('Download failed');
        }
      }

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (selectedReports.length === 0) return;

    try {
      if (onDelete) {
        await onDelete(selectedReports);
      } else {
        // Default delete behavior
        const response = await fetch('/api/reports', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportIds: selectedReports }),
        });

        if (!response.ok) {
          throw new Error('Delete failed');
        }
      }

      toast({
        title: 'Success',
        description: `Successfully deleted ${selectedReports.length} report(s)`,
      });

      setSelectedReports([]);
      setIsDeleteDialogOpen(false);
      loadReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reports',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (report: Report) => {
    if (onShare) {
      await onShare(report);
    } else {
      // Default share behavior - copy link to clipboard
      if (report.downloadUrl) {
        await navigator.clipboard.writeText(report.downloadUrl);
        toast({
          title: 'Success',
          description: 'Download link copied to clipboard',
        });
      }
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'GENERATING':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    const variants = {
      COMPLETED: 'default',
      GENERATING: 'secondary',
      FAILED: 'destructive',
      SCHEDULED: 'outline',
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Library</h2>
          <p className="text-muted-foreground">
            Manage and download your generated reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { onRefresh?.(); loadReports(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RISK_ASSESSMENT">Risk Assessment</SelectItem>
                  <SelectItem value="COMPLIANCE_STATUS">Compliance Status</SelectItem>
                  <SelectItem value="CONTROL_EFFECTIVENESS">Control Effectiveness</SelectItem>
                  <SelectItem value="EXECUTIVE_SUMMARY">Executive Summary</SelectItem>
                  <SelectItem value="AUDIT_TRAIL">Audit Trail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="GENERATING">Generating</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{selectedReports.length} report(s) selected</span>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading reports...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No reports found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedReports.includes(report.id)}
                        onCheckedChange={(checked) => handleSelectReport(report.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{report.name}</span>
                        {report.isScheduled && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {report.schedule?.frequency}
                            {report.schedule?.nextRun && (
                              <span>
                                • Next: {format(new Date(report.schedule.nextRun), 'MMM dd, HH:mm')}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase">
                        {report.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      {report.fileSize > 0 ? formatFileSize(report.fileSize) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{report.createdBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(report.generatedAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          disabled={report.status !== 'COMPLETED'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(report)}
                          disabled={report.status !== 'COMPLETED'}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Report Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about this report
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Name</Label>
                                  <p className="text-sm text-muted-foreground">{report.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Type</Label>
                                  <p className="text-sm text-muted-foreground">{report.type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Format</Label>
                                  <p className="text-sm text-muted-foreground">{report.format}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <div className="mt-1">{getStatusBadge(report.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">File Size</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {report.fileSize > 0 ? formatFileSize(report.fileSize) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Created By</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {report.createdBy.name} ({report.createdBy.email})
                                  </p>
                                </div>
                              </div>
                              
                              {report.recipients && report.recipients.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Recipients</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {report.recipients.map((email, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {email}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {report.parameters && Object.keys(report.parameters).length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">Parameters</Label>
                                  <div className="mt-1 space-y-1">
                                    {Object.entries(report.parameters).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span>{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reports</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedReports.length} report(s)? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
                            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
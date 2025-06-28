'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share2,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { formatFileSize } from '@/lib/storage/file-validator';
import { format } from 'date-fns';
import DocumentViewer from './DocumentViewer';
import FileUploadDropzone from './FileUploadDropzone';
import DocumentSearch from './DocumentSearch';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  tags: string[];
  description?: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  updatedAt: string;
  version: number;
  downloadCount: number;
  lastDownloadedAt?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  isImage: boolean;
  isDocument: boolean;
  detectedFileType: string;
  commentCount?: number;
  shareCount?: number;
}

interface DocumentLibraryProps {
  linkedEntityType?: string;
  linkedEntityId?: string;
  category?: string;
  allowUpload?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  className?: string;
}

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
} as const;

const SORT_OPTIONS = [
  { value: 'uploadedAt:desc', label: 'Newest first' },
  { value: 'uploadedAt:asc', label: 'Oldest first' },
  { value: 'originalName:asc', label: 'Name A-Z' },
  { value: 'originalName:desc', label: 'Name Z-A' },
  { value: 'fileSize:desc', label: 'Largest first' },
  { value: 'fileSize:asc', label: 'Smallest first' },
  { value: 'downloadCount:desc', label: 'Most downloaded' },
];

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
  { value: 'image', label: 'Images' },
  { value: 'text', label: 'Text Files' },
];

export default function DocumentLibrary({
  linkedEntityType,
  linkedEntityId,
  category: defaultCategory,
  allowUpload = true,
  allowEdit = true,
  allowDelete = true,
  className = '',
}: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<keyof typeof VIEW_MODES>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || '');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt:desc');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy.split(':')[0],
        sortOrder: sortBy.split(':')[1],
      });

      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedFileType) params.append('fileType', selectedFileType);
      if (linkedEntityType) params.append('linkedEntityType', linkedEntityType);
      if (linkedEntityId) params.append('linkedEntityId', linkedEntityId);

      const response = await fetch(`/api/documents/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedFileType, sortBy, pagination.page, pagination.limit, linkedEntityType, linkedEntityId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleUploadComplete = (results: any[]) => {
    toast.success(`Uploaded ${results.length} file(s) successfully`);
    setShowUpload(false);
    fetchDocuments();
  };

  const handleDocumentView = (document: Document) => {
    setViewingDocument(document);
  };

  const handleDocumentEdit = (document: Document) => {
    // TODO: Open edit dialog
    console.log('Edit document:', document.id);
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      toast.success('Document deleted successfully');
      fetchDocuments();
      setViewingDocument(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDocumentShare = (documentId: string) => {
    // TODO: Open share dialog
    console.log('Share document:', documentId);
          toast('Share functionality coming soon');
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected');
      return;
    }

    // TODO: Implement bulk download
          toast('Bulk download functionality coming soon');
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedDocuments.length} selected document(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedDocuments.map(id => 
          fetch(`/api/documents/${id}`, { method: 'DELETE' })
        )
      );

      toast.success(`Deleted ${selectedDocuments.length} document(s)`);
      setSelectedDocuments([]);
      fetchDocuments();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some documents');
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(documents.map(doc => doc.id));
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const renderDocumentCard = (document: Document) => (
    <Card key={document.id} className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <Checkbox
              checked={selectedDocuments.includes(document.id)}
              onCheckedChange={() => toggleDocumentSelection(document.id)}
            />
            <div className="flex-1 min-w-0">
              <CardTitle 
                className="text-sm font-medium truncate cursor-pointer hover:text-blue-600"
                onClick={() => handleDocumentView(document)}
                title={document.originalName}
              >
                {document.originalName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {document.category}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatFileSize(document.fileSize)}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDocumentView(document)}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              {allowEdit && (
                <DropdownMenuItem onClick={() => handleDocumentEdit(document)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDocumentShare(document.id)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              {allowDelete && (
                <DropdownMenuItem 
                  onClick={() => handleDocumentDelete(document.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {document.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {document.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{document.uploadedBy.name}</span>
            <span>{format(new Date(document.uploadedAt), 'MMM dd')}</span>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentList = (document: Document) => (
    <div key={document.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
      <Checkbox
        checked={selectedDocuments.includes(document.id)}
        onCheckedChange={() => toggleDocumentSelection(document.id)}
      />
      
      <div className="flex-shrink-0">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 
          className="font-medium truncate cursor-pointer hover:text-blue-600"
          onClick={() => handleDocumentView(document)}
          title={document.originalName}
        >
          {document.originalName}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
          <span>{document.uploadedBy.name}</span>
          <span>{formatFileSize(document.fileSize)}</span>
          <span>{format(new Date(document.uploadedAt), 'MMM dd, yyyy')}</span>
          <Badge variant="outline" className="text-xs">
            {document.category}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleDocumentView(document)}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
        >
          <Download className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allowEdit && (
              <DropdownMenuItem onClick={() => handleDocumentEdit(document)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDocumentShare(document.id)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            {allowDelete && (
              <DropdownMenuItem 
                onClick={() => handleDocumentDelete(document.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Library</h2>
          <p className="text-gray-600">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
            {linkedEntityType && ` linked to ${linkedEntityType}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {allowUpload && (
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSearch(true)}>
            <Search className="w-4 h-4 mr-2" />
            Advanced Search
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFileType} onValueChange={setSelectedFileType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="File Type" />
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

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'GRID' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('GRID')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'LIST' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('LIST')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkDownload}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            {allowDelete && (
              <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Documents Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading documents...</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedCategory || selectedFileType
              ? 'Try adjusting your filters'
              : 'Get started by uploading your first document'
            }
          </p>
          {allowUpload && (
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      ) : (
        <div>
          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map(renderDocumentCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(renderDocumentList)}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <FileUploadDropzone
            onUploadComplete={handleUploadComplete}
            category={defaultCategory}
            linkedEntityType={linkedEntityType}
            linkedEntityId={linkedEntityId}
          />
        </DialogContent>
      </Dialog>

      {/* Advanced Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
          </DialogHeader>
          <DocumentSearch onSearch={(results) => {
            setDocuments(results);
            setShowSearch(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DocumentViewer
              document={viewingDocument}
              onEdit={allowEdit ? handleDocumentEdit : undefined}
              onDelete={allowDelete ? handleDocumentDelete : undefined}
              onShare={handleDocumentShare}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 
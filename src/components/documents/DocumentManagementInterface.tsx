'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Eye, 
  Share2,
  Plus,
  FileText,
  Image,
  Archive,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import FileUploadDropzone from './FileUploadDropzone';
import EnhancedDocumentViewer from './EnhancedDocumentViewer';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  extractedText?: string;
  uploadedAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  aiAnalysis?: {
    fileType: string;
    isImage: boolean;
    isDocument: boolean;
    warnings: string[];
    thumbnailUrl?: string;
  };
}

interface DocumentManagementInterfaceProps {
  organizationId?: string;
  category?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  onDocumentSelect?: (document: Document) => void;
  className?: string;
}

export default function DocumentManagementInterface({
  organizationId,
  category,
  linkedEntityType,
  linkedEntityId,
  onDocumentSelect,
  className = '',
}: DocumentManagementInterfaceProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [bulkOperating, setBulkOperating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadDocuments();
  }, [currentPage, searchQuery, sortBy, sortOrder, filterType]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        sortBy,
        sortOrder,
        ...(filterType !== 'all' && { type: filterType }),
        ...(category && { category }),
        ...(linkedEntityType && { linkedEntityType }),
        ...(linkedEntityId && { linkedEntityId }),
      });

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Failed to load documents');

      const data = await response.json();
      setDocuments(data.data || []);
      setTotalDocuments(data.meta?.total || 0);
      setTotalPages(Math.ceil((data.meta?.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Load documents error:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (results: any[]) => {
    toast.success(`Successfully uploaded ${results.length} file(s)`);
    setShowUpload(false);
    loadDocuments();
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      toast.success('Document deleted successfully');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) return;

    try {
      setBulkOperating(true);
      const deletePromises = selectedDocuments.map(id => 
        fetch(`/api/documents/${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${selectedDocuments.length} document(s)`);
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some documents');
    } finally {
      setBulkOperating(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      setBulkOperating(true);
      const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
      
      for (const doc of selectedDocs) {
        const response = await fetch(`/api/documents/${doc.id}/download`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }

      toast.success(`Downloaded ${selectedDocuments.length} file(s)`);
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to download some files');
    } finally {
      setBulkOperating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (type.includes('archive') || type.includes('zip')) return <Archive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getFileTypeColor = (type: string): string => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (type === 'application/pdf') return 'bg-red-100 text-red-800';
    if (type.includes('word')) return 'bg-blue-100 text-blue-800';
    if (type.includes('excel') || type.includes('sheet')) return 'bg-emerald-100 text-emerald-800';
    if (type.includes('archive') || type.includes('zip')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <DaisyCard 
          key={document.id} 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedDocuments.includes(document.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onDocumentSelect?.(document)}
        >
          <DaisyCardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <DaisyCheckbox
                  checked={selectedDocuments.includes(document.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDocuments(prev => [...prev, document.id]);
                    } else {
                      setSelectedDocuments(prev => prev.filter(id => id !== document.id));
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {getFileIcon(document.type)}
              </div>
              <DaisyDropdownMenu>
                <DaisyDropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <DaisyButton variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => setSelectedDocument(document.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem 
                    onClick={() => handleDocumentDelete(document.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          
          <DaisyCardContent>
            {document.aiAnalysis?.thumbnailUrl && (
              <div className="mb-3">
                <img
                  src={document.aiAnalysis.thumbnailUrl}
                  alt={document.name}
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>
            )}
            <h3 className="font-medium text-sm mb-2 line-clamp-2">{document.name}</h3>
            <div className="space-y-2">
              <DaisyBadge className={`text-xs ${getFileTypeColor(document.type)}`}>
                {document.type.split('/')[1]?.toUpperCase() || 'FILE'}
              </DaisyBadge>
              <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
              <div className="flex items-center space-x-1">
                <DaisyAvatar className="w-4 h-4">
                  <DaisyAvatarFallback className="text-xs">
                    {document.uploader.firstName[0]}{document.uploader.lastName[0]}
                  </DaisyAvatarFallback>
                </DaisyAvatar>
                <p className="text-xs text-gray-500 truncate">
                  {document.uploader.firstName} {document.uploader.lastName}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
              </p>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {documents.map((document) => (
        <DaisyCard 
          key={document.id}
          className={`cursor-pointer transition-all hover:shadow-sm ${
            selectedDocuments.includes(document.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onDocumentSelect?.(document)}
        >
          <DaisyCardContent className="p-4">
            <div className="flex items-center space-x-4">
              <DaisyCheckbox
                checked={selectedDocuments.includes(document.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDocuments(prev => [...prev, document.id]);
                  } else {
                    setSelectedDocuments(prev => prev.filter(id => id !== document.id));
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {getFileIcon(document.type)}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{document.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{formatFileSize(document.size)}</span>
                  <span>{document.uploader.firstName} {document.uploader.lastName}</span>
                  <span>{formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}</span>
                </div>
              </div>
              <DaisyBadge className={`${getFileTypeColor(document.type)}`}>
                {document.type.split('/')[1]?.toUpperCase() || 'FILE'}
              </DaisyBadge>
              <DaisyDropdownMenu>
                <DaisyDropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <DaisyButton variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => setSelectedDocument(document.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem 
                    onClick={() => handleDocumentDelete(document.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          </DaisyCardBody>
        </DaisyCard>
      ))}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-gray-600">
            {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DaisyButton onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Files
          </DaisyButton>
          <DaisyButton variant="outline" onClick={loadDocuments}>
            <RefreshCw className="w-4 h-4" />
          </DaisyButton>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <DaisyInput
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DaisySelect value={filterType} onValueChange={setFilterType}>
          <DaisySelectTrigger className="w-48">
            <DaisySelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <DaisySelectContent>
            <DaisySelectItem value="all">All Types</SelectItem>
            <DaisySelectItem value="application/pdf">PDF</SelectItem>
            <DaisySelectItem value="image">Images</SelectItem>
            <DaisySelectItem value="application/msword">Word Documents</SelectItem>
            <DaisySelectItem value="application/vnd.ms-excel">Excel Files</SelectItem>
          </SelectContent>
        </DaisySelect>
        <DaisySelect value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-');
          setSortBy(field);
          setSortOrder(order as 'asc' | 'desc');
        }}>
          <DaisySelectTrigger className="w-48">
            <DaisySelectValue placeholder="Sort by" />
          </SelectTrigger>
          <DaisySelectContent>
            <DaisySelectItem value="uploadedAt-desc">Newest First</SelectItem>
            <DaisySelectItem value="uploadedAt-asc">Oldest First</SelectItem>
            <DaisySelectItem value="name-asc">Name A-Z</SelectItem>
            <DaisySelectItem value="name-desc">Name Z-A</SelectItem>
            <DaisySelectItem value="size-desc">Largest First</SelectItem>
            <DaisySelectItem value="size-asc">Smallest First</SelectItem>
          </SelectContent>
        </DaisySelect>
        <div className="flex items-center space-x-2">
          <DaisyButton
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </DaisyButton>
          <DaisyButton
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </DaisyButton>
        </div>
      </div>

      {/* Bulk Operations */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium">
            {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center space-x-2">
            <DaisyButton 
              variant="outline" 
              size="sm" 
              onClick={handleBulkDownload}
              disabled={bulkOperating}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </DaisyButton>
            <DaisyButton 
              variant="outline" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={bulkOperating}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </DaisyButton>
            <DaisyButton 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedDocuments([])}
            >
              Clear Selection
            </DaisyButton>
          </div>
        </div>
      )}

      {/* Documents */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'Upload your first document to get started'}
          </p>
          <DaisyButton onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </DaisyButton>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalDocuments)} of {totalDocuments} results
              </p>
              <div className="flex items-center space-x-2">
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </DaisyButton>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <DaisyButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </DaisyButton>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Upload Documents</h3>
                  <DaisyButton variant="outline" onClick={() => setShowUpload(false)}>
                    ✕
                  </DaisyButton>
                </div>
                <FileUploadDropzone
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(error) => toast.error(error)}
                  category={category}
                  linkedEntityType={linkedEntityType}
                  linkedEntityId={linkedEntityId}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              <EnhancedDocumentViewer
                documentId={selectedDocument}
                onClose={() => setSelectedDocument(null)}
                onDelete={handleDocumentDelete}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
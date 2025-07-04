'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Share2, 
  Edit3, 
  Trash2, 
  Eye, 
  Clock, 
  User, 
  Tag, 
  MessageSquare,
  History,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface DocumentViewerProps {
  documentId: string;
  onClose?: () => void;
  onEdit?: (document: any) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (document: any) => void;
  className?: string;
}

interface DocumentData {
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
  downloadUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  aiAnalysis?: {
    fileType: string;
    isImage: boolean;
    isDocument: boolean;
    warnings: string[];
    versions?: Array<{
      version: number;
      uploadedAt: string;
      changeLog?: string;
      url: string;
      size: number;
    }>;
  };
}

export default function EnhancedDocumentViewer({
  documentId,
  onClose,
  onEdit,
  onDelete,
  onShare,
  className = '',
}: DocumentViewerProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load document');
      }

      const data = await response.json();
      setDocument(data.document || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const response = await fetch(document.downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!document || !onDelete) return;

    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      try {
        await onDelete(document.id);
        toast.success('Document deleted successfully');
        onClose?.();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      // In a real implementation, this would call an API
      const newComment = {
        id: Date.now(),
        text: comment,
        author: {
          name: 'Current User',
          email: 'user@example.com',
        },
        createdAt: new Date().toISOString(),
      };

      setComments(prev => [newComment, ...prev]);
      setComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
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
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    return '📄';
  };

  const canPreview = (type: string): boolean => {
    return [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
    ].includes(type);
  };

  const renderPreview = () => {
    if (!document || !canPreview(document.type)) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <FileText className="w-16 h-16 mb-4" />
          <p>Preview not available for this file type</p>
          <Button onClick={handleDownload} className="mt-4">
            <Download className="w-4 h-4 mr-2" />
            Download to View
          </Button>
        </div>
      );
    }

    if (document.type.startsWith('image/')) {
      return (
        <div className="relative">
          <div className="flex justify-center items-center mb-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(300, zoom + 25))}
              disabled={zoom >= 300}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-center">
            <img
              src={document.previewUrl || document.downloadUrl}
              alt={document.name}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '600px',
              }}
              className="border rounded-lg shadow-sm"
            />
          </div>
        </div>
      );
    }

    if (document.type === 'application/pdf') {
      return (
        <div className="w-full h-96">
          <iframe
            src={`${document.previewUrl || document.downloadUrl}#toolbar=1`}
            className="w-full h-full border rounded-lg"
            title={document.name}
          />
        </div>
      );
    }

    if (document.type.startsWith('text/') && document.extractedText) {
      return (
        <ScrollArea className="h-96 w-full border rounded-lg p-4">
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {document.extractedText}
          </pre>
        </ScrollArea>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FileText className="w-16 h-16 mb-4" />
        <p>Loading preview...</p>
      </div>
    );
  };

  const renderMetadata = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-500">File Name</Label>
          <p className="mt-1">{document?.name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">File Type</Label>
          <p className="mt-1">{document?.type}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">File Size</Label>
          <p className="mt-1">{document ? formatFileSize(document.size) : '-'}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-500">Uploaded</Label>
          <p className="mt-1">
            {document ? formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true }) : '-'}
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="text-sm font-medium text-gray-500">Uploaded By</Label>
        <div className="flex items-center mt-2">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarFallback>
              {document?.uploader.firstName[0]}{document?.uploader.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {document?.uploader.firstName} {document?.uploader.lastName}
            </p>
            <p className="text-xs text-gray-500">{document?.uploader.email}</p>
          </div>
        </div>
      </div>

      {document?.aiAnalysis?.warnings && document.aiAnalysis.warnings.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-sm font-medium text-gray-500">Warnings</Label>
            <div className="mt-2 space-y-1">
              {document.aiAnalysis.warnings.map((warning, index) => (
                <Badge key={index} variant="secondary" className="mr-1">
                  {warning}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderVersionHistory = () => (
    <div className="space-y-4">
      {document?.aiAnalysis?.versions && document.aiAnalysis.versions.length > 0 ? (
        document.aiAnalysis.versions.map((version, index) => (
          <Card key={version.version}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Version {version.version}</p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                  </p>
                  {version.changeLog && (
                    <p className="text-sm mt-1">{version.changeLog}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {formatFileSize(version.size)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No version history available</p>
      )}
    </div>
  );

  const renderComments = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[80px]"
        />
        <Button onClick={handleAddComment} disabled={!comment.trim()}>
          Add Comment
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {comment.author.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm">{comment.author.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No comments yet</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500">
        <FileText className="w-16 h-16 mb-4" />
        <p>{error || 'Document not found'}</p>
        <Button onClick={onClose} variant="outline" className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(document.type)}</span>
            <div>
              <h2 className="text-xl font-semibold">{document.name}</h2>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.size)} • {document.type}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onShare && (
              <Button variant="outline" onClick={() => onShare(document)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(document)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="metadata">
                <FileText className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="versions">
                <History className="w-4 h-4 mr-2" />
                Versions
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-6">
              {renderPreview()}
            </TabsContent>

            <TabsContent value="metadata" className="mt-6">
              {renderMetadata()}
            </TabsContent>

            <TabsContent value="versions" className="mt-6">
              {renderVersionHistory()}
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              {renderComments()}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreen && document?.type.startsWith('image/') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <div className="relative max-w-full max-h-full">
              <Button
                variant="outline"
                className="absolute top-4 right-4 z-10"
                onClick={() => setFullscreen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <img
                src={document.previewUrl || document.downloadUrl}
                alt={document.name}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 
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
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
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
          <DaisyButton onClick={handleDownload} className="mt-4" >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
            Download to View
          </DaisyButton>
        </div>
      );
    }

    if (document.type.startsWith('image/')) {
      return (
        <div className="relative">
          <div className="flex justify-center items-center mb-4 space-x-2">
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25} />
              <ZoomOut className="w-4 h-4" />
            </DaisyButton>
            <span className="text-sm font-medium">{zoom}%</span>
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(300, zoom + 25))}
              disabled={zoom >= 300} />
              <ZoomIn className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setRotation((rotation + 90) % 360)} />
              <RotateCw className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setFullscreen(true)} />
              <Maximize2 className="w-4 h-4" />
            </DaisyButton>
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
        <DaisyScrollArea className="h-96 w-full border rounded-lg p-4" />
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {document.extractedText}
          </pre>
        </DaisyScrollArea>
      );
    };

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
          <DaisyLabel className="text-sm font-medium text-gray-500">File Name</DaisyLabel>
          <p className="mt-1">{document?.name}</p>
        </div>
        <div>
          <DaisyLabel className="text-sm font-medium text-gray-500">File Type</DaisyLabel>
          <p className="mt-1">{document?.type}</p>
        </div>
        <div>
          <DaisyLabel className="text-sm font-medium text-gray-500">File Size</DaisyLabel>
          <p className="mt-1">{document ? formatFileSize(document.size) : '-'}</p>
        </div>
        <div>
          <DaisyLabel className="text-sm font-medium text-gray-500">Uploaded</DaisyLabel>
          <p className="mt-1">
            {document ? formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true }) : '-'}
          </p>
        </div>
      </div>

      <DaisySeparator />

      <div>
        <DaisyLabel className="text-sm font-medium text-gray-500">Uploaded By</DaisySeparator>
        <div className="flex items-center mt-2">
          <DaisyAvatar className="w-8 h-8 mr-2" />
            <DaisyAvatarFallback />
              {document?.uploader.firstName[0]}{document?.uploader.lastName[0]}
            </DaisyAvatar>
          </DaisyAvatar>
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
          <DaisySeparator />
          <div>
            <DaisyLabel className="text-sm font-medium text-gray-500">Warnings</DaisySeparator>
            <div className="mt-2 space-y-1">
              {document.aiAnalysis.warnings.map((warning, index) => (
                <DaisyBadge key={index} variant="secondary" className="mr-1" >
  {warning}
</DaisyBadge>
                </DaisyBadge>
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
          <DaisyCard key={version.version} >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
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
            </DaisyCardBody>
          </DaisyCard>
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No version history available</p>
      )}
    </div>
  );

  const renderComments = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <DaisyTextarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[80px]"
        />
        <DaisyButton onClick={handleAddComment} disabled={!comment.trim()} >
  Add Comment
</DaisyTextarea>
        </DaisyButton>
      </div>

      <DaisySeparator />

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <DaisyCard key={comment.id} >
  <DaisyCardBody className="p-4" >
  </DaisySeparator>
</DaisyCardBody>
                <div className="flex items-start space-x-3">
                  <DaisyAvatar className="w-8 h-8" />
                    <DaisyAvatarFallback />
                      {comment.author.name.split(' ').map((n: string) => n[0]).join('')}
                    </DaisyAvatar>
                  </DaisyAvatar>
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
              </DaisyCardBody>
            </DaisyCard>
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
        <DaisyButton onClick={onClose} variant="outline" className="mt-4" >
  Close
</DaisyButton>
        </DaisyButton>
      </div>
    );
  };

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
            <DaisyButton variant="outline" onClick={handleDownload} >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
              Download
            </DaisyButton>
            {onShare && (
              <DaisyButton variant="outline" onClick={() => onShare(document)} />
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DaisyButton>
            )}
            {onEdit && (
              <DaisyButton variant="outline" onClick={() => onEdit(document)} />
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </DaisyButton>
            )}
            {onDelete && (
              <DaisyButton variant="outline" onClick={handleDelete} >
  <Trash2 className="w-4 h-4 mr-2" />
</DaisyButton>
                Delete
              </DaisyButton>
            )}
            {onClose && (
              <DaisyButton variant="outline" onClick={onClose} >
  <X className="w-4 h-4" />
</DaisyButton>
              </DaisyButton>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <DaisyTabs value={activeTab} onValueChange={setActiveTab} />
            <DaisyTabsList className="grid w-full grid-cols-4" />
              <DaisyTabsTrigger value="preview" />
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DaisyTabs>
              <DaisyTabsTrigger value="metadata" />
                <FileText className="w-4 h-4 mr-2" />
                Details
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="versions" />
                <History className="w-4 h-4 mr-2" />
                Versions
              </DaisyTabsTrigger>
              <DaisyTabsTrigger value="comments" />
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </DaisyTabsTrigger>
            </DaisyTabsList>

            <DaisyTabsContent value="preview" className="mt-6" />
              {renderPreview()}
            </DaisyTabsContent>

            <DaisyTabsContent value="metadata" className="mt-6" />
              {renderMetadata()}
            </DaisyTabsContent>

            <DaisyTabsContent value="versions" className="mt-6" />
              {renderVersionHistory()}
            </DaisyTabsContent>

            <DaisyTabsContent value="comments" className="mt-6" />
              {renderComments()}
            </DaisyTabsContent>
          </DaisyTabs>
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
              <DaisyButton
                variant="outline"
                className="absolute top-4 right-4 z-10"
                onClick={() => setFullscreen(false)} />
                <X className="w-4 h-4" />
              </DaisyButton>
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
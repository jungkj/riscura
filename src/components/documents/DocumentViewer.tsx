'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Archive, 
  Share2, 
  Edit3, 
  Trash2,
  Clock,
  User,
  Tag,
  Link,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatFileSize } from '@/lib/storage/file-validator';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DocumentViewerProps {
  document: {
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
    versions?: Array<{
      id: string;
      version: number;
      fileName: string;
      fileSize: number;
      uploadedAt: string;
      changeLog?: string;
    }>;
    commentCount?: number;
    shareCount?: number;
  };
  onEdit?: (document: any) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  className?: string;
}

const FILE_TYPE_ICONS = {
  pdf: FileText,
  word: FileText,
  excel: FileText,
  powerpoint: FileText,
  text: FileText,
  image: Image,
  archive: Archive,
  unknown: FileText,
};

const CATEGORY_COLORS = {
  evidence: 'bg-blue-100 text-blue-800',
  policy: 'bg-purple-100 text-purple-800',
  control: 'bg-green-100 text-green-800',
  risk: 'bg-red-100 text-red-800',
  audit: 'bg-orange-100 text-orange-800',
  template: 'bg-gray-100 text-gray-800',
  general: 'bg-gray-100 text-gray-800',
};

export default function DocumentViewer({
  document,
  onEdit,
  onDelete,
  onShare,
  className = '',
}: DocumentViewerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);

  const FileIcon = FILE_TYPE_ICONS[document.detectedFileType as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.unknown;

  useEffect(() => {
    return () => {
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${document.id}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = (document as any).createElement('a');
      a.href = url;
      a.download = document.fileName;
      (document as any).body.appendChild(a);
      a.click();
      (document as any).body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!document.isImage && document.detectedFileType !== 'pdf') {
      toast.error('Preview not available for this file type');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${document.id}/download?inline=true`);
      
      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(document);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
      onDelete?.(document.id);
    }
  };

  const handleShare = () => {
    onShare?.(document.id);
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.general;
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    if (document.isImage) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded">
          <img
            src={previewUrl}
            alt={document.originalName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      );
    }

    if (document.detectedFileType === 'pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={document.originalName}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Preview not available for this file type</p>
      </div>
    );
  };

  const canPreview = document.isImage || document.detectedFileType === 'pdf';

  return (
    <>
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                  <FileIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate" title={document.originalName}>
                  {document.originalName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getCategoryColor(document.category)}>
                    {document.category}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    v{document.version}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {canPreview && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handlePreview}
                  disabled={loading}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDownload}
                disabled={loading}
              >
                <Download className="w-4 h-4" />
              </Button>
              {onShare && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleEdit}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {document.description && (
            <div>
              <p className="text-sm text-gray-700">{document.description}</p>
            </div>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-400" />
              {document.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Document Details */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Uploaded by</p>
                    <p className="text-gray-600">{document.uploadedBy.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Upload date</p>
                    <p className="text-gray-600">
                      {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">File size</p>
                  <p className="text-gray-600">{formatFileSize(document.fileSize)}</p>
                </div>

                <div>
                  <p className="font-medium">File type</p>
                  <p className="text-gray-600">{document.mimeType}</p>
                </div>

                <div>
                  <p className="font-medium">Downloads</p>
                  <p className="text-gray-600">{document.downloadCount}</p>
                </div>

                {document.lastDownloadedAt && (
                  <div>
                    <p className="font-medium">Last downloaded</p>
                    <p className="text-gray-600">
                      {format(new Date(document.lastDownloadedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              {/* Linked Entity */}
              {document.linkedEntityType && document.linkedEntityId && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Link className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">Linked to</p>
                    <p className="text-sm text-gray-600">
                      {document.linkedEntityType}: {document.linkedEntityId}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="versions" className="space-y-3 mt-4">
              {document.versions && document.versions.length > 0 ? (
                <div className="space-y-2">
                  {document.versions.map((version) => (
                    <div 
                      key={version.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.version}</span>
                          {version.version === document.version && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(version.fileSize)} • {format(new Date(version.uploadedAt), 'MMM dd, yyyy')}
                        </p>
                        {version.changeLog && (
                          <p className="text-sm text-gray-700 mt-1">{version.changeLog}</p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No version history available</p>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-3 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Document uploaded</span>
                  <span className="text-gray-500">
                    {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {document.updatedAt && document.updatedAt !== document.uploadedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Document updated</span>
                    <span className="text-gray-500">
                      {format(new Date(document.updatedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                )}
                {document.lastDownloadedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Last downloaded</span>
                    <span className="text-gray-500">
                      {format(new Date(document.lastDownloadedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate">{document.originalName}</DialogTitle>
              <div className="flex items-center gap-2">
                {document.isImage && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRotation((rotation + 90) % 360)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 p-4 pt-0" style={{ height: '70vh' }}>
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 